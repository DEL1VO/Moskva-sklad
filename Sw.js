/* Service worker: приложение открывается и работает без интернета.
   Положите этот файл рядом с index.html (в ту же папку). */
const CACHE = 'market-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  const cdn = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname);
  if (!same && !cdn) return; // база данных и Telegram — всегда напрямую
  e.respondWith(
    fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(async () => {
      const m = await caches.match(r, { ignoreSearch: true });
      if (m) return m;
      if (r.mode === 'navigate') {
        return (await caches.match('./', { ignoreSearch: true })) || (await caches.match('index.html', { ignoreSearch: true })) || Response.error();
      }
      return Response.error();
    })
  );
});
