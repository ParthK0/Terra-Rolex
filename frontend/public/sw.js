const CACHE_NAME = 'terra-watch-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Do not intercept or cache API requests
  if (
    url.port === '8000' || 
    url.pathname.includes('/auth') || 
    url.pathname.includes('/log') || 
    url.pathname.includes('/insights') ||
    url.pathname.includes('/leaderboard')
  ) {
    return;
  }

  const isStaticAsset = 
    url.pathname.match(/\.(js|ts|tsx|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/) || 
    url.pathname.includes('/assets/') || 
    url.pathname.includes('/src/');

  if (isStaticAsset) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('Asset not available offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  } else {
    // Network-first strategy for SPA routing / index.html
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to caching shell index.html if network is unreachable
          return caches.match('/') || caches.match('/index.html') || caches.match(event.request);
        })
    );
  }
});
