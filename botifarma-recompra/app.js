/* BotiFarma — Recompra · Lógica
   © 2026 Juan Carlos Pérez Arthur. Todos los derechos reservados.
   Sin frameworks, sin servidores: los datos viven solo en este dispositivo. */

"use strict";

/* ══════════ Datos ══════════ */

const CLAVE_DATOS = "botifarma_recompra_v1";

const PLANTILLA_DEFECTO =
  "Hola {nombre} 👋, le saluda BotiFarma. Le recordamos que ya le toca la " +
  "recompra de {producto} (cada {dias} días). ¿Se lo preparamos? ¡Le esperamos! 💚";

let datos = cargarDatos();

function cargarDatos() {
  try {
    const crudo = localStorage.getItem(CLAVE_DATOS);
    if (crudo) {
      const d = JSON.parse(crudo);
      if (d && Array.isArray(d.clientes)) {
        if (typeof d.plantilla !== "string" || !d.plantilla.trim()) {
          d.plantilla = PLANTILLA_DEFECTO;
        }
        return d;
      }
    }
  } catch (e) { /* datos corruptos → empezar limpio */ }
  return { clientes: [], plantilla: PLANTILLA_DEFECTO };
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch (e) {
    avisar("⚠️ No se pudo guardar. Revise el espacio del dispositivo.");
  }
}

/* ══════════ Fechas ══════════ */

function hoyISO() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function aFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12, 0, 0); // mediodía: evita saltos por horario
}

