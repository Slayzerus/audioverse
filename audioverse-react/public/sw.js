/* eslint-disable no-restricted-globals */
// ─── AudioVerse Service Worker ─────────────────────────────────────────────────
// Network-first for navigation and JS/CSS chunks; cache-first for audio/media.
//
// CACHE_NAME includes a build date so every new deploy purges stale caches
// and prevents old JS modules from being served after a deployment.

const CACHE_NAME = 'audioverse-v4-2026-03-01';
const STATIC_ASSETS = [
  '/',
  '/mic.svg',
  '/manifest.json',
];

// Install: pre-cache shell, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: purge ALL old caches so stale JS chunks are gone
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== 'GET') return;

  // API / SignalR → network-only (don't cache dynamic data)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/hubs/')) {
    return;
  }

  // Audio clips / song files → cache-first with network fallback
  if (
    url.pathname.startsWith('/audioClips/') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.wav')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Hashed JS/CSS assets (/assets/xxx-HASH.{js,css}) → network-first.
  // Even though Vite hashes filenames, a new deploy may reuse the same hash
  // if source is unchanged but transitive imports changed — network-first
  // ensures the browser always fetches the latest chunk from the server.
  // Falls back to cache only when offline.
  if (url.pathname.startsWith('/assets/') && url.pathname.match(/\.[jt]sx?$|\.(css)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.match(request).then(
              (cached) => cached || new Response('Chunk unavailable (offline)', { status: 503 })
            )
          )
        )
    );
    return;
  }

  // HTML navigation → network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', cloned));
          }
          return response;
        })
        .catch(() => caches.match('/').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Other static files (svg, png, fonts) → stale-while-revalidate
  if (url.pathname.match(/\.(svg|png|jpg|webp|gif|ico|woff2?|ttf|eot|css)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached || new Response('Offline', { status: 503 }));
          return cached || fetched;
        })
      )
    );
    return;
  }
});

// Background sync placeholder for future offline queue support
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urls));
  }
});
