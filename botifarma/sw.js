/* BotiFarma — Recompra · Service Worker
   © 2026 Juan Carlos Pérez Arthur. Todos los derechos reservados.
   Cachea la app completa para funcionar 100% sin conexión.
   Al cambiar la versión aquí, la app descarga la nueva y avisa en pantalla. */

const CACHE = "botifarma-recompra-v1.3.1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-192.png",
  "./assets/icon-maskable-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("botifarma-") && k !== CACHE).map((k) => caches.delete(k)))
    )
    // Si otro service worker del mismo origen o el sistema borró la caché,
    // se vuelve a sembrar para que la app siga abriendo sin conexión
    .then(() => caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {}))
    .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo manejamos peticiones de nuestro propio origen y dentro de la app
  if (url.origin !== self.location.origin) return;

  // Navegaciones → servir index.html desde caché (offline-first) y, si no
  // está, pedirlo a la red y guardarlo
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
        }
        return res;
      })).catch(() => caches.match("./index.html"))
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
        // sin red y sin caché: para documentos devolvemos la app,
        // para el resto una respuesta vacía con estado "sin conexión"
        req.destination === "document"
          ? caches.match("./index.html")
          : new Response("", { status: 503, statusText: "offline" })
      );
    })
  );
});
