/* ============================================================
   Game — main controller: owns the game loop and connects the
   pure logic layer (RunnerLogic) to the Three.js renderer
   (SceneManager), input, sound, and UI.
   ============================================================ */
class Game {
  constructor(assets) {
    this.assets = assets;
    this.canvas = document.getElementById('gameCanvas');
    this.scene = new SceneManager(this.canvas, assets);
    this.sound = new SoundManager();
    this.ui = new UIManager(this);
    this.input = new InputManager(this);

    this.state = GAME_STATE.START;
    this.player = new RunnerPlayer();
    this.track = new SpawnTrack(Math.random);
    this.visualsByItemId = new Map();

    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.crystals = 0;
    this.best = 0;
    this.totalCoins = 0;

    this.activeEffects = {};
    this.speedMultiplier = 1;

    this.lastTime = 0;
    this._footstepTimer = 0;
    this._dustTimer = 0;

    this._loadStorage();
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    window.addEventListener('orientationchange', () => setTimeout(() => this._resizeCanvas(), 200));

    this.ui.updateStartStats(this.totalCoins, this.best);

    requestAnimationFrame((t) => this._loop(t));
  }

  _resizeCanvas() {
    const w = window.innerWidth, h = window.innerHeight;
    this.scene.resize(w, h);
  }

  _loadStorage() {
    try {
      this.best = parseInt(localStorage.getItem(RUNNER_CONFIG.STORAGE_KEYS.best), 10) || 0;
      this.totalCoins = parseInt(localStorage.getItem(RUNNER_CONFIG.STORAGE_KEYS.coins), 10) || 0;
    } catch (e) { /* ignore */ }
  }

  _saveStorage() {
    try {
      localStorage.setItem(RUNNER_CONFIG.STORAGE_KEYS.best, String(Math.floor(this.best)));
      localStorage.setItem(RUNNER_CONFIG.STORAGE_KEYS.coins, String(this.totalCoins));
    } catch (e) { /* ignore */ }
  }

  /* ---------------- state transitions ---------------- */
  startFromMenu() {
    this.sound.startMusic();
    this._beginNewRun();
  }

  _beginNewRun() {
    this.player.reset();
    this.track.reset();
    this.visualsByItemId.forEach((mesh) => this.scene.removeItemVisual(mesh));
    this.visualsByItemId.clear();

    this.distance = 0;
    this.score = 0;
    this.coins = 0;
    this.crystals = 0;
    this.activeEffects = {};
    this.speedMultiplier = 1;
    this.ui.clearAllChips();

    this.state = GAME_STATE.PLAYING;
    this.ui.showScreen(null);
    this.ui.setHudVisible(true);
    this.ui.updateHUD(0, 0, 0);
  }

  restart() {
    this.ui.showScreen(null);
    this._beginNewRun();
  }

