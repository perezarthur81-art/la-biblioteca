/* La Biblioteca — Reservas · Service Worker
   © Juan Carlos Pérez Arthur. Todos los derechos reservados.
   Cachea el "app shell" para funcionar 100% sin conexión y
   recuerda avisos (campaña / fechas conmemorativas) en segundo plano. */

const CACHE = "la-biblioteca-v1.1.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-192.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png",
  "./assets/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo manejamos peticiones de nuestro propio origen
  if (url.origin !== self.location.origin) return;

  // BotiFarma vive en la carpeta botifarma/ con su propio service worker:
  // no tocarla (funciona igual en la raíz del dominio o bajo una subruta)
  if (url.pathname.includes("/botifarma")) return;

  // Navegaciones → servir index.html desde caché (offline-first)
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(req))
    );
    return;
  }

  // Recursos → cache-first, con respaldo a red y cacheo dinámico
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() =>
        // sin red y sin caché: para documentos devolvemos el shell,
        // para el resto una respuesta vacía con estado de "sin conexión"
        req.destination === "document"
          ? caches.match("./index.html")
          : new Response("", { status: 503, statusText: "offline" })
      );
    })
  );
});

/* ---------------- Recordatorios en segundo plano ----------------
   La app guarda en IndexedDB un índice mínimo SIN datos sensibles:
   días de campaña (0-6) y fechas "MM-DD". Nunca nombres ni teléfonos.
   En navegadores compatibles (Chrome/Edge instalado como app), el
   periodic background sync dispara un aviso aunque la app esté cerrada. */

function readRemindCfg() {
  return new Promise((resolve) => {
    try {
      const open = indexedDB.open("lb-remind", 1);
      open.onupgradeneeded = () => { open.result.createObjectStore("kv"); };
      open.onerror = () => resolve(null);
      open.onsuccess = () => {
        try {
          const db = open.result;
          const tx = db.transaction("kv", "readonly");
          const get = tx.objectStore("kv").get("cfg");
          get.onsuccess = () => { resolve(get.result || null); db.close(); };
          get.onerror = () => { resolve(null); db.close(); };
        } catch (e) { resolve(null); }
      };
    } catch (e) { resolve(null); }
  });
}

async function checkReminders() {
  const cfg = await readRemindCfg();
  if (!cfg || !cfg.enabled) return;
  const now = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const msgs = [];
  if (Array.isArray(cfg.dates) && cfg.dates.includes(mmdd) && cfg.txtDate) msgs.push(cfg.txtDate);
  if (Array.isArray(cfg.campDays) && cfg.campDays.includes(now.getDay()) && cfg.txtCamp) msgs.push(cfg.txtCamp);
  if (!msgs.length) return;
  await self.registration.showNotification("La Biblioteca", {
    body: msgs.join("\n"),
    icon: "assets/icon-192.png",
    badge: "assets/icon-192.png",
    tag: "lb-avisos-bg",
  });
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "lb-daily") event.waitUntil(checkReminders());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow("./?view=notify");
    })
  );
});
