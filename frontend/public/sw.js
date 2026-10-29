// Push delivery only. Never cache authenticated API responses or application HTML.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {}
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.slice(0, 200)
      : "Invent IO";
  const body =
    typeof data.body === "string"
      ? data.body.slice(0, 2000)
      : "Open Invent IO to see your latest updates.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "./assets/app-icon-192.png",
      badge: "./assets/push-badge.png",
      data: { url: new URL("./#/home", self.registration.scope).href },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Fixed same-origin destination; never trust URLs from the push payload.
  const url = new URL("./#/home", self.registration.scope).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        const existing = windows.find((client) =>
          client.url.startsWith(self.registration.scope),
        );
        if (existing) {
          await existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
