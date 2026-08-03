/* ============================================================
   UIManager — DOM screens and HUD. Talks to Game via callbacks.
   ============================================================ */
class UIManager {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: document.getElementById('hud'),
      scoreValue: document.getElementById('scoreValue'),
      coinValue: document.getElementById('coinValue'),
      crystalValue: document.getElementById('crystalValue'),
      powerupBar: document.getElementById('powerupBar'),

      startScreen: document.getElementById('startScreen'),
      pauseScreen: document.getElementById('pauseScreen'),
      gameOverScreen: document.getElementById('gameOverScreen'),

      startCoins: document.getElementById('startCoins'),
      startBest: document.getElementById('startBest'),

      finalScore: document.getElementById('finalScore'),
      finalBest: document.getElementById('finalBest'),
      finalCrystals: document.getElementById('finalCrystals'),
      finalCoins: document.getElementById('finalCoins'),
    };
    this.activeChips = {};
    this._bindButtons();
  }

  _bindButtons() {
    const g = this.game;
    const click = (id, fn) => document.getElementById(id).addEventListener('click', (e) => { g.sound.playClick(); fn(e); });

    click('startBtn', () => g.startFromMenu());
    click('pauseBtn', () => g.togglePause());
    click('resumeBtn', () => g.resume());
    click('restartFromPauseBtn', () => g.restart());
    click('homeFromPauseBtn', () => g.goHome());
    click('homeFromGameOverBtn', () => g.goHome());
    click('restartFromGameOverBtn', () => g.restart());
  }

  updateHUD(score, coins, crystals) {
    this.el.scoreValue.textContent = Math.floor(score).toLocaleString();
    this.el.coinValue.textContent = coins;
    this.el.crystalValue.textContent = crystals;
  }

  updateStartStats(coins, best) {
    this.el.startCoins.textContent = coins;
    this.el.startBest.textContent = best;
  }

  showScreen(name) {
    ['startScreen', 'pauseScreen', 'gameOverScreen'].forEach((k) => this.el[k].classList.add('hidden'));
    if (name) this.el[name].classList.remove('hidden');
  }

  setHudVisible(visible) {
    this.el.hud.classList.toggle('hidden', !visible);
  }

  showGameOver({ score, best, crystals, coins }) {
    this.el.finalScore.textContent = Math.floor(score).toLocaleString();
    this.el.finalBest.textContent = Math.floor(best).toLocaleString();
    this.el.finalCrystals.textContent = crystals;
    this.el.finalCoins.textContent = coins;
    this.showScreen('gameOverScreen');
  }

  setPowerupChip(kind, remainingMs, iconSrc) {
    let chip = this.activeChips[kind];
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'powerup-chip';
      chip.innerHTML = `<img src="${iconSrc}"><span class="chip-timer"></span>`;
      this.el.powerupBar.appendChild(chip);
      this.activeChips[kind] = chip;
    }
    const timerEl = chip.querySelector('.chip-timer');
    timerEl.textContent = remainingMs === Infinity ? '●' : (remainingMs / 1000).toFixed(1) + 's';
  }

  clearPowerupChip(kind) {
    const chip = this.activeChips[kind];
    if (chip) { chip.remove(); delete this.activeChips[kind]; }
  }

  clearAllChips() {
    Object.keys(this.activeChips).forEach((k) => this.clearPowerupChip(k));
  }

  triggerShakeUI() {
    const app = document.getElementById('app');
    app.classList.remove('shake');
    void app.offsetWidth;
    app.classList.add('shake');
  }
}