  goHome() {
    this.state = GAME_STATE.START;
    this.sound.stopMusic();
    this.ui.setHudVisible(false);
    this.ui.clearAllChips();
    this.ui.updateStartStats(this.totalCoins, this.best);
    this.ui.showScreen('startScreen');
  }

  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
      this.ui.showScreen('pauseScreen');
    } else if (this.state === GAME_STATE.PAUSED) {
      this.resume();
    }
  }

  resume() {
    this.state = GAME_STATE.PLAYING;
    this.ui.showScreen(null);
  }

  /* ---------------- input callbacks ---------------- */
  onLeft() { if (this.state === GAME_STATE.PLAYING) { this.player.requestLaneChange(-1); } }
  onRight() { if (this.state === GAME_STATE.PLAYING) { this.player.requestLaneChange(1); } }
  onJump() {
    if (this.state !== GAME_STATE.PLAYING) return;
    if (this.player.state === 'run') { this.player.requestJump(); this.sound.playJump(); }
  }
  onSlide() {
    if (this.state !== GAME_STATE.PLAYING) return;
    if (this.player.state === 'run') { this.player.requestSlide(); this.sound.playSlide(); }
  }

  /* ---------------- effects ---------------- */
  _activateEffect(kind, durationMs) {
    this.activeEffects[kind] = { expiresAt: durationMs === Infinity ? Infinity : performance.now() + durationMs, total: durationMs };
    const iconMap = { shield: 'assets/images/shield_icon.png', speedBoost: 'assets/images/speed_icon.png' };
    this.ui.setPowerupChip(kind, durationMs, iconMap[kind]);
  }

  _updateEffects(now) {
    for (const kind of Object.keys(this.activeEffects)) {
      const eff = this.activeEffects[kind];
      if (eff.expiresAt === Infinity) continue;
      const remaining = eff.expiresAt - now;
      if (remaining <= 0) {
        delete this.activeEffects[kind];
        this.ui.clearPowerupChip(kind);
        if (kind === 'speedBoost') this.speedMultiplier = 1;
      } else {
        this.ui.setPowerupChip(kind, remaining, kind === 'shield' ? 'assets/images/shield_icon.png' : 'assets/images/speed_icon.png');
      }
    }
  }

  consumeShield() {
    delete this.activeEffects.shield;
    this.player._shieldVisible = false;
    this.ui.clearPowerupChip('shield');
    this.sound.playShieldHit();
    this.scene.triggerShake(0.15, 200);
  }

  /* ---------------- collision resolution ---------------- */
  _resolveCollisions() {
    const nearby = this.track.items.filter((it) => Math.abs(it.z) <= 6);

    const hitObstacle = checkObstacleCollision(this.player, nearby, RUNNER_CONFIG.COLLISION_WINDOW);
    if (hitObstacle) {
      if (this.activeEffects.shield) {
        this.consumeShield();
        this.track.removeItem(hitObstacle.id);
        this._removeVisual(hitObstacle.id);
      } else {
        this._onCollision(hitObstacle);
        return;
      }
    }

    const collected = checkPickup(this.player, nearby, RUNNER_CONFIG.PICKUP_WINDOW);
    for (const item of collected) {
      this._onPickup(item);
      this.track.removeItem(item.id);
      this._removeVisual(item.id);
    }
  }

  _onPickup(item) {
    const pos = { x: (item.lane - 1) * RUNNER_CONFIG.LANE_WIDTH, y: 1.1, z: 0 };
    if (item.type === 'collectible') {
      if (item.kind === 'crystal') {
        this.crystals++;
        this.score += RUNNER_CONFIG.SCORE.crystal;
        this.sound.playCrystal();
        this.scene.spawnParticle(new THREE.Vector3(pos.x, pos.y, pos.z), this.scene.crystalGlowTex, { size: 0.5, life: 400 });
      } else if (item.kind === 'coin') {
        this.coins++; this.totalCoins++;
        this.score += RUNNER_CONFIG.SCORE.coin;
        this.sound.playCoin();
        this.scene.spawnParticle(new THREE.Vector3(pos.x, pos.y, pos.z), this.scene.sparkTex, { size: 0.4, life: 350 });
      } else if (item.kind === 'gem') {
        this.score += RUNNER_CONFIG.SCORE.gem;
        this.sound.playGem();
        this.scene.spawnParticle(new THREE.Vector3(pos.x, pos.y, pos.z), this.scene.sparkTex, { size: 0.8, life: 600 });
      }
    } else if (item.type === 'powerup') {
      if (item.kind === 'shield') {
        this._activateEffect('shield', RUNNER_CONFIG.POWERUP_DURATION_MS.shield);
        this.player._shieldVisible = true;
        this.sound.playShieldActivate();
      } else if (item.kind === 'speedBoost') {
        this._activateEffect('speedBoost', RUNNER_CONFIG.POWERUP_DURATION_MS.speedBoost);
        this.speedMultiplier = 1.4;
        this.sound.playSpeedBoost();
      }
    }
    this.ui.updateHUD(this.score, this.coins, this.crystals);
  }

  _onCollision(item) {
    const survived = this.player.hit();
    this.sound.playCollision();
    this.scene.triggerShake(0.35, 320);
    this.ui.triggerShakeUI();
    if (!survived) return; // still invulnerable from a prior hit, shouldn't happen but guard anyway
    // second hit while already in HIT/grace or a hard obstacle => death for this prototype's difficulty feel
    this._killPlayer();
  }

  _killPlayer() {
    this.player.kill();
    this.player._deathT = 0;
    this.sound.playGameOver();
    if (this.score > this.best) this.best = this.score;
    this._saveStorage();
    setTimeout(() => {
      this.state = GAME_STATE.GAMEOVER;
      this.ui.setHudVisible(false);
      this.ui.clearAllChips();
      this.ui.showGameOver({ score: this.score, best: this.best, crystals: this.crystals, coins: this.coins });
    }, 900);
  }

  _removeVisual(id) {
    const mesh = this.visualsByItemId.get(id);
    if (mesh) { this.scene.removeItemVisual(mesh); this.visualsByItemId.delete(id); }
  }

  /* ---------------- main loop ---------------- */
  _loop(ts) {
    const dtMs = Math.min(50, ts - (this.lastTime || ts));
    this.lastTime = ts;
    const dtSec = dtMs / 1000;

    if (this.state === GAME_STATE.PLAYING) {
      this._update(dtMs, dtSec);
    } else if (this.state === GAME_STATE.GAMEOVER && this.player.state === 'dead') {
      this.player._deathT = Math.min(1, (this.player._deathT || 0) + dtSec * 1.5);
    }

    this.scene.step(dtSec);
    this.scene.updateParticles(dtSec);
    if (this.player) {
      this.scene.updateCharacterPose(this.player, this.distance, this._currentSpeed || RUNNER_CONFIG.SPEED.baseWorldUnitsPerSec);
      this.scene.updateCamera(this.distance, this._currentSpeed || RUNNER_CONFIG.SPEED.baseWorldUnitsPerSec, this.player, dtSec);
    }
    this.scene.render();

    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dtMs, dtSec) {
    const difficulty = getDifficulty(this.distance);
    const speed = difficulty.speed * this.speedMultiplier;
    this._currentSpeed = speed;

    this.player.update(dtMs, RUNNER_CONFIG.JUMP_DURATION_MS, RUNNER_CONFIG.SLIDE_DURATION_MS);

    if (this.player.state !== 'dead') {
      this.distance += speed * dtSec;
      this.score += speed * dtSec * RUNNER_CONFIG.SCORE.perUnitDistance * 0.1;
    }

    this._updateEffects(performance.now());

    // advance world items toward the player
    for (const item of this.track.items) {
      item.z -= speed * dtSec;
    }
    this.track.fillAhead(this.distance + 60, difficulty);
    this.track.cullBehind(-8);

    // sync visuals
    const seen = new Set();
    for (const item of this.track.items) {
      seen.add(item.id);
      let mesh = this.visualsByItemId.get(item.id);
      if (!mesh) {
        mesh = this.scene.createItemVisual(item);
        this.visualsByItemId.set(item.id, mesh);
      }
      this.scene.updateItemVisual(item, mesh, dtSec);
    }
    for (const [id, mesh] of this.visualsByItemId) {
      if (!seen.has(id)) { this.scene.removeItemVisual(mesh); this.visualsByItemId.delete(id); }
    }

    this.scene.recycleTrackSegments(this.distance);

    this._resolveCollisions();

    // footstep + dust while running
    if (this.player.state === 'run') {
      this._footstepTimer += dtMs;
      const stepInterval = Math.max(180, 340 - speed * 4);
      if (this._footstepTimer > stepInterval) {
        this._footstepTimer = 0;
        this.sound.playFootstep();
      }
      this._dustTimer += dtMs;
      if (this._dustTimer > 110) {
        this._dustTimer = 0;
        const px = this.player.laneOffset * RUNNER_CONFIG.LANE_WIDTH;
        this.scene.spawnParticle(new THREE.Vector3(px, 0.05, -0.3), this.scene.dustTex, { size: 0.5, life: 380, vel: new THREE.Vector3(0, 0.4, -1.2), gravity: -0.2, additive: false });
      }
    }

    this.ui.updateHUD(this.score, this.coins, this.crystals);
  }
}
