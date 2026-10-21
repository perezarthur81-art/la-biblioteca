/* BotiFarma — Recompra · Pruebas de extremo a extremo (navegador real)
   © 2026 Juan Carlos Pérez Arthur. Todos los derechos reservados.

   Uso:  npm install && npm test
   (sirve la carpeta botifarma/ en un puerto local y la prueba en Chromium
    con tamaños de tablet horizontal, tablet vertical y celular).

   Variables opcionales:
     CODIGO_PRO=BOTI-XXXX-XXXX-XXXX  prueba la activación PRO con un código real
     CAPTURAS=1                      guarda capturas de pantalla en tests/capturas/ */

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURAS = process.env.CAPTURAS ? path.join(RAIZ, "tests", "capturas") : null;
const CODIGO_PRO = process.env.CODIGO_PRO || "";

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".css": "text/css", ".md": "text/plain" };

/* Servidor estático mínimo (equivale a GitHub Pages / cualquier hosting) */
function servir() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
        if (p.endsWith("/")) p += "index.html";
        const archivo = path.join(RAIZ, p);
        if (!archivo.startsWith(RAIZ)) throw new Error("fuera");
        const cuerpo = await readFile(archivo);
        res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream", "Cache-Control": "no-store" });
        res.end(cuerpo);
      } catch (e) {
        res.writeHead(404); res.end("no encontrado");
      }
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, base: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

let fallos = 0, pasadas = 0;
function ok(cond, msg) {
  if (cond) { pasadas++; console.log("  ✅", msg); }
  else { fallos++; console.log("  ❌", msg); }
}
function igual(a, b, msg) { ok(a === b, `${msg} (esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)})`); }

async function captura(page, nombre) {
  if (!CAPTURAS) return;
  await mkdir(CAPTURAS, { recursive: true });
  await page.screenshot({ path: path.join(CAPTURAS, nombre + ".png"), fullPage: true });
}

/* Cola de respuestas para confirm()/alert(): true = Aceptar, false = Cancelar */
function dialogos(page) {
  const cola = [];
  page.on("dialog", async (d) => {
    const r = cola.length ? cola.shift() : true;
    if (r) await d.accept(); else await d.dismiss();
  });
  return cola;
}

function vigilarConsola(page, errores) {
  page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
}

async function nuevoCliente(page, c) {
  await page.click('button[data-vista="nuevo"]');
  await page.fill("#f-nombre", c.nombre);
  await page.fill("#f-tel", c.tel || "");
  await page.fill("#f-producto", c.producto);
  if (c.dias) { await page.fill("#f-dias", String(c.dias)); }
  if (c.haceDias !== undefined) {
    const iso = await page.evaluate((n) => sumarDias(hoyISO(), -n), c.haceDias);
    await page.fill("#f-ultima", iso);
  }
  if (c.precio) await page.fill("#f-precio", String(c.precio));
  if (c.consiente === false) await page.uncheck("#f-consiente");
  await page.click("#btn-guardar");
  await page.waitForTimeout(80);
}

const toast = (page) => page.textContent("#toast");

