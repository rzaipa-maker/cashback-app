const CACHE = 'cashback-v6-pwa';
const FILES = ['./cashback_navigator.html', './cashback_data.js', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const dataUrl = new URL('./cashback_data.js', self.location).href;

  // Каждый месяц сначала проверяем свежий файл данных в GitHub.
  if (event.request.url === dataUrl) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Запросы к AI не кэшируем.
  if (
    event.request.url.includes('generativelanguage.googleapis.com') ||
    event.request.url.includes('/v1/messages')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(
      cached => cached || fetch(event.request).catch(() => caches.match('./cashback_navigator.html'))
    )
  );
});
