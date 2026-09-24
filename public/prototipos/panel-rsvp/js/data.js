// Datos de ejemplo del Panel RSVP: el evento (mismos datos de las invitaciones) y confirmaciones
// con el contrato común (_shared/rsvp-contract.js). También formatos de fecha y reloj simulable.
import { createRsvp } from "../../_shared/rsvp-contract.js";

export const event = {
  childName: "Luis Arturo",
  age: 8,
  dateISO: "2026-11-14T16:00:00-06:00",
  endTime: "20:00",
  venueName: "Salón Aventura",
  address: "Av. Ejemplo 123, Col. Centro, CDMX",
  expectedInvites: 25 // invitaciones enviadas (opcional)
};

// Invitación de cada plantilla (para "Copiar enlace" y "Compartir por WhatsApp")
export const INVITATIONS = {
  "temporada-8": { id: "temporada-8-demo", path: "../temporada-8/index.html" },
  "isla-cubo": { id: "isla-cubo-demo", path: "../isla-cubo/index.html" },
  "el-circuito": { id: "el-circuito-demo", path: "../el-circuito/index.html" },
  default: { id: "demo", path: "../temporada-8/index.html" }
};

/* ---------- Reloj simulable (debug: antes, el día, después) ---------- */
let offset = 0;
export const clock = { now: () => Date.now() + offset, set(ms) { offset = ms - Date.now(); }, reset() { offset = 0; } };

/* ---------- Fechas en la zona del evento ---------- */
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const offMin = (() => { const m = event.dateISO.match(/([+-])(\d{2}):?(\d{2})$/); return m ? (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0; })();
const wall = (ms) => new Date(ms + offMin * 60000);
const hhmm = (d) => { const h = d.getUTCHours(); return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };

export const start = new Date(event.dateISO).getTime();
const w0 = wall(start);
export const dayStart = Date.UTC(w0.getUTCFullYear(), w0.getUTCMonth(), w0.getUTCDate()) - offMin * 60000;
const [eh, em] = event.endTime.split(":").map(Number);
export const end = dayStart + (eh * 60 + em) * 60000;

export const fmt = {
  dateLong: `${cap(DAYS[w0.getUTCDay()])} ${w0.getUTCDate()} de ${MONTHS[w0.getUTCMonth()]}`,
  dateShort: `${w0.getUTCDate()} de ${MONTHS[w0.getUTCMonth()]} de ${w0.getUTCFullYear()}`,
  time: `${hhmm(w0)} – ${hhmm(wall(end))}`,
  /** dd/mm/aaaa hh:mm (hora local del navegador) */
  stamp(iso) {
    const d = new Date(iso), p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  },
  /** "hace 2 días", "hace 3 h", "hace un momento" */
  relative(iso, now = clock.now()) {
    const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
    if (s < 60) return "hace un momento";
    if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    const d = Math.floor(s / 86400);
    return d === 1 ? "ayer" : d < 30 ? `hace ${d} días` : `hace ${Math.floor(d / 30)} mes${d >= 60 ? "es" : ""}`;
  },
  /** "Faltan 51 días" | "¡Es hoy!" | "La fiesta fue el …" */
  countdown(now = clock.now()) {
    if (now >= end) return { key: "past", text: `La fiesta fue el ${fmt.dateLong.toLowerCase()}` };
    if (now >= dayStart) return { key: "today", text: "¡Es hoy!" };
    const days = Math.ceil((dayStart - now) / 86400000);
    return { key: "before", text: days === 1 ? "Falta 1 día" : `Faltan ${days} días` };
  }
};

/* ---------- Confirmaciones de ejemplo ---------- */
const BASE = [
  // nombre, asiste, adultos, niños, mensaje
  ["Familia Pérez", true, 2, 2, "¡Feliz cumple, Luis! Nos vemos en la fiesta 🎉"],
  ["Adriana Gómez", true, 1, 1, ""],
  ["Familia Hernández", true, 2, 3, "¡Qué emoción! Los niños no dejan de hablar de la fiesta."],
  ["Mateo Ruiz", true, 1, 1, ""],
  ["Familia Ortega", false, 0, 0, "Lo sentimos mucho, estaremos de viaje. ¡Muchas felicidades!"],
  ["Valentina Cruz", true, 1, 2, ""],
  ["Familia Núñez", true, 2, 1, "¡Luis, eres el mejor! Te queremos mucho."],
  ["Diego Salazar", true, 2, 0, ""],
  ["Abuelos Martínez", true, 2, 0, "Ahí estaremos con el regalo más grande 🎁"],
  ["Sofía Lozano", false, 0, 0, ""],
  ["Familia Ramírez", true, 1, 2, ""],
  ["Regina Toledo", true, 1, 1, ""],
  ["Tía Carmen", true, 1, 0, "¡Feliz cumpleaños, campeón!"],
  ["Familia Ibáñez", false, 0, 0, ""],
  ["Emilio Fuentes", true, 2, 1, ""],
  ["Familia Domínguez", true, 2, 2, ""],
  ["Ximena Peña", false, 0, 0, "No podré ir, pero te mando un abrazo enorme. 💛"],
  ["Familia Ávila", true, 1, 1, ""]
];
const EXTRA_NAMES = ["Familia Castro", "Andrea Vega", "Familia Morales", "Pablo Ríos", "Familia Santos", "Camila Ortiz", "Familia León", "Íñigo Muñoz", "Familia Herrera", "Lucía Campos", "Familia Mendoza", "Tomás Aguilar", "Familia Rojas", "Natalia Silva", "Familia Guzmán", "Bruno Sáenz", "Familia Cabrera", "Renata Solís", "Familia Paredes", "Joaquín Mora", "Familia Luna", "Isabel Reyes"];
const COLORS = ["#FF6B6B", "#9BE564", "#B388FF", "#FFD23F", "#4CC9F0", "#FF9FCB"];
const HAIRS = ["short", "long", "pigtails"];
const SYMBOLS = ["heart", "star", "bolt", "ball", "flower", "paw"];

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/**
 * Confirmaciones de ejemplo con el avatar de la plantilla indicada.
 * @param {"t8-character"|"isla-block"|"circuito-runner"|"default"} style
 * @param {{ count?: number, invitationId?: string, now?: number }} opts  count: 18 (base) o más (p. ej. 60)
 */
export function sampleRsvps(style, { count = 18, invitationId = "demo", now = clock.now() } = {}) {
  const R = rng(1114);
  const rows = [...BASE];
  for (let i = 0; rows.length < count; i++) {
    const n = EXTRA_NAMES[i % EXTRA_NAMES.length] + (i >= EXTRA_NAMES.length ? ` ${Math.floor(i / EXTRA_NAMES.length) + 1}` : "");
    const yes = R() > 0.18;
    rows.push([n, yes, yes ? 1 + Math.floor(R() * 2) : 0, yes ? Math.floor(R() * 3) : 0, R() < 0.2 ? "¡Felicidades, Luis!" : ""]);
  }
  return rows.slice(0, count).map(([guestName, attending, adults, children, message], i) => {
    const t = new Date(now - (Math.floor(R() * 14 * 24) + 1) * 3600000 - Math.floor(R() * 59) * 60000).toISOString();
    return createRsvp({
      id: `demo-${i + 1}`, invitationId, guestName, attending, adults, children, message,
      avatar: { style, color: COLORS[i % COLORS.length], hair: HAIRS[i % 3], symbol: SYMBOLS[(i * 5) % 6] },
      createdAt: t, updatedAt: t
    });
  });
}
