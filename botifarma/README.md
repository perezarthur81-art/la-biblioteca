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
- **Copia de seguridad**: exportar, compartir (WhatsApp/Drive) e importar
  (reemplazando o añadiendo, con «Deshacer»); la app recuerda hacerla cada
  semana; con el bloqueo activo la copia puede salir **cifrada**
- **Bloqueo con clave** opcional: los datos quedan **cifrados (AES-256-GCM)** en
  el dispositivo y la app pide la clave al abrirla y tras un rato sin uso; si
  se olvida la clave, los datos se apartan (no se destruyen) y se recuperan
  cuando se recuerde
- **✓ Compró** y las importaciones tienen botón **Deshacer**
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
5. **Ajustes → Bloqueo con clave**: active una clave (mínimo 6 caracteres, sin
   secuencias como 123456). La tablet queda en el mostrador, así que esto
   protege a sus pacientes. Anote la clave en un lugar seguro.
6. Cierre la pestaña de Chrome y use siempre el ícono instalado (si la app está
   abierta en dos sitios a la vez, se sincronizan, pero es mejor usar una sola).
7. **Ajustes → Versión**: si tiene código PRO, actívelo (más de 15 clientes y
   mensaje personalizable).
8. Registre los primeros clientes en **Nuevo**. Pregunte siempre
   *«¿le aviso por WhatsApp cuando le toque?»* y deje marcada la casilla de
   consentimiento solo si dice que sí.
9. Al final de la primera semana, **Ajustes → Exportar copia** (o Compartir
   copia a su propio WhatsApp). La app se lo recordará cada 7 días.

Cada mañana: abrir la app → pestaña **Hoy** → tocar **WhatsApp** en cada
cliente → cuando compre, tocar **✓ Compró**. Al final del mes, el **Panel**
dice cuántas recompras y cuántos pesos se recuperaron.

La app se actualiza sola: cuando se publique una versión nueva, muestra el
aviso «Hay una versión nueva» y basta tocar **Actualizar ahora**.

---

## 3. Otras formas de usarla

### A. Abrir el archivo directamente (solo en computadora)

Copie `index.html` a la computadora y ábralo con Chrome o Edge. Todo funciona:
clientes, WhatsApp Web, copias y panel. Lo que no aplica en este modo es la
instalación como app y el modo sin conexión automático.

**En Android no use este modo**: al abrir el archivo desde el gestor de
archivos, Chrome no deja guardar datos (la app lo avisa con un cartel rojo y
todo se pierde al cerrarla). En la tablet use siempre la dirección `https://…`
o la app instalada.

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
  (200 000 iteraciones, sal aleatoria) y los datos se guardan cifrados. Protege
  contra miradas y manos ajenas en el mostrador; contra un experto con el
  dispositivo en su poder, lo que protege es la longitud de la clave (mínimo 6,
  mejor 10 o más, y sin secuencias). Al activar el bloqueo, los datos en claro
  se borran del dispositivo. Mientras se activa, cambia o desactiva la clave,
  la app no puede bloquearse (evita vaciar los datos a medias).
- **Clave olvidada**: «¿Olvidó la clave?» exige escribir BORRAR y **aparta** el
  baúl cifrado en vez de destruirlo; si más adelante recuerda la clave, en
  Ajustes → Bloqueo puede recuperar esos clientes y añadirlos a la lista.
- **Copias de seguridad**: con el bloqueo activo, al exportar elige entre copia
  **cifrada** (solo se abre con su clave) o **sin cifrar** (sirve aunque olvide
  la clave). Sin bloqueo, la copia va sin cifrar. Trate toda copia como un
  documento confidencial. El CSV para Excel siempre va en claro.
- **Dos ventanas**: si la app está abierta en dos pestañas o ventanas del
  mismo dispositivo, los cambios de una se reflejan en la otra al instante.
- **Mismo origen que La Biblioteca**: en GitHub Pages ambas apps comparten el
  origen `perezarthur81-art.github.io`, y el almacenamiento del navegador es
  por origen. Hoy no hay terceros en ese origen; cuando BotiFarma se venda a
  otras farmacias conviene publicarla en su propio dominio (Cloudflare Pages
  o Netlify, el `_headers` ya está listo).
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
  app ayuda). Si el navegador no deja guardar (archivo abierto desde el gestor
  de archivos, modo incógnito), la app lo avisa con un cartel rojo permanente.
- **CSV**: las celdas que empiezan por `=`, `+`, `-` o `@` se neutralizan para
  que Excel no las ejecute como fórmulas.

---

## 5. Pruebas

La app se prueba en un navegador real (Chromium, con Playwright) en tres
tamaños: tablet horizontal, tablet vertical y celular. Las pruebas registran
clientes, envían WhatsApp, deshacen compras, verifican el panel y el CSV,
exportan e importan copias (en claro y cifradas), migran datos de la v1.2,
activan PRO, cifran con clave, bloquean por inactividad, fuerzan la carrera
«cambiar clave + bloquear», recuperan un baúl de clave olvidada, abren dos
ventanas a la vez, simulan un navegador que no deja guardar, recargan sin
conexión y comprueban el aviso de actualización. Se sirven desde una copia
temporal, así que nunca tocan los archivos del repositorio.

```bash
npm install
npm test                         # 102 comprobaciones
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
  fuente; códigos nuevos de 12 caracteres (se aceptan con o sin guiones)
- Botón **Deshacer** en ✓ Compró y en las importaciones; copias cifradas con
  el bloqueo activo; clave olvidada recuperable; sincronización entre ventanas;
  aviso cuando el navegador no deja guardar; CSV a prueba de fórmulas
- El service worker de La Biblioteca ya no borra la caché de BotiFarma (misma
  dirección web); BotiFarma vuelve a sembrar su caché si desaparece
- Aviso de **nueva versión** con botón Actualizar; almacenamiento persistente;
  la lista «Hoy» se refresca sola al cambiar el día
- Validaciones: teléfono incompleto y fecha de compra futura; «✓ Compró» dos
  veces el mismo día no duplica
- Atajos del ícono (mantener pulsado): Nuevo cliente y Panel
- Pruebas automáticas en navegador real (102 comprobaciones)

### 1.2.0 — 23 de julio de 2026

- App "todo en uno" publicada en `/botifarma/`, lista para cualquier celular o
  computadora

### 1.1.0 — 23 de julio de 2026

- Versión GRATIS (15 clientes) y PRO por código de activación

### 1.0.0 — 23 de julio de 2026

- Primera versión: PWA con Hoy, Clientes, Nuevo, Ajustes, WhatsApp y copias
