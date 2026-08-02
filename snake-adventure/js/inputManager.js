/* ============================================================
   InputManager — keyboard (arrows/WASD/space/esc/r) + touch swipe
   ============================================================ */
class InputManager {
  constructor(game) {
    this.game = game;
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

    // Tap-to-move: touching the screen immediately steers the snake toward
    // that point (relative to the head's current on-screen position) —
    // no drag/swipe distance required.
    const handleTap = (x, y) => {
      const game = this.game;
      if (!game.snake || game.state !== STATE.PLAYING) return;
      const cs = game.cellSize;
      const head = game.snake.head;
      const headPxX = (head.x + 0.5) * cs;
      const headPxY = (head.y + 0.5) * cs;
      const dx = x - headPxX;
      const dy = y - headPxY;
      if (Math.abs(dx) > Math.abs(dy)) {
        game.requestDirection(dx > 0 ? DIR.RIGHT : DIR.LEFT);
      } else {
        game.requestDirection(dy > 0 ? DIR.DOWN : DIR.UP);
      }
    };

    layer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return; // ignore pinch/multi-touch
      const t = e.touches[0];
      handleTap(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    // Prevent the browser from turning any finger movement into a page
    // scroll / back-forward navigation swipe.
    layer.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    layer.addEventListener('touchend', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Mouse fallback for desktop click-to-steer testing
    layer.addEventListener('mousedown', (e) => {
      handleTap(e.clientX, e.clientY);
    });
  }
}
