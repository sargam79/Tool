/* ============================================================
   AssetLoader — preloads every image once, exposes get(name)
   ============================================================ */
class AssetLoader {
  constructor() {
    this.images = {};
    this.manifest = {
      apple: 'assets/images/apple.png',
      goldenApple: 'assets/images/golden_apple.png',
      coin: 'assets/images/coin.png',
      stoneWall: 'assets/images/stone_wall.png',
      woodenWall: 'assets/images/wooden_wall.png',
      bomb: 'assets/images/bomb.png',
      poisonMushroom: 'assets/images/poison_mushroom.png',
      iceBlock: 'assets/images/ice_block.png',
      speedBoost: 'assets/images/speed_boost.png',
      shield: 'assets/images/shield.png',
      magnet: 'assets/images/magnet.png',
      eatEffect: 'assets/images/eat_effect.png',
      sparkEffect: 'assets/images/spark_effect.png',
      snakeHead: 'assets/images/snake_head.png',
      snakeBody: 'assets/images/snake_body.png',
      snakeTail: 'assets/images/snake_tail.png',
      grassTile: 'assets/images/grass_tile.png',
      pauseBtn: 'assets/images/pause_button.png',
      playBtn: 'assets/images/play_button.png',
      homeBtn: 'assets/images/home_button.png',
      settingsBtn: 'assets/images/settings_button.png',
      restartBtn: 'assets/images/restart_button.png',
      soundOn: 'assets/images/sound_on.png',
      soundOff: 'assets/images/sound_off.png',
    };
    this.total = Object.keys(this.manifest).length;
    this.loaded = 0;
  }

  async loadAll(onProgress) {
    const promises = Object.entries(this.manifest).map(([key, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.loaded++;
          if (onProgress) onProgress(this.loaded / this.total);
          resolve();
        };
        img.onerror = () => {
          // Never block the game on a missing asset — resolve anyway.
          this.loaded++;
          if (onProgress) onProgress(this.loaded / this.total);
          resolve();
        };
        img.src = src;
        this.images[key] = img;
      });
    });
    await Promise.all(promises);
    return this.images;
  }

  get(name) {
    return this.images[name];
  }
}