function fechaBonita(iso) {
  if (!iso) return "—";
  return aFecha(iso).toLocaleDateString("es-DO", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* Días que faltan para la próxima recompra (negativo = vencida) */
function diasParaRecompra(cliente) {
  const proxima = aFecha(cliente.ultima);
  proxima.setDate(proxima.getDate() + cliente.dias);
  const hoy = aFecha(hoyISO());
  return Math.round((proxima - hoy) / 86400000);
}

function estadoCliente(cliente) {
  const d = diasParaRecompra(cliente);
  if (d < 0) return "vencida";
  if (d === 0) return "hoy";
  if (d <= 3) return "pronto";
  return "ok";
}

/* ══════════ Utilidades de interfaz ══════════ */

const $ = (sel) => document.querySelector(sel);

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

let toastTimer = null;
function avisar(mensaje) {
  const t = $("#toast");
  t.textContent = mensaje;
  t.classList.add("toast-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("toast-visible"), 2600);
}

/* ══════════ WhatsApp ══════════ */

function telefonoWhatsApp(tel) {
  let digitos = (tel || "").replace(/\D/g, "");
  if (!digitos) return "";
  // Números dominicanos de 10 dígitos → anteponer código de país 1
  if (digitos.length === 10 && /^(809|829|849)/.test(digitos)) {
    digitos = "1" + digitos;
  }
  return digitos;
}

function enlaceWhatsApp(cliente) {
  const tel = telefonoWhatsApp(cliente.tel);
  const mensaje = (datos.plantilla || PLANTILLA_DEFECTO)
    .replaceAll("{nombre}", cliente.nombre)
    .replaceAll("{producto}", cliente.producto)
    .replaceAll("{dias}", String(cliente.dias));
  const base = tel ? "https://wa.me/" + tel : "https://wa.me/";
  return base + "?text=" + encodeURIComponent(mensaje);
}

/* ══════════ Acciones sobre clientes ══════════ */

function registrarCompra(id) {
  const c = datos.clientes.find((x) => x.id === id);
  if (!c) return;
  c.ultima = hoyISO();
  c.historial = c.historial || [];
  c.historial.push(c.ultima);
  guardarDatos();
  pintarTodo();
  avisar("✅ Recompra registrada: " + c.nombre);
}

function eliminarCliente(id) {
  const c = datos.clientes.find((x) => x.id === id);
  if (!c) return;
  if (!confirm("¿Eliminar a " + c.nombre + " y todo su historial?")) return;
  datos.clientes = datos.clientes.filter((x) => x.id !== id);
  guardarDatos();
  pintarTodo();
  avisar("🗑️ Cliente eliminado");
}

function editarCliente(id) {
  const c = datos.clientes.find((x) => x.id === id);
  if (!c) return;
  $("#f-id").value = c.id;
  $("#f-nombre").value = c.nombre;
  $("#f-tel").value = c.tel || "";
  $("#f-producto").value = c.producto;
  $("#f-dias").value = c.dias;
  $("#f-ultima").value = c.ultima;
  $("#f-notas").value = c.notas || "";
  marcarChipFrecuencia(c.dias);
  $("#form-titulo").textContent = "Editar cliente";
  $("#btn-guardar").textContent = "Guardar cambios";
  $("#btn-cancelar").classList.remove("oculto");
  mostrarVista("nuevo");
}

/* ══════════ Tarjeta de cliente ══════════ */

const TEXTO_CHIP = {
  vencida: (d) => "Vencida hace " + Math.abs(d) + (Math.abs(d) === 1 ? " día" : " días"),
  hoy:     () => "¡Le toca hoy!",
  pronto:  (d) => "En " + d + (d === 1 ? " día" : " días"),
  ok:      (d) => "En " + d + " días",
};

function tarjetaCliente(cliente, conGestion) {
  const d = diasParaRecompra(cliente);
  const estado = estadoCliente(cliente);

  const tarjeta = el("article", "tarjeta-cliente tc-" + estado);

  const fila = el("div", "tc-fila");
  fila.appendChild(el("span", "tc-nombre", cliente.nombre));
  fila.appendChild(el("span", "tc-chip chip-" + estado, TEXTO_CHIP[estado](d)));
  tarjeta.appendChild(fila);

  tarjeta.appendChild(el("p", "tc-producto", "💊 " + cliente.producto));
  tarjeta.appendChild(el("p", "tc-detalle",
    "Cada " + cliente.dias + " días · Última compra: " + fechaBonita(cliente.ultima)));
  if (cliente.notas) tarjeta.appendChild(el("p", "tc-notas", cliente.notas));

  const acciones = el("div", "tc-acciones");

  if (cliente.tel) {
    const wa = el("a", "btn btn-mini btn-whatsapp", "💬 WhatsApp");
    wa.href = enlaceWhatsApp(cliente);
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    acciones.appendChild(wa);
  }

  const compro = el("button", "btn btn-mini btn-compro", "✓ Compró");
  compro.type = "button";
  compro.addEventListener("click", () => registrarCompra(cliente.id));
  acciones.appendChild(compro);

  if (conGestion) {
    const editar = el("button", "btn btn-mini btn-editar", "✏️ Editar");
    editar.type = "button";
    editar.addEventListener("click", () => editarCliente(cliente.id));
    acciones.appendChild(editar);

    const borrar = el("button", "btn btn-mini btn-eliminar", "🗑️");
    borrar.type = "button";
    borrar.setAttribute("aria-label", "Eliminar " + cliente.nombre);
    borrar.addEventListener("click", () => eliminarCliente(cliente.id));
    acciones.appendChild(borrar);
  }

  tarjeta.appendChild(acciones);
  return tarjeta;
}

/* ══════════ Vista: Hoy ══════════ */

function pintarHoy() {
  const vencidas = [], paraHoy = [], proximas = [];
  for (const c of datos.clientes) {
    const estado = estadoCliente(c);
    if (estado === "vencida") vencidas.push(c);
    else if (estado === "hoy") paraHoy.push(c);
    else if (estado === "pronto") proximas.push(c);
  }
  const porUrgencia = (a, b) => diasParaRecompra(a) - diasParaRecompra(b);
  vencidas.sort(porUrgencia); proximas.sort(porUrgencia);

  $("#stat-vencidas").textContent = vencidas.length;
  $("#stat-hoy").textContent = paraHoy.length;
  $("#stat-proximas").textContent = proximas.length;
  $("#stat-clientes").textContent = datos.clientes.length;

  const cont = $("#hoy-listas");
  cont.replaceChildren();

  const grupos = [
    ["🔴 Vencidas", vencidas],
    ["🟡 Para hoy", paraHoy],
    ["🔵 Próximos 3 días", proximas],
  ];

  let hayAlgo = false;
  for (const [titulo, lista] of grupos) {
    if (!lista.length) continue;
    hayAlgo = true;
    cont.appendChild(el("h2", "grupo-titulo", titulo));
    const caja = el("div", "grupo-tarjetas");
    for (const c of lista) caja.appendChild(tarjetaCliente(c, false));
    cont.appendChild(caja);
  }

  $("#hoy-vacio").classList.toggle("oculto", hayAlgo);
}

/* ══════════ Vista: Clientes ══════════ */

function pintarClientes() {
  const filtro = $("#busqueda").value.trim().toLowerCase();
  const lista = $("#clientes-lista");
  lista.replaceChildren();

  const visibles = datos.clientes
    .filter((c) => {
      if (!filtro) return true;
      return (c.nombre + " " + c.producto + " " + (c.tel || ""))
        .toLowerCase().includes(filtro);
    })
    .sort((a, b) => diasParaRecompra(a) - diasParaRecompra(b));

  for (const c of visibles) lista.appendChild(tarjetaCliente(c, true));

  $("#clientes-vacio").classList.toggle(
    "oculto", datos.clientes.length > 0);
  if (datos.clientes.length && !visibles.length) {
    lista.appendChild(el("p", "ayuda", "Sin resultados para «" + filtro + "»."));
  }
}

function pintarTodo() { pintarHoy(); pintarClientes(); }

/* ══════════ Formulario ══════════ */

function marcarChipFrecuencia(dias) {
  document.querySelectorAll("#frecuencias .chip").forEach((ch) => {
    ch.classList.toggle("chip-activo", Number(ch.dataset.dias) === Number(dias));
  });
}

function limpiarFormulario() {
  $("#form-cliente").reset();
  $("#f-id").value = "";
  $("#f-dias").value = 30;
  $("#f-ultima").value = hoyISO();
  marcarChipFrecuencia(30);
  $("#form-titulo").textContent = "Nuevo cliente";
  $("#btn-guardar").textContent = "Guardar cliente";
  $("#btn-cancelar").classList.add("oculto");
}

function prepararFormulario() {
  $("#f-ultima").value = hoyISO();

  $("#frecuencias").addEventListener("click", (ev) => {
    const chip = ev.target.closest(".chip");
    if (!chip) return;
    $("#f-dias").value = chip.dataset.dias;
    marcarChipFrecuencia(chip.dataset.dias);
  });

  $("#f-dias").addEventListener("input", () => {
    marcarChipFrecuencia($("#f-dias").value);
  });

  $("#btn-cancelar").addEventListener("click", () => {
    limpiarFormulario();
    mostrarVista("clientes");
  });

  $("#form-cliente").addEventListener("submit", (ev) => {
    ev.preventDefault();

    const dias = Math.max(1, Math.min(365, Number($("#f-dias").value) || 30));
    const registro = {
      nombre: $("#f-nombre").value.trim(),
      tel: $("#f-tel").value.trim(),
      producto: $("#f-producto").value.trim(),
      dias,
      ultima: $("#f-ultima").value || hoyISO(),
      notas: $("#f-notas").value.trim(),
    };
    if (!registro.nombre || !registro.producto) {
      avisar("⚠️ Nombre y producto son obligatorios");
      return;
    }

    const id = $("#f-id").value;
    if (id) {
      const c = datos.clientes.find((x) => x.id === id);
      if (c) Object.assign(c, registro);
      avisar("✅ Cliente actualizado");
    } else {
      datos.clientes.push({
        id: (crypto.randomUUID ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2)),
        historial: [],
        ...registro,
      });
      avisar("✅ Cliente guardado");
    }

    guardarDatos();
    limpiarFormulario();
    pintarTodo();
    mostrarVista("hoy");
  });
}

/* ══════════ Ajustes ══════════ */

function prepararAjustes() {
  $("#plantilla").value = datos.plantilla;

  $("#btn-plantilla").addEventListener("click", () => {
    datos.plantilla = $("#plantilla").value.trim() || PLANTILLA_DEFECTO;
    $("#plantilla").value = datos.plantilla;
    guardarDatos();
    avisar("✅ Mensaje guardado");
  });

  $("#btn-exportar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(datos, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "botifarma-recompra-copia-" + hoyISO() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    avisar("💾 Copia exportada");
  });

  $("#btn-importar").addEventListener("click", () => $("#archivo-importar").click());

  $("#archivo-importar").addEventListener("change", (ev) => {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const d = JSON.parse(lector.result);
        if (!d || !Array.isArray(d.clientes)) throw new Error("formato");
        if (!confirm("Importar " + d.clientes.length +
          " cliente(s). Esto reemplaza los datos actuales. ¿Continuar?")) return;
        datos = d;
        if (typeof datos.plantilla !== "string" || !datos.plantilla.trim()) {
          datos.plantilla = PLANTILLA_DEFECTO;
        }
        guardarDatos();
        $("#plantilla").value = datos.plantilla;
        pintarTodo();
        avisar("✅ Copia importada");
      } catch (e) {
        avisar("⚠️ El archivo no es una copia válida de BotiFarma");
      }
    };
    lector.readAsText(archivo);
    ev.target.value = "";
  });

  $("#btn-borrar-todo").addEventListener("click", () => {
    if (!confirm("⚠️ Se borrarán TODOS los clientes de este dispositivo. " +
      "Esta acción no se puede deshacer. ¿Está seguro?")) return;
    if (!confirm("Última confirmación: ¿borrar todo definitivamente?")) return;
    datos = { clientes: [], plantilla: PLANTILLA_DEFECTO };
    guardarDatos();
    $("#plantilla").value = datos.plantilla;
    pintarTodo();
    avisar("🗑️ Datos borrados");
  });
}

