# BotiFarma — Recompra

Gestor de **recompras** para BotiFarma. App web instalable (PWA) que funciona en
**Android, iPhone, iPad, Windows y Mac**, con o sin conexión. Registra qué
compra cada cliente y cada cuántos días, y la app le dice **cada día a quién le
toca volver a comprar**, con un botón para recordárselo por **WhatsApp** con el
mensaje ya escrito.

© 2026 **Juan Carlos Pérez Arthur**. Todos los derechos reservados.

---

## 1. Qué hace

- **Hoy:** panel con las recompras **vencidas**, las de **hoy** y las de los
  **próximos 3 días**, ordenadas por urgencia.
- **Clientes:** libro completo con **búsqueda** por nombre, producto o teléfono.
- **Registrar cliente:** nombre, teléfono, producto, frecuencia de recompra
  (7 / 15 / 30 / 60 / 90 días o personalizada), última compra y notas.
- **Botón "✓ Compró":** al registrar la recompra, el contador arranca de nuevo
  y se guarda el historial.
- **WhatsApp:** mensaje de recordatorio personalizable con `{nombre}`,
  `{producto}` y `{dias}` — se abre listo para enviar.
- **Copia de seguridad:** exportar / importar todos los datos en un archivo.
- **100 % offline** (service worker) y **sin servidores**: los datos viven solo
  en el dispositivo. Sin rastreadores ni llamadas externas (CSP estricta).

## 2. Probar en la computadora

```bash
cd botifarma-recompra
python3 -m http.server 8000
```

Abrir `http://localhost:8000`.

## 3. Publicar en internet (para instalarla)

Cualquiera de estas opciones gratis con HTTPS:

- **Cloudflare Pages:** Workers & Pages → Create → Pages → Upload assets →
  arrastrar **el contenido** de la carpeta `botifarma-recompra`. El archivo
  `_headers` aplica las cabeceras de seguridad automáticamente.
- **Netlify:** arrastrar la carpeta a https://app.netlify.com/drop
- **GitHub Pages:** activar Pages sobre esta carpeta/repositorio.

## 4. Instalar en cada dispositivo

- **Android (Chrome):** URL → menú ⋮ → *Instalar app*.
- **iPhone / iPad (Safari):** URL → Compartir → *Añadir a pantalla de inicio*.
- **Windows / Mac (Chrome/Edge):** ícono de instalar en la barra de direcciones.

## 5. Estructura

```
botifarma-recompra/
├── index.html              App (shell con CSP)
├── styles.css              Diseño (responsive: celular y laptop)
├── app.js                  Lógica (clientes, recompras, WhatsApp, copias)
├── sw.js                   Service worker (offline)
├── manifest.webmanifest    Manifiesto PWA
├── _headers                Cabeceras de seguridad (Cloudflare/Netlify)
├── README.md               Este archivo
└── assets/                 Logo e íconos (SVG + PNG 192/512/maskable/apple/favicon)
```
