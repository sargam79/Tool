/* Minimal offline cache for Snake Adventure (PWA) */
const CACHE_NAME = 'snake-adventure-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/assetLoader.js',
  './js/soundManager.js',
  './js/inputManager.js',
  './js/particles.js',
  './js/entities.js',
  './js/snake.js',
  './js/collisionManager.js',
  './js/uiManager.js',
  './js/game.js',
  './js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
