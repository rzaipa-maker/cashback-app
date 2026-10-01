const CACHE = 'cashback-v5-pwa';
const FILES = ['./', './index.html', './cashback_navigator.html', './cashback_data.js', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const dataUrl = new URL('./cashback_data.js', self.location).href;

  // Ежемесячный файл данных проверяем в сети первым.
  if (e.request.url === dataUrl) {
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Для cashback_data.js применяется network-first выше.
  // Остальные файлы используют кэш-first.
  if (e.request.url.includes('generativelanguage.googleapis.com') || e.request.url.includes('/v1/messages')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./cashback_navigator.html')))
  );
});
