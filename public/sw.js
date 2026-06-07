/*
 * Service worker minimo. Su unica funcion es entregar una pagina de respaldo
 * cuando una navegacion falla por red o responde con un error 4xx o 5xx.
 *
 * Por que asi: una Trusted Web Activity (la futura app Android) crashea si una
 * navegacion no devuelve 200 estando sin conexion. Este SW cumple ese requisito
 * sin cachear contenido dinamico, de modo que el sitio siempre muestra la
 * version en vivo (precios, horas, copy) apenas hay red. La app se actualiza
 * sola porque carga el sitio publicado, no una copia guardada aqui.
 */

const CACHE = 'pjf-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo intervenimos navegaciones (cargar una pagina). El resto pasa directo
  // a la red, sin cache, para no servir nunca contenido obsoleto.
  if (req.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        if (!res || res.status >= 400) {
          const cache = await caches.open(CACHE);
          return (await cache.match(OFFLINE_URL)) || res;
        }
        return res;
      } catch (err) {
        const cache = await caches.open(CACHE);
        return cache.match(OFFLINE_URL);
      }
    })()
  );
});
