// Modo automático ("Ver la carrera"): el corredor salta solo y perfecto. Simula hacia adelante con la
// misma función de física del juego (step) y elige la acción que evita caídas y golpes.
import { step, makeRunnerState, copyState, DT } from "./physics.js";

const scratch = makeRunnerState();
const inp = { pressed: false, held: false };
const Wsim = { course: null, wt: 0, balls: [], easy: null };
const ballsSim = Array.from({ length: 8 }, () => ({ id: "", x: 0, y: 0, r: 0, alive: false }));

/** Simula `secs` segundos con una estrategia; devuelve true si no hay caídas ni golpes. */
function simulate(s, W, secs, strat) {
  copyState(s, scratch);
  Wsim.course = W.course; Wsim.easy = W.easy; Wsim.easySkipTower = W.easySkipTower;
  const nb = W.balls.length;
  Wsim.balls = ballsSim;
  ballsSim.length = nb;
  for (let k = 0; k < nb; k++) {
    const b = W.balls[k], o = ballsSim[k] || (ballsSim[k] = { id: "", x: 0, y: 0, r: 0, alive: false });
    o.id = b.id; o.x = b.x; o.y = b.y; o.r = b.r; o.alive = b.alive;
    o.vFull = b.v * (W.easy.has(b.id) ? 0.75 : 1); o.v = b.active ? o.vFull : 0; o.trigger = b.ref.trigger ?? b.ref.x - 640;
  }
  const steps = Math.round(secs / DT);
  for (let i = 0; i < steps; i++) {
    Wsim.wt = W.wt + i * DT;
    for (let k = 0; k < nb; k++) { const o = ballsSim[k]; if (!o.v && o.alive && scratch.x >= o.trigger && scratch.x < o.x) o.v = o.vFull; o.x -= o.v * DT; }
    const act = strat(i);
    inp.pressed = act === 1 || act === 3; inp.held = act >= 2;
    const ev = step(scratch, inp, Wsim);
    if (ev === "fall" || (typeof ev === "string" && ev.startsWith("hit:"))) return false;
  }
  return true;
}

/** Decide la entrada de este paso. Devuelve { pressed, held }. */
export function autopilot(s, W, out) {
  out.pressed = false; out.held = false;
  if (s.onSlide) return out;
  if (s.grounded) {
    if (simulate(s, W, 0.45, () => 0)) return out; // seguir corriendo es seguro por ahora
    // probar: salto corto, salto largo (mantener), salto + doble salto
    const opts = [
      (i) => (i === 0 ? 1 : 0),
      (i) => (i === 0 ? 3 : i < 12 ? 2 : 0),
      (i) => (i === 0 ? 1 : i === 26 ? 1 : 0)
    ];
    for (let k = 0; k < opts.length; k++) {
      if (simulate(s, W, 1.6, opts[k])) { out.pressed = true; out.held = k === 1; W.autoHold = k === 1 ? 12 : 0; W.autoDouble = k === 2 ? 26 : -1; return out; }
    }
    // si no hay opción segura todavía, esperar; pero si seguir ya falla muy pronto, saltar igual
    if (!simulate(s, W, 0.1, () => 0)) { out.pressed = true; out.held = true; W.autoHold = 12; }
    return out;
  }
  // En el aire: mantener si se decidió un salto largo; doble salto si hace falta
  if (W.autoHold > 0) { W.autoHold--; out.held = true; }
  if (W.autoDouble > 0) { W.autoDouble--; if (W.autoDouble === 0) { out.pressed = true; W.autoDouble = -1; return out; } }
  if (s.dbl && !simulate(s, W, 1.2, () => 0) && simulate(s, W, 1.2, (i) => (i === 0 ? 1 : 0))) out.pressed = true;
  return out;
}
