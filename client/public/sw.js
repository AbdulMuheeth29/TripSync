// Service worker for push notification reminders
self.addEventListener("push", (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? "Trip Sync reminder";
  const opts = {
    body: data.body ?? "",
    icon: data.icon ?? "/favicon.ico",
    badge: data.badge ?? "/favicon.ico",
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
