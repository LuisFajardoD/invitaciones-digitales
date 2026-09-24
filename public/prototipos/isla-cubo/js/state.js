// Estado persistente en localStorage ("gloobi:{invitationId}"), siempre con try/catch.
// Sin almacenamiento, la experiencia funciona como primera visita.
import { demoData } from "./data.js";

const KEY = `gloobi:${demoData.invitationId}`;

/**
 * Modo muestra (?demo=1): para enseñar la invitación a clientes. Siempre se ve como la primera
 * visita: no lee ni escribe localStorage ni sessionStorage; todo el estado vive en memoria.
 */
export const DEMO = (() => { try { return new URLSearchParams(location.search).get("demo") === "1"; } catch { return false; } })();
const memory = new Map(); // sustituto de sessionStorage en modo muestra
export const session = {
  get(k) { if (DEMO) return memory.get(k) ?? null; try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { if (DEMO) { memory.set(k, v); return; } try { sessionStorage.setItem(k, v); } catch { /* sin sessionStorage */ } }
};
const defaults = () => ({ v: 1, builtSeen: false, lastStop: 0, sound: null, rsvp: null });

function store() {
  if (DEMO) return null;
  try {
    const s = window.localStorage;
    s.setItem("__gloobi_probe", "1");
    s.removeItem("__gloobi_probe");
    return s;
  } catch {
    return null;
  }
}

let returning = false;
let data = defaults();
try {
  const raw = store()?.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") { data = { ...defaults(), ...parsed }; returning = true; }
  }
} catch { data = defaults(); }

function save() { try { store()?.setItem(KEY, JSON.stringify(data)); } catch { /* sin persistencia */ } }

export const state = {
  get: () => data,
  isReturning: () => returning && data.builtSeen,
  set(patch) { data = { ...data, ...patch }; save(); },
  reset() { try { store()?.removeItem(KEY); } catch { /* nada */ } data = defaults(); returning = false; },
  soundEnabled: () => (data.sound == null ? !!demoData.sound.enabledByDefault : !!data.sound)
};
