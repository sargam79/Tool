/* ============================================================
   AssetLoader — preloads every image once, exposes get(name)
   ============================================================ */
class AssetLoader {
  constructor() {
    this.images = {};
    this.manifest = {
      playButton: 'assets/images/play_button.png',
      pauseIcon: 'assets/images/pause_icon.png',
      restartIcon: 'assets/images/restart_icon.png',
      homeIcon: 'assets/images/home_icon.png',
      confirmIcon: 'assets/images/confirm_icon.png',
      shieldIcon: 'assets/images/shield_icon.png',
      speedIcon: 'assets/images/speed_icon.png',
      coinIcon: 'assets/images/coin_icon.png',
      crystalIcon: 'assets/images/crystal_icon.png',
      scoreBadge: 'assets/images/score_badge.png',
      gameoverBanner: 'assets/images/gameover_banner.png',
      heroPortrait: 'assets/images/hero_portrait.png',
      decorIsland: 'assets/images/decor_island.png',
      dustEffect: 'assets/images/dust_effect.png',
      barrierTexture: 'assets/images/barrier_texture_raw.png',
      texRock: 'assets/images/tex_rock.png',
      texGrass: 'assets/images/tex_grass.png',
      texWood: 'assets/images/tex_wood.png',
      texSand: 'assets/images/tex_sand.png',
    };
    this.total = Object.keys(this.manifest).length;
    this.loaded = 0;
  }

  async loadAll(onProgress) {
    const promises = Object.entries(this.manifest).map(([key, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { this.loaded++; if (onProgress) onProgress(this.loaded / this.total); resolve(); };
        img.onerror = () => { this.loaded++; if (onProgress) onProgress(this.loaded / this.total); resolve(); };
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
