const CACHE_NAME = 'music-hub-v9';

const ASSETS = [
    './',
    './index.html',
    './songs.js',
    './audio-engine.js',
    './app-piano.js',
    './app-songbo.js',
    './app-kongling.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.match(e.request).then(function(cached) {
                var fetchPromise = fetch(e.request).then(function(networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(e.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(function() {
                    return cached;
                });
                return cached || fetchPromise;
            });
        })
    );
});
