/* ============================================================
   Game — the main controller: state machine, game loop,
   rendering, and the glue between all the other modules.
   ============================================================ */
class Game {
  constructor(assets) {
    this.assets = assets;
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.fxCanvas = document.getElementById('fxCanvas');
    this.particles = new ParticleSystem(this.fxCanvas);

    this.sound = new SoundManager();
    this.ui = new UIManager(this);
    this.input = new InputManager(this);
    this.spawner = new Spawner(this);
    this.collisionManager = new CollisionManager(this);

    this.state = STATE.START;
    this.difficulty = 'medium';
    this.score = 0;
    this.best = 0;
    this.coins = 0;
    this.moveTimer = 0;
    this.moveInterval = CONFIG.DIFFICULTY.medium.baseInterval;
    this.speedMultiplier = 1;
    this.lastMilestone = 0;
    this.lastTime = 0;

    this.activeEffects = {}; // kind -> { expiresAt, totalMs }

    this._loadStorage();
    this._computeGrid();
    window.addEventListener('resize', () => this._computeGrid());
    window.addEventListener('orientationchange', () => setTimeout(() => this._computeGrid(), 200));

    this.ui.setActiveDifficulty(this.difficulty);
    this.ui.updateStartStats(this.coins, this.best);
    this.ui.setSoundIcon(this.sound.muted);

    requestAnimationFrame((t) => this._loop(t));
  }

