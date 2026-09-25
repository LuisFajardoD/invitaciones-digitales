/**
 * Contrato de datos de una CONFIRMACIÓN (RSVP) de Gloobi.
 *
 * ⚠️ Este es el formato que la app real deberá guardar más adelante (tabla/colección de confirmaciones).
 * Hoy lo usan los prototipos (temporada-8, isla-cubo, el-circuito, mision-estrella y panel-rsvp) guardando en localStorage.
 * No incluye alergias, dietas ni restricciones alimentarias: el anfitrión sólo necesita saber
 * cuántos menús de adultos y cuántos de niños contratar.
 *
 * @typedef {"t8-character" | "isla-block" | "circuito-runner" | "mission-patch" | "default"} AvatarStyle
 *
 * @typedef {Object} RsvpAvatar  Cómo se dibuja al invitado; depende de la plantilla.
 * @property {AvatarStyle} style
 * @property {string} color      Color hex (#RRGGBB).
 * @property {"short"|"long"|"pigtails"} [hair]   Sólo "t8-character" y "circuito-runner".
 * @property {string} [symbol]  "isla-block": heart|star|bolt|ball|flower|paw.
 *                               "mission-patch": star|rocket|planet|heart|moon|comet.
 *
 * @typedef {Object} Rsvp
 * @property {string}  id            UUID.
 * @property {string}  invitationId  Id de la invitación (p. ej. "isla-cubo-demo").
 * @property {string}  guestName     Nombre del invitado o de la familia (1–60 caracteres).
 * @property {boolean} attending     false = "No podré asistir".
 * @property {number}  adults        0–10 (0 si attending = false).
 * @property {number}  children      0–10 (0 si attending = false).
 * @property {string}  message       Opcional, máx. 140 caracteres ("" si no hay).
 * @property {RsvpAvatar} avatar
 * @property {string}  createdAt     ISO 8601.
 * @property {string}  updatedAt     ISO 8601.
 *
 * Reglas:
 *  - Si attending es true: adults + children >= 1.
 *  - Si attending es false: adults = children = 0.
 */

export const MAX_PEOPLE = 10;
export const MAX_MESSAGE = 140;
export const AVATAR_STYLES = ["t8-character", "isla-block", "circuito-runner", "mission-patch", "default"];
export const HAIRS = ["short", "long", "pigtails"];
export const SYMBOLS = ["heart", "star", "bolt", "ball", "flower", "paw"];
export const MISSION_SYMBOLS = ["star", "rocket", "planet", "heart", "moon", "comet"];

export class RsvpError extends Error {}

function uuid() {
  try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch { /* sin crypto */ }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
const isHex = (s) => /^#[0-9a-fA-F]{6}$/.test(String(s));
const iso = (v, fallback) => { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toISOString() : fallback; };

/**
 * Valida y normaliza una confirmación. Lanza RsvpError si no es válida.
 * @param {Partial<Rsvp>} input
 * @param {{ previous?: Rsvp }} [opts]  Si se edita una respuesta existente, conserva id y createdAt.
 * @returns {Rsvp}
 */
export function createRsvp(input = {}, { previous } = {}) {
  const now = new Date().toISOString();
  const guestName = String(input.guestName ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!guestName) throw new RsvpError("Falta el nombre del invitado.");
  const invitationId = String(input.invitationId ?? previous?.invitationId ?? "").trim();
  if (!invitationId) throw new RsvpError("Falta invitationId.");
  const attending = input.attending !== false;
  const adults = attending ? int(input.adults, 0, MAX_PEOPLE) : 0;
  const children = attending ? int(input.children, 0, MAX_PEOPLE) : 0;
  if (attending && adults + children < 1) throw new RsvpError("Debe asistir al menos una persona.");
  const message = String(input.message ?? "").trim().slice(0, MAX_MESSAGE);

  const a = input.avatar || {};
  const style = AVATAR_STYLES.includes(a.style) ? a.style : "default";
  const avatar = { style, color: isHex(a.color) ? a.color.toUpperCase() : "#9AA5B1" };
  if (style === "t8-character" || style === "circuito-runner") avatar.hair = HAIRS.includes(a.hair) ? a.hair : "short";
  if (style === "isla-block") avatar.symbol = SYMBOLS.includes(a.symbol) ? a.symbol : "star";
  if (style === "mission-patch") avatar.symbol = MISSION_SYMBOLS.includes(a.symbol) ? a.symbol : "star";

  const createdAt = iso(previous?.createdAt ?? input.createdAt, now);
  return {
    id: String(previous?.id ?? input.id ?? uuid()),
    invitationId,
    guestName,
    attending,
    adults,
    children,
    message,
    avatar,
    createdAt,
    updatedAt: iso(input.updatedAt, now)
  };
}

/** Total de personas de una confirmación (0 si no asiste). */
export const peopleOf = (r) => (r && r.attending ? r.adults + r.children : 0);

/** "2 adultos, 1 niño" (vacío si no asiste). */
export function peopleLabel(r) {
  if (!r?.attending) return "";
  const parts = [];
  if (r.adults) parts.push(`${r.adults} adulto${r.adults === 1 ? "" : "s"}`);
  if (r.children) parts.push(`${r.children} niño${r.children === 1 ? "" : "s"}`);
  return parts.join(", ");
}

/**
 * Mensaje de WhatsApp a partir de las plantillas de demoData.rsvp
 * (messageYes / messageNo / messageLinePrefix). Omite la línea del mensaje si está vacío.
 */
export function whatsappText(r, tpl, childName) {
  const messageLine = r.message ? `${tpl.messageLinePrefix || "Mensaje: "}${r.message}` : "";
  const vars = { guestName: r.guestName, childName, adults: r.adults, children: r.children, messageLine };
  const text = String(r.attending ? tpl.messageYes : tpl.messageNo).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ""));
  return text.split("\n").filter((line) => line.trim() !== "").join("\n").trim();
}
