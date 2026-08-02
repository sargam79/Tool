/* ============================================================
   UIManager — DOM screens, HUD, buttons. Talks to Game via a
   small set of callback methods; never touches canvas rendering.
   ============================================================ */
class UIManager {
  constructor(game) {
    this.game = game;
    this.el = {
      hud: document.getElementById('hud'),
      scoreValue: document.getElementById('scoreValue'),
      bestValue: document.getElementById('bestValue'),
      coinValue: document.getElementById('coinValue'),
      powerupBar: document.getElementById('powerupBar'),

      startScreen: document.getElementById('startScreen'),
      pauseScreen: document.getElementById('pauseScreen'),
      settingsScreen: document.getElementById('settingsScreen'),
      gameOverScreen: document.getElementById('gameOverScreen'),
      victoryScreen: document.getElementById('victoryScreen'),

      startCoins: document.getElementById('startCoins'),
      startBest: document.getElementById('startBest'),

      finalScore: document.getElementById('finalScore'),
      finalBest: document.getElementById('finalBest'),
      finalCoins: document.getElementById('finalCoins'),

      victoryScore: document.getElementById('victoryScore'),
      victoryBest: document.getElementById('victoryBest'),
      victoryCoins: document.getElementById('victoryCoins'),

      soundToggle: document.getElementById('soundToggle'),
      muteBtnImg: document.querySelector('#muteBtn img'),
    };

    this.activePowerupChips = {};
    this._bindButtons();
  }

  _bindButtons() {
    const g = this.game;
    const click = (id, fn) => document.getElementById(id).addEventListener('click', (e) => {
      g.sound.playClick();
      fn(e);
    });

    click('startBtn', () => g.startFromMenu());
    click('pauseBtn', () => g.togglePauseMenu());
    click('settingsBtn', () => g.openSettings());
    click('muteBtn', () => g.toggleMute());

    click('resumeBtn', () => g.resume());
    click('restartFromPauseBtn', () => g.restart());
    click('homeFromPauseBtn', () => g.goHome());

    click('closeSettingsBtn', () => g.closeSettings());
    click('soundToggle', () => g.toggleMute());

    click('homeFromGameOverBtn', () => g.goHome());
    click('restartFromGameOverBtn', () => g.restart());
    click('playAgainBtn', () => g.restart());

    click('homeFromVictoryBtn', () => g.goHome());
    click('restartFromVictoryBtn', () => g.restart());
    click('nextLevelBtn', () => g.nextLevel());

    document.querySelectorAll('#diffOptions .diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        g.sound.playClick();
        g.setDifficulty(btn.dataset.diff);
        this.setActiveDifficulty(btn.dataset.diff);
      });
    });
    document.querySelectorAll('#settingsDiffOptions .diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        g.sound.playClick();
        g.setDifficulty(btn.dataset.diff);
        this.setActiveDifficulty(btn.dataset.diff);
      });
    });
  }

  setActiveDifficulty(diff) {
    document.querySelectorAll('.diff-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.diff === diff);
    });
  }

  updateHUD(score, best, coins) {
    this.el.scoreValue.textContent = score;
    this.el.bestValue.textContent = best;
    this.el.coinValue.textContent = coins;
  }

  updateStartStats(coins, best) {
    this.el.startCoins.textContent = coins;
    this.el.startBest.textContent = best;
  }

  showScreen(name) {
    ['startScreen', 'pauseScreen', 'settingsScreen', 'gameOverScreen', 'victoryScreen'].forEach((k) => {
      this.el[k].classList.add('hidden');
    });
    if (name && this.el[name]) this.el[name].classList.remove('hidden');
  }

  hideAllScreens() {
    this.showScreen(null);
  }

  setSoundIcon(muted) {
    this.el.muteBtnImg.src = muted ? 'assets/images/sound_off.png' : 'assets/images/sound_on.png';
    this.el.soundToggle.textContent = muted ? 'Off' : 'On';
    this.el.soundToggle.classList.toggle('off', muted);
  }

  showGameOver({ score, best, coins }) {
    this.el.finalScore.textContent = score;
    this.el.finalBest.textContent = best;
    this.el.finalCoins.textContent = coins;
    this.showScreen('gameOverScreen');
  }

  showVictory({ score, best, coins }) {
    this.el.victoryScore.textContent = score;
    this.el.victoryBest.textContent = best;
    this.el.victoryCoins.textContent = coins;
    this.showScreen('victoryScreen');
  }

  /* ---- Power-up chip indicators ---- */
  setPowerupChip(kind, remainingMs, totalMs, iconSrc) {
    let chip = this.activePowerupChips[kind];
    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'powerup-chip';
      chip.innerHTML = `<img src="${iconSrc}"><span class="chip-timer"></span>`;
      this.el.powerupBar.appendChild(chip);
      this.activePowerupChips[kind] = chip;
    }
    const timerEl = chip.querySelector('.chip-timer');
    if (remainingMs === Infinity) {
      timerEl.textContent = '●';
    } else {
      timerEl.textContent = (remainingMs / 1000).toFixed(1) + 's';
    }
  }

  clearPowerupChip(kind) {
    const chip = this.activePowerupChips[kind];
    if (chip) {
      chip.remove();
      delete this.activePowerupChips[kind];
    }
  }

  clearAllPowerupChips() {
    Object.keys(this.activePowerupChips).forEach((k) => this.clearPowerupChip(k));
  }

  triggerShake() {
    document.getElementById('app').classList.remove('shake');
    // reflow to restart animation
    void document.getElementById('app').offsetWidth;
    document.getElementById('app').classList.add('shake');
  }
}
