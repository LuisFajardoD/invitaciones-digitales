// Partículas con pool fijo (typed arrays, sin crear objetos en el loop): gotas, confeti, destellos y
// anillos de salpicadura. Coordenadas del mundo (y hacia arriba).
const N = 420;
const COLORS = ["#FFFFFF", "#BDF3FF", "#2EC4B6", "#FF5A5F", "#FFC93C", "#3D5AFE", "#9BE564", "#FF9FCB", "#8FE3FF"];
export const PCOL = { white: 0, foam: 1, water: 2, coral: 3, yellow: 4, blue: 5, lime: 6, pink: 7, sky: 8 };
const KIND = { drop: 0, confetti: 1, spark: 2, ring: 3 };

export function createParticles() {
  const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  const life = new Float32Array(N), max = new Float32Array(N), size = new Float32Array(N), rot = new Float32Array(N);
  const col = new Uint8Array(N), kind = new Uint8Array(N);
  let cursor = 0, budget = 1; // budget < 1 reduce la cantidad (calidad baja / movimiento reducido)
  function spawn(k, px, py, pvx, pvy, l, s, c) {
    const i = cursor; cursor = (cursor + 1) % N;
    x[i] = px; y[i] = py; vx[i] = pvx; vy[i] = pvy; life[i] = l; max[i] = l; size[i] = s; col[i] = c; kind[i] = k; rot[i] = Math.random() * 6;
  }
  const n = (k) => Math.max(1, Math.round(k * budget));
  return {
    setBudget(b) { budget = b; },
    /** Chapuzón: gotas hacia arriba + anillo en el agua. */
    splash(px, py, power = 1) {
      for (let k = 0; k < n(26 * power); k++) spawn(KIND.drop, px + (Math.random() - 0.5) * 20, py, (Math.random() - 0.5) * 260 * power, 180 + Math.random() * 420 * power, 0.7 + Math.random() * 0.4, 3 + Math.random() * 4, k % 3 ? PCOL.foam : PCOL.sky);
      spawn(KIND.ring, px, py, 0, 0, 0.7, 10, PCOL.white);
      spawn(KIND.ring, px, py, 0, 0, 0.9, 6, PCOL.foam);
    },
    /** Estela de gotas (trampolín, tobogán). */
    trail(px, py, count = 3) {
      for (let k = 0; k < n(count); k++) spawn(KIND.drop, px + (Math.random() - 0.5) * 16, py + Math.random() * 10, -60 - Math.random() * 80, 40 + Math.random() * 90, 0.45 + Math.random() * 0.2, 2.5 + Math.random() * 2.5, k % 2 ? PCOL.foam : PCOL.sky);
    },
    /** Confeti de gotas de colores. */
    confetti(px, py, count = 60, spread = 260) {
      for (let k = 0; k < n(count); k++) spawn(KIND.confetti, px + (Math.random() - 0.5) * spread, py + Math.random() * 60, (Math.random() - 0.5) * 120, -40 - Math.random() * 90, 1.6 + Math.random() * 1.2, 4 + Math.random() * 3, 3 + (k % 6));
    },
    /** Estallido de confeti hacia arriba (celebraciones). */
    burst(px, py, count = 40) {
      for (let k = 0; k < n(count); k++) { const a = Math.random() * Math.PI, v = 220 + Math.random() * 360; spawn(KIND.confetti, px, py, Math.cos(a) * v * 0.8, Math.sin(a) * v, 1.3 + Math.random() * 0.8, 4 + Math.random() * 3, 3 + (k % 6)); }
    },
    /** Destellos (foto recogida). */
    sparkle(px, py, count = 14) {
      for (let k = 0; k < n(count); k++) { const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 180; spawn(KIND.spark, px, py, Math.cos(a) * v, Math.sin(a) * v, 0.5 + Math.random() * 0.3, 3 + Math.random() * 3, k % 3 ? PCOL.yellow : PCOL.white); }
    },
    /** Polvo de agua al aterrizar. */
    puff(px, py) { for (let k = 0; k < n(5); k++) spawn(KIND.drop, px + (Math.random() - 0.5) * 18, py + 2, (Math.random() - 0.5) * 120, 40 + Math.random() * 60, 0.35, 2 + Math.random() * 2, PCOL.foam); },
    update(dt) {
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        const k = kind[i];
        if (k === KIND.ring) continue;
        if (k === KIND.confetti) { vy[i] -= 260 * dt; vx[i] *= 0.985; vy[i] = Math.max(vy[i], -140); rot[i] += dt * 7; }
        else if (k === KIND.spark) { vx[i] *= 0.92; vy[i] *= 0.92; }
        else vy[i] -= 900 * dt;
        x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        if (k === KIND.drop && y[i] < -4) life[i] = 0;
      }
    },
    draw(ctx) {
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        const t = life[i] / max[i], k = kind[i];
        ctx.globalAlpha = Math.min(1, t * 2.2);
        if (k === KIND.ring) {
          const r = size[i] + (1 - t) * 46;
          ctx.strokeStyle = COLORS[col[i]]; ctx.lineWidth = 3 * t + 0.5;
          ctx.beginPath(); ctx.ellipse(x[i], -y[i], r, r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
          continue;
        }
        ctx.fillStyle = COLORS[col[i]];
        const s = size[i];
        if (k === KIND.confetti) {
          ctx.save(); ctx.translate(x[i], -y[i]); ctx.rotate(rot[i]); ctx.fillRect(-s / 2, -s * 0.3, s, s * 0.6); ctx.restore();
        } else if (k === KIND.spark) {
          const r = s * (0.6 + t * 0.6);
          ctx.fillRect(x[i] - r, -y[i] - r * 0.25, r * 2, r * 0.5); ctx.fillRect(x[i] - r * 0.25, -y[i] - r, r * 0.5, r * 2);
        } else {
          ctx.beginPath(); ctx.arc(x[i], -y[i], s * (0.5 + t * 0.5), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() { life.fill(0); }
  };
}
