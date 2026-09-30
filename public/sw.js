/* Saqib portfolio — network-first service worker.
   Only ONE thing is cached: the offline fallback page. Everything else goes
   straight to the network so the site never serves stale content after a
   deploy (maintenance first). If a navigation fails offline, show fallback. */
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open('sq-offline-v1').then(function (c) {
    return c.add('/offline.html').catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).catch(function () {
      if (e.request.mode === 'navigate') {
        return caches.match('/offline.html').then(function (r) {
          return r || new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
