// Production build replaces the version and complete precache list.
const CACHE_NAME = 'starshiy-brat-10bfda8a3b73af66';
const APP_SHELL = ["/assets/index-CxiYZXKZ.js","/assets/index-jNtrTAR9.css","/icons/apple-touch-icon.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon.svg","/icons/maskable-512.png","/index.html","/manifest.webmanifest"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('starshiy-brat-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (!response.ok) throw new Error('Navigation failed');
      return response;
    }).catch(async () => (await caches.open(CACHE_NAME)).match('/index.html')));
    return;
  }
  if (!APP_SHELL.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
});
