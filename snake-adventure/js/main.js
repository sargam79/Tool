/* ============================================================
   main.js — bootstraps the game once assets are preloaded
   ============================================================ */
(async function bootstrap() {
  const loader = new AssetLoader();
  const fill = document.getElementById('loadingBarFill');

  const images = await loader.loadAll((progress) => {
    fill.style.width = Math.round(progress * 100) + '%';
  });

  const game = new Game(loader);
  window.__snakeGame = game; // handy for debugging in devtools

  const loadingScreen = document.getElementById('loadingScreen');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 450);
  }, 250);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
