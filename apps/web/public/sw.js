// Self-unregistering service worker.
// This app does not use a service worker. If a stale one was registered for
// this origin (e.g. by another app on the same localhost port), this replaces
// it, unregisters itself, clears caches, and reloads open tabs once.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) client.navigate(client.url);
      } catch {
        /* no-op */
      }
    })(),
  );
});
