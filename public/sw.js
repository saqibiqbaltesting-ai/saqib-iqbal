/* Saqib Iqbal PWA — network-first, cache fallback for offline */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== 'sq-pwa-v2'; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('/v1/')) return; /* never cache API calls */
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      if (res && res.ok) {
        caches.open('sq-pwa-v2').then(function (c) { c.put(e.request, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || Response.error(); });
    })
  );
});
