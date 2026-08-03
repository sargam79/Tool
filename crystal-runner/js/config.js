/* ============================================================
   CONFIG — tuning values for Crystal Runner
   ============================================================ */
const RUNNER_CONFIG = {
  LANE_WIDTH: 2.4,
  JUMP_DURATION_MS: 620,
  SLIDE_DURATION_MS: 520,
  COLLISION_WINDOW: 1.15,
  PICKUP_WINDOW: 1.3,

  CAMERA: {
    baseDistance: 6.2,
    baseHeight: 3.1,
    lookAheadHeight: 1.3,
    followLerp: 0.12,
    baseFov: 62,
    maxFovBoost: 10, // extra FOV at max speed
    tiltMaxDeg: 7,
    shakeDecay: 0.88,
  },

  SPEED: {
    baseWorldUnitsPerSec: 14,
    maxWorldUnitsPerSec: 30,
    rampDistance: 3000,
  },

  SCORE: {
    perUnitDistance: 1,
    crystal: 15,
    coin: 5,
    gem: 100,
  },

  POWERUP_DURATION_MS: {
    shield: Infinity, // consumed on hit
    speedBoost: 6000,
  },

  TRACK: {
    segmentLength: 20,
    segmentsAhead: 8,
    segmentsBehind: 2,
  },

  STORAGE_KEYS: {
    best: 'crystalRunner_bestScore',
    coins: 'crystalRunner_coins',
    settings: 'crystalRunner_settings',
  },

  COLORS: {
    fogColor: 0x0a1830,
    skyTop: 0x1a3a6e,
    skyBottom: 0x6fb8e8,
    crystalGlow: 0x33ccff,
    goldAccent: 0xffc850,
  },
};

const GAME_STATE = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RUNNER_CONFIG, GAME_STATE };
}
