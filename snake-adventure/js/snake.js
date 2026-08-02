/* ============================================================
   Snake — grid-based movement with smooth interpolated rendering,
   growth animation, direction-reversal guarding, and status effects
   ============================================================ */
class Snake {
  constructor(x, y, length = 3) {
    this.reset(x, y, length);
  }

  reset(x, y, length = 3) {
    this.segments = [];
    for (let i = 0; i < length; i++) {
      this.segments.push({ x: x - i, y, bornAt: performance.now(), scale: 1 });
    }
    this.prevSegments = this.segments.map((s) => ({ x: s.x, y: s.y }));
    this.direction = DIR.RIGHT;
    this.queuedDirections = [];
    this.pendingGrowth = 0;
    this.slideExtra = 0;
    this.shieldActive = false;
    this.alive = true;
  }

  requestDirection(dir) {
    const last = this.queuedDirections[this.queuedDirections.length - 1] || this.direction;
    if (isOpposite(dir, last)) return; // never allow instant reversal
    if (dir.x === last.x && dir.y === last.y) return;
    if (this.queuedDirections.length < 2) this.queuedDirections.push(dir);
  }

  grow(n = 1) {
    this.pendingGrowth += n;
  }

  get head() {
    return this.segments[0];
  }

  /** Peek the direction that the *next* step would use, without mutating the queue. */
  peekDirection() {
    return this.queuedDirections.length ? this.queuedDirections[0] : this.direction;
  }

  /** Consume the queued direction (call only once the move has been approved). */
  consumeQueuedDirection(dir) {
    if (this.queuedDirections.length && this.queuedDirections[0] === dir) {
      this.queuedDirections.shift();
    }
    this.direction = dir;
  }

  /** Advance the snake one grid cell in the given direction. Returns the new head cell. */
  step(dir) {
    this.prevSegments = this.segments.map((s) => ({ x: s.x, y: s.y, scale: s.scale }));

    const newHead = {
      x: this.head.x + dir.x,
      y: this.head.y + dir.y,
      bornAt: performance.now(),
      scale: 1,
    };
    this.segments.unshift(newHead);

    if (this.pendingGrowth > 0) {
      this.pendingGrowth--;
      const tail = this.segments[this.segments.length - 1];
      tail.bornAt = performance.now();
    } else {
      this.segments.pop();
    }
    return newHead;
  }

  /** Remove n segments from the tail (poison mushroom). Returns true if snake still viable. */
  shrink(n) {
    for (let i = 0; i < n; i++) {
      if (this.segments.length <= 1) break;
      this.segments.pop();
    }
    this.prevSegments = this.segments.map((s) => ({ x: s.x, y: s.y }));
    return this.segments.length >= CONFIG.MIN_SNAKE_LENGTH;
  }

  occupies(x, y, { excludeHead = false } = {}) {
    return this.segments.some((s, i) => (excludeHead && i === 0 ? false : s.x === x && s.y === y));
  }

  /** Interpolated render positions between prevSegments and segments, t in [0,1] */
  getRenderSegments(t) {
    const out = [];
    for (let i = 0; i < this.segments.length; i++) {
      const cur = this.segments[i];
      const prev = this.prevSegments[i] || cur;
      out.push({
        x: prev.x + (cur.x - prev.x) * t,
        y: prev.y + (cur.y - prev.y) * t,
        bornAt: cur.bornAt,
      });
    }
    return out;
  }

  length() {
    return this.segments.length;
  }
}
