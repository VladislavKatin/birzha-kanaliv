const CACHE_NAME = 'birza-static-v4';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
        ),
    );
    self.clients.claim();
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';

    if (!isHttp || request.method !== 'GET') {
        return;
    }

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (request.mode === 'navigate' || acceptsHtml) {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});
