/* Petty service worker — STATIC SHELL ONLY.
   Doctrine: agency data is never cached, never proxied, never served stale.
   Same-origin static assets: cache-first (filenames are hashed by the build).
   Navigations: network-first, offline falls back to the cached shell.
   Cross-origin (openFDA, NWS, FSA, Health Canada snapshot, GitHub…): untouched. */
const VERSION = 'petty-shell-v2.2.0';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()), /* never let a cache miss break install */
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* agency APIs, fonts, anything cross-origin: straight to network */

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('/', copy)); return res; })
        .catch(() => caches.match('/').then(r => r ?? Response.error())),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached ?? fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })),
  );
});
