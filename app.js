/* ============================================================
   La Biblioteca — Reservas
   © Juan Carlos Pérez Arthur. Todos los derechos reservados.
   App 100% del lado del cliente. Sin servidores, sin telemetria.
   Los datos se cifran en el dispositivo (AES-256-GCM / Web Crypto).
   ============================================================ */
"use strict";

/* ---------------- Constantes ---------------- */
const APP_VERSION = "1.0.0";
const META_KEY  = "lb.meta.v1";
const VAULT_KEY = "lb.vault.v1";
const KDF_ITERS = 250000;
const IDLE_LOCK_MS = 5 * 60 * 1000; // auto-bloqueo por inactividad

const ZONES = [
  { id: "salon",   es: "Salón Principal", en: "Main Floor",      ds: { es: "Planta principal", en: "Open floor" } },
  { id: "estudio", es: "El Estudio",       en: "The Study",       ds: { es: "VIP · botella",     en: "VIP · bottle" } },
  { id: "boveda",  es: "La Bóveda",        en: "The Vault",       ds: { es: "Premium",           en: "Premium" } },
  { id: "lectura", es: "Sala de Lectura",  en: "Reading Room",    ds: { es: "Lounge tranquilo",  en: "Quiet lounge" } },
  { id: "barra",   es: "La Barra",         en: "The Bar",         ds: { es: "En la barra",       en: "At the bar" } },
  { id: "terraza", es: "Terraza",          en: "Terrace",         ds: { es: "Al aire libre",     en: "Outdoor" } },
];
const zoneName = (id) => { const z = ZONES.find(z => z.id === id); return z ? z[state.lang] : (id || ""); };

const STATUSES = ["pending", "confirmed", "seated", "cancelled"];

