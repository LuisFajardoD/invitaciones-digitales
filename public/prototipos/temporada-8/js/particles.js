// Partículas en Canvas 2D: confeti de bloques y polvo de aterrizaje.
// DPR limitado a 2, calidad adaptativa según tamaño de pantalla y framerate, y el loop
// sólo corre mientras haya partículas vivas.
import { prefersReduced } from "./util.js";

export const PALETTE = ["#FFD23F", "#FF6B6B", "#9BE564", "#4CC9F0", "#B388FF", "#FFF8EC"];

/** Ajusta un canvas a su tamaño CSS con DPR ≤ 2. Devuelve { ctx, w, h, dpr, resize }. */
export function fitCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const s = { ctx, w: 0, h: 0, dpr: 1 };
  s.resize = () => {
    const r = canvas.getBoundingClientRect();
    s.dpr = Math.min(2, window.devicePixelRatio || 1);
    s.w = Math.max(1, r.width);
    s.h = Math.max(1, r.height);
    canvas.width = Math.round(s.w * s.dpr);
    canvas.height = Math.round(s.h * s.dpr);
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
  };
  s.resize();
  return s;
}

/** Calidad global de efectos 0.35..1 (se reduce si el framerate cae). */
export const quality = {
  value: 1,
  init() {
    const area = window.innerWidth * window.innerHeight;
    const cores = navigator.hardwareConcurrency || 4;
    this.value = area < 330000 || cores <= 4 ? 0.7 : 1;
  },
  sample(dt) {
    this._acc = (this._acc || 0) + dt;
    this._n = (this._n || 0) + 1;
    if (this._n >= 40) {
      const avg = this._acc / this._n;
      if (avg > 24) this.value = Math.max(0.35, this.value * 0.75);
      else if (avg < 18 && this.value < 1) this.value = Math.min(1, this.value + 0.05);
      this._acc = 0; this._n = 0;
    }
  }
};
quality.init();

function drawBlock(ctx, p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(1, Math.max(0.15, Math.abs(Math.cos(p.flip))));
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.fillRect(-s / 2, -s / 2, s, s * 0.32);
  ctx.fillStyle = "rgba(27,42,107,.22)";
  ctx.fillRect(-s / 2, s * 0.22, s, s * 0.28);
  ctx.lineWidth = Math.max(1.2, s * 0.12);
  ctx.strokeStyle = "#1B2A6B";
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

function drawDust(ctx, p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = p.color;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = "rgba(27,42,107,.14)";
  ctx.fillRect(-s / 2, s * 0.15, s, s * 0.35);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(27,42,107,.55)";
  ctx.strokeRect(-s / 2, -s / 2, s, s);
  ctx.restore();
}

export function createFx(canvas) {
  let c = fitCanvas(canvas);
  let parts = [];
  let raf = 0;
  let last = 0;

  const onResize = () => { c = fitCanvas(canvas); };
  window.addEventListener("resize", onResize);

  function loop(t) {
    const dt = Math.min(40, last ? t - last : 16);
    last = t;
    quality.sample(dt);
    const k = dt / 16.67;
    const { ctx, w, h } = c;
    ctx.clearRect(0, 0, w, h);
    const alive = [];
    for (const p of parts) {
      p.life += dt;
      const lt = p.life / p.maxLife;
      if (lt >= 1 || p.y > h + 40) continue;
      p.vx *= Math.pow(p.drag, k);
      p.vy = p.vy * Math.pow(p.drag, k) + p.g * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      p.flip += p.vf * k;
      if (p.type === "dust") {
        p.size = p.size0 * (1 - lt * 0.6);
        p.alpha = 1 - lt;
        drawDust(ctx, p);
      } else {
        p.alpha = lt > 0.8 ? (1 - lt) / 0.2 : 1;
        drawBlock(ctx, p);
      }
      alive.push(p);
    }
    parts = alive;
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; last = 0; ctx.clearRect(0, 0, w, h); }
  }

  function kick() {
    if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
  }

  const api = {
    /** Explosión de confeti desde un punto (coordenadas relativas al canvas). */
    burst({ x, y, count = 60, power = 9, colors = PALETTE, spread = Math.PI * 2, angle = -Math.PI / 2 }) {
      if (c.w < 2) c = fitCanvas(canvas);
      const n = Math.round(count * quality.value * (prefersReduced() ? 0.3 : 1));
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = power * (0.45 + Math.random() * 0.75);
        parts.push({
          type: "block", x, y,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          g: 0.28, drag: 0.975,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          flip: Math.random() * 6, vf: 0.08 + Math.random() * 0.15,
          size: 7 + Math.random() * 7,
          color: colors[(Math.random() * colors.length) | 0],
          life: 0, maxLife: 2200 + Math.random() * 1200, alpha: 1
        });
      }
      kick();
    },
    /** Lluvia de confeti que cae desde arriba de toda la pantalla. */
    rain({ count = 90, colors = PALETTE } = {}) {
      if (c.w < 2) c = fitCanvas(canvas);
      const n = Math.round(count * quality.value * (prefersReduced() ? 0.3 : 1));
      for (let i = 0; i < n; i++) {
        parts.push({
          type: "block",
          x: Math.random() * c.w, y: -20 - Math.random() * c.h * 0.6,
          vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
          g: 0.06, drag: 0.99,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2,
          flip: Math.random() * 6, vf: 0.06 + Math.random() * 0.12,
          size: 7 + Math.random() * 8,
          color: colors[(Math.random() * colors.length) | 0],
          life: 0, maxLife: 4200, alpha: 1
        });
      }
      kick();
    },
    /**
     * Nube de polvo de bloques al aterrizar.
     * ring: true → anillo aplanado alrededor de los pies (vista frontal); si no, abanico hacia arriba.
     */
    dust({ x, y, count = 46, ring = false, spread = 1, colors = ["#FFFFFF", "#E8DCC4", "#C9B48E", "#BFEA9E", "#FFD23F"] }) {
      if (c.w < 2) c = fitCanvas(canvas);
      const n = Math.round(count * quality.value);
      for (let i = 0; i < n; i++) {
        const a = ring ? Math.random() * Math.PI * 2 : Math.PI + Math.random() * Math.PI;
        const v = (3 + Math.random() * 6) * spread;
        const size = (ring ? 7 + Math.random() * 10 : 10 + Math.random() * 14) * Math.min(1.3, spread);
        parts.push({
          type: "dust", x: x + (Math.random() - 0.5) * (ring ? 16 : 30), y: y + (Math.random() - 0.5) * (ring ? 4 : 8),
          vx: Math.cos(a) * v * 1.5, vy: ring ? Math.sin(a) * v * 0.32 - 0.6 : Math.sin(a) * v * 0.55,
          g: -0.02, drag: 0.93,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.12,
          flip: 0, vf: 0,
          size, size0: size,
          color: colors[(Math.random() * colors.length) | 0],
          life: 0, maxLife: 900 + Math.random() * 700, alpha: 1
        });
      }
      kick();
    },
    clear() { parts = []; },
    destroy() { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); parts = []; }
  };
  return api;
}
