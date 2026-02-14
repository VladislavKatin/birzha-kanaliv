// Service Worker: cache-first for static assets, network-first for API GET
const CACHE_NAME = 'birza-v3';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
        ),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

    if (!isHttp) {
        return;
    }

    // Do not cache non-GET requests (POST/PUT/PATCH/DELETE)
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // API GET requests: network first, fallback to cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches
                            .open(CACHE_NAME)
                            .then((cache) => cache.put(request, clone))
                            .catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(request)),
        );
        return;
    }

    // Static assets: cache first
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
