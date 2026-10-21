# BotiFarma — Recompra

Gestor de recompras para farmacias: sepa cada día a qué cliente le toca
volver a comprar, recuérdeselo por **WhatsApp** y mida cuánto dinero recupera.
App web instalable (PWA) que funciona en **Android, iPhone, iPad, Windows y
Mac**, con o sin conexión, en vertical y en horizontal.

© 2026 **Juan Carlos Pérez Arthur**. Todos los derechos reservados.

Versión actual: **1.3.0** · publicada en
`https://perezarthur81-art.github.io/la-biblioteca/botifarma/`

---

## 1. Qué hace

- Vista **Hoy**: vencidas, para hoy y próximos 3 días, con contadores y
  marca «✓ Avisado hoy» para saber a quién ya le escribió
- Lista completa de **clientes** con búsqueda por nombre, producto, teléfono o nota
- Registro de clientes con frecuencia de recompra (7/15/30/60/90 días o la que sea),
  precio opcional y **consentimiento** para recibir recordatorios (Ley 172-13)
- Botón de **WhatsApp** con mensaje automático (personalizable en PRO); si el
  cliente no dio consentimiento, el botón pasa a **Llamar**
- Botón **✓ Compró** que reinicia el ciclo y guarda el historial
- **Panel**: recompras de 7 y 30 días, RD$ recuperados, % que recompra a tiempo,
  gráfica de 6 meses, clientes en riesgo, productos más recomprados y
  **exportación a Excel (CSV)**
- **Ritmo real**: cuando un cliente lleva 3 o más compras, la app calcula cada
  cuántos días vuelve de verdad y ofrece ajustar la frecuencia con un toque
- **Copia de seguridad**: exportar, compartir (WhatsApp/Drive) e importar;
  la app recuerda hacerla cada semana
- **Bloqueo con clave** opcional: los datos quedan **cifrados (AES-256-GCM)** en
  el dispositivo y la app pide la clave al abrirla y tras un rato sin uso
- Versión **GRATIS** (hasta 15 clientes) y **PRO** por código de activación
- Los datos viven **solo en el dispositivo**; nada sale a internet

---

## 2. Instalar en la tablet de la farmacia (Android, 5 minutos)

1. En la tablet, instale **WhatsApp** (o WhatsApp Business) con el chip de la
   farmacia y verifique el número. Sin WhatsApp instalado, el botón abre
   WhatsApp Web en el navegador, que también sirve.
2. Abra **Chrome** y entre a
   `https://perezarthur81-art.github.io/la-biblioteca/botifarma/`
3. Menú **⋮ → Instalar app** (o «Añadir a pantalla de inicio»). Aparece el
   ícono de BotiFarma en el escritorio; ábrala desde ahí.
4. **Ajustes → Nombre de la farmacia**: escriba el nombre que saldrá en los mensajes.
5. **Ajustes → Bloqueo con clave**: active una clave (mínimo 4 caracteres). La
   tablet queda en el mostrador, así que esto protege a sus pacientes.
   Anote la clave en un lugar seguro: sin ella los datos no se recuperan.
6. **Ajustes → Versión**: si tiene código PRO, actívelo (más de 15 clientes y
   mensaje personalizable).
7. Registre los primeros clientes en **Nuevo**. Pregunte siempre
   *«¿le aviso por WhatsApp cuando le toque?»* y deje marcada la casilla de
   consentimiento solo si dice que sí.
8. Al final de la primera semana, **Ajustes → Exportar copia** (o Compartir
   copia a su propio WhatsApp). La app se lo recordará cada 7 días.

Cada mañana: abrir la app → pestaña **Hoy** → tocar **WhatsApp** en cada
cliente → cuando compre, tocar **✓ Compró**. Al final del mes, el **Panel**
dice cuántas recompras y cuántos pesos se recuperaron.

La app se actualiza sola: cuando se publique una versión nueva, muestra el
aviso «Hay una versión nueva» y basta tocar **Actualizar ahora**.

---

## 3. Otras formas de usarla

### A. Abrir el archivo directamente

Copie `index.html` al teléfono o computadora y ábralo con Chrome, Edge o
Safari. Todo funciona: clientes, WhatsApp, copias, panel, bloqueo (en Chrome).
Lo único que no aplica en este modo es la instalación como app y el modo sin
conexión automático.

### B. Publicarla en otro hosting (HTTPS)

Suba **el contenido de esta carpeta** a cualquier hosting estático gratis:

- **Cloudflare Pages**: Workers & Pages → Create → Pages → Upload assets →
  arrastre los archivos de esta carpeta. El archivo `_headers` aplica las
  cabeceras de seguridad.
- **Netlify**: arrastre la carpeta a https://app.netlify.com/drop
- **GitHub Pages**: suba los archivos y active Pages (la CSP ya va dentro del
  propio `index.html`).

