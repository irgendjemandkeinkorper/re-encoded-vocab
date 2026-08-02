const CACHE_NAME = 're-encoded-cache-v1';

// Static assets forming the application shell
const ASSETS_TO_CACHE = [
  '/re-encoded-vocab/',
  '/re-encoded-vocab/index.html',
  '/re-encoded-vocab/manifest.webmanifest',
  '/re-encoded-vocab/assets/icons/icon-192.png',
  '/re-encoded-vocab/assets/icons/icon-512.png',
  '/re-encoded-vocab/assets/icons/maskable-512.png'
];

// Install Event: cache the static app shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: remove obsolete application caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: handle requests gracefully, offline support
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Handle same-origin requests (the local application shell)
  if (requestUrl.origin === self.location.origin) {
    // Check if the request is a navigation request (loading a page)
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            // Offline fallback: serve cached index.html for navigation requests
            return caches.match('/re-encoded-vocab/index.html') || caches.match('/re-encoded-vocab/');
          })
      );
      return;
    }

    // Cache-first strategy for other static assets in the app shell
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          // Cache newly requested local resources if needed, or simply return them
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Handle cross-origin requests (Supabase CDN, Supabase API, external scripts, etc.)
  // Rule: Do not cache mutable, sensitive, or external API responses (e.g. Supabase DB calls)
  // These are handled using a network-only or network-first-without-caching strategy.
  // Failed optional cross-origin requests must not break cached local navigation.
  if (requestUrl.hostname.includes('supabase.co') || requestUrl.hostname.includes('jsdelivr.net')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.warn('[Service Worker] Failed to fetch cross-origin resource:', event.request.url, error);
          // Return a fallback or empty response instead of failing the request entirely
          // For script loads, return an empty body/OK response, or let the browser fail it gracefully
          if (event.request.destination === 'script') {
            return new Response('', {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
          // Return a generic error Response so the local UI handles it gracefully
          return new Response(JSON.stringify({ error: 'Offline / Network Failure' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
});
