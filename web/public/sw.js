// Minimal Service Worker for PWA installability
const CACHE_NAME = 'mobilsayt-cache-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through (required for PWA criteria)
    event.respondWith(fetch(event.request));
});
