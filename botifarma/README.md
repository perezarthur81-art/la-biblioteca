# BotiFarma — Recompra

Gestor de recompras para **BotiFarma**: sepa cada día a qué cliente le toca
volver a comprar y recuérdeselo por **WhatsApp**. App web instalable (PWA)
que funciona en **Android, iPhone, iPad, Windows y Mac**, con o sin conexión.

© 2026 **Juan Carlos Pérez Arthur**. Todos los derechos reservados.

---

## 1. Qué es esto

Una app "todo en uno": **toda la lógica y el diseño viven en `index.html`**,
sin frameworks ni paso de compilación. Los archivos que la acompañan
(`manifest.webmanifest`, `sw.js`, íconos) son los que la vuelven instalable
y capaz de funcionar sin internet cuando se publica por HTTPS.

- Vista **Hoy**: vencidas, para hoy y próximos 3 días, con contadores
- Lista completa de **clientes** con búsqueda por nombre, producto o teléfono
- Registro de clientes con frecuencia de recompra (7/15/30/60/90 días o la que sea)
- Botón de **WhatsApp** con mensaje automático (personalizable en PRO)
- Botón **✓ Compró** que reinicia el ciclo y guarda historial
- **Copia de seguridad**: exportar e importar en un archivo JSON
- Versión **GRATIS** (hasta 15 clientes) y **PRO** por código de activación
- Los datos viven **solo en el dispositivo** (localStorage); nada sale a internet

---

## 2. Dos formas de usarla

### A. Abrir el archivo directamente (lo más simple)

Copie `index.html` al teléfono o computadora y ábralo con Chrome, Edge o
Safari. Todo funciona: clientes, WhatsApp, copias de seguridad. Lo único que
no aplica en este modo es la instalación como app y el modo sin conexión
automático (no hacen falta: el archivo ya está en el dispositivo).

### B. Publicarla por HTTPS (recomendada: instalable y sin conexión)

Suba **el contenido de esta carpeta** a cualquier hosting estático gratis:

- **Cloudflare Pages**: Workers & Pages → Create → Pages → Upload assets →
  arrastre los archivos de esta carpeta. El archivo `_headers` aplica solo las
  cabeceras de seguridad.
- **Netlify**: arrastre la carpeta a https://app.netlify.com/drop
- **GitHub Pages**: suba los archivos y active Pages (la CSP ya va dentro del
  propio `index.html`, así que la app queda protegida igual).

Después de publicarla:

- **Android (Chrome)**: menú ⋮ → *Instalar app*.
- **iPhone / iPad (Safari)**: botón Compartir → *Añadir a pantalla de inicio*.
- **Windows / Mac (Chrome/Edge)**: ícono de instalar en la barra de direcciones.

Para probar en su computadora antes de publicar:

```bash
cd botifarma
python3 -m http.server 8080
```

y abra `http://localhost:8080`.

---

## 3. Notas importantes

- **Activación PRO**: usa `crypto.subtle` (SHA-256), disponible al abrir la app
  por HTTPS, en `localhost` o abriendo el archivo suelto. En un servidor HTTP
  sin certificado la app lo avisa.
- **Copia de seguridad**: los datos viven solo en cada dispositivo. Exporte una
  copia de vez en cuando (Ajustes → Exportar copia). Al importar, la app
  valida y repara los registros para que un archivo dañado no la rompa.
- **Cada dispositivo tiene sus propios datos.** Sincronizar varios teléfonos
  requiere un backend (se puede montar gratis con Cloudflare Workers + D1 si
  algún día lo necesita).

---

## 4. Estructura de archivos

```
botifarma/
├── index.html              App completa (diseño + lógica, "todo en uno")
├── manifest.webmanifest    Manifiesto PWA (instalación)
├── sw.js                   Service worker (modo sin conexión)
├── _headers                Cabeceras de seguridad (si se publica sola)
├── README.md               Este archivo
└── assets/                 Íconos (192, 512, maskable, apple-touch, favicon)
```