/* ══════════ Navegación ══════════ */

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach((v) =>
    v.classList.toggle("vista-visible", v.id === "vista-" + nombre));
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.classList.toggle("nav-activo", b.dataset.vista === nombre));
  window.scrollTo({ top: 0 });
}

function prepararNavegacion() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.vista === "nuevo" && !$("#f-id").value) limpiarFormulario();
      mostrarVista(btn.dataset.vista);
    });
  });
}

/* ══════════ Instalación PWA ══════════ */

let eventoInstalar = null;

function prepararInstalacion() {
  window.addEventListener("beforeinstallprompt", (ev) => {
    ev.preventDefault();
    eventoInstalar = ev;
    $("#btn-instalar").classList.remove("oculto");
  });

  $("#btn-instalar").addEventListener("click", async () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    await eventoInstalar.userChoice;
    eventoInstalar = null;
    $("#btn-instalar").classList.add("oculto");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* sin https */ });
    });
  }
}

/* ══════════ Arranque ══════════ */

document.addEventListener("DOMContentLoaded", () => {
  prepararNavegacion();
  prepararFormulario();
  prepararAjustes();
  prepararInstalacion();
  $("#busqueda").addEventListener("input", pintarClientes);
  pintarTodo();

  // Repintar al volver a la app (por si cambió el día)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pintarTodo();
  });
});
