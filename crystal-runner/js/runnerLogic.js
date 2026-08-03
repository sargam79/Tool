/* ============================================================
   RunnerLogic — the entire gameplay simulation, decoupled from
   rendering. Everything here uses plain numbers (lane index 0-2,
   z-distance traveled) so it can run and be unit-tested with no
   browser, no WebGL, no Three.js. sceneManager.js is the only
   place that turns these numbers into 3D positions.
   ============================================================ */

const LANES = [-1, 0, 1]; // lane x-offset multiplier (times LANE_WIDTH)

const PLAYER_STATE = {
  RUN: 'run',
  JUMP: 'jump',
  SLIDE: 'slide',
  HIT: 'hit',
  DEAD: 'dead',
};

class RunnerPlayer {
  constructor() {
    this.reset();
  }

  reset() {
    this.lane = 1; // index into LANES (0=left,1=center,2=right)
    this.targetLane = 1;
    this.laneT = 1; // 0..1 progress of lane-switch tween, 1 = settled
    this.state = PLAYER_STATE.RUN;
    this.stateTime = 0;
    this.jumpProgress = 0; // 0..1 through the jump arc
    this.slideProgress = 0; // 0..1 through the slide
    this.height = 0; // current vertical offset (world units), derived from jumpProgress
    this.alive = true;
    this.invulnerableMs = 0; // brief post-hit grace period
  }

  requestLaneChange(dir) {
    // dir: -1 = left, +1 = right
    if (this.state === PLAYER_STATE.DEAD) return;
    const next = this.targetLane + dir;
    if (next < 0 || next > 2) return;
    this.targetLane = next;
    this.laneT = 0;
  }

  requestJump() {
    if (this.state === PLAYER_STATE.DEAD) return;
    if (this.state === PLAYER_STATE.JUMP) return;
    this.state = PLAYER_STATE.JUMP;
    this.jumpProgress = 0;
  }

  requestSlide() {
    if (this.state === PLAYER_STATE.DEAD) return;
    if (this.state === PLAYER_STATE.SLIDE) return;
    this.state = PLAYER_STATE.SLIDE;
    this.slideProgress = 0;
  }

  hit() {
    if (this.state === PLAYER_STATE.DEAD || this.invulnerableMs > 0) return false;
    this.state = PLAYER_STATE.HIT;
    this.stateTime = 0;
    this.invulnerableMs = 900;
    return true;
  }

  kill() {
    this.state = PLAYER_STATE.DEAD;
    this.alive = false;
  }

  isAirborne() {
    return this.state === PLAYER_STATE.JUMP;
  }

  isSliding() {
    return this.state === PLAYER_STATE.SLIDE;
  }

  update(dtMs, jumpDurationMs, slideDurationMs) {
    if (this.invulnerableMs > 0) this.invulnerableMs = Math.max(0, this.invulnerableMs - dtMs);

    // lane tween
    if (this.laneT < 1) {
      this.laneT = Math.min(1, this.laneT + dtMs / 220);
      if (this.laneT >= 1) this.lane = this.targetLane;
    }

    if (this.state === PLAYER_STATE.JUMP) {
      this.jumpProgress += dtMs / jumpDurationMs;
      if (this.jumpProgress >= 1) {
        this.jumpProgress = 1;
        this.height = 0;
        this.state = PLAYER_STATE.RUN;
      } else {
        // simple parabolic arc
        this.height = Math.sin(this.jumpProgress * Math.PI) * 1.6;
      }
    } else if (this.state === PLAYER_STATE.SLIDE) {
      this.slideProgress += dtMs / slideDurationMs;
      if (this.slideProgress >= 1) {
        this.slideProgress = 1;
        this.state = PLAYER_STATE.RUN;
      }
    } else if (this.state === PLAYER_STATE.HIT) {
      this.stateTime += dtMs;
      if (this.stateTime > 500) {
        this.state = PLAYER_STATE.RUN;
      }
    }
  }

  get laneOffset() {
    // interpolated x-offset (in lane units, -1..1) during a lane switch
    const from = LANES[this.lane];
    const to = LANES[this.targetLane];
    const eased = 1 - Math.pow(1 - this.laneT, 3); // ease-out cubic
    return from + (to - from) * eased;
  }
}

/* ---------------- Spawn track: obstacles & collectibles as data ---------------- */
class SpawnTrack {
  constructor(rng = Math.random) {
    this.rng = rng;
    this.items = []; // { id, kind, lane, z, type: 'obstacle'|'collectible'|'powerup', width: 1|3 (lanes blocked) }
    this._nextId = 1;
    this._nextSpawnZ = 40;
  }

  reset() {
    this.items = [];
    this._nextId = 1;
    this._nextSpawnZ = 40;
  }

  /** Ensure the track has spawned content up to `aheadZ` distance from the player. */
  fillAhead(aheadZ, difficulty) {
    while (this._nextSpawnZ < aheadZ) {
      this._spawnCluster(this._nextSpawnZ, difficulty);
      const gap = this._randRange(difficulty.minGap, difficulty.maxGap);
      this._nextSpawnZ += gap;
    }
  }

