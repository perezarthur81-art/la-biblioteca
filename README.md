# La Biblioteca — Reservas

Gestor de reservas privado para **La Biblioteca**. App web instalable (PWA) que
funciona en **Android, iPhone, iPad, Windows y Mac**, sin conexión, y que
**cifra todos los datos en el propio dispositivo**.

© 2026 **Juan Carlos Pérez Arthur**. Todos los derechos reservados.

> Este repositorio también publica **BotiFarma — Recompra** (gestor de
> recompras para farmacias, con WhatsApp, panel de resultados y bloqueo con
> clave) en la carpeta [`botifarma/`](botifarma/README.md), disponible en
> `https://perezarthur81-art.github.io/la-biblioteca/botifarma/`.

---

## 1. Qué es esto

Una PWA (Progressive Web App) hecha con HTML, CSS y JavaScript puro —
**sin frameworks y sin paso de compilación**. Se sube tal cual a cualquier
hosting estático y queda lista para instalar como app.

- Registrar y administrar reservas (nombre, teléfono, personas, fecha, hora, zona, notas)
- Vista **Hoy**, libro completo con **búsqueda** y filtros
- Estados: pendiente / confirmada / llegó / cancelada
- Tarjeta de confirmación estilo ficha de biblioteca + compartir por **WhatsApp**
- **Clientes con memoria propia** (v1.1): cada reserva registra al cliente
  automáticamente; puedes añadirle **fechas conmemorativas** (cumpleaños,
  aniversarios…) y notas
- **Avisos de WhatsApp** (v1.1): la app detecta sola las fechas conmemorativas
  de hoy y de los próximos 7 días, y prepara el mensaje de felicitación de cada
  cliente — se envía con un toque
- **Campaña de reservas** (v1.1): los **jueves, viernes y sábados** aparece la
  lista de todos tus clientes con el mensaje "estamos activos, ¿quieres reservar?"
  listo para enviar uno a uno, con contador de enviados
- **Recordatorios** (v1.1): notificación en el dispositivo cuando hay mensajes
  pendientes (y, en Android/Chrome con la app instalada, incluso con la app cerrada)
- Plantillas de mensajes **personalizables** con variables `{nombre} {motivo} {fecha} {dia}`
- **Bilingüe** español / inglés
- **100% offline** (service worker)
- **Cifrado AES-256-GCM** de los datos guardados

### Cómo funcionan los avisos de WhatsApp (honesto)

WhatsApp **no permite** que una app web envíe mensajes sola en segundo plano;
eso requiere la API de pago "WhatsApp Business Platform" y un servidor. Lo que
esta app hace es **automatizar todo lo demás**: detecta a quién hay que
escribirle, redacta el mensaje con la plantilla, abre WhatsApp con el mensaje y
el número ya puestos, y lleva el registro de a quién ya le enviaste. Tú solo
tocas **Enviar** en cada cliente y confirmas en WhatsApp. Nada de copiar y pegar.

### Paso a paso: fechas conmemorativas

1. Pestaña **Clientes** → toca un cliente (o **Nuevo cliente**).
2. En "Fechas conmemorativas" escribe el motivo (ej. *Cumpleaños*), elige día y
   mes, y toca **Añadir**. Repite las que quieras por cliente.
3. Cuando llegue la fecha (o falten pocos días), la pestaña **Avisos** mostrará
   al cliente con su botón **Enviar**: se abre WhatsApp con la felicitación lista.

### Paso a paso: campaña de jueves, viernes y sábado

1. Registra tus clientes (se crean solos con cada reserva que tenga teléfono).
2. Los jueves, viernes o sábados abre la pestaña **Avisos**: verás la lista
   completa con el mensaje de campaña listo y el progreso "X de Y enviados".
3. Toca **Enviar** cliente por cliente. Los enviados quedan marcados ✓ ese día.
4. Los días de campaña se cambian en **Ajustes → Mensajes y campaña**.

### Paso a paso: recordatorios

1. **Ajustes → Avisos y WhatsApp → Recordatorios en este dispositivo** → acepta
   el permiso de notificaciones.
2. Al abrir la app un día con avisos pendientes, recibirás una notificación.
   En Android/Chrome con la app instalada, el navegador puede avisarte incluso
   con la app cerrada (el aviso en segundo plano nunca incluye nombres ni
   teléfonos: solo "hay fechas hoy" o "hoy hay campaña").

---

## 2. Cómo probarla en tu computadora (local)

Una PWA necesita servirse por HTTP(S); abrir `index.html` con doble clic
**no** activa el service worker ni el cifrado. Para una prueba local rápida:

```bash
cd la-biblioteca
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`. (`localhost` cuenta como contexto seguro,
así que el cifrado funciona).

---

## 3. Cómo publicarla en internet (para instalarla)

Necesitas **HTTPS**. Cualquiera de estas opciones es gratis:

### Opción A — Cloudflare Pages (recomendada, ya tienes Cloudflare)
1. Entra a Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Arrastra **el contenido** de la carpeta `la-biblioteca` (no la carpeta, sino los archivos de adentro).
3. Deploy. Te da una URL `https://...pages.dev`.
   - El archivo `_headers` aplica automáticamente todas las cabeceras de seguridad.

Por línea de comandos (si usas Wrangler):
```bash
npx wrangler pages deploy la-biblioteca --project-name la-biblioteca
```