/* ---------------- i18n ---------------- */
const I18N = {
  es: {
    brandSub: "Reservas",
    house: "La Biblioteca",
    // gate
    welcome: "La Biblioteca",
    onboardSub: "Crea tu clave de seguridad. Con ella se cifran todas las reservas en este dispositivo.",
    setKey: "Clave de seguridad",
    setKeyPh: "Crea una clave (mín. 6 caracteres)",
    confirmKey: "Confirma la clave",
    confirmKeyPh: "Repite la clave",
    createVault: "Crear y entrar",
    lockedSub: "Introduce tu clave para abrir las reservas.",
    keyPh: "Tu clave de seguridad",
    unlock: "Abrir",
    forgot: "Si olvidas la clave no hay forma de recuperar los datos. Eso es lo que mantiene la información protegida.",
    encNote: "Cifrado de extremo a extremo en tu dispositivo",
    errShort: "La clave debe tener al menos 6 caracteres.",
    errMatch: "Las claves no coinciden.",
    errWrong: "Clave incorrecta.",
    insecureTitle: "Conexión no segura",
    insecureBody: "Para cifrar los datos, abre la app con HTTPS o desde localhost. Al publicarla en internet (Cloudflare Pages, Netlify, etc.) funciona automáticamente.",
    // nav
    navToday: "Hoy", navAll: "Reservas", navNew: "Nueva", navSettings: "Ajustes",
    // today
    todayEyebrow: "Esta noche", todayTitle: "Hoy",
    stReservas: "Reservas", stInvitados: "Invitados", stConfirm: "Confirm.",
    emptyTodayT: "Sin reservas para hoy", emptyTodayD: "Toca el botón + para registrar la primera.",
    // all
    allEyebrow: "Libro de reservas", allTitle: "Reservas",
    searchPh: "Buscar por nombre o teléfono…",
    fAll: "Todas", fToday: "Hoy", fUpcoming: "Próximas",
    emptyAllT: "Aún no hay reservas", emptyAllD: "Las reservas que registres aparecerán aquí.",
    emptySearchT: "Sin resultados", emptySearchD: "Prueba con otro nombre o teléfono.",
    // form
    newEyebrow: "Nueva reserva", newTitle: "Registrar reserva",
    editEyebrow: "Editar", editTitle: "Editar reserva",
    fName: "Nombre del cliente", fNamePh: "Ej. Carlos M.",
    fPhone: "Teléfono", fPhonePh: "Ej. 809 000 0000",
    fGuests: "Personas", fDate: "Fecha", fTime: "Hora",
    fZone: "Zona", fNotes: "Notas", fNotesPh: "Cumpleaños, alergias, mesa preferida…",
    save: "Guardar reserva", saveEdit: "Guardar cambios", cancel: "Cancelar",
    reqName: "Escribe el nombre.", reqPhone: "Escribe el teléfono.",
    reqDate: "Elige una fecha válida (hoy o después).", reqTime: "Elige la hora.", reqZone: "Elige una zona.",
    // confirm sheet
    confTitle: "Reserva registrada", confSub: "Guardada y cifrada en este dispositivo.",
    done: "Listo", share: "Compartir", whatsapp: "WhatsApp", copy: "Copiar",
    copied: "Copiado al portapapeles",
    // detail
    detailTitle: "Reserva", status: "Estado", changeStatus: "Cambiar estado",
    edit: "Editar", del: "Eliminar", delConfirm: "¿Eliminar esta reserva? No se puede deshacer.",
    deleted: "Reserva eliminada", saved: "Cambios guardados", created: "Reserva creada",
    statusChanged: "Estado actualizado",
    // statuses
    s_pending: "Pendiente", s_confirmed: "Confirmada", s_seated: "Llegó", s_cancelled: "Cancelada",
    // settings
    setEyebrow: "Ajustes", setTitle: "Ajustes",
    secLang: "Idioma", secApp: "Aplicación", secSecurity: "Seguridad", secData: "Datos", secAbout: "Acerca de",
    install: "Instalar app", installD: "Añadir al inicio de tu teléfono o PC",
    installed: "App instalada ✓", installedD: "Ya está en tu dispositivo",
    iosInstall: "Instalar en iPhone / iPad", iosStep1: "Toca el botón Compartir", iosStep2: "Elige “Añadir a inicio”", iosStep3: "Confirma con “Añadir”",
    androidInstall: "Instalar en Android / PC", androidBody: "Si no aparece el botón automático, usa el menú del navegador (⋮) → “Instalar app” o “Añadir a pantalla de inicio”.",
    changeKey: "Cambiar clave de seguridad", changeKeyD: "Actualiza tu clave de cifrado",
    lockNow: "Bloquear ahora", lockNowD: "Cierra la sesión y pide la clave",
    backupExport: "Exportar copia cifrada", backupExportD: "Archivo .json seguro (necesita tu clave)",
    backupImport: "Importar copia cifrada", backupImportD: "Restaura desde un archivo de copia",
    csvExport: "Exportar lista (CSV)", csvExportD: "Sin cifrar — para uso operativo del día",
    wipe: "Borrar todos los datos", wipeD: "Elimina todo de este dispositivo",
    wipeConfirm1: "Esto borra TODAS las reservas de este dispositivo. ¿Continuar?",
    wipeConfirm2: "Última confirmación. ¿Borrar todo definitivamente?",
    wiped: "Todos los datos fueron borrados",
    curKey: "Clave actual", newKey: "Nueva clave", confNewKey: "Confirma la nueva clave",
    update: "Actualizar clave", keyUpdated: "Clave actualizada",
    rights: "Todos los derechos reservados.",
    privacyLine: "Tus datos no salen de este dispositivo. Sin servidores, sin rastreo, sin terceros.",
    // misc
    csvHeaders: ["Codigo", "Nombre", "Telefono", "Personas", "Fecha", "Hora", "Zona", "Estado", "Notas"],
    waMsg: (r) => `*La Biblioteca — Reserva*\n\nCódigo: ${r.code}\nNombre: ${r.name}\nPersonas: ${r.guests}\nFecha: ${fmtDate(r.date)}\nHora: ${fmtTime(r.time)}\nZona: ${zoneName(r.zone)}${r.notes ? `\nNotas: ${r.notes}` : ""}`,
    guestsWord: "personas", at: "en",
  },
  en: {
    brandSub: "Reservations",
    house: "La Biblioteca",
    welcome: "La Biblioteca",
    onboardSub: "Create your security key. It encrypts every reservation stored on this device.",
    setKey: "Security key",
    setKeyPh: "Create a key (min. 6 characters)",
    confirmKey: "Confirm key",
    confirmKeyPh: "Repeat the key",
    createVault: "Create & enter",
    lockedSub: "Enter your key to open your reservations.",
    keyPh: "Your security key",
    unlock: "Open",
    forgot: "If you forget the key there is no way to recover the data. That is exactly what keeps it protected.",
    encNote: "End-to-end encrypted on your device",
    errShort: "The key must be at least 6 characters.",
    errMatch: "The keys don't match.",
    errWrong: "Wrong key.",
    insecureTitle: "Insecure connection",
    insecureBody: "To encrypt data, open the app over HTTPS or from localhost. Once published online (Cloudflare Pages, Netlify, etc.) it works automatically.",
    navToday: "Today", navAll: "Bookings", navNew: "New", navSettings: "Settings",
    todayEyebrow: "Tonight", todayTitle: "Today",
    stReservas: "Bookings", stInvitados: "Guests", stConfirm: "Confirm.",
    emptyTodayT: "No bookings for today", emptyTodayD: "Tap the + button to add the first one.",
    allEyebrow: "Reservation book", allTitle: "Bookings",
    searchPh: "Search by name or phone…",
    fAll: "All", fToday: "Today", fUpcoming: "Upcoming",
    emptyAllT: "No bookings yet", emptyAllD: "Bookings you add will show up here.",
    emptySearchT: "No results", emptySearchD: "Try a different name or phone.",
    newEyebrow: "New booking", newTitle: "Add a booking",
    editEyebrow: "Edit", editTitle: "Edit booking",
    fName: "Guest name", fNamePh: "e.g. Carlos M.",
    fPhone: "Phone", fPhonePh: "e.g. 809 000 0000",
    fGuests: "Guests", fDate: "Date", fTime: "Time",
    fZone: "Area", fNotes: "Notes", fNotesPh: "Birthday, allergies, preferred table…",
    save: "Save booking", saveEdit: "Save changes", cancel: "Cancel",
    reqName: "Enter the name.", reqPhone: "Enter the phone.",
    reqDate: "Pick a valid date (today or later).", reqTime: "Pick the time.", reqZone: "Pick an area.",
    confTitle: "Booking saved", confSub: "Stored and encrypted on this device.",
    done: "Done", share: "Share", whatsapp: "WhatsApp", copy: "Copy",
    copied: "Copied to clipboard",
    detailTitle: "Booking", status: "Status", changeStatus: "Change status",
    edit: "Edit", del: "Delete", delConfirm: "Delete this booking? This can't be undone.",
    deleted: "Booking deleted", saved: "Changes saved", created: "Booking created",
    statusChanged: "Status updated",
    s_pending: "Pending", s_confirmed: "Confirmed", s_seated: "Arrived", s_cancelled: "Cancelled",
    setEyebrow: "Settings", setTitle: "Settings",
    secLang: "Language", secApp: "Application", secSecurity: "Security", secData: "Data", secAbout: "About",
    install: "Install app", installD: "Add to your phone or PC home screen",
    installed: "App installed ✓", installedD: "Already on your device",
    iosInstall: "Install on iPhone / iPad", iosStep1: "Tap the Share button", iosStep2: "Choose “Add to Home Screen”", iosStep3: "Confirm with “Add”",
    androidInstall: "Install on Android / PC", androidBody: "If the automatic button doesn't appear, use the browser menu (⋮) → “Install app” or “Add to Home screen”.",
    changeKey: "Change security key", changeKeyD: "Update your encryption key",
    lockNow: "Lock now", lockNowD: "Sign out and require the key",
    backupExport: "Export encrypted backup", backupExportD: "Secure .json file (needs your key)",
    backupImport: "Import encrypted backup", backupImportD: "Restore from a backup file",
    csvExport: "Export list (CSV)", csvExportD: "Unencrypted — for daily operations",
    wipe: "Erase all data", wipeD: "Remove everything from this device",
    wipeConfirm1: "This erases ALL bookings on this device. Continue?",
    wipeConfirm2: "Final confirmation. Erase everything permanently?",
    wiped: "All data erased",
    curKey: "Current key", newKey: "New key", confNewKey: "Confirm new key",
    update: "Update key", keyUpdated: "Key updated",
    rights: "All rights reserved.",
    privacyLine: "Your data never leaves this device. No servers, no tracking, no third parties.",
    csvHeaders: ["Code", "Name", "Phone", "Guests", "Date", "Time", "Area", "Status", "Notes"],
    waMsg: (r) => `*La Biblioteca — Booking*\n\nCode: ${r.code}\nName: ${r.name}\nGuests: ${r.guests}\nDate: ${fmtDate(r.date)}\nTime: ${fmtTime(r.time)}\nArea: ${zoneName(r.zone)}${r.notes ? `\nNotes: ${r.notes}` : ""}`,
    guestsWord: "guests", at: "at",
  },
};
const t = (k) => { const v = I18N[state.lang][k]; return v === undefined ? k : v; };

