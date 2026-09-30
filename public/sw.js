/* Saqib portfolio — network-only service worker.
   Deliberately NO caching: every request goes straight to the network so the
   site can never go stale after a deploy (maintenance first). It exists only
   so the browser can offer the PWA install prompt. */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).catch(function () {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }));
});
