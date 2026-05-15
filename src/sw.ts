/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Precache the build manifest (injected by vite-plugin-pwa).
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  taskId?: string;
};

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { body: event.data.text() };
    }
  }
  const title = payload.title ?? "Stickit";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: "/Stickit/icons/icon-192.png",
    badge: "/Stickit/icons/icon-192.png",
    data: { url: payload.url ?? "/Stickit/today", taskId: payload.taskId ?? null },
    tag: payload.taskId ?? "stickit-reminder",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/Stickit/today";
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        // Focus an existing window if one is already open
        if ("focus" in client) {
          await (client as WindowClient).focus();
          if ("navigate" in client) {
            try {
              await (client as WindowClient).navigate(url);
            } catch {
              /* ignore cross-origin nav errors */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
