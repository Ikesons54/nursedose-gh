/* NurseDose GH - service worker.
   Saves the app on the phone so it works without internet.
   Serves the saved copy straight away, then quietly updates it when online.
   To force everyone onto new files, change VERSION. */
var VERSION = 'nursedose-v2';
var ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/styles.css',
  'js/units.js',
  'js/calculator.js',
  'js/app.js',
  'js/questions.js',
  'js/menu.js',
  'js/pwa.js',
  'data/questions/tablets.json',
  'data/questions/syrups.json',
  'data/questions/injections.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () { return null; });

      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      return network.then(function (res) {
        if (res) return res;
        return req.mode === 'navigate' ? caches.match('index.html') : Response.error();
      });
    })
  );
});