  /* ---------------- persistence ---------------- */
  _loadStorage() {
    try {
      this.best = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.best), 10) || 0;
      this.coins = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.coins), 10) || 0;
      const settings = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.settings) || '{}');
      if (settings.difficulty) this.difficulty = settings.difficulty;
      if (typeof settings.muted === 'boolean') this.sound.setMuted(settings.muted);
    } catch (e) { /* ignore corrupt storage */ }
  }

  _saveStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.best, String(this.best));
    localStorage.setItem(CONFIG.STORAGE_KEYS.coins, String(this.coins));
    localStorage.setItem(CONFIG.STORAGE_KEYS.settings, JSON.stringify({
      difficulty: this.difficulty,
      muted: this.sound.muted,
    }));
  }

  /* ---------------- grid / responsive canvas ---------------- */
  _computeGrid() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPlaying = this.state === STATE.PLAYING || this.state === STATE.PAUSED;

    const targetCols = w < h ? 16 : 24; // portrait: fewer cols; landscape: more
    if (!isPlaying || !this.cols) {
      this.cols = targetCols;
      this.cellSize = w / this.cols;
      this.rows = Math.floor(h / this.cellSize);
    } else {
      this.cellSize = w / this.cols;
    }

    [this.canvas, this.fxCanvas].forEach((c) => {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  isCellFree(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
    if (this.snake && this.snake.occupies(x, y)) return false;
    if (this.spawner.obstacles.some((o) => o.x === x && o.y === y)) return false;
    if (this.spawner.food.some((f) => f.x === x && f.y === y)) return false;
    if (this.spawner.powerups.some((p) => p.x === x && p.y === y)) return false;
    return true;
  }

  /* ---------------- state transitions ---------------- */
  startFromMenu() {
    this.sound.startMusic();
    this._beginNewGame();
  }

  _beginNewGame() {
    this._computeGrid();
    const cfg = CONFIG.DIFFICULTY[this.difficulty];
    this.score = 0;
    this.lastMilestone = 0;
    this.moveInterval = cfg.baseInterval;
    this.speedMultiplier = 1;
    this.activeEffects = {};
    this.ui.clearAllPowerupChips();

    const startX = Math.floor(this.cols / 2);
    const startY = Math.floor(this.rows / 2);
    this.snake = new Snake(startX, startY, 3);
    this.spawner.reset(cfg, this.cols, this.rows);

    this.state = STATE.PLAYING;
    this.ui.showScreen(null);
    this.ui.updateHUD(this.score, this.best, this.coins);
    this.moveTimer = 0;
  }

  restart() {
    this.ui.hideAllScreens();
    this._beginNewGame();
  }

  nextLevel() {
    // Escalate difficulty one notch (hard stays hard) and continue playing
    const order = ['easy', 'medium', 'hard'];
    const idx = order.indexOf(this.difficulty);
    this.difficulty = order[Math.min(idx + 1, order.length - 1)];
    this.ui.setActiveDifficulty(this.difficulty);
    this.ui.hideAllScreens();
    this._beginNewGame();
  }

  goHome() {
    this.state = STATE.START;
    this.sound.stopMusic();
    this.ui.clearAllPowerupChips();
    this.ui.updateStartStats(this.coins, this.best);
    this.ui.showScreen('startScreen');
  }

  togglePause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      this.ui.showScreen('pauseScreen');
    } else if (this.state === STATE.PAUSED) {
      this.resume();
    }
  }

  togglePauseMenu() {
    this.togglePause();
  }

  resume() {
    this.state = STATE.PLAYING;
    this.ui.showScreen(null);
  }

  openSettings() {
    this._preSettingsState = this.state;
    this.state = STATE.SETTINGS;
    this.ui.setActiveDifficulty(this.difficulty);
    this.ui.showScreen('settingsScreen');
  }

  closeSettings() {
    this.state = this._preSettingsState === STATE.PLAYING ? STATE.PLAYING : STATE.START;
    this.ui.showScreen(this.state === STATE.PLAYING ? null : 'startScreen');
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    this._saveStorage();
  }

  toggleMute() {
    this.sound.setMuted(!this.sound.muted);
    this.ui.setSoundIcon(this.sound.muted);
    this._saveStorage();
  }

  requestDirection(dir) {
    if (this.state === STATE.PLAYING) this.snake.requestDirection(dir);
  }

  /* ---------------- collision callbacks ---------------- */
  onFood(food) {
    this.spawner.removeFood(food);
    let points = 0;
    let img = null;
    if (food.kind === 'apple') {
      points = CONFIG.SCORES.apple;
      this.snake.grow(1);
      this.sound.playEat();
      img = this.assets.get('eatEffect');
    } else if (food.kind === 'goldenApple') {
      points = CONFIG.SCORES.goldenApple;
      this.snake.grow(1);
      this.sound.playGoldenEat();
      img = this.assets.get('sparkEffect');
    } else if (food.kind === 'coin') {
      points = CONFIG.SCORES.coin;
      this.coins += 1;
      this.sound.playCoin();
      img = this.assets.get('sparkEffect');
    }
    this._addScore(points);
    const px = (food.x + 0.5) * this.cellSize;
    const py = (food.y + 0.5) * this.cellSize;
    this.particles.burst(px, py, img, 10, { size: this.cellSize * 0.9, life: 450 });
    this.particles.floatText(px, py, '+' + points, food.kind === 'goldenApple' ? '#ffd54a' : '#c8ffcf');
  }

  onPoison(x, y) {
    const px = (x + 0.5) * this.cellSize;
    const py = (y + 0.5) * this.cellSize;
    if (this.snake.shieldActive) {
      this.consumeShield('poison');
      return;
    }
    const survives = this.snake.shrink(CONFIG.POISON_SEGMENTS_REMOVED);
    this.sound.playPoison();
    this.particles.burst(px, py, this.assets.get('poisonMushroom'), 6, { size: this.cellSize, life: 400, gravity: 0.02 });
    this.particles.floatText(px, py, '-3', '#c86bff');
    if (!survives) {
      this.onGameOver('poison');
    }
  }

  onIce(x, y) {
    this.snake.slideExtra += CONFIG.ICE_SLIDE_EXTRA_TILES;
    this.sound.playSlide();
  }

  onPowerup(powerup) {
    this.spawner.removePowerup(powerup);
    this.sound.playPowerup();
    const px = (powerup.x + 0.5) * this.cellSize;
    const py = (powerup.y + 0.5) * this.cellSize;
    this.particles.burst(px, py, this.assets.get(powerup.kind), 12, { size: this.cellSize, life: 500 });

    if (powerup.kind === 'speedBoost') {
      this._activateEffect('speedBoost', CONFIG.POWERUP_DURATION.speed);
      this.speedMultiplier = 1.8;
    } else if (powerup.kind === 'shield') {
      this.snake.shieldActive = true;
      this._activateEffect('shield', Infinity);
    } else if (powerup.kind === 'magnet') {
      this._activateEffect('magnet', CONFIG.POWERUP_DURATION.magnet);
    }
  }

  _activateEffect(kind, duration) {
    this.activeEffects[kind] = { expiresAt: duration === Infinity ? Infinity : performance.now() + duration, totalMs: duration };
    const iconMap = { speedBoost: 'speed_boost.png', shield: 'shield.png', magnet: 'magnet.png' };
    this.ui.setPowerupChip(kind, duration, duration, 'assets/images/' + iconMap[kind]);
  }

  consumeShield(cause) {
    this.snake.shieldActive = false;
    delete this.activeEffects.shield;
    this.ui.clearPowerupChip('shield');
    this.sound.playShieldHit();
    this.particles.shake(6, 200);
    this.ui.triggerShake();
    const p = (this.snake.head);
    this.particles.burst((p.x + 0.5) * this.cellSize, (p.y + 0.5) * this.cellSize, this.assets.get('sparkEffect'), 14, { size: this.cellSize, life: 400 });
  }

  onGameOver(cause) {
    this.state = STATE.GAMEOVER;
    this.sound.playExplosion();
    this.sound.playGameOver();
    this.particles.shake(cause === 'bomb' ? 14 : 8, 350);
    this.ui.triggerShake();
    if (cause === 'bomb') {
      const h = this.snake.head;
      this.particles.burst((h.x + 0.5) * this.cellSize, (h.y + 0.5) * this.cellSize, this.assets.get('bomb'), 18, { size: this.cellSize * 1.3, life: 600, gravity: 0.08 });
    }
    if (this.score > this.best) this.best = this.score;
    this._saveStorage();
    this.ui.clearAllPowerupChips();
    setTimeout(() => {
      this.ui.showGameOver({ score: this.score, best: this.best, coins: this.coins });
    }, 380);
  }

  _addScore(points) {
    this.score += points;
    if (this.score > this.best) this.best = this.score;
    this.ui.updateHUD(this.score, this.best, this.coins);

    const cfg = CONFIG.DIFFICULTY[this.difficulty];
    if (this.score >= cfg.victoryScore && this.state === STATE.PLAYING) {
      this._onVictory();
      return;
    }

    const milestone = Math.floor(this.score / CONFIG.SPEED_UP_EVERY);
    if (milestone > this.lastMilestone) {
      this.lastMilestone = milestone;
      this.moveInterval = Math.max(CONFIG.MIN_INTERVAL, this.moveInterval * CONFIG.SPEED_UP_FACTOR);
      this.spawner.maybeSpawnExtraBomb(true);
    }
  }

  _onVictory() {
    this.state = STATE.VICTORY;
    this.sound.playVictory();
    if (this.score > this.best) this.best = this.score;
    this._saveStorage();
    this.ui.clearAllPowerupChips();
    setTimeout(() => {
      this.ui.showVictory({ score: this.score, best: this.best, coins: this.coins });
    }, 300);
  }

  /* ---------------- main loop ---------------- */
  _loop(ts) {
    const dt = Math.min(50, ts - (this.lastTime || ts));
    this.lastTime = ts;

    if (this.state === STATE.PLAYING) {
      this._update(dt);
    }
    this.particles.update(dt);
    this._render();

    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    const now = performance.now();
    this.spawner.update(now);
    this._updateEffects(now);
    this._updateMagnet(dt);

    const effectiveDt = dt * this.speedMultiplier;
    this.moveTimer += effectiveDt;

    let guard = 0;
    while (this.moveTimer >= this.moveInterval && guard < 4) {
      this.moveTimer -= this.moveInterval;
      this._performStep();
      guard++;
      if (this.state !== STATE.PLAYING) { this.moveTimer = 0; break; }
    }
  }

  _updateEffects(now) {
    for (const kind of Object.keys(this.activeEffects)) {
      const eff = this.activeEffects[kind];
      if (eff.expiresAt !== Infinity) {
        const remaining = eff.expiresAt - now;
        if (remaining <= 0) {
          delete this.activeEffects[kind];
          this.ui.clearPowerupChip(kind);
          if (kind === 'speedBoost') this.speedMultiplier = 1;
        } else {
          this.ui.setPowerupChip(kind, remaining, eff.totalMs, 'assets/images/' + { speedBoost: 'speed_boost.png', magnet: 'magnet.png' }[kind]);
        }
      } else if (kind === 'shield' && !this.snake.shieldActive) {
        delete this.activeEffects[kind];
        this.ui.clearPowerupChip(kind);
      }
    }
  }

  _updateMagnet(dt) {
    if (!this.activeEffects.magnet || !this.snake) return;
    const head = this.snake.head;
    const radius = CONFIG.MAGNET_RADIUS_CELLS;
    const pull = CONFIG.MAGNET_PULL_SPEED * (dt / 16);
    const items = [...this.spawner.food];
    items.forEach((item) => {
      if (item.floatX === undefined) { item.floatX = item.x; item.floatY = item.y; }
      const dx = head.x - item.floatX;
      const dy = head.y - item.floatY;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius && dist > 0.001) {
        item.floatX += (dx / dist) * pull;
        item.floatY += (dy / dist) * pull;
        if (Math.hypot(head.x - item.floatX, head.y - item.floatY) < 0.5) {
          // snap onto head cell so the normal step collision picks it up next tick
          item.x = head.x;
          item.y = head.y;
        }
      }
    });
  }

  _performStep() {
    const snake = this.snake;
    let dir;
    let forcedSlide = false;
    if (snake.slideExtra > 0) {
      dir = snake.direction;
      forcedSlide = true;
    } else {
      dir = snake.peekDirection();
    }

    const nx = snake.head.x + dir.x;
    const ny = snake.head.y + dir.y;

    const allowed = this.collisionManager.resolve(nx, ny);
    if (this.state !== STATE.PLAYING) return; // game over / victory triggered inside resolve
    if (!allowed) return; // shield absorbed the hit; snake stays in place

    if (forcedSlide) {
      snake.slideExtra--;
      snake.direction = dir;
    } else {
      snake.consumeQueuedDirection(dir);
    }
    snake.step(dir);
  }

  /* ---------------- rendering ---------------- */
  _render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const shakeOff = this.particles.getShakeOffset();
    ctx.save();
    ctx.translate(shakeOff.x, shakeOff.y);

    this._drawBackground(ctx, w, h);

    if (this.snake) {
      this._drawObstacles(ctx);
      this._drawFood(ctx);
      this._drawPowerups(ctx);
      this._drawSnake(ctx);
    }

    ctx.restore();
    this.particles.draw();
  }

  _drawBackground(ctx, w, h) {
    const grass = this.assets.get('grassTile');
    const cs = this.cellSize;
    if (grass && grass.complete) {
      const cols = Math.ceil(w / cs) + 1;
      const rows = Math.ceil(h / cs) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.save();
          ctx.globalAlpha = (x + y) % 2 === 0 ? 1 : 0.85;
          ctx.drawImage(grass, x * cs, y * cs, cs + 1, cs + 1);
          ctx.restore();
        }
      }
      ctx.fillStyle = 'rgba(10,20,12,0.28)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = CONFIG.COLORS.grassA;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _drawObstacles(ctx) {
    const cs = this.cellSize;
    const now = performance.now();
    this.spawner.obstacles.forEach((o) => {
      const img = this.assets.get(o.kind);
      const px = o.x * cs, py = o.y * cs;
      ctx.save();
      if (o.kind === 'bomb') {
        const pulse = 1 + Math.sin(now / 180 + o.bobPhase) * 0.08;
        ctx.translate(px + cs / 2, py + cs / 2);
        ctx.scale(pulse, pulse);
        ctx.drawImage(img, -cs / 2, -cs / 2, cs, cs);
      } else if (o.kind === 'iceBlock') {
        ctx.globalAlpha = 0.95;
        ctx.drawImage(img, px, py, cs, cs);
      } else {
        ctx.drawImage(img, px, py, cs, cs);
      }
      ctx.restore();
    });
  }

  _drawFood(ctx) {
    const cs = this.cellSize;
    const now = performance.now();
    this.spawner.food.forEach((f) => {
      const key = f.kind === 'goldenApple' ? 'goldenApple' : f.kind === 'coin' ? 'coin' : 'apple';
      const img = this.assets.get(key);
      const bob = Math.sin(now / 260 + f.bobPhase) * cs * 0.06;
      const fx = f.floatX !== undefined ? f.floatX : f.x;
      const fy = f.floatY !== undefined ? f.floatY : f.y;
      const px = fx * cs;
      const py = fy * cs + bob;
      ctx.save();
      if (f.kind === 'goldenApple' || f.kind === 'coin') {
        const glow = 6 + Math.sin(now / 200 + f.bobPhase) * 4;
        ctx.shadowColor = 'rgba(255,214,80,0.9)';
        ctx.shadowBlur = glow;
      }
      ctx.drawImage(img, px, py, cs, cs);
      ctx.restore();
    });
  }

  _drawPowerups(ctx) {
    const cs = this.cellSize;
    const now = performance.now();
    this.spawner.powerups.forEach((p) => {
      const img = this.assets.get(p.kind);
      const bob = Math.sin(now / 220 + p.bobPhase) * cs * 0.1;
      const px = p.x * cs;
      const py = p.y * cs + bob;
      ctx.save();
      ctx.shadowColor = 'rgba(120,200,255,0.8)';
      ctx.shadowBlur = 10;
      ctx.drawImage(img, px, py, cs, cs);
      ctx.restore();
    });
  }

  _drawSnake(ctx) {
    const cs = this.cellSize;
    const t = Math.min(1, this.moveTimer / this.moveInterval);
    const renderSegs = this.snake.getRenderSegments(t);
    const now = performance.now();

    for (let i = renderSegs.length - 1; i >= 0; i--) {
      const seg = renderSegs[i];
      const isHead = i === 0;
      const isTail = i === renderSegs.length - 1;
      const img = isHead ? this.assets.get('snakeHead') : isTail ? this.assets.get('snakeTail') : this.assets.get('snakeBody');

      let angle = 0;
      const neighbor = isHead ? renderSegs[1] : renderSegs[i - 1];
      if (neighbor) {
        const dx = isHead ? seg.x - neighbor.x : neighbor.x - seg.x;
        const dy = isHead ? seg.y - neighbor.y : neighbor.y - seg.y;
        angle = Math.atan2(dy, dx);
      }

      const age = now - (seg.bornAt || 0);
      const popScale = isTail && age < 220 ? Math.min(1, age / 220) : 1;

      const cx = (seg.x + 0.5) * cs;
      const cy = (seg.y + 0.5) * cs;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const size = cs * 1.08 * popScale;
      if (this.snake.shieldActive && isHead) {
        ctx.save();
        ctx.rotate(-angle);
        ctx.globalAlpha = 0.5 + Math.sin(now / 150) * 0.15;
        ctx.drawImage(this.assets.get('shield'), -cs * 0.75, -cs * 0.75, cs * 1.5, cs * 1.5);
        ctx.restore();
      }
      if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}
