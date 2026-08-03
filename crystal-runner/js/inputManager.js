/* ============================================================
   InputManager — keyboard + touch swipe controls.
   Swipe is the natural scheme for a lane-runner (one-shot
   directional commands), unlike a free-movement game, so unlike
   Crystal Runner's cousin project this uses swipe, not tap.
   ============================================================ */
class InputManager {
  constructor(game) {
    this.game = game;
    this.touchStart = null;
    this.minSwipeDist = 30;
    this._bindKeyboard();
    this._bindTouch();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': this.game.onLeft(); e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD': this.game.onRight(); e.preventDefault(); break;
        case 'ArrowUp': case 'KeyW': this.game.onJump(); e.preventDefault(); break;
        case 'ArrowDown': case 'KeyS': this.game.onSlide(); e.preventDefault(); break;
        case 'Space': this.game.togglePause(); e.preventDefault(); break;
        case 'KeyR': this.game.restart(); e.preventDefault(); break;
      }
    });
  }

  _bindTouch() {
    const layer = document.getElementById('touchLayer');

    layer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      const t = e.touches[0];
      this.touchStart = { x: t.clientX, y: t.clientY };
      e.preventDefault();
    }, { passive: false });

    layer.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    layer.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.touchStart.x;
      const dy = t.clientY - this.touchStart.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      this.touchStart = null;
      if (Math.max(adx, ady) < this.minSwipeDist) return;
      if (adx > ady) {
        if (dx > 0) this.game.onRight(); else this.game.onLeft();
      } else {
        if (dy > 0) this.game.onSlide(); else this.game.onJump();
      }
    }, { passive: false });

    layer.addEventListener('touchcancel', () => { this.touchStart = null; });
  }
}
