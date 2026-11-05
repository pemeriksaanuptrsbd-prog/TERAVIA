// Service worker TERAVIA: hanya menyimpan "cangkang" (halaman pembungkus + ikon) agar aplikasi bisa dipasang
// dan terbuka cepat. Data pasien TIDAK pernah disimpan di perangkat.
var CACHE = 'teravia-pwa-v3';
var CANGKANG = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CANGKANG); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;       // Google/Apps Script: selalu langsung ke jaringan
  if (r.mode === 'navigate') {                                           // halaman: jaringan dulu, cadangan dari simpanan
    e.respondWith(fetch(r).then(function (res) { if (res.ok) { var s = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', s); }); } return res; }).catch(function () { return caches.match('./index.html'); }));
    return;
  }
  // config.js dan manifest: jaringan dulu, supaya alamat /exec yang baru langsung terpakai tanpa menghapus data situs
  if (/\/(config\.js|manifest\.webmanifest)$/.test(u.pathname)) {
    e.respondWith(fetch(r).then(function (res) { var s = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, s); }); return res; }).catch(function () { return caches.match(r); }));
    return;
  }
  e.respondWith(caches.match(r).then(function (m) { return m || fetch(r).then(function (res) { var s = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, s); }); return res; }); }));
});
