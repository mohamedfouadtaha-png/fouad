// يعمل التطبيق بدون إنترنت بعد أول فتح
const CACHE = "seerah-v3";
const ASSETS = ["./", "index.html", "styles.css", "app.js", "data-people.js", "data-seerah.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "fonts/amiri-arabic-400-normal.woff2", "fonts/amiri-arabic-700-normal.woff2", "fonts/tajawal-arabic-400-normal.woff2",
  "fonts/tajawal-arabic-500-normal.woff2", "fonts/tajawal-arabic-700-normal.woff2", "fonts/tajawal-arabic-800-normal.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // الشبكة أولًا للحصول على التحديثات، ثم النسخة المحفوظة
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  }
});
