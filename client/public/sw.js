// TripSync PWA: offline caching + push notifications
const CACHE_NAME = "tripsync-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/index.html", "/favicon.png", "/logo.png"]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.startsWith("chrome-extension")) return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") && !url.pathname.includes("/api/trips")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((res) => {
            if (res.ok && (event.request.destination === "document" || event.request.destination === "script" || event.request.destination === "style" || event.request.destination === ""))
              cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached || (event.request.destination === "document" ? caches.match("/") : null));
        return cached || fetchPromise;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? "TripSync reminder";
  const opts = {
    body: data.body ?? "",
    icon: data.icon ?? "/favicon.png",
    badge: data.badge ?? "/favicon.png",
    tag: data.tag ?? "trip-reminder",
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length) clientList[0].focus();
      else if (clients.openWindow) clients.openWindow("/");
    })
  );
});