### Opción B — Netlify
Arrastra la carpeta a https://app.netlify.com/drop — también lee el archivo `_headers`.

### Opción C — GitHub Pages
Sube los archivos a un repo y activa Pages. (GitHub Pages no aplica `_headers`,
pero la app ya trae la CSP en el propio `index.html`, así que sigue protegida).

---

## 4. Cómo instalarla en cada dispositivo

**Android (Chrome):** entra a la URL → menú **⋮** → *Instalar app* / *Añadir a pantalla de inicio*.
A veces aparece solo un botón "Instalar"; o usa **Ajustes → Instalar app** dentro de la propia app.

**iPhone / iPad (Safari):** entra a la URL → botón **Compartir** → *Añadir a inicio* → *Añadir*.
(En la app, **Ajustes → Instalar app** te muestra estos pasos).

**Windows / Mac (Chrome/Edge):** ícono de instalar en la barra de direcciones, o menú → *Instalar*.

Una vez instalada se abre como app independiente, a pantalla completa y sin conexión.

---

## 5. Modelo de seguridad (honesto)

Lo que **sí** hace esta app:

- **Cifrado en reposo:** las reservas se guardan cifradas con **AES-256-GCM**.
  La clave se deriva de tu contraseña con **PBKDF2 (SHA-256, 250 000 iteraciones)**
  y un *salt* aleatorio. La clave vive **solo en memoria** mientras la app está
  abierta; nunca se guarda. Si alguien abre el almacenamiento del navegador,
  solo ve texto cifrado.
- **Sin servidores ni terceros:** la app no envía datos a ningún lado. No hay
  analítica, ni rastreadores, ni llamadas externas. **Tus datos no salen del dispositivo.**
- **CSP estricta:** una *Content-Security-Policy* bloquea todo lo que no sea del
  propio origen, lo que cierra la puerta a ataques XSS y a fugas hacia dominios externos.
- **Cabeceras de seguridad** (archivo `_headers`): anti-clickjacking, no-sniff,
  no-referrer, HSTS, permisos del navegador desactivados, etc.
- **Bloqueo automático:** la app se bloquea sola tras 5 minutos de inactividad y
  al recargar; pide la clave de nuevo.

Límites que debes conocer (ninguna app del lado del cliente puede prometer lo contrario):

- La seguridad real depende de **tu contraseña**. Si es débil o la compartes, la
  protección baja. Usa una larga.
- **Si olvidas la clave, los datos no se pueden recuperar.** Eso es justamente lo
  que los mantiene seguros. Haz **copias cifradas** (Ajustes → Exportar copia cifrada).
- Los datos están en **ese** dispositivo. Otro teléfono no los ve (ver sección 7).
- **Memoria propia:** la app pide al navegador **almacenamiento persistente**
  (`navigator.storage.persist()`) para que no borre los datos por falta de
  espacio. En **Ajustes → Datos → Memoria del dispositivo** ves si quedó
  protegida. Aun así, haz copias cifradas de vez en cuando.
- La protección de *cara al servidor* (control de acceso por usuario, registros de
  auditoría, multiusuario real) requiere backend. La versión actual es de **uso
  interno del local** y no expone una base de datos pública que se pueda "hackear".

---

## 6. Sobre el registro a tu nombre / derechos de autor

- El código ya lleva tu **autoría y aviso de copyright** en todos los archivos
  (`index.html`, `app.js`, `styles.css`, `sw.js`) y una **licencia propietaria**
  (`LICENSE.txt`) a nombre de **Juan Carlos Pérez Arthur**, con todos los derechos reservados.
- Importante: el **derecho de autor existe de forma automática** desde que creas la
  obra; no hace falta un trámite para que sea tuya. El registro formal es **opcional**
  pero te da una **prueba con fecha** muy útil si algún día tienes que defenderla.
- Para registrarla formalmente:
  - **República Dominicana:** ONDA (Oficina Nacional de Derecho de Autor) — registro de obra/software.
  - **Estados Unidos:** U.S. Copyright Office (copyright.gov), registro de "computer program".
- Yo (la IA) **no puedo hacer el trámite legal por ti**, pero el paquete ya queda
  preparado y firmado a tu nombre para ese registro.

---

## 7. Siguiente paso opcional: sincronizar entre dispositivos

Si quieres que **varios celulares/PC vean las mismas reservas** (por ejemplo tú en
la puerta y otra persona en caja), hace falta un **backend**. Con tu cuenta de
**Cloudflare** se puede hacer gratis y muy seguro con un **Worker + base de datos D1**
(o KV), manteniendo el cifrado. Puedo construirte esa parte cuando quieras.

---

## 8. Estructura de archivos

```
la-biblioteca/
├── index.html              App (shell con CSP)
├── styles.css              Diseño
├── app.js                  Lógica + cifrado (Web Crypto)
├── sw.js                   Service worker (offline)
├── manifest.webmanifest    Manifiesto PWA
├── _headers                Cabeceras de seguridad (Cloudflare/Netlify)
├── LICENSE.txt             Licencia propietaria
├── README.md               Este archivo
├── package.json            Solo para correr las pruebas (npm test)
├── assets/                 Íconos (192, 512, maskable, apple-touch, favicon)
└── botifarma/              BotiFarma — Recompra (app independiente, ver su README)
```
