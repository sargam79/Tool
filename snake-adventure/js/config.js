/* ============================================================
   CONFIG — central tuning values for the whole game
   ============================================================ */
const CONFIG = {
  GRID: {
    COLS: 22,
    ROWS: 34, // recalculated at runtime to match viewport aspect ratio
  },

  DIFFICULTY: {
    easy:   { baseInterval: 240, obstacleCount: 4,  bombChance: 0.15, wallChance: 0.5, victoryScore: 400  },
    medium: { baseInterval: 190, obstacleCount: 7,  bombChance: 0.30, wallChance: 0.65, victoryScore: 700  },
    hard:   { baseInterval: 150, obstacleCount: 11, bombChance: 0.45, wallChance: 0.8, victoryScore: 1000 },
  },

  SPEED_UP_EVERY: 50,       // points
  SPEED_UP_FACTOR: 0.97,    // multiply interval (faster) each speed-up step — gentle ramp
  MIN_INTERVAL: 100,

  SCORES: {
    apple: 10,
    goldenApple: 50,
    coin: 5,
  },

  SPAWN: {
    foodMin: 3, foodMax: 5,          // simultaneous food items on board
    powerupIntervalMin: 9000,        // ms between powerup spawn attempts
    powerupIntervalMax: 16000,
    powerupLifetime: 9000,           // ms a powerup stays on the board before vanishing
  },

  POWERUP_DURATION: {
    speed: 5000,
    shield: Infinity, // consumed on hit
    magnet: 8000,
  },

  MAGNET_RADIUS_CELLS: 5,
  MAGNET_PULL_SPEED: 0.35,

  ICE_SLIDE_EXTRA_TILES: 1,
  POISON_SEGMENTS_REMOVED: 3,
  MIN_SNAKE_LENGTH: 2,

  STORAGE_KEYS: {
    best: 'snakeAdventure_bestScore',
    coins: 'snakeAdventure_coins',
    settings: 'snakeAdventure_settings',
  },

  COLORS: {
    grassA: '#2c5c38',
    grassB: '#316641',
  },
};

const STATE = {
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SETTINGS: 'settings',
  GAMEOVER: 'gameover',
  VICTORY: 'victory',
};

const DIR = {
  UP:    { x: 0, y: -1 },
  DOWN:  { x: 0, y: 1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}
