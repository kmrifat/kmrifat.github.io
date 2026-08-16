/**
 * KILL SWITCH — not a real service worker.
 *
 * The 2022 build shipped a Workbox service worker at this exact path, registered
 * at scope "/", which did skipWaiting() + clientsClaim() and installed a
 * NavigationRoute serving the precached 2022 index.html for EVERY navigation.
 * Anyone who visited the old site still has it installed, and it would keep
 * serving them the old shell forever.
 *
 * This replacement takes over that registration, deletes every cache it left
 * behind, unregisters itself, and reloads open tabs onto the real site. Once a
 * visitor has run it, no service worker remains.
 *
 * Do not remove this file, and do not move it off /sw.js — the path is what the
 * old registration is bound to.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        // Reload each open tab so it re-fetches from the network rather than
        // continuing to render whatever the old worker had already served.
        client.navigate(client.url);
      }
    })(),
  );
});