  _randRange(min, max) {
    return min + this.rng() * (max - min);
  }

  _spawnCluster(z, difficulty) {
    const roll = this.rng();
    if (roll < difficulty.obstacleChance) {
      this._spawnObstacle(z, difficulty);
    } else if (roll < difficulty.obstacleChance + difficulty.powerupChance) {
      this._spawnPowerup(z);
    } else {
      this._spawnCollectibleRow(z);
    }
  }

  _spawnObstacle(z, difficulty) {
    const kinds = ['barrier', 'rock', 'brokenBridge', 'fallenTree', 'movingRock'];
    const kind = kinds[Math.floor(this.rng() * kinds.length)];
    if (kind === 'rock' || kind === 'brokenBridge') {
      // full-width hazard: blocks all 3 lanes, must be jumped (bridge gap) or is simply impassable on foot (rock spans one lane still, so use single lane for rock)
    }
    if (kind === 'rock') {
      const lane = Math.floor(this.rng() * 3);
      this.items.push({ id: this._nextId++, type: 'obstacle', kind, lane, z, requiresLaneChange: true });
    } else if (kind === 'barrier') {
      const lane = Math.floor(this.rng() * 3);
      this.items.push({ id: this._nextId++, type: 'obstacle', kind, lane, z, requiresJump: true });
    } else if (kind === 'fallenTree') {
      // spans all 3 lanes, low, must jump
      this.items.push({ id: this._nextId++, type: 'obstacle', kind, lane: 1, z, requiresJump: true, allLanes: true });
    } else if (kind === 'brokenBridge') {
      // spans all 3 lanes, must jump the gap
      this.items.push({ id: this._nextId++, type: 'obstacle', kind, lane: 1, z, requiresJump: true, allLanes: true });
    } else if (kind === 'movingRock') {
      const lane = Math.floor(this.rng() * 3);
      this.items.push({ id: this._nextId++, type: 'obstacle', kind, lane, z, requiresLaneChange: true, moving: true, moveSeed: this.rng() * 1000 });
    }
  }

  _spawnPowerup(z) {
    const kinds = ['shield', 'speedBoost'];
    const kind = kinds[Math.floor(this.rng() * kinds.length)];
    const lane = Math.floor(this.rng() * 3);
    this.items.push({ id: this._nextId++, type: 'powerup', kind, lane, z });
  }

  _spawnCollectibleRow(z) {
    // a short run of crystals/coins in one lane, occasional rare gem
    const lane = Math.floor(this.rng() * 3);
    const count = 3 + Math.floor(this.rng() * 4);
    const rareRoll = this.rng();
    for (let i = 0; i < count; i++) {
      const kind = rareRoll < 0.08 && i === Math.floor(count / 2) ? 'gem' : (this.rng() < 0.6 ? 'crystal' : 'coin');
      this.items.push({ id: this._nextId++, type: 'collectible', kind, lane, z: z + i * 2.2 });
    }
  }

  removeItem(id) {
    this.items = this.items.filter((it) => it.id !== id);
  }

  /** Drop items that have scrolled behind the player (cleanup). */
  cullBehind(z) {
    this.items = this.items.filter((it) => it.z > z - 5);
  }
}

/* ---------------- Difficulty scaling ---------------- */
function getDifficulty(distance) {
  const t = Math.min(1, distance / 3000); // ramps up over the first 3000 units
  return {
    speed: 14 + t * 16, // world units/sec
    obstacleChance: 0.35 + t * 0.15,
    powerupChance: Math.max(0.04, 0.09 - t * 0.05),
    minGap: Math.max(7, 11 - t * 4),
    maxGap: Math.max(11, 16 - t * 5),
  };
}

/* ---------------- Collision detection (pure math) ---------------- */
/**
 * Check the player's current state/lane against a list of nearby obstacle
 * items and return the first one it collides with, or null.
 * `playerZ` is fixed at 0 in local space; item.z is distance ahead.
 */
function checkObstacleCollision(player, items, collisionWindow = 1.1) {
  for (const it of items) {
    if (it.type !== 'obstacle') continue;
    if (Math.abs(it.z) > collisionWindow) continue;
    const laneHit = it.allLanes || it.lane === player.lane;
    if (!laneHit) continue;
    if (it.requiresJump && player.isAirborne()) continue;
    if (it.requiresLaneChange) {
      // side-stepping obstacles are avoided simply by not being in that lane (already checked above)
    }
    if ((it.kind === 'fallenTree' || it.kind === 'barrier') && player.isSliding() && it.kind === 'barrier') {
      // low barriers can also be jumped OR slid under in this game's design
      continue;
    }
    return it;
  }
  return null;
}

function checkPickup(player, items, collisionWindow = 1.1) {
  const collected = [];
  for (const it of items) {
    if (it.type !== 'collectible' && it.type !== 'powerup') continue;
    if (Math.abs(it.z) > collisionWindow) continue;
    if (it.lane !== player.lane) continue;
    collected.push(it);
  }
  return collected;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LANES, PLAYER_STATE, RunnerPlayer, SpawnTrack, getDifficulty, checkObstacleCollision, checkPickup };
}
