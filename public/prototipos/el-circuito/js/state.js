// Estado persistente en localStorage ("gloobi:{invitationId}"), siempre con try/catch.
// Sin almacenamiento, la experiencia funciona como primera visita.
// Modo muestra (?demo=1): no lee ni escribe nada; todo vive en memoria durante esta carga.
import { demoData } from "./data.js";

const KEY = `gloobi:${demoData.invitationId}`;
export const DEMO = (() => { try { return new URLSearchParams(location.search).get("demo") === "1"; } catch { return false; } })();
const defaults = () => ({ v: 1, tutorialSeen: false, bestTime: null, photosEver: [], sound: null, rsvp: null, visits: 0 });

function store() {
  if (DEMO) return null;
  try { const s = window.localStorage; s.setItem("__gloobi_probe", "1"); s.removeItem("__gloobi_probe"); return s; } catch { return null; }
}
let returning = false;
let data = defaults();
try {
  const raw = store()?.getItem(KEY);
  if (raw) { const p = JSON.parse(raw); if (p && typeof p === "object") { data = { ...defaults(), ...p }; returning = true; } }
} catch { data = defaults(); }
if (!Array.isArray(data.photosEver)) data.photosEver = [];

function save() { try { store()?.setItem(KEY, JSON.stringify(data)); } catch { /* sin persistencia */ } }

export const state = {
  get: () => data,
  isReturning: () => returning,
  set(patch) { data = { ...data, ...patch }; save(); },
  reset() { try { store()?.removeItem(KEY); } catch { /* nada */ } data = defaults(); returning = false; },
  soundEnabled: () => (data.sound == null ? !!demoData.sound.enabledByDefault : !!data.sound),
  /** Guarda el tiempo si es récord personal; devuelve true si lo mejoró. */
  submitTime(sec) {
    if (data.bestTime == null || sec < data.bestTime) { state.set({ bestTime: Math.round(sec * 10) / 10 }); return true; }
    return false;
  },
  addPhotos(list) { state.set({ photosEver: [...new Set([...data.photosEver, ...list])].sort() }); }
};
