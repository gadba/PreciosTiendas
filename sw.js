// A simple service worker for caching the app shell and data

const CACHE_NAME = 'price-catalog-cache-v1';
const DATA_CACHE_NAME = 'price-catalog-data-cache-v1';

// URLs to cache on installation
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com/',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

const API_URL = 'https://script.google.com/macros/s/AKfycbyCeUfSV8KNH8J1DHvce1R48OROY_BjkBlE-7m50q-J-Xd29xvQnvKCM0mJf2zcgNDkog/exec';

// --- INSTALL: Cache the app shell ---
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// --- FETCH: Serve from cache or network ---
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Strategy for the API: Network first, then cache
    if (requestUrl.href.startsWith('https://script.google.com/macros/s/')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request).then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    return response;
                }).catch(() => {
                    return cache.match(event.request);
                });
            })
        );
        return;
    }

    // Strategy for App Shell: Cache first, then network
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});