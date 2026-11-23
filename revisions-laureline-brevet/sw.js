/* Objectif Brevet : reçoit les rappels du défi du jour */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Objectif Brevet", {
    body: d.body || "Ton défi du jour t’attend.",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: d.tag || "rappel",
    renotify: true,
    data: { url: d.url || "./#defi" }
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || "./#defi", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) { if ("navigate" in c) c.navigate(url); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
