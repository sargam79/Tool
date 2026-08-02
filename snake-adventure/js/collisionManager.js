/* ============================================================
   CollisionManager — decides what happens when the snake's head
   reaches a new cell: walls, hazards, food, power-ups, self.
   ============================================================ */
class CollisionManager {
  constructor(game) {
    this.game = game;
  }

  /**
   * Evaluate the outcome of the snake moving its head to (x,y).
   * Mutates game state as a side effect (score, board, effects).
   * Returns true if the move is allowed to complete, false if the
   * step must be aborted (game over already handled internally).
   */
  resolve(x, y) {
    const game = this.game;
    const snake = game.snake;

    // 1. Out of bounds
    if (x < 0 || x >= game.cols || y < 0 || y >= game.rows) {
      return this._lethal('bounds');
    }

    // 2. Self collision (check against current segments, excluding the tail
    //    cell that is about to vacate unless the snake is growing)
    const willVacateTail = snake.pendingGrowth === 0;
    const bodyToCheck = willVacateTail ? snake.segments.slice(0, -1) : snake.segments;
    if (bodyToCheck.some((s) => s.x === x && s.y === y)) {
      return this._lethal('self');
    }

    // 3. Obstacles
    const obstacle = game.spawner.obstacles.find((o) => o.x === x && o.y === y);
    if (obstacle) {
      switch (obstacle.kind) {
        case 'stoneWall':
        case 'woodenWall':
          return this._lethal('wall');
        case 'bomb':
          return this._lethal('bomb');
        case 'poisonMushroom':
          game.spawner.removeObstacle(obstacle);
          game.onPoison(x, y);
          break;
        case 'iceBlock':
          game.onIce(x, y);
          break;
      }
    }

    // 4. Food
    const food = game.spawner.food.find((f) => f.x === x && f.y === y);
    if (food) {
      game.onFood(food);
    }

    // 5. Power-ups
    const powerup = game.spawner.powerups.find((p) => p.x === x && p.y === y);
    if (powerup) {
      game.onPowerup(powerup);
    }

    return true;
  }

  _lethal(cause) {
    const game = this.game;
    if (game.snake.shieldActive) {
      game.consumeShield(cause);
      return false; // step aborted, snake stays put, shield consumed
    }
    game.onGameOver(cause);
    return false;
  }
}
