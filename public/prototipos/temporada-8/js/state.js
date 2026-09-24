// Estado persistente en localStorage bajo "gloobi:{invitationId}".
// Todo acceso va en try/catch: sin almacenamiento la experiencia funciona como primera visita.
import { demoData } from "./data.js";

const KEY = `gloobi:${demoData.invitationId}`;

/**
 * Modo muestra (?demo=1): para enseñar la invitación a clientes. Siempre se ve como la primera
 * visita: no lee ni escribe localStorage; todo el estado vive en memoria durante esta carga.
 */
export const DEMO = (() => { try { return new URLSearchParams(location.search).get("demo") === "1"; } catch { return false; } })();

/** Misiones que suman XP (el Escuadrón es la recompensa final, no cuenta como misión). */
export const QUESTS = ["salto", "mision", "mapa", "pase", "tienda", "repeticiones"];
/** Bonus opcional: abrir el planeador a tiempo. Suma a la barra pero no se exige para subir de nivel. */
export const BONUS = ["planeo"];
export const XP_PER_QUEST = 100;
const ALL = [...QUESTS, ...BONUS];

const defaults = () => ({
  v: 1,
  seenDrop: false,
  visited: [],
  leveledUp: false,
  rsvp: null, // confirmación con el contrato común (_shared/rsvp-contract.js)
  sound: null // null = usar demoData.sound.enabledByDefault
});

function store() {
  if (DEMO) return null;
  try {
    const s = window.localStorage;
    const probe = "__gloobi_probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
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
    if (parsed && typeof parsed === "object") {
      data = { ...defaults(), ...parsed };
      if (!Array.isArray(data.visited)) data.visited = [];
      returning = true;
    }
  }
} catch {
  data = defaults();
}

const listeners = new Set();

function save() {
  try { store()?.setItem(KEY, JSON.stringify(data)); } catch { /* sin persistencia */ }
}

export const state = {
  get: () => data,
  isReturning: () => returning,
  set(patch) {
    data = { ...data, ...patch };
    save();
    listeners.forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  xp: () => data.visited.filter((q) => ALL.includes(q)).length * XP_PER_QUEST,
  maxXp: () => ALL.length * XP_PER_QUEST,
  /** XP necesaria para subir de nivel (sin el bonus opcional). */
  requiredXp: () => QUESTS.length * XP_PER_QUEST,
  hasBonus: (id) => data.visited.includes(id),
  /** Marca una misión o bonus; devuelve true si era nueva. */
  visit(quest) {
    if (!ALL.includes(quest) || data.visited.includes(quest)) return false;
    state.set({ visited: [...data.visited, quest] });
    return true;
  },
  allDone: () => QUESTS.every((q) => data.visited.includes(q)),
  reset() {
    try { store()?.removeItem(KEY); } catch { /* nada */ }
    data = defaults();
    returning = false;
  },
  soundEnabled: () => (data.sound == null ? !!demoData.sound.enabledByDefault : !!data.sound)
};
