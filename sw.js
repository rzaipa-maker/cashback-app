// sw.js — service worker с автообновлением категорий
// Стратегия: HTML/данные — network-first (всегда свежие при наличии интернета)
//            иконки/статика — cache-first (не грузим заново без нужды)

const STATIC_CACHE = 'cashback-static-v1';
const RUNTIME_CACHE = 'cashback-runtime';

const STATIC_ASSETS = [
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
];

// Установка: кэшируем только редко меняющуюся статику
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Активация: чистим старые кэши и сразу берём под контроль все вкладки
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || req.destination === 'document';

  if (isHTML) {
    // network-first для главной страницы — тут живут категории
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // cache-first для статики (иконки, манифест)
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
