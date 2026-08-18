/* Caderno — Meu Estudo Pessoal
   v6: baixar demonstração do ministério como imagem/PDF (modo leitura) */
const CACHE = 'caderno-v6';
const ARQUIVOS = ['./', './index.html', './manifest.json', './app.js', './icone-192.png', './icone-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(ns => Promise.all(ns.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', ev => { if (ev.data === 'atualizar') self.skipWaiting(); });

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET') return;
  // a nuvem, as fontes e as bibliotecas de imagem/pdf sempre vão à rede
  if (url.hostname.indexOf('google') >= 0 || url.hostname.indexOf('gstatic') >= 0 ||
      url.hostname.indexOf('cdnjs.cloudflare.com') >= 0) return;

  const ehPagina = ev.request.mode === 'navigate' ||
                   /\/(index\.html|manifest\.json)$/.test(url.pathname) ||
                   url.pathname.endsWith('/');

  if (ehPagina) {
    // rede primeiro: abre sempre a versão mais nova, e o cache cobre o offline
    ev.respondWith(
      fetch(ev.request).then(net => {
        if (net.ok && url.origin === location.origin) {
          const copia = net.clone();
          caches.open(CACHE).then(c => c.put(ev.request, copia));
        }
        return net;
      }).catch(() => caches.match(ev.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  ev.respondWith(
    caches.match(ev.request).then(resp => resp || fetch(ev.request).then(net => {
      const copia = net.clone();
      if (net.ok && url.origin === location.origin) caches.open(CACHE).then(c => c.put(ev.request, copia));
      return net;
    }).catch(() => caches.match('./index.html')))
  );
});
