// Utilidades compartidas: DOM, matemáticas, fechas del evento y reloj (con modo debug).
import { demoData } from "./data.js";

/* ---------- DOM ---------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Crea un elemento: h("button.btn", { onclick, "aria-label": "x" }, "texto", hijo) */
export function h(tag, props, ...children) {
  const [nameId, ...classes] = tag.split(".");
  const [name, id] = nameId.split("#");
  const el = document.createElement(name || "div");
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(" ");
  // Si el segundo argumento es un hijo (nodo, texto o lista), no es un objeto de props.
  if (props instanceof Node || typeof props === "string" || typeof props === "number" || Array.isArray(props)) {
    children.unshift(props);
    props = null;
  }
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className += (el.className ? " " : "") + v;
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const fillTemplate = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));

/* ---------- Matemáticas ---------- */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeOutElastic = (t) => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};
export const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);

/** RNG determinista (mulberry32) para ilustraciones reproducibles. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/* ---------- Movimiento reducido ---------- */
let forcedReduced = false;
const rmQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
export const prefersReduced = () => forcedReduced || !!(rmQuery && rmQuery.matches);
export function setForcedReduced(v) {
  forcedReduced = !!v;
  syncReducedClass();
}
export function syncReducedClass() {
  document.documentElement.classList.toggle("rm", prefersReduced());
}
if (rmQuery && rmQuery.addEventListener) rmQuery.addEventListener("change", syncReducedClass);

export function vibrate(pattern) {
  try { if (navigator.vibrate && !prefersReduced()) navigator.vibrate(pattern); } catch { /* sin vibración */ }
}

/* ---------- Reloj (con desplazamiento simulado para ?debug=1) ---------- */
let clockOffset = 0;
export const clock = {
  now: () => Date.now() + clockOffset,
  setOffset(ms) { clockOffset = ms; },
  reset() { clockOffset = 0; },
  get simulated() { return clockOffset !== 0; }
};

/* ---------- Fechas del evento (en la zona horaria del propio evento) ---------- */
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAY_MS = 86400000;

function offsetMinutes(iso) {
  const m = String(iso).match(/([+-])(\d{2}):?(\d{2})$/);
  if (!m) return -new Date(iso).getTimezoneOffset();
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

const wall = (ms, off) => new Date(ms + off * 60000); // leer con getUTC*

/** "4:30 pm" | "16:30" → minutos desde medianoche */
export function parseClock(str) {
  const m = String(str).trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?$/);
  if (!m) return 0;
  let hh = Number(m[1]);
  const mm = Number(m[2] || 0);
  if (m[3]) {
    const pm = m[3].startsWith("p");
    if (pm && hh < 12) hh += 12;
    if (!pm && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
}

export function formatClock(ms, off) {
  const d = wall(ms, off);
  const hh = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm} ${hh < 12 ? "am" : "pm"}`;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

let cachedEvent = null;
/** Instantes clave del evento, calculados una sola vez a partir de demoData.event */
export function eventInfo() {
  if (cachedEvent) return cachedEvent;
  const ev = demoData.event;
  const start = new Date(ev.dateISO).getTime();
  const off = offsetMinutes(ev.dateISO);
  const w = wall(start, off);
  const dayStart = Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - off * 60000;
  let end = dayStart + parseClock(ev.endTime) * 60000;
  if (end <= start) end += DAY_MS;
  cachedEvent = {
    start, end, off, dayStart,
    atClock: (str) => dayStart + parseClock(str) * 60000,
    dateLong: `${cap(DAYS[w.getUTCDay()])} ${w.getUTCDate()} de ${MONTHS[w.getUTCMonth()]}`,
    dateWithYear: `${cap(DAYS[w.getUTCDay()])} ${w.getUTCDate()} de ${MONTHS[w.getUTCMonth()]} de ${w.getUTCFullYear()}`,
    dayNum: w.getUTCDate(),
    monthShort: MONTHS[w.getUTCMonth()].slice(0, 3).toUpperCase(),
    weekday: cap(DAYS[w.getUTCDay()]),
    startTime: formatClock(start, off),
    endTime: formatClock(end, off)
  };
  return cachedEvent;
}

/** Estado temporal: "countdown" | "today" (día del evento, antes de terminar) | "past" */
export function eventPhase(now = clock.now()) {
  const ev = eventInfo();
  if (now >= ev.end) return "past";
  if (now >= ev.dayStart) return "today";
  return "countdown";
}

export function splitDuration(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
export const pad2 = (n) => String(n).padStart(2, "0");

/* ---------- Textos derivados ---------- */
export const inviteTitle = () =>
  demoData.titleOverride || `${demoData.child.name} · Temporada ${demoData.child.age}`;
