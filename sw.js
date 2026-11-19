/* Arad Explorer offline shell. Bump CACHE_NAME whenever the shell asset set changes. */
const CACHE_NAME = 'arad-shell-v1';
const BASE_URL = new URL('./', self.location.href);
const SHELL_ASSETS = [
  "./index.html",
  "./css/styles.css",
  "./css/game.css",
  "./data/game-data.json",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "./assets/brand/favicon.png",
  "./assets/brand/stema-arad.png",
  "./js/app.js",
  "./js/auth.js",
  "./js/backend.js",
  "./js/confetti.js",
  "./js/config.js",
  "./js/csv.js",
  "./js/data.js",
  "./js/game/core.js",
  "./js/game/draw.js",
  "./js/game/font.js",
  "./js/game/game.js",
  "./js/game/index.js",
  "./js/game/interiors.js",
  "./js/game/landmarks.js",
  "./js/game/locations.js",
  "./js/game/outfit.js",
  "./js/game/patrons.js",
  "./js/game/people.js",
  "./js/game/streets.js",
  "./js/geo.js",
  "./js/leaderboard.js",
  "./js/map.js",
  "./js/minigame.js",
  "./js/photos.js",
  "./js/progress-sync.js",
  "./js/routing.js",
  "./js/sky.js",
  "./js/store.js",
  "./js/tour.js"
];
const ALLOWED_PATHS = new Set(SHELL_ASSETS.map(path => new URL(path, BASE_URL).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL_ASSETS.map(path => new URL(path, BASE_URL).href));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('arad-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Never intercept cross-origin traffic (Supabase, map tiles, routing, photos, fonts).
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        const cached = await caches.match(new URL('./index.html', BASE_URL).href);
        return cached || Response.error();
      }
    })());
    return;
  }

  // An explicit same-origin allowlist prevents caching auth/session/API responses.
  if (!ALLOWED_PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(fetch(request).then(response => {
        if (response.ok && response.type === 'basic') return cache.put(request, response.clone());
      }).catch(() => {}));
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch { return Response.error(); }
  })());
});