Para probar en su computadora antes de publicar:

```bash
cd botifarma
python3 -m http.server 8080
```

y abra `http://localhost:8080`.

---

## 4. Seguridad y datos (resumen honesto)

- **Dónde viven los datos**: solo en el navegador del dispositivo
  (`localStorage`). No hay servidor ni cuenta; nadie más los ve.
- **Bloqueo con clave**: la clave se convierte en una llave AES-256 con PBKDF2
  (200 000 iteraciones, sal aleatoria). Sin la clave, lo guardado es ilegible.
  Al activar el bloqueo, los datos en claro se borran del dispositivo.
- **Copias de seguridad**: el archivo JSON **no va cifrado**, para poder
  restaurarlo aunque olvide la clave. Guárdelo como un documento confidencial.
- **Consentimiento**: cada ficha guarda si el cliente aceptó recibir
  recordatorios y la fecha. El mensaje estándar incluye «responda BAJA»; si un
  cliente lo pide, edite su ficha y desmarque la casilla.
- **Mensajes**: el farmacéutico envía cada WhatsApp a mano desde su propio
  WhatsApp (la app solo prepara el mensaje). No es envío masivo ni automático.
- **PRO**: el dispositivo guarda el código de activación y lo verifica al
  arrancar contra una huella SHA-256. Las huellas del código fuente no sirven
  para activarlo. Los códigos de las versiones 1.1 y 1.2 dejaron de funcionar;
  si tenía PRO, vuelva a introducir su código nuevo.
- **Almacenamiento persistente**: la app pide al navegador que no borre los
  datos por falta de espacio (en Ajustes se ve si lo concedió; instalarla como
  app ayuda).

---

## 5. Pruebas

La app se prueba en un navegador real (Chromium, con Playwright) en tres
tamaños: tablet horizontal, tablet vertical y celular. Las pruebas registran
clientes, envían WhatsApp, verifican el panel, exportan e importan copias,
migran datos de la v1.2, activan PRO, cifran con clave, bloquean por
inactividad, recargan sin conexión y comprueban el aviso de actualización.

```bash
npm install
npm test                         # 76 comprobaciones
CODIGO_PRO=BOTI-XXXX-XXXX-XXXX npm test   # además prueba un código PRO real
npm run test:capturas            # guarda capturas en botifarma/tests/capturas/
```

---

## 6. Estructura de archivos

```
botifarma/
├── index.html              App completa (diseño + lógica, "todo en uno")
├── manifest.webmanifest    Manifiesto PWA (instalación, atajos)
├── sw.js                   Service worker (modo sin conexión y actualizaciones)
├── _headers                Cabeceras de seguridad (si se publica sola)
├── README.md               Este archivo
├── assets/                 Íconos (192, 512, maskable, apple-touch, favicon)
└── tests/e2e.mjs           Pruebas de extremo a extremo
```

---

## 7. Historial de versiones

### 1.3.0 — 21 de octubre de 2026

- Tablet: la app ya **gira a horizontal** (antes quedaba fija en vertical) y
  las tarjetas se muestran a dos columnas
- **Bloqueo con clave** y cifrado AES-256-GCM de los datos; bloqueo por
  inactividad configurable; «Bloquear ahora»; cambio de clave
- **Panel** con recompras, RD$ recuperados, puntualidad, gráfica de 6 meses,
  clientes en riesgo, productos y calidad de las fichas; **exportar CSV**
- Ficha del cliente: **precio** opcional, **consentimiento** con fecha,
  «✓ Avisado hoy», botón **Llamar** cuando no hay consentimiento, sugerencia
  de **ritmo real**
- Nombre de la farmacia configurable (`{farmacia}` en el mensaje) y frase de
  baja en el mensaje estándar
- Copias: **compartir** por WhatsApp/Drive, recordatorio semanal, importar en
  modo **reemplazar** o **añadir** sin duplicar, fecha de la última copia
- Se cierra el hueco que permitía activar PRO copiando una huella del código
  fuente; códigos nuevos de 12 caracteres
- Aviso de **nueva versión** con botón Actualizar; almacenamiento persistente;
  la lista «Hoy» se refresca sola al cambiar el día
- Validaciones: teléfono incompleto y fecha de compra futura; «✓ Compró» dos
  veces el mismo día no duplica
- Atajos del ícono (mantener pulsado): Nuevo cliente y Panel
- Pruebas automáticas en navegador real (76 comprobaciones)

### 1.2.0 — 23 de julio de 2026

- App "todo en uno" publicada en `/botifarma/`, lista para cualquier celular o
  computadora

### 1.1.0 — 23 de julio de 2026

- Versión GRATIS (15 clientes) y PRO por código de activación

### 1.0.0 — 23 de julio de 2026

- Primera versión: PWA con Hoy, Clientes, Nuevo, Ajustes, WhatsApp y copias
