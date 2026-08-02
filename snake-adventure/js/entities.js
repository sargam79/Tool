/* ============================================================
   Entities — Food, Obstacle, PowerUp + the Spawner that places
   them on the grid without overlapping the snake or each other.
   ============================================================ */

class GridEntity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.spawnTime = performance.now();
    this.bobPhase = Math.random() * Math.PI * 2;
  }
}

class Food extends GridEntity {
  constructor(x, y, kind) {
    super(x, y, 'food');
    this.kind = kind; // 'apple' | 'goldenApple' | 'coin'
  }
}

class Obstacle extends GridEntity {
  constructor(x, y, kind) {
    super(x, y, 'obstacle');
    this.kind = kind; // 'stoneWall' | 'woodenWall' | 'bomb' | 'poisonMushroom' | 'iceBlock'
  }
}

class PowerUp extends GridEntity {
  constructor(x, y, kind) {
    super(x, y, 'powerup');
    this.kind = kind; // 'speedBoost' | 'shield' | 'magnet'
  }
}

/* ---------------- Spawner ---------------- */
class Spawner {
  constructor(game) {
    this.game = game;
    this.food = [];
    this.obstacles = [];
    this.powerups = [];
    this._nextPowerupAt = 0;
  }

  reset(difficultyConfig, cols, rows) {
    this.cfg = difficultyConfig;
    this.cols = cols;
    this.rows = rows;
    this.food = [];
    this.obstacles = [];
    this.powerups = [];
    this._scheduleNextPowerup();
    this._placeInitialObstacles();
    this._fillFood();
  }

  _scheduleNextPowerup() {
    const { powerupIntervalMin, powerupIntervalMax } = CONFIG.SPAWN;
    this._nextPowerupAt = performance.now() + powerupIntervalMin + Math.random() * (powerupIntervalMax - powerupIntervalMin);
  }

  _randomFreeCell(margin = 1) {
    const game = this.game;
    for (let attempts = 0; attempts < 200; attempts++) {
      const x = Math.floor(Math.random() * (this.cols - margin * 2)) + margin;
      const y = Math.floor(Math.random() * (this.rows - margin * 2)) + margin;
      if (game.isCellFree(x, y)) return { x, y };
    }
    return null;
  }

  _placeInitialObstacles() {
    const total = this.cfg.obstacleCount;
    const bombShare = Math.round(total * 0.25 * this.cfg.bombChance * 2);
    const poisonShare = Math.max(1, Math.round(total * 0.15));
    const iceShare = Math.max(1, Math.round(total * 0.15));
    const wallShare = Math.max(2, total - bombShare - poisonShare - iceShare);
    const stoneCount = Math.ceil(wallShare * 0.5);
    const woodCount = wallShare - stoneCount;

    for (let i = 0; i < stoneCount; i++) this._spawnObstacle('stoneWall');
    for (let i = 0; i < woodCount; i++) this._spawnObstacle('woodenWall');
    for (let i = 0; i < poisonShare; i++) this._spawnObstacle('poisonMushroom');
    for (let i = 0; i < iceShare; i++) this._spawnObstacle('iceBlock');
    for (let i = 0; i < Math.max(1, bombShare); i++) this._spawnObstacle('bomb');
  }

  _spawnObstacle(kind) {
    const cell = this._randomFreeCell(2);
    if (!cell) return null;
    const obs = new Obstacle(cell.x, cell.y, kind);
    this.obstacles.push(obs);
    return obs;
  }

  _fillFood() {
    const target = CONFIG.SPAWN.foodMin + Math.floor(Math.random() * (CONFIG.SPAWN.foodMax - CONFIG.SPAWN.foodMin + 1));
    while (this.food.length < target) {
      const cell = this._randomFreeCell(1);
      if (!cell) break;
      const roll = Math.random();
      let kind = 'apple';
      if (roll < 0.12) kind = 'goldenApple';
      else if (roll < 0.42) kind = 'coin';
      this.food.push(new Food(cell.x, cell.y, kind));
    }
  }

  removeFood(item) {
    this.food = this.food.filter((f) => f !== item);
    this._fillFood();
  }

  removeObstacle(item) {
    this.obstacles = this.obstacles.filter((o) => o !== item);
  }

  update(now) {
    // periodic bomb refresh to keep late-game tense
    if (now >= this._nextPowerupAt) {
      this._trySpawnPowerup();
      this._scheduleNextPowerup();
    }
    // expire stale powerups
    this.powerups = this.powerups.filter((p) => now - p.spawnTime < CONFIG.SPAWN.powerupLifetime);
  }

  _trySpawnPowerup() {
    if (this.powerups.length >= 2) return;
    const cell = this._randomFreeCell(1);
    if (!cell) return;
    const kinds = ['speedBoost', 'shield', 'magnet'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.powerups.push(new PowerUp(cell.x, cell.y, kind));
  }

  removePowerup(item) {
    this.powerups = this.powerups.filter((p) => p !== item);
  }

  maybeSpawnExtraBomb(scoreMilestoneHit) {
    if (scoreMilestoneHit && Math.random() < this.cfg.bombChance) {
      this._spawnObstacle('bomb');
    }
  }

  allOccupiedCells() {
    return [...this.food, ...this.obstacles, ...this.powerups];
  }
}
