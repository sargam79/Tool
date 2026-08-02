/* ============================================================
   InputManager — keyboard (arrows/WASD/space/esc/r) + touch swipe
   ============================================================ */
class InputManager {
  constructor(game) {
    this.game = game;
    this.touchStart = null;
    this.minSwipeDist = 24;

    this._bindKeyboard();
    this._bindTouch();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': this.game.requestDirection(DIR.UP); e.preventDefault(); break;
        case 'ArrowDown': case 'KeyS': this.game.requestDirection(DIR.DOWN); e.preventDefault(); break;
        case 'ArrowLeft': case 'KeyA': this.game.requestDirection(DIR.LEFT); e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD': this.game.requestDirection(DIR.RIGHT); e.preventDefault(); break;
        case 'Space': this.game.togglePause(); e.preventDefault(); break;
        case 'KeyR': this.game.restart(); e.preventDefault(); break;
        case 'Escape': this.game.togglePauseMenu(); e.preventDefault(); break;
      }
    });
  }

  _bindTouch() {
    const layer = document.getElementById('touchLayer');

    const start = (x, y) => { this.touchStart = { x, y }; };
    const end = (x, y) => {
      if (!this.touchStart) return;
      const dx = x - this.touchStart.x;
      const dy = y - this.touchStart.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < this.minSwipeDist) { this.touchStart = null; return; }
      if (adx > ady) {
        this.game.requestDirection(dx > 0 ? DIR.RIGHT : DIR.LEFT);
      } else {
        this.game.requestDirection(dy > 0 ? DIR.DOWN : DIR.UP);
      }
      this.touchStart = null;
    };

    layer.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      start(t.clientX, t.clientY);
    }, { passive: true });

    layer.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      end(t.clientX, t.clientY);
    }, { passive: true });

    // Mouse fallback for desktop drag-swipe testing
    let mouseDown = false;
    layer.addEventListener('mousedown', (e) => { mouseDown = true; start(e.clientX, e.clientY); });
    layer.addEventListener('mouseup', (e) => { if (mouseDown) end(e.clientX, e.clientY); mouseDown = false; });
  }
}
