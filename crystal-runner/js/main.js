/* ============================================================
   main.js — bootstraps Crystal Runner once assets are preloaded
   ============================================================ */
(async function bootstrap() {
  const loader = new AssetLoader();
  const fill = document.getElementById('loadingBarFill');

  await loader.loadAll((progress) => {
    fill.style.width = Math.round(progress * 100) + '%';
  });

  // give three.js (loaded via CDN <script>) a moment if the network was slow
  if (typeof THREE === 'undefined') {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (typeof THREE !== 'undefined') { clearInterval(check); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
  }

  const game = new Game(loader);
  window.__crystalRunner = game;

  const loadingScreen = document.getElementById('loadingScreen');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 450);
  }, 250);
})();