/* ---------------- Estado ---------------- */
const state = {
  lang: "es",
  key: null,        // CryptoKey en memoria, nunca se guarda
  meta: null,       // { v, salt, iters, lang }
  vault: null,      // { reservations:[], settings:{}, createdAt }
  view: "today",
  filter: "all",
  search: "",
  deferredInstall: null,
  idleTimer: null,
};

/* ---------------- Utilidades ---------------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function b64(bytes) { let s = ""; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
function ub64(str) { const bin = atob(str); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
function uid() { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function makeCode(date) {
  const ymd = (date || todayStr()).replace(/-/g, "").slice(2);
  const rnd = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "X0Z";
  return "LB-" + ymd + "-" + rnd;
}
function todayStr() { const d = new Date(); const z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; }
function fmtDate(ymd) {
  if (!ymd) return "";
  const p = ymd.split("-").map(Number);
  const dt = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  return new Intl.DateTimeFormat(state.lang === "es" ? "es-DO" : "en-US", { weekday: "short", day: "numeric", month: "short" }).format(dt);
}
function fmtTime(hm) {
  if (!hm) return "";
  const p = hm.split(":").map(Number);
  const dt = new Date(2000, 0, 1, p[0] || 0, p[1] || 0);
  return new Intl.DateTimeFormat(state.lang === "es" ? "es-DO" : "en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(dt);
}
function isSecure() { return !!(window.crypto && window.crypto.subtle); }

/* localStorage seguro con respaldo en memoria */
const mem = {};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } },
};

/* ---------------- Criptografía (Web Crypto) ---------------- */
async function deriveKey(passphrase, saltBytes, iters) {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: iters, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}
async function encryptJSON(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: b64(iv), ct: b64(ct) };
}
async function decryptJSON(key, ivB64, ctB64) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub64(ivB64) }, key, ub64(ctB64));
  return JSON.parse(new TextDecoder().decode(pt));
}

/* ---------------- Persistencia ---------------- */
function loadMeta() { try { const raw = store.get(META_KEY); state.meta = raw ? JSON.parse(raw) : null; } catch (e) { state.meta = null; } if (state.meta && state.meta.lang) state.lang = state.meta.lang; }
function saveMeta() { store.set(META_KEY, JSON.stringify(state.meta)); }
async function saveVault() {
  if (!state.key || !state.vault) return;
  const enc = await encryptJSON(state.key, state.vault);
  store.set(VAULT_KEY, JSON.stringify(enc));
}