(async () => {
  const { srv, base } = await servir();
  const browser = await chromium.launch();
  const errores = [];
  console.log("Probando", base);

  /* ───────── 1. Arranque, registro, Hoy y WhatsApp (tablet horizontal) ───────── */
  console.log("\n1. Arranque, registro y WhatsApp");
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-DO", timezoneId: "America/Santo_Domingo" });
  let page = await ctx.newPage();
  vigilarConsola(page, errores);
  let cola = dialogos(page);
  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(300);
  igual(await page.textContent("#pie-version"), "BotiFarma — Recompra · v1.3.0", "versión en el pie");
  igual(await page.locator(".nav-btn").count(), 5, "cinco pestañas");
  igual(await page.isVisible("#hoy-vacio"), true, "estado vacío visible al inicio");
  await captura(page, "tablet-h-01-hoy-vacio");

  await nuevoCliente(page, { nombre: "María Rodríguez", tel: "809-555-1234", producto: "Losartán 50 mg", dias: 30, haceDias: 30, precio: 850 });
  igual(await page.textContent("#stat-hoy"), "1", "cliente con 30 días y última compra hace 30 → para hoy");
  const href = await page.getAttribute("#hoy-listas a.btn-whatsapp", "href");
  ok(href.startsWith("https://wa.me/18095551234?text="), "enlace de WhatsApp con código de país 1");
  const msg = decodeURIComponent(href.split("text=")[1]);
  ok(msg.includes("María Rodríguez") && msg.includes("Losartán 50 mg") && msg.includes("BotiFarma") && msg.includes("BAJA"), "mensaje con nombre, producto, farmacia y frase de baja");
  ok(!msg.includes("{"), "sin variables sin reemplazar");

  // Tocar WhatsApp abre otra pestaña y marca "Avisado hoy"
  const [popup] = await Promise.all([ctx.waitForEvent("page"), page.click("#hoy-listas a.btn-whatsapp")]);
  await popup.close();
  await page.waitForTimeout(300);
  ok((await page.textContent("#hoy-listas")).includes("Avisado hoy"), "marca «Avisado hoy» tras tocar WhatsApp");
  await captura(page, "tablet-h-02-hoy");

  // Vencida y Compró
  await nuevoCliente(page, { nombre: "Pedro Gómez", tel: "18295550000", producto: "Metformina 850 mg", dias: 30, haceDias: 45, precio: 400 });
  igual(await page.textContent("#stat-vencidas"), "1", "cliente con 45 días → vencida");
  await page.click("#hoy-listas .tc-vencida .btn-compro");
  await page.waitForTimeout(100);
  igual(await page.textContent("#stat-vencidas"), "0", "✓ Compró reinicia el ciclo");
  ok((await toast(page)).includes("Recompra registrada"), "aviso de recompra registrada");
  // Compró dos veces el mismo día no duplica
  await page.click('button[data-vista="clientes"]');
  await page.locator("#clientes-lista .tarjeta-cliente", { hasText: "Pedro Gómez" }).locator(".btn-compro").click();
  await page.waitForTimeout(100);
  ok((await toast(page)).includes("ya estaba registrada"), "segundo ✓ Compró el mismo día no duplica");
  const hist = await page.evaluate(() => datos.clientes.map((c) => c.historial.length));
  igual(Math.max(...hist), 1, "historial con una sola compra registrada");

  // Validaciones
  await nuevoCliente(page, { nombre: "Tel corto", tel: "809-55", producto: "X" });
  ok((await toast(page)).includes("teléfono parece incompleto"), "teléfono de 5 dígitos rechazado");
  await page.click("#btn-cancelar").catch(() => {});
  await page.click('button[data-vista="nuevo"]');
  await page.fill("#f-nombre", "Futuro"); await page.fill("#f-producto", "Y");
  await page.fill("#f-ultima", await page.evaluate(() => sumarDias(hoyISO(), 2)));
  await page.click("#btn-guardar"); await page.waitForTimeout(80);
  ok((await toast(page)).includes("fecha futura"), "última compra futura rechazada");
  igual(await page.evaluate(() => datos.clientes.length), 2, "los clientes inválidos no se guardaron");

  // Sin consentimiento → sin WhatsApp, con Llamar
  await nuevoCliente(page, { nombre: "Ana Sin", tel: "8495551111", producto: "Enalapril 10 mg", dias: 30, haceDias: 30, consiente: false });
  await page.click('button[data-vista="clientes"]');
  const tarjetaAna = page.locator("#clientes-lista .tarjeta-cliente", { hasText: "Ana Sin" });
  igual(await tarjetaAna.locator(".btn-whatsapp").count(), 0, "sin consentimiento: no hay botón de WhatsApp");
  igual(await tarjetaAna.locator(".btn-llamar").count(), 1, "sin consentimiento: hay botón Llamar");
  ok((await tarjetaAna.textContent()).includes("Sin consentimiento"), "chip «Sin consentimiento»");
  await captura(page, "tablet-h-03-clientes");

  // Editar: consentimiento vuelve a sí
  await tarjetaAna.locator(".btn-editar").click();
  igual(await page.isChecked("#f-consiente"), false, "el formulario recuerda el consentimiento");
  await page.check("#f-consiente");
  await page.click("#btn-guardar"); await page.waitForTimeout(80);
  const ana = await page.evaluate(() => datos.clientes.find((c) => c.nombre === "Ana Sin").consentimiento);
  ok(ana.acepta === true && /^\d{4}-\d{2}-\d{2}$/.test(ana.fecha), "consentimiento aceptado con fecha");
  await captura(page, "tablet-h-04-nuevo");

  /* ───────── 2. Panel, ritmo real y CSV ───────── */
  console.log("\n2. Panel, ritmo real y CSV");
  // Historial artificial para María: compras cada ~27 días
  await page.evaluate(() => {
    const c = datos.clientes.find((x) => x.nombre === "María Rodríguez");
    c.historial = [sumarDias(hoyISO(), -81), sumarDias(hoyISO(), -54), sumarDias(hoyISO(), -27), hoyISO()];
    c.ultima = hoyISO();
    guardarDatos(); pintarTodo();
  });
  await page.click('button[data-vista="panel"]');
  await page.waitForTimeout(100);
  igual(await page.textContent("#p-r30"), "3", "recompras en 30 días (María hoy y hace 27, Pedro hoy)");
  igual(await page.textContent("#p-ingresos"), "RD$2,100", "RD$ recuperados en 30 días (850×2 + 400)");
  igual(await page.textContent("#p-puntualidad"), "100 %", "puntualidad 100 % (intervalos de 27 ≤ 33)");
  igual(await page.locator("#p-meses .barra-fila").count(), 6, "gráfica de 6 meses");
  ok((await page.textContent("#p-productos")).includes("Losartán 50 mg"), "tabla de productos");
  await captura(page, "tablet-h-05-panel");
  await page.click('button[data-vista="clientes"]');
  const maria = page.locator("#clientes-lista .tarjeta-cliente", { hasText: "María Rodríguez" });
  ok((await maria.textContent()).includes("Ritmo real: cada 27 días"), "sugerencia de ritmo real (27 vs 30)");
  await maria.locator(".btn-enlace").click(); await page.waitForTimeout(80);
  igual(await page.evaluate(() => datos.clientes.find((x) => x.nombre === "María Rodríguez").dias), 27, "«Usar 27» cambia la frecuencia");

  const [csv] = await Promise.all([page.waitForEvent("download"), page.click('button[data-vista="panel"]').then(() => page.click("#btn-csv"))]);
  const csvTexto = await readFile(await csv.path(), "utf8");
  ok(csvTexto.startsWith("﻿Nombre,Teléfono,Producto"), "CSV con BOM y cabecera");
  igual(csvTexto.trim().split("\r\n").length, 4, "CSV con 3 clientes");
  ok(csvTexto.includes("María Rodríguez,809-555-1234,Losartán 50 mg,27"), "fila de María en el CSV");

  /* ───────── 3. Copias: exportar, importar (reemplazar y añadir) ───────── */
  console.log("\n3. Copias de seguridad");
  await page.click('button[data-vista="ajustes"]');
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btn-exportar")]);
  const copia = JSON.parse(await readFile(await dl.path(), "utf8"));
  igual(copia.version, "1.3.0", "la copia lleva la versión");
  igual(copia.clientes.length, 3, "la copia lleva los 3 clientes");
  igual(await page.evaluate(() => datos.ajustes.ultimaCopia === hoyISO()), true, "se anota la fecha de la copia");

  // Importar en modo AÑADIR (segundo confirm = Cancelar) con un cliente nuevo y uno repetido
  const copiaExtra = { clientes: [copia.clientes[0], { nombre: "Luis Nuevo", producto: "Atorvastatina 20 mg", tel: "8095550002", dias: 30, ultima: copia.clientes[0].ultima }] };
  const archivoTmp = path.join(RAIZ, "tests", "_copia-prueba.json");
  await writeFile(archivoTmp, JSON.stringify(copiaExtra));
  cola.push(true, false);
  await page.setInputFiles("#archivo-importar", archivoTmp);
  await page.waitForTimeout(200);
  igual(await page.evaluate(() => datos.clientes.length), 4, "importar en modo añadir: 1 nuevo, 1 repetido ignorado");
  // Importar en modo REEMPLAZAR
  cola.push(true, true);
  await page.setInputFiles("#archivo-importar", archivoTmp);
  await page.waitForTimeout(200);
  igual(await page.evaluate(() => datos.clientes.length), 2, "importar en modo reemplazar deja solo los de la copia");
  // Archivo inválido
  await writeFile(archivoTmp, "{esto no es json");
  await page.setInputFiles("#archivo-importar", archivoTmp);
  await page.waitForTimeout(200);
  ok((await toast(page)).includes("no es una copia válida"), "archivo inválido rechazado");
  await captura(page, "tablet-h-06-ajustes");
  await ctx.close();

  /* ───────── 4. Migración desde v1.2 ───────── */
  console.log("\n4. Migración desde la v1.2");
  ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-DO", timezoneId: "America/Santo_Domingo" });
  page = await ctx.newPage(); vigilarConsola(page, errores); cola = dialogos(page);
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.setItem("botifarma_recompra_v1", JSON.stringify({
      clientes: [{ id: "abc", nombre: "Viejo Cliente", producto: "Amlodipino 5 mg", tel: "8095550003", dias: 30, ultima: "2026-10-01", notas: "", historial: ["2026-10-01"] }],
      plantilla: "Hola {nombre} 👋, le saluda BotiFarma. Le recordamos que ya le toca la recompra de {producto} (cada {dias} días). ¿Se lo preparamos? ¡Le esperamos! 💚",
    }));
    localStorage.setItem("botifarma_pro_v1", "02e2d941106b7bf563d897f4379b64f6190d517d09218221755cb0ea4996efc5");
  });
  await page.reload(); await page.waitForTimeout(300);
  const viejo = await page.evaluate(() => datos.clientes[0]);
  ok(viejo && viejo.consentimiento.acepta === true && viejo.precio === 0 && viejo.creado === "2026-10-01", "ficha v1.2 normalizada (consentimiento, precio, creado)");
  igual(await page.evaluate(() => datos.plantilla.includes("{farmacia}") && datos.plantilla.includes("BAJA")), true, "plantilla estándar v1.2 modernizada");
  igual(await page.evaluate(() => localStorage.getItem("botifarma_pro_v1")), null, "clave PRO antigua eliminada");
  igual(await page.isVisible("#badge-pro"), false, "la huella antigua ya no activa PRO");
  await page.click('button[data-vista="ajustes"]');
  ok((await page.textContent("#version-estado")).includes("vuelva a introducir su código"), "aviso para reactivar PRO");
  await ctx.close();

  /* ───────── 5. GRATIS / PRO ───────── */
  console.log("\n5. Límite GRATIS y activación PRO");
  ctx = await browser.newContext({ viewport: { width: 800, height: 1280 }, isMobile: true, hasTouch: true, locale: "es-DO", timezoneId: "America/Santo_Domingo" });
  page = await ctx.newPage(); vigilarConsola(page, errores); cola = dialogos(page);
  await page.goto(base); await page.waitForTimeout(200);
  for (let i = 1; i <= 16; i++) await nuevoCliente(page, { nombre: "Cliente " + i, producto: "Producto " + i });
  igual(await page.evaluate(() => datos.clientes.length), 15, "la versión GRATIS se detiene en 15 clientes");
  igual(await page.isVisible("#vista-ajustes"), true, "al llegar al límite se abre Ajustes");
  await captura(page, "tablet-v-01-ajustes-limite");
  await page.fill("#codigo-pro", "BOTI-0000-0000-0000");
  await page.click("#btn-activar-pro"); await page.waitForTimeout(200);
  ok((await toast(page)).includes("no válido"), "código falso rechazado");
  // Intento de trampa: guardar una huella del código fuente en vez del código
  await page.evaluate(() => localStorage.setItem("botifarma_pro_v2", HUELLAS_PRO[0]));
  await page.reload(); await page.waitForTimeout(300);
  igual(await page.isVisible("#badge-pro"), false, "una huella copiada del código fuente NO activa PRO");
  igual(await page.evaluate(() => localStorage.getItem("botifarma_pro_v2")), null, "la huella falsa se borra");
  if (CODIGO_PRO) {
    await page.click('button[data-vista="ajustes"]');
    await page.fill("#codigo-pro", CODIGO_PRO.toLowerCase());
    await page.click("#btn-activar-pro"); await page.waitForTimeout(300);
    igual(await page.isVisible("#badge-pro"), true, "código real activa PRO (aunque se escriba en minúsculas)");
    await page.reload(); await page.waitForTimeout(300);
    igual(await page.isVisible("#badge-pro"), true, "PRO sigue activo tras recargar");
    await nuevoCliente(page, { nombre: "Cliente 16", producto: "Producto 16" });
    igual(await page.evaluate(() => datos.clientes.length), 16, "PRO permite más de 15 clientes");
    igual(await page.isDisabled("#plantilla"), false, "PRO permite editar el mensaje");
  } else {
    console.log("  ⏭️  CODIGO_PRO no definido: se omite la activación con código real");
  }
  await page.click('button[data-vista="hoy"]');
  await captura(page, "tablet-v-02-hoy");
  await ctx.close();

  /* ───────── 6. Bloqueo con clave y cifrado ───────── */
  console.log("\n6. Bloqueo con clave y cifrado");
  ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "es-DO", timezoneId: "America/Santo_Domingo" });
  page = await ctx.newPage(); vigilarConsola(page, errores); cola = dialogos(page);
  await page.goto(base); await page.waitForTimeout(200);
  await nuevoCliente(page, { nombre: "Secreto Paciente", tel: "8095550009", producto: "Insulina", dias: 30, haceDias: 10 });
  await page.click('button[data-vista="ajustes"]');
  await page.fill("#clave-nueva", "123"); await page.fill("#clave-nueva2", "123");
  await page.click("#btn-activar-bloqueo"); await page.waitForTimeout(100);
  ok((await toast(page)).includes("al menos 4"), "clave de 3 caracteres rechazada");
  await page.fill("#clave-nueva", "1234"); await page.fill("#clave-nueva2", "1234");
  await page.click("#btn-activar-bloqueo");
  await page.waitForSelector("#bloqueo-activo:not(.oculto)", { timeout: 15000 });
  const claves = await page.evaluate(() => ({ plano: localStorage.getItem("botifarma_recompra_v1"), baul: localStorage.getItem("botifarma_baul_v1"), meta: localStorage.getItem("botifarma_meta_v1") }));
  igual(claves.plano, null, "con bloqueo: los datos en claro desaparecen");
  ok(claves.baul && !claves.baul.includes("Secreto") && !claves.baul.includes("Insulina"), "el baúl cifrado no contiene nombres ni productos legibles");
  ok(claves.meta && JSON.parse(claves.meta).iters === 200000, "meta con 200 000 iteraciones");
  // Un cambio con el bloqueo activo también se guarda cifrado
  await nuevoCliente(page, { nombre: "Otro Paciente", producto: "Levotiroxina", dias: 30 });
  await page.waitForTimeout(300);
  ok(!(await page.evaluate(() => localStorage.getItem("botifarma_baul_v1"))).includes("Levotiroxina"), "el cambio se guardó cifrado");

  await page.reload(); await page.waitForTimeout(300);
  igual(await page.isVisible("#bloqueo"), true, "al recargar aparece la pantalla de bloqueo");
  igual(await page.evaluate(() => datos), null, "sin clave no hay datos en memoria");
  await captura(page, "tablet-h-07-bloqueo");
  await page.fill("#bloqueo-clave", "0000"); await page.click("#btn-desbloquear");
  await page.waitForSelector("#bloqueo-error:not(:empty)", { timeout: 15000 });
  ok((await page.textContent("#bloqueo-error")).includes("incorrecta"), "clave incorrecta avisada");
  await page.fill("#bloqueo-clave", "1234"); await page.press("#bloqueo-clave", "Enter");
  await page.waitForFunction(() => document.querySelector("#bloqueo").classList.contains("oculto"), null, { timeout: 15000 });
  igual(await page.evaluate(() => datos.clientes.length), 2, "con la clave correcta se recuperan los 2 clientes");
  igual(await page.textContent("#stat-clientes"), "2", "la pantalla se pinta tras desbloquear");

  // Bloqueo por inactividad (simulando que la app estuvo oculta 20 min con bloqueo a 15)
  await page.evaluate(() => {
    ocultadaEn = Date.now() - 20 * 60000;
    Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(100);
  igual(await page.isVisible("#bloqueo"), true, "se bloquea al volver tras 20 min oculta");
  igual((await page.textContent("#clientes-lista")).trim(), "", "la lista queda vacía mientras está bloqueada");
  await page.fill("#bloqueo-clave", "1234"); await page.click("#btn-desbloquear");
  await page.waitForFunction(() => document.querySelector("#bloqueo").classList.contains("oculto"), null, { timeout: 15000 });

  // Cambiar clave y desactivar
  await page.click('button[data-vista="ajustes"]');
  await page.fill("#clave-actual", "mala"); await page.fill("#clave-cambio", "5678");
  await page.click("#btn-cambiar-clave"); await page.waitForTimeout(1500);
  ok((await toast(page)).includes("incorrecta"), "cambiar clave con la actual mal → error");
  await page.fill("#clave-actual", "1234"); await page.fill("#clave-cambio", "5678");
  await page.click("#btn-cambiar-clave");
  await page.waitForFunction(() => document.querySelector("#toast").textContent.includes("Clave cambiada"), null, { timeout: 15000 });
  await page.click("#btn-bloquear-ahora"); await page.waitForTimeout(100);
  igual(await page.isVisible("#bloqueo"), true, "«Bloquear ahora» bloquea");
  await page.fill("#bloqueo-clave", "5678"); await page.click("#btn-desbloquear");
  await page.waitForFunction(() => document.querySelector("#bloqueo").classList.contains("oculto"), null, { timeout: 15000 });
  await page.click('button[data-vista="ajustes"]');
  await page.fill("#clave-actual", "5678");
  await page.click("#btn-desactivar-bloqueo");
  await page.waitForSelector("#bloqueo-inactivo:not(.oculto)", { timeout: 15000 });
  const tras = await page.evaluate(() => ({ plano: localStorage.getItem("botifarma_recompra_v1"), baul: localStorage.getItem("botifarma_baul_v1"), meta: localStorage.getItem("botifarma_meta_v1") }));
  ok(tras.plano && tras.plano.includes("Secreto Paciente") && !tras.baul && !tras.meta, "desactivar devuelve los datos en claro y borra baúl y meta");

  // ¿Olvidó la clave? → borra y empieza de nuevo
  await page.fill("#clave-nueva", "9999"); await page.fill("#clave-nueva2", "9999");
  await page.click("#btn-activar-bloqueo");
  await page.waitForSelector("#bloqueo-activo:not(.oculto)", { timeout: 15000 });
  await page.reload(); await page.waitForTimeout(300);
  cola.push(true, true);
  await page.click("#btn-olvide-clave");
  await page.waitForTimeout(500);
  igual(await page.isVisible("#bloqueo"), false, "«Olvidé la clave» borra y la app arranca limpia");
  igual(await page.evaluate(() => datos.clientes.length), 0, "sin clientes tras borrar");
  await ctx.close();

  /* ───────── 7. Atajos, sin conexión, actualización ───────── */
  console.log("\n7. Atajos, modo sin conexión y actualización");
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "es-DO", timezoneId: "America/Santo_Domingo" });
  page = await ctx.newPage(); vigilarConsola(page, errores); cola = dialogos(page);
  await page.goto(base + "?vista=nuevo"); await page.waitForTimeout(300);
  igual(await page.isVisible("#vista-nuevo"), true, "?vista=nuevo abre el formulario");
  ok(!page.url().includes("vista="), "el parámetro se limpia de la URL");
  await captura(page, "celular-01-nuevo");
  await page.goto(base + "?vista=panel"); await page.waitForTimeout(300);
  igual(await page.isVisible("#vista-panel"), true, "?vista=panel abre el panel");
  await captura(page, "celular-02-panel");
  await page.goto(base); await page.waitForTimeout(500);
  await nuevoCliente(page, { nombre: "Celular Uno", tel: "8095550010", producto: "Omeprazol", dias: 15, haceDias: 15 });
  await captura(page, "celular-03-hoy");
  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  ok(sw, "service worker activo");
  const cachesNombres = await page.evaluate(() => caches.keys());
  ok(cachesNombres.includes("botifarma-recompra-v1.3.0"), "caché v1.3.0 creada");
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "load" }); await page.waitForTimeout(300);
  igual(await page.title(), "BotiFarma — Recompra", "recarga sin conexión");
  igual(await page.textContent("#stat-clientes"), "1", "los datos siguen ahí sin conexión");
  await ctx.setOffline(false);

  // Actualización: cambia sw.js en disco → la app avisa
  const swRuta = path.join(RAIZ, "sw.js");
  const swOriginal = await readFile(swRuta, "utf8");
  try {
    await writeFile(swRuta, swOriginal.replace('v1.3.0"', 'v1.3.0-prueba"'));
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await page.waitForSelector("#aviso-actualizar:not(.oculto)", { timeout: 10000 });
    ok(true, "aviso de nueva versión al cambiar el service worker");
  } catch (e) {
    ok(false, "aviso de nueva versión: " + e.message);
  } finally {
    await writeFile(swRuta, swOriginal);
  }
  await ctx.close();

  await browser.close();
  srv.close();
  try { const { unlink } = await import("node:fs/promises"); await unlink(archivoTmp); } catch (e) { /* nada */ }

  console.log(`\nResultado: ${pasadas} pruebas pasadas, ${fallos} fallidas.`);
  if (errores.length) { console.log("Errores de consola:"); for (const e of errores) console.log("  •", e); }
  else console.log("Sin errores de consola en ninguna prueba.");
  process.exit(fallos || errores.length ? 1 : 0);
})().catch((e) => { console.error("FALLO GENERAL:", e); process.exit(1); });
