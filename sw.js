// Service Worker: App funktioniert auch ohne Netz.
// Strategie "erst Netz, sonst Cache", damit Updates sofort ankommen.
const CACHE = "fuhrpark-v1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "store.js", "util.js", "config.js", "manifest.webmanifest", "icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  const cacheable = e.request.method === "GET" && (url.origin === location.origin || url.pathname.startsWith("/firebasejs/"));
  if (!cacheable) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
