// Estado persistente en localStorage ("gloobi:{invitationId}"), siempre en try/catch.
// Con ?demo=1 no se lee ni se escribe nada: cada visita es la primera, completa.
import { demoData } from "./data.js";
import { flag } from "./util.js";

export const DEMO = flag("demo");
const KEY = `gloobi:${demoData.invitationId}`;
const DEFAULTS = { seenLaunch: false, lastChapter: 0, sound: null, rsvp: null, visits: 0 };
let mem = { ...DEFAULTS };

function read() {
  if (DEMO) return { ...DEFAULTS };
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }; } catch { return { ...DEFAULTS }; }
}
mem = read();
const returning = !DEMO && (mem.seenLaunch || mem.visits > 0);

export const state = {
  get: () => mem,
  set(patch) {
    mem = { ...mem, ...patch };
    if (DEMO) return;
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* sin almacenamiento: sigue en memoria */ }
  },
  reset() { mem = { ...DEFAULTS }; try { localStorage.removeItem(KEY); } catch { /* nada */ } },
  isReturning: () => returning,
  soundEnabled: () => (mem.sound == null ? demoData.sound.enabledByDefault !== false : !!mem.sound)
};
