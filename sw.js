/* Caderno da Átina — funciona mesmo sem internet */
const CACHE = 'caderno-atina-v2';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icone-192.png', './icone-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(ns => Promise.all(ns.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  // a nuvem e as fontes sempre vão à rede
  if (url.hostname.indexOf('google') >= 0 || url.hostname.indexOf('gstatic') >= 0) return;
  if (ev.request.method !== 'GET') return;

  ev.respondWith(
    caches.match(ev.request).then(resp => resp || fetch(ev.request).then(net => {
      const copia = net.clone();
      if (net.ok && url.origin === location.origin) caches.open(CACHE).then(c => c.put(ev.request, copia));
      return net;
    }).catch(() => caches.match('./index.html')))
  );
});
