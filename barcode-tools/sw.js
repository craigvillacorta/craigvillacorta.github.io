const CACHE = 'barcode-tools-70ae5a94fe68';
const FILES = ["./","./THIRD-PARTY-LICENSES.txt","./assets/generate-eqZeKm5I.js","./assets/index-CCHh28WN.js","./assets/index-CGu9l96_.css","./assets/scanner-DjhlR2Mw.js","./icon-192.png","./icon-512.png","./icon.svg","./index.html","./manifest.webmanifest"];
const ALLOWED = new Set(FILES.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('barcode-tools-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !ALLOWED.has(event.request.url)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request, { ignoreVary: true })) || fetch(event.request)));
});