/* ---------------- Mutaciones ---------------- */
async function addReservation(data) {
  const r = {
    id: uid(), code: makeCode(data.date), name: data.name.trim(), phone: data.phone.trim(),
    guests: data.guests, date: data.date, time: data.time, zone: data.zone,
    notes: (data.notes || "").trim(), status: "pending",
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  state.vault.reservations.push(r);
  await saveVault();
  return r;
}
async function updateReservation(id, patch) {
  const r = state.vault.reservations.find(x => x.id === id);
  if (!r) return null;
  Object.assign(r, patch, { updatedAt: Date.now() });
  await saveVault();
  return r;
}
async function deleteReservation(id) {
  state.vault.reservations = state.vault.reservations.filter(x => x.id !== id);
  await saveVault();
}
const getRes = (id) => state.vault.reservations.find(x => x.id === id);

/* ---------------- Iconos SVG ---------------- */
const I = {
  lock: '<path d="M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  today: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 5 13.4H4.8a2 2 0 1 1 0-4H5a1.6 1.6 0 0 0 1.5-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 12 4.2V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.8"/><path d="M16 3.1A4 4 0 0 1 16 11"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  wa: '<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.6 4.7-1.2A10 10 0 1 0 12 2z"/><path d="M8.5 7.8c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4-.1.5l-.5.6c-.1.2-.2.3 0 .6.6 1 1.4 1.6 2.3 2 .3.2.5.1.6 0l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 1-.7 1.8-1.6 1.9-.9.1-1.6 0-3.6-1.2-2.3-1.5-3.6-3.9-3.7-4.1-.1-.2-.8-1.2-.8-2.3z" fill="currentColor" stroke="none"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>',
  upload: '<path d="M12 21V9m0 0 4 4m-4-4-4 4M5 3h14"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M16 5l3 3M14 7l2 2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>',
  back: '<path d="M19 12H5m7 7-7-7 7-7"/>',
  apple: '<path d="M16 13c0-2 1.5-3 1.6-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 7.9.6 1 1.4 2 2.4 2s1.3-.6 2.5-.6 1.5.6 2.5.6 1.7-.9 2.3-1.9c.5-.7.7-1.1 1.1-1.9-2.4-.9-2.2-3.8-1.2-4.1z"/><path d="M14 6c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.8 2.6 1 .1 2-.5 2.4-1.2z" fill="currentColor" stroke="none"/>',
};
const icon = (name, cls) => `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name] || ""}</svg>`;

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(msg, kind) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
  el.textContent = msg; el.className = "show " + (kind || "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = el.className.replace("show", "").trim(); }, 2600);
}

/* ---------------- Sheets ---------------- */
function openSheet(inner) {
  closeSheet();
  const scrim = document.createElement("div");
  scrim.className = "scrim"; scrim.id = "scrim";
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${inner}</div>`;
  document.body.appendChild(scrim);
  scrim.addEventListener("click", (e) => { if (e.target === scrim) closeSheet(); });
}
function closeSheet() { const s = document.getElementById("scrim"); if (s) s.remove(); }

/* ============================================================
   RENDER
   ============================================================ */
function gateMode() {
  if (!isSecure()) return "insecure";
  if (!state.meta) return "onboard";
  if (!state.key) return "locked";
  return null;
}

function render() {
  const app = document.getElementById("app");
  const gm = gateMode();
  if (gm) { app.innerHTML = renderGate(gm); bindGate(gm); return; }
  app.innerHTML = shell(viewContent());
  bindShell();
  bindView();
  resetIdle();
}

/* ---------- Gate ---------- */
function langToggleHTML() {
  return `<div class="seg mb-28">
    <button data-action="lang" data-lang="es" class="${state.lang === "es" ? "active" : ""}">ES</button>
    <button data-action="lang" data-lang="en" class="${state.lang === "en" ? "active" : ""}">EN</button>
  </div>`;
}
function renderGate(mode) {
  if (mode === "insecure") {
    return `<div class="gate">
      <div class="gate-mark">${icon("shield")}</div>
      <h1>${esc(t("insecureTitle"))}</h1>
      <p class="gate-sub">${esc(t("insecureBody"))}</p>
      ${langToggleHTML()}
    </div>`;
  }
  if (mode === "onboard") {
    return `<div class="gate">
      ${langToggleHTML()}
      <div class="gate-mark">LB</div>
      <h1>${esc(t("welcome"))}</h1>
      <p class="gate-sub">${esc(t("onboardSub"))}</p>
      <div class="gate-form">
        <div class="field"><input id="k1" class="pin" type="password" inputmode="text" autocomplete="new-password" placeholder="${esc(t("setKeyPh"))}"></div>
        <div class="field"><input id="k2" class="pin" type="password" autocomplete="new-password" placeholder="${esc(t("confirmKeyPh"))}"></div>
        <div class="gate-err" id="gerr"></div>
        <button class="btn btn-primary" data-action="create">${esc(t("createVault"))}</button>
        <p class="gate-note">${esc(t("forgot"))}</p>
        <div class="gate-shield">${icon("shield")} ${esc(t("encNote"))}</div>
      </div>
    </div>`;
  }
  // locked
  return `<div class="gate">
    ${langToggleHTML()}
    <div class="gate-mark">LB</div>
    <h1>${esc(t("welcome"))}</h1>
    <p class="gate-sub">${esc(t("lockedSub"))}</p>
    <div class="gate-form">
      <div class="field"><input id="k1" class="pin" type="password" autocomplete="current-password" placeholder="${esc(t("keyPh"))}"></div>
      <div class="gate-err" id="gerr"></div>
      <button class="btn btn-primary" data-action="unlock">${esc(t("unlock"))}</button>
      <div class="gate-shield">${icon("shield")} ${esc(t("encNote"))}</div>
    </div>
  </div>`;
}

function bindGate(mode) {
  const k1 = document.getElementById("k1");
  if (k1) { k1.focus(); k1.addEventListener("keydown", (e) => { if (e.key === "Enter") { if (mode === "onboard") { const k2 = document.getElementById("k2"); if (k2 && document.activeElement === k1) { k2.focus(); return; } doCreate(); } else doUnlock(); } }); }
  const k2 = document.getElementById("k2");
  if (k2) k2.addEventListener("keydown", (e) => { if (e.key === "Enter") doCreate(); });
}

async function doCreate() {
  const e = document.getElementById("gerr");
  const k1 = document.getElementById("k1").value;
  const k2 = document.getElementById("k2").value;
  if (k1.length < 6) { e.textContent = t("errShort"); return; }
  if (k1 !== k2) { e.textContent = t("errMatch"); return; }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  state.meta = { v: 1, salt: b64(salt), iters: KDF_ITERS, lang: state.lang };
  state.key = await deriveKey(k1, salt, KDF_ITERS);
  state.vault = { reservations: [], settings: {}, createdAt: Date.now() };
  saveMeta();
  await saveVault();
  state.view = "today";
  render();
}

async function doUnlock() {
  const e = document.getElementById("gerr");
  const k1 = document.getElementById("k1").value;
  if (!k1) return;
  try {
    const salt = ub64(state.meta.salt);
    const key = await deriveKey(k1, salt, state.meta.iters || KDF_ITERS);
    const raw = store.get(VAULT_KEY);
    if (!raw) { state.key = key; state.vault = { reservations: [], settings: {}, createdAt: Date.now() }; await saveVault(); render(); return; }
    const enc = JSON.parse(raw);
    const data = await decryptJSON(key, enc.iv, enc.ct); // lanza si la clave es incorrecta
    state.key = key; state.vault = data;
    if (!Array.isArray(state.vault.reservations)) state.vault.reservations = [];
    state.view = "today";
    render();
  } catch (err) {
    e.textContent = t("errWrong");
    const i = document.getElementById("k1"); if (i) { i.value = ""; i.focus(); }
  }
}

function lock() { state.key = null; state.vault = null; clearTimeout(state.idleTimer); render(); }

/* ---------- Shell ---------- */
function shell(content) {
  const tabs = [
    { id: "today", icon: "today", label: t("navToday") },
    { id: "all", icon: "list", label: t("navAll") },
    { id: "__new", icon: "plus", label: t("navNew"), fab: true },
    { id: "settings", icon: "settings", label: t("navSettings") },
  ];
  const tabHTML = tabs.map(tb => {
    if (tb.fab) return `<button class="tab fab" data-action="nav" data-view="form"><div class="fab-ic">${icon("plus")}</div><span>${esc(tb.label)}</span></button>`;
    const active = state.view === tb.id ? "active" : "";
    return `<button class="tab ${active}" data-action="nav" data-view="${tb.id}">${icon(tb.icon)}<span>${esc(tb.label)}</span></button>`;
  }).join("");

  return `
  <div class="screen">
    <header class="appbar"><div class="wrap appbar-in">
      <div class="brandmark">LB</div>
      <div><div class="brand-title">${esc(t("house"))}</div><div class="brand-sub">${esc(t("brandSub"))}</div></div>
      <div class="appbar-spacer"></div>
      <button class="icon-btn" data-action="lock" title="${esc(t("lockNow"))}">${icon("lock")}</button>
    </div></header>
    <main><div class="wrap">${content}</div></main>
    <nav class="tabbar"><div class="tabbar-in">${tabHTML}</div></nav>
  </div>`;
}

function bindShell() {
  // delegación global ya cubre data-action; aquí solo idle resets via interacción
}

/* ---------- Views ---------- */
function viewContent() {
  switch (state.view) {
    case "today": return viewToday();
    case "all": return viewAll();
    case "form": return viewForm();
    case "settings": return viewSettings();
    default: return viewToday();
  }
}

function reservationCard(r) {
  const stLabel = t("s_" + r.status);
  return `<button class="rcard" data-st="${r.status}" data-action="open" data-id="${r.id}">
    <div class="rtime">${esc(fmtTime(r.time))}</div>
    <div class="rbody">
      <div class="rname">${esc(r.name)}</div>
      <div class="rmeta">
        <span>${icon("users")} ${esc(r.guests)}</span>
        <span>${esc(zoneName(r.zone))}</span>
      </div>
    </div>
    <span class="badge ${r.status}">${esc(stLabel)}</span>
  </button>`;
}

function emptyState(ic, title, desc) {
  return `<div class="empty"><div class="glyph">${icon(ic)}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`;
}

function viewToday() {
  const today = todayStr();
  const list = state.vault.reservations
    .filter(r => r.date === today)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const active = list.filter(r => r.status !== "cancelled");
  const guests = active.reduce((s, r) => s + (Number(r.guests) || 0), 0);
  const confirmed = active.filter(r => r.status === "confirmed" || r.status === "seated").length;

  const body = list.length
    ? `<div class="rlist">${list.map(reservationCard).join("")}</div>`
    : emptyState("today", t("emptyTodayT"), t("emptyTodayD"));

  return `
    <div class="view-head">
      <div class="eyebrow">${esc(t("todayEyebrow"))}</div>
      <h1 class="view-title">${esc(t("todayTitle"))}</h1>
      <div class="view-sub">${esc(fmtDate(today))}</div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-n">${active.length}</div><div class="stat-l">${esc(t("stReservas"))}</div></div>
      <div class="stat"><div class="stat-n">${guests}</div><div class="stat-l">${esc(t("stInvitados"))}</div></div>
      <div class="stat"><div class="stat-n">${confirmed}</div><div class="stat-l">${esc(t("stConfirm"))}</div></div>
    </div>
    ${body}`;
}

function filterReservations() {
  let list = state.vault.reservations.slice();
  const today = todayStr();
  if (state.filter === "today") list = list.filter(r => r.date === today);
  else if (state.filter === "upcoming") list = list.filter(r => r.date >= today && r.status !== "cancelled");
  const q = state.search.trim().toLowerCase();
  if (q) list = list.filter(r => (r.name || "").toLowerCase().includes(q) || (r.phone || "").toLowerCase().includes(q) || (r.code || "").toLowerCase().includes(q));
  list.sort((a, b) => (b.date + (b.time || "")).localeCompare(a.date + (a.time || "")));
  return list;
}

function viewAll() {
  const chips = [
    { id: "all", label: t("fAll") }, { id: "today", label: t("fToday") }, { id: "upcoming", label: t("fUpcoming") },
  ].map(c => `<button class="chip ${state.filter === c.id ? "active" : ""}" data-action="filter" data-filter="${c.id}">${esc(c.label)}</button>`).join("");

  return `
    <div class="view-head">
      <div class="eyebrow">${esc(t("allEyebrow"))}</div>
      <h1 class="view-title">${esc(t("allTitle"))}</h1>
    </div>
    <div class="toolbar">
      <div class="search">${icon("search")}<input id="q" type="search" placeholder="${esc(t("searchPh"))}" value="${esc(state.search)}" autocomplete="off"></div>
      <div class="chips">${chips}</div>
    </div>
    <div id="rlist" class="rlist"></div>`;
}

function renderRList() {
  const box = document.getElementById("rlist");
  if (!box) return;
  const list = filterReservations();
  if (!list.length) {
    box.innerHTML = state.search.trim()
      ? emptyState("search", t("emptySearchT"), t("emptySearchD"))
      : emptyState("book", t("emptyAllT"), t("emptyAllD"));
    return;
  }
  box.innerHTML = list.map(reservationCard).join("");
}

/* ---------- Formulario nueva / editar ---------- */
function viewForm(prefill) {
  const r = state._editId ? getRes(state._editId) : null;
  const d = r || prefill || {};
  const guests = d.guests || 2;
  const date = d.date || todayStr();
  const time = d.time || "21:00";
  const selZone = d.zone || "salon";

  const zonesHTML = ZONES.map(z => `
    <button type="button" class="zone ${selZone === z.id ? "active" : ""}" data-action="zone" data-zone="${z.id}">
      <div class="zn">${esc(z[state.lang])}</div><div class="zc">${esc(z.ds[state.lang])}</div>
    </button>`).join("");

  return `
    <div class="view-head">
      <div class="eyebrow">${esc(r ? t("editEyebrow") : t("newEyebrow"))}</div>
      <h1 class="view-title">${esc(r ? t("editTitle") : t("newTitle"))}</h1>
    </div>
    <form id="resForm" novalidate>
      <input type="hidden" id="f_zone" value="${esc(selZone)}">
      <div class="field" id="wrap_name">
        <label>${esc(t("fName"))} <span class="req">*</span></label>
        <input id="f_name" class="control" type="text" placeholder="${esc(t("fNamePh"))}" value="${esc(d.name || "")}" autocomplete="off" maxlength="80">
        <div class="field-error">${esc(t("reqName"))}</div>
      </div>
      <div class="field" id="wrap_phone">
        <label>${esc(t("fPhone"))} <span class="req">*</span></label>
        <input id="f_phone" class="control" type="tel" inputmode="tel" placeholder="${esc(t("fPhonePh"))}" value="${esc(d.phone || "")}" autocomplete="off" maxlength="40">
        <div class="field-error">${esc(t("reqPhone"))}</div>
      </div>
      <div class="field">
        <label>${esc(t("fGuests"))} <span class="req">*</span></label>
        <div class="stepper">
          <button type="button" data-action="guests" data-d="-1">−</button>
          <input id="f_guests" class="mono" type="number" min="1" max="50" value="${esc(guests)}" inputmode="numeric">
          <button type="button" data-action="guests" data-d="1">+</button>
        </div>
      </div>
      <div class="grid-2">
        <div class="field" id="wrap_date">
          <label>${esc(t("fDate"))} <span class="req">*</span></label>
          <input id="f_date" class="control" type="date" value="${esc(date)}" min="${esc(todayStr())}">
          <div class="field-error">${esc(t("reqDate"))}</div>
        </div>
        <div class="field" id="wrap_time">
          <label>${esc(t("fTime"))} <span class="req">*</span></label>
          <input id="f_time" class="control" type="time" value="${esc(time)}">
          <div class="field-error">${esc(t("reqTime"))}</div>
        </div>
      </div>
      <div class="field">
        <label>${esc(t("fZone"))}</label>
        <div class="zones" id="zonesBox">${zonesHTML}</div>
      </div>
      <div class="field">
        <label>${esc(t("fNotes"))}</label>
        <textarea id="f_notes" class="control" placeholder="${esc(t("fNotesPh"))}" maxlength="400">${esc(d.notes || "")}</textarea>
      </div>
      <div class="btn-row mt-6">
        <button type="button" class="btn btn-ghost" data-action="cancelForm">${esc(t("cancel"))}</button>
        <button type="button" class="btn btn-primary" data-action="submitForm">${esc(r ? t("saveEdit") : t("save"))}</button>
      </div>
    </form>`;
}

function clearFieldError(id) { const w = document.getElementById(id); if (w) w.classList.remove("invalid"); }
function setFieldError(id) { const w = document.getElementById(id); if (w) { w.classList.add("invalid"); return w; } }

async function submitForm() {
  const name = document.getElementById("f_name").value.trim();
  const phone = document.getElementById("f_phone").value.trim();
  let guests = parseInt(document.getElementById("f_guests").value, 10);
  const date = document.getElementById("f_date").value;
  const time = document.getElementById("f_time").value;
  const zone = document.getElementById("f_zone").value;
  const notes = document.getElementById("f_notes").value;

  ["wrap_name", "wrap_phone", "wrap_date", "wrap_time"].forEach(clearFieldError);
  let firstErr = null;
  if (!name) firstErr = firstErr || setFieldError("wrap_name");
  if (!phone) firstErr = firstErr || setFieldError("wrap_phone");
  if (!date || date < todayStr()) firstErr = firstErr || setFieldError("wrap_date");
  if (!time) firstErr = firstErr || setFieldError("wrap_time");
  if (firstErr) { firstErr.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if (!guests || guests < 1) guests = 1; if (guests > 50) guests = 50;

  if (state._editId) {
    const r = await updateReservation(state._editId, { name, phone, guests, date, time, zone, notes });
    state._editId = null;
    state.view = "all"; render();
    toast(t("saved"), "ok");
    if (r) setTimeout(() => openDetail(r.id), 60);
  } else {
    const r = await addReservation({ name, phone, guests, date, time, zone, notes });
    state.view = "today"; render();
    openConfirm(r);
  }
}

/* ---------- Library card ---------- */
function libCardHTML(r) {
  return `<div class="libcard">
    <div class="lc-top">
      <div class="lc-house">${esc(t("house"))}<small>${esc(t("brandSub"))}</small></div>
      <div class="lc-code">${esc(r.code)}</div>
    </div>
    <div class="lc-name">${esc(r.name)}</div>
    <div class="lc-rows">
      <div><span class="k">${esc(t("fDate"))}</span><span class="v">${esc(fmtDate(r.date))}</span></div>
      <div><span class="k">${esc(t("fTime"))}</span><span class="v">${esc(fmtTime(r.time))}</span></div>
      <div><span class="k">${esc(t("fGuests"))}</span><span class="v">${esc(r.guests)} ${esc(t("guestsWord"))}</span></div>
      <div><span class="k">${esc(t("fZone"))}</span><span class="v">${esc(zoneName(r.zone))}</span></div>
      <div><span class="k">${esc(t("fPhone"))}</span><span class="v">${esc(r.phone)}</span></div>
    </div>
    ${r.notes ? `<div class="lc-notes">“${esc(r.notes)}”</div>` : ""}
    <div class="lc-stamp">${esc(t("s_" + r.status))}</div>
  </div>`;
}

function openConfirm(r) {
  openSheet(`
    <h3>${esc(t("confTitle"))}</h3>
    <p class="sub">${esc(t("confSub"))}</p>
    ${libCardHTML(r)}
    <div class="btn-row mt-18">
      <button class="btn btn-ghost" data-action="wa" data-id="${r.id}">${icon("wa")} ${esc(t("whatsapp"))}</button>
      <button class="btn btn-ghost" data-action="copy" data-id="${r.id}">${icon("copy")} ${esc(t("copy"))}</button>
    </div>
    <button class="btn btn-primary mt-10" data-action="closeSheet">${esc(t("done"))}</button>
  `);
}

function openDetail(id) {
  const r = getRes(id);
  if (!r) return;
  const statusPick = STATUSES.map(s => `
    <button class="spick ${r.status === s ? "active" : ""}" data-action="setStatus" data-id="${r.id}" data-s="${s}">
      ${s === "cancelled" ? icon("x") : icon("check")} ${esc(t("s_" + s))}
    </button>`).join("");

  openSheet(`
    ${libCardHTML(r)}
    <div class="mt-18">
      <label class="pick-label">${esc(t("changeStatus"))}</label>
      <div class="status-pick">${statusPick}</div>
    </div>
    <div class="btn-row mt-14">
      <button class="btn btn-ghost" data-action="wa" data-id="${r.id}">${icon("wa")} ${esc(t("whatsapp"))}</button>
      <button class="btn btn-ghost" data-action="copy" data-id="${r.id}">${icon("copy")} ${esc(t("copy"))}</button>
    </div>
    <div class="btn-row mt-10">
      <button class="btn btn-ghost" data-action="editRes" data-id="${r.id}">${icon("edit")} ${esc(t("edit"))}</button>
      <button class="btn btn-danger" data-action="delRes" data-id="${r.id}">${icon("trash")} ${esc(t("del"))}</button>
    </div>
  `);
}

/* ---------- Compartir ---------- */
function shareText(r) { return I18N[state.lang].waMsg(r); }
async function copyRes(id) {
  const r = getRes(id); if (!r) return;
  const txt = shareText(r);
  try { await navigator.clipboard.writeText(txt); toast(t("copied"), "ok"); }
  catch (e) {
    const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(t("copied"), "ok"); } catch (e2) {}
    ta.remove();
  }
}
function waShare(id) {
  const r = getRes(id); if (!r) return;
  const url = "https://wa.me/?text=" + encodeURIComponent(shareText(r));
  window.open(url, "_blank", "noopener");
}

/* ---------- Settings ---------- */
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function isiOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }

function row(action, ic, title, desc, opts) {
  opts = opts || {};
  const cls = opts.danger ? "row danger" : "row";
  const chev = opts.noChev ? "" : icon("chev", "chev");
  return `<button class="${cls}" data-action="${action}">
    <span class="ric">${icon(ic)}</span>
    <span class="rtxt"><span class="rt">${esc(title)}</span>${desc ? `<span class="rd">${esc(desc)}</span>` : ""}</span>
    ${chev}
  </button>`;
}

function viewSettings() {
  let installRow;
  if (isStandalone()) installRow = `<div class="row"><span class="ric">${icon("check")}</span><span class="rtxt"><span class="rt">${esc(t("installed"))}</span><span class="rd">${esc(t("installedD"))}</span></span></div>`;
  else installRow = row("install", "download", t("install"), t("installD"));

  return `
    <div class="view-head">
      <div class="eyebrow">${esc(t("setEyebrow"))}</div>
      <h1 class="view-title">${esc(t("setTitle"))}</h1>
    </div>

    <div class="section">
      <div class="section-h">${esc(t("secLang"))}</div>
      <div class="row">
        <span class="ric">${icon("globe")}</span>
        <span class="rtxt"><span class="rt">${esc(t("secLang"))}</span></span>
        <span class="seg">
          <button data-action="lang" data-lang="es" class="${state.lang === "es" ? "active" : ""}">ES</button>
          <button data-action="lang" data-lang="en" class="${state.lang === "en" ? "active" : ""}">EN</button>
        </span>
      </div>
    </div>

    <div class="section">
      <div class="section-h">${esc(t("secApp"))}</div>
      ${installRow}
    </div>

    <div class="section">
      <div class="section-h">${esc(t("secSecurity"))}</div>
      ${row("changeKey", "key", t("changeKey"), t("changeKeyD"))}
      ${row("lock", "lock", t("lockNow"), t("lockNowD"))}
    </div>

    <div class="section">
      <div class="section-h">${esc(t("secData"))}</div>
      ${row("exportVault", "download", t("backupExport"), t("backupExportD"))}
      ${row("importVault", "upload", t("backupImport"), t("backupImportD"))}
      ${row("exportCSV", "book", t("csvExport"), t("csvExportD"))}
      ${row("wipe", "trash", t("wipe"), t("wipeD"), { danger: true })}
    </div>

    <div class="section">
      <div class="section-h">${esc(t("secAbout"))}</div>
      <div class="row static">
        <span class="ric">${icon("shield")}</span>
        <span class="rtxt"><span class="rt">${esc(t("privacyLine"))}</span></span>
      </div>
    </div>

    <input type="file" id="importFile" accept="application/json,.json" hidden>
    <div class="foot-note">
      <strong>La Biblioteca — Reservas</strong> · v${APP_VERSION}<br>
      © ${new Date().getFullYear()} Juan Carlos Pérez Arthur. ${esc(t("rights"))}
    </div>`;
}

/* ---------- Cambiar clave ---------- */
function openChangeKey() {
  openSheet(`
    <h3>${esc(t("changeKey"))}</h3>
    <p class="sub">${esc(t("forgot"))}</p>
    <div class="field"><label>${esc(t("curKey"))}</label><input id="ck_cur" class="control" type="password" autocomplete="current-password"></div>
    <div class="field"><label>${esc(t("newKey"))}</label><input id="ck_new" class="control" type="password" autocomplete="new-password"></div>
    <div class="field"><label>${esc(t("confNewKey"))}</label><input id="ck_cf" class="control" type="password" autocomplete="new-password"></div>
    <div class="gate-err" id="ckerr"></div>
    <button class="btn btn-primary mt-6" data-action="doChangeKey">${esc(t("update"))}</button>
  `);
}
async function doChangeKey() {
  const err = document.getElementById("ckerr");
  const cur = document.getElementById("ck_cur").value;
  const nw = document.getElementById("ck_new").value;
  const cf = document.getElementById("ck_cf").value;
  if (nw.length < 6) { err.textContent = t("errShort"); return; }
  if (nw !== cf) { err.textContent = t("errMatch"); return; }
  try {
    const testKey = await deriveKey(cur, ub64(state.meta.salt), state.meta.iters || KDF_ITERS);
    const raw = store.get(VAULT_KEY);
    if (raw) { const enc = JSON.parse(raw); await decryptJSON(testKey, enc.iv, enc.ct); }
  } catch (e) { err.textContent = t("errWrong"); return; }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  state.meta.salt = b64(salt); state.meta.iters = KDF_ITERS;
  state.key = await deriveKey(nw, salt, KDF_ITERS);
  saveMeta(); await saveVault();
  closeSheet(); toast(t("keyUpdated"), "ok");
}

/* ---------- Export / Import / CSV / Wipe ---------- */
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type: type || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 200);
}
async function exportVault() {
  await saveVault();
  const raw = store.get(VAULT_KEY);
  const payload = { format: "lb-vault", v: 1, meta: { salt: state.meta.salt, iters: state.meta.iters }, vault: JSON.parse(raw || "{}"), exportedAt: new Date().toISOString() };
  downloadBlob(JSON.stringify(payload, null, 2), `la-biblioteca-backup-${todayStr()}.json`, "application/json");
  toast("✓", "ok");
}
function importVault() { const f = document.getElementById("importFile"); if (f) f.click(); }
function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const p = JSON.parse(reader.result);
      if (p.format !== "lb-vault" || !p.meta || !p.vault) throw new Error("bad");
      state.meta = { v: 1, salt: p.meta.salt, iters: p.meta.iters || KDF_ITERS, lang: state.lang };
      store.set(VAULT_KEY, JSON.stringify(p.vault));
      saveMeta();
      state.key = null; state.vault = null; // pedir clave del backup
      render();
      toast("✓", "ok");
    } catch (e) { toast("Archivo no válido", "err"); }
  };
  reader.readAsText(file);
}
function csvCell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evitar inyección de fórmulas
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function exportCSV() {
  const headers = I18N[state.lang].csvHeaders;
  const rows = state.vault.reservations.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(r =>
    [r.code, r.name, r.phone, r.guests, r.date, r.time, zoneName(r.zone), t("s_" + r.status), r.notes].map(csvCell).join(","));
  const csv = "\uFEFF" + headers.map(csvCell).join(",") + "\n" + rows.join("\n");
  downloadBlob(csv, `la-biblioteca-reservas-${todayStr()}.csv`, "text/csv;charset=utf-8");
  toast("✓", "ok");
}
async function wipeAll() {
  if (!confirm(t("wipeConfirm1"))) return;
  if (!confirm(t("wipeConfirm2"))) return;
  store.del(VAULT_KEY); store.del(META_KEY);
  state.meta = null; state.key = null; state.vault = null;
  render(); toast(t("wiped"), "ok");
}

/* ---------- Instalación ---------- */
function openInstall() {
  if (state.deferredInstall) {
    state.deferredInstall.prompt();
    state.deferredInstall.userChoice.finally(() => { state.deferredInstall = null; });
    return;
  }
  if (isiOS()) {
    openSheet(`
      <h3>${esc(t("iosInstall"))}</h3>
      <div class="section mt-8">
        <div class="row static"><span class="ric">${icon("share")}</span><span class="rtxt"><span class="rt">1. ${esc(t("iosStep1"))}</span></span></div>
        <div class="row static"><span class="ric">${icon("plus")}</span><span class="rtxt"><span class="rt">2. ${esc(t("iosStep2"))}</span></span></div>
        <div class="row static"><span class="ric">${icon("check")}</span><span class="rtxt"><span class="rt">3. ${esc(t("iosStep3"))}</span></span></div>
      </div>
      <button class="btn btn-primary mt-8" data-action="closeSheet">${esc(t("done"))}</button>`);
  } else {
    openSheet(`
      <h3>${esc(t("androidInstall"))}</h3>
      <p class="sub mt-8">${esc(t("androidBody"))}</p>
      <button class="btn btn-primary mt-8" data-action="closeSheet">${esc(t("done"))}</button>`);
  }
}

/* ---------- Cambio de idioma ---------- */
function setLang(lang) {
  if (lang === state.lang) return;
  state.lang = lang;
  if (state.meta) { state.meta.lang = lang; saveMeta(); }
  closeSheet();
  render();
}

/* ============================================================
   Binding por vista
   ============================================================ */
function bindView() {
  if (state.view === "all") {
    renderRList();
    const q = document.getElementById("q");
    if (q) q.addEventListener("input", () => { state.search = q.value; renderRList(); });
  }
  if (state.view === "settings") {
    const f = document.getElementById("importFile");
    if (f) f.addEventListener("change", (e) => { if (e.target.files && e.target.files[0]) handleImportFile(e.target.files[0]); e.target.value = ""; });
  }
}

/* ============================================================
   Delegación global de clics
   ============================================================ */
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;

  switch (a) {
    case "lang": setLang(el.dataset.lang); break;
    case "create": await doCreate(); break;
    case "unlock": await doUnlock(); break;
    case "lock": lock(); break;
    case "nav": state._editId = null; state.view = el.dataset.view; render(); break;
    case "filter": state.filter = el.dataset.filter; render(); break;
    case "open": openDetail(id); break;
    case "zone": {
      document.querySelectorAll("#zonesBox .zone").forEach(z => z.classList.remove("active"));
      el.classList.add("active");
      const f = document.getElementById("f_zone"); if (f) f.value = el.dataset.zone;
      break;
    }
    case "guests": {
      const inp = document.getElementById("f_guests");
      let v = parseInt(inp.value, 10) || 1; v += parseInt(el.dataset.d, 10);
      if (v < 1) v = 1; if (v > 50) v = 50; inp.value = v; break;
    }
    case "submitForm": await submitForm(); break;
    case "cancelForm": state._editId = null; state.view = "today"; render(); break;
    case "setStatus": { await updateReservation(id, { status: el.dataset.s }); openDetail(id); refreshAfterStatus(); toast(t("statusChanged"), "ok"); break; }
    case "editRes": closeSheet(); state._editId = id; state.view = "form"; render(); break;
    case "delRes": if (confirm(t("delConfirm"))) { await deleteReservation(id); closeSheet(); render(); toast(t("deleted"), "ok"); } break;
    case "wa": waShare(id); break;
    case "copy": await copyRes(id); break;
    case "closeSheet": closeSheet(); break;
    case "install": openInstall(); break;
    case "changeKey": openChangeKey(); break;
    case "doChangeKey": await doChangeKey(); break;
    case "exportVault": await exportVault(); break;
    case "importVault": importVault(); break;
    case "exportCSV": exportCSV(); break;
    case "wipe": await wipeAll(); break;
  }
});

function refreshAfterStatus() {
  // actualizar contadores/listas detrás del sheet
  const app = document.getElementById("app");
  const scrim = document.getElementById("scrim");
  const sheetHTML = scrim ? scrim.outerHTML : null;
  app.innerHTML = shell(viewContent());
  bindShell(); bindView();
  if (sheetHTML) { /* el sheet ya fue recreado por openDetail */ }
}

/* ============================================================
   Auto-bloqueo por inactividad + ciclo de vida
   ============================================================ */
function resetIdle() {
  clearTimeout(state.idleTimer);
  if (!state.key) return;
  state.idleTimer = setTimeout(() => { if (state.key) lock(); }, IDLE_LOCK_MS);
}
["click", "keydown", "touchstart", "pointerdown"].forEach(ev =>
  document.addEventListener(ev, () => { if (state.key) resetIdle(); }, { passive: true }));

document.addEventListener("visibilitychange", () => { if (document.hidden && state.key) resetIdle(); });

/* ============================================================
   Service Worker + install prompt
   ============================================================ */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.deferredInstall = e;
});
window.addEventListener("appinstalled", () => { state.deferredInstall = null; if (state.view === "settings") render(); });

if ("serviceWorker" in navigator && navigator.serviceWorker) {
  window.addEventListener("load", () => {
    try { navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) {}
  });
}

/* ============================================================
   Init
   ============================================================ */
(function init() {
  loadMeta();
  render();
})();
