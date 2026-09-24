// Física del corredor con paso fijo (60 Hz). Función de paso pura sobre un estado plano, para que el
// modo automático pueda simular hacia adelante con la misma física que el juego.
// Tolerancias amables: coyote time 120 ms, buffer de salto 150 ms, hitbox ≈ 70 % del dibujo y
// hitboxes de obstáculos reducidas.
import { PLAT_Y, RUN_SPEED, SPRINT, SLIDE_SPEED, slideY } from "./course.js";

export const DT = 1 / 60;
export const G = 2200, JUMP_V = 820, DOUBLE_V = 740, TRAMP_V = 1350;
const COYOTE = 0.12, BUFFER = 0.15, HOLD_T = 0.2, HOLD_G = 0.45;
export const HIT = { hw: 11, y0: 5, y1: 54 }; // hitbox del corredor (≈70 % de 34×78)

export function makeRunnerState() {
  return {
    x: 0, y: PLAT_Y, vy: 0, grounded: true, gi: -1, coyote: 0, buffer: 0, hold: 0, dbl: true,
    onSlide: false, sprint: false, invuln: 0, flip: -1, lastGround: -1
  };
}
export function copyState(a, b) { for (const k in a) b[k] = a[k]; return b; }

/* ---------- Mundo dependiente del tiempo ---------- */
export function floatTop(f, wt, easy) {
  return f.y + f.amp * (easy ? 0.5 : 1) * Math.sin((Math.PI * 2 * wt) / (f.period * (easy ? 1.35 : 1)) + f.phase);
}
export function surfaceTop(g, wt, W) {
  if (g.kind === "float") return floatTop(g, wt, W.easy.has(g.id));
  return g.y;
}
export function sweepAngle(s, wt, easy) { return (Math.PI * 2 * wt) / (s.period * (easy ? 1.35 : 1)); }

/**
 * Un paso de física. W = { course, wt (tiempo del mundo), balls (posiciones actuales), easy (Set de ids) }.
 * input = { pressed, held }. Devuelve un código de evento (o 0): "jump" "double" "land" "boing"
 * "hit:<id>" "fall" "slide" ; escribe detalles en s.
 */
