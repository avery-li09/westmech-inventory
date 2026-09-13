// WM Parts service worker. Navigations go network first so a bad cache can never pin a phone to an old build;
// the API (a different origin) is never touched here, so the app's own fetch logic decides what is fresh.
// Bump CACHE on every deploy (GitHub Pages sets no cache headers, so index.html registers sw.js?v=N as well).
var CACHE = 'wmparts-v3';
var ASSETS = ['./', './index.html', './labels.html', './manifest.webmanifest', './qrcode.js',
              './icon-192.png', './icon-512.png', './icon-180.png', './logo.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    var stale = keys.filter(function (k) { return k !== CACHE; });
    return Promise.all(stale.map(function (k) { return caches.delete(k); }))
      .then(function () { return self.clients.claim(); })
      .then(function () {
        if (!stale.length) return;
        return self.clients.matchAll({ type: 'window' }).then(function (cs) {
          cs.forEach(function (c) { if (c.navigate) { c.navigate(c.url).catch(function () {}); } });
        });
      });
  }));
});

function isDoc(req) {
  return req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') > -1;
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // the n8n API and Google Fonts are never cached here

  if (isDoc(e.request)) {
    var doc = url.pathname.indexOf('labels') > -1 ? './labels.html' : './index.html';
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(doc, copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match(doc).then(function (hit) { return hit || new Response('Offline', { status: 503 }); });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