export function step(s, input, W) {
  const C = W.course;
  let ev = 0;
  const vx = RUN_SPEED * (s.onSlide ? SLIDE_SPEED : s.sprint ? SPRINT : 1);
  if (input.pressed) s.buffer = BUFFER;
  else s.buffer = Math.max(0, s.buffer - DT);
  if (!s.grounded) s.coyote = Math.max(0, s.coyote - DT);
  s.invuln = Math.max(0, s.invuln - DT);

  // Saltos (el tobogán no admite input)
  if (!s.onSlide) {
    if (s.buffer > 0 && (s.grounded || s.coyote > 0)) {
      s.vy = JUMP_V; s.grounded = false; s.coyote = 0; s.buffer = 0; s.hold = HOLD_T; s.dbl = true; ev = "jump";
    } else if (input.pressed && !s.grounded && s.coyote <= 0 && s.dbl) {
      s.vy = DOUBLE_V; s.dbl = false; s.buffer = 0; s.hold = HOLD_T * 0.6; s.flip = 0; ev = "double";
    }
  }
  // Gravedad (mantener presionado = salto un poco más alto, limitado)
  if (!s.grounded) {
    const g = input.held && s.hold > 0 && s.vy > 0 ? G * HOLD_G : G;
    s.hold = Math.max(0, s.hold - DT);
    s.vy -= g * DT;
  }
  const prevY = s.y;
  s.x += vx * DT;
  if (!s.grounded) s.y += s.vy * DT;
  if (s.flip >= 0) { s.flip += DT / 0.42; if (s.flip >= 1) s.flip = -1; }

  // Tobogán
  s.onSlide = false;
  for (const sl of C.slides) {
    if (s.x >= sl.x0 && s.x <= sl.x1) {
      const sy = slideY(sl, s.x);
      if (s.y <= sy + 6 && prevY >= sy - 30) { s.y = sy; s.vy = 0; s.grounded = true; s.onSlide = true; s.gi = -1; s.dbl = true; if (!ev) ev = "slide"; }
    }
  }
  // Suelo: aterrizar / seguir sobre flotantes / caerse del borde
  if (!s.onSlide) {
    let landed = false;
    const G2 = C.ground;
    for (let k = 0; k < G2.length; k++) {
      const g = G2[k];
      if (s.x < g.x0 - 9 || s.x > g.x1 + 9) continue;
      const top = surfaceTop(g, W.wt, W);
      if (s.grounded && s.gi === k) { s.y = top; landed = true; break; }
      if (!s.grounded && s.vy <= 0 && prevY >= top - 14 && s.y <= top) {
        s.y = top; s.vy = 0; s.grounded = true; s.gi = k; s.dbl = true; s.flip = -1; landed = true; ev = ev || "land"; break;
      }
    }
    if (s.grounded && !landed) {
      // ¿pasó a otra superficie contigua?
      let next = -1;
      for (let k = 0; k < G2.length; k++) { const g = G2[k]; if (s.x >= g.x0 - 9 && s.x <= g.x1 + 9 && Math.abs(surfaceTop(g, W.wt, W) - s.y) < 16) { next = k; break; } }
      if (next >= 0) { s.gi = next; s.y = surfaceTop(G2[next], W.wt, W); }
      else { s.grounded = false; s.coyote = COYOTE; s.vy = 0; }
    }
    if (s.grounded && s.gi >= 0) s.lastGround = s.gi;
  }
  // Trampolines
  if (s.grounded && !s.onSlide) {
    for (const t of C.tramps) if (s.x >= t.x - 4 && s.x <= t.x + t.w + 4 && Math.abs(s.y - PLAT_Y) < 3) { s.vy = TRAMP_V; s.grounded = false; s.coyote = 0; s.hold = 0; s.dbl = true; ev = "boing"; s.tramp = t.id; break; }
  }
  // Pared de la torre del tobogán (si no se llegó arriba)
  for (const tw of C.towers) {
    if (s.x + HIT.hw > tw.x0 && s.x - HIT.hw < tw.x0 + 14 && s.y < tw.y - 8 && !W.easySkipTower) return "hit:" + tw.id;
  }
  // Obstáculos
  if (s.invuln <= 0) {
    const L = s.x - HIT.hw, R = s.x + HIT.hw, B = s.y + HIT.y0, T = s.y + HIT.y1;
    const circle = (cx, cy, r) => { const nx = Math.max(L, Math.min(cx, R)), ny = Math.max(B, Math.min(cy, T)); return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r; };
    for (const o of C.rollers) {
      if (Math.abs(o.x - s.x) > 80) continue;
      const r = o.r * (W.easy.has(o.id) ? 0.7 : 0.85);
      if (circle(o.x, PLAT_Y + o.r, r)) return "hit:" + o.id;
    }
    for (const b of W.balls) {
      if (!b.alive || Math.abs(b.x - s.x) > 80) continue;
      if (circle(b.x, b.y + b.r, b.r * 0.82)) return "hit:" + b.id;
    }
    for (const o of C.sweeps) {
      if (Math.abs(o.x - s.x) > o.len + 30) continue;
      const e = Math.abs(Math.cos(sweepAngle(o, W.wt, W.easy.has(o.id)))) * o.len * 0.88;
      if (R > o.x - e && L < o.x + e && B < PLAT_Y + 26 && T > PLAT_Y + 4) return "hit:" + o.id;
      if (R > o.x - 5 && L < o.x + 5 && B < PLAT_Y + 34) return "hit:" + o.id;
    }
  }
  if (s.y < -26) return "fall";
  return ev;
}
