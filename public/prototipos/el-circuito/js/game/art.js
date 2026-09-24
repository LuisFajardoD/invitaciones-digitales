// Arte del parque inflable (Canvas 2D). Todo se pre-renderiza una vez en canvases fuera de pantalla
// (sprite cache) y en el juego sólo se hace drawImage. Estilo: inflables redondeados con contorno
// oscuro, costuras, brillo especular blanco y sombra interna; agua turquesa; cielo de verano.
import { OUTLINE } from "./runner-art.js";

export const PAL = {
  water: "#2EC4B6", waterDeep: "#1A9E9A", foam: "#FFFFFF", skyTop: "#7FD8FF", skyBottom: "#E8FBFF",
  coral: "#FF5A5F", yellow: "#FFC93C", blue: "#3D5AFE", lime: "#9BE564", sand: "#FFE1A8", outline: OUTLINE
};
const Q = 2; // píxeles de sprite por unidad del mundo

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * Q)); c.height = Math.max(1, Math.ceil(h * Q));
  const x = c.getContext("2d");
  x.scale(Q, Q);
  return { c, x, w, h };
}
function rr(x, px, py, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  x.beginPath();
  x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
}
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function outline(x, w = 2.6) { x.lineWidth = w; x.strokeStyle = OUTLINE; x.stroke(); }
/** Relleno de inflable: degradado vertical con brillo arriba y sombra interna abajo. */
function inflateFill(x, px, py, w, h, color) {
  const g = x.createLinearGradient(0, py, 0, py + h);
  g.addColorStop(0, shade(color, 1.18)); g.addColorStop(0.45, color); g.addColorStop(1, shade(color, 0.72));
  x.fillStyle = g;
}
function shine(x, px, py, w, h) {
  x.save();
  x.globalAlpha = 0.75; x.fillStyle = "#FFFFFF";
  x.beginPath(); x.ellipse(px + Math.min(w * 0.22, 40), py + h * 0.28, Math.min(w * 0.14, 26), Math.max(2.5, h * 0.11), -0.1, 0, Math.PI * 2); x.fill();
  x.globalAlpha = 0.5;
  x.beginPath(); x.ellipse(px + Math.min(w * 0.22, 40) + Math.min(w * 0.17, 32), py + h * 0.26, 3.2, 2.4, 0, 0, Math.PI * 2); x.fill();
  x.restore();
}

/* ---------- Plataforma inflable ---------- */
const PH = 46; // alto visible de la plataforma (de la cara superior hacia abajo, en parte bajo el agua)
export function platformSprite(w, color) {
  const { c, x } = canvas(w + 8, PH + 10);
  const px = 4, py = 4;
  rr(x, px, py, w, PH, 20);
  inflateFill(x, px, py, w, PH, color); x.fill(); outline(x);
  // tubo superior (borde inflado)
  rr(x, px + 3, py + 2, w - 6, 15, 8);
  x.fillStyle = shade(color, 1.12); x.fill();
  x.lineWidth = 1.3; x.strokeStyle = shade(color, 0.7); x.stroke();
  // costuras verticales
  x.strokeStyle = shade(color, 0.72); x.lineWidth = 1.4;
  for (let sx = px + 46; sx < px + w - 30; sx += 58) { x.beginPath(); x.moveTo(sx, py + 19); x.lineTo(sx, py + PH - 6); x.stroke(); }
  // franja de color alternativo y agarraderas
  x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(px + 12, py + PH - 16, w - 24, 3);
  shine(x, px, py, w, 18);
  return { c, ox: -4, oy: -4, w: w + 8, h: PH + 10 };
}

/* ---------- Trampolín ---------- */
export function trampSprite(w) {
  const { c, x } = canvas(w + 8, 34);
  // base/marco coral con resortes
  rr(x, 4, 12, w, 20, 10); inflateFill(x, 4, 12, w, 20, PAL.coral); x.fill(); outline(x);
  x.strokeStyle = OUTLINE; x.lineWidth = 1.6;
  for (let k = 0; k < 4; k++) { const sx = 14 + k * ((w - 20) / 3); x.beginPath(); x.moveTo(sx - 3, 26); x.lineTo(sx + 3, 22); x.lineTo(sx - 3, 18); x.lineTo(sx + 3, 14); x.stroke(); }
  // lona elástica
  rr(x, 2, 4, w + 4, 11, 6); x.fillStyle = PAL.blue; x.fill(); outline(x, 2.2);
  x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(12, 6.5, w * 0.35, 2.4);
  // flechas "¡arriba!"
  x.fillStyle = PAL.yellow;
  for (const ax of [w * 0.5 - 12, w * 0.5 + 8]) { x.beginPath(); x.moveTo(ax, 13); x.lineTo(ax + 5, 7.5); x.lineTo(ax + 10, 13); x.closePath(); x.fill(); }
  return { c, ox: -4, oy: -4, w: w + 8, h: 34 };
}

/* ---------- Rodillo a rayas (gira) ---------- */
export function rollerSprite(r) {
  const d = r * 2 + 8;
  const { c, x } = canvas(d, d);
  const cx = d / 2, cy = d / 2;
  const cols = [PAL.coral, "#FFFFFF", PAL.yellow, "#FFFFFF"];
  for (let k = 0; k < 8; k++) {
    x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, (k / 8) * Math.PI * 2, ((k + 1) / 8) * Math.PI * 2); x.closePath();
    x.fillStyle = cols[k % 4]; x.fill();
  }
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); outline(x);
  x.beginPath(); x.arc(cx, cy, r * 0.28, 0, Math.PI * 2); x.fillStyle = PAL.blue; x.fill(); outline(x, 2);
  return { c, ox: -d / 2, oy: -d / 2, w: d, h: d };
}
/** Brillo fijo (no gira) encima del rodillo o la pelota. */
export function glossSprite(r) {
  const d = r * 2 + 4;
  const { c, x } = canvas(d, d);
  const g = x.createRadialGradient(d * 0.35, d * 0.3, 1, d / 2, d / 2, r);
  g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(0.35, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(27,31,59,.22)");
  x.beginPath(); x.arc(d / 2, d / 2, r - 1, 0, Math.PI * 2); x.fillStyle = g; x.fill();
  return { c, ox: -d / 2, oy: -d / 2, w: d, h: d };
}
/* ---------- Pelota de playa gigante ---------- */
export function ballSprite(r) {
  const d = r * 2 + 8;
  const { c, x } = canvas(d, d);
  const cx = d / 2, cy = d / 2;
  const cols = [PAL.coral, "#FFFFFF", PAL.blue, "#FFFFFF", PAL.yellow, "#FFFFFF"];
  for (let k = 0; k < 6; k++) {
    x.beginPath(); x.moveTo(cx, cy); x.ellipse(cx, cy, r, r, 0, (k / 6) * Math.PI * 2, ((k + 1) / 6) * Math.PI * 2); x.closePath();
    x.fillStyle = cols[k]; x.fill();
  }
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); outline(x);
  x.beginPath(); x.arc(cx, cy, r * 0.18, 0, Math.PI * 2); x.fillStyle = "#FFFFFF"; x.fill(); outline(x, 1.8);
  return { c, ox: -d / 2, oy: -d / 2, w: d, h: d };
}

/* ---------- Poste de la barra barredora ---------- */
export function postSprite() {
  const { c, x } = canvas(26, 48);
  rr(x, 5, 4, 16, 42, 7); inflateFill(x, 5, 4, 16, 42, PAL.yellow); x.fill(); outline(x);
  x.beginPath(); x.ellipse(13, 6, 9, 5, 0, 0, Math.PI * 2); x.fillStyle = PAL.coral; x.fill(); outline(x, 2);
  return { c, ox: -13, oy: -46, w: 26, h: 48 };
}

/* ---------- Arco de punto de control / meta ---------- */
export function archSprite(n, { finish = false } = {}) {
  const W = finish ? 270 : 210, H = finish ? 250 : 190, t = finish ? 34 : 28;
  const { c, x } = canvas(W + 10, H + 40);
  const col = finish ? PAL.coral : PAL.blue, col2 = finish ? PAL.yellow : PAL.yellow;
  // arco inflable (tubo)
  x.lineCap = "round";
  x.beginPath(); x.moveTo(5 + t / 2, H + 36); x.lineTo(5 + t / 2, H * 0.45); x.arc(5 + W / 2, H * 0.45 + 4, W / 2 - t / 2, Math.PI, 0); x.lineTo(5 + W - t / 2, H + 36);
  x.strokeStyle = OUTLINE; x.lineWidth = t + 5; x.stroke();
  x.strokeStyle = col; x.lineWidth = t; x.stroke();
  x.strokeStyle = shade(col, 1.25); x.lineWidth = t * 0.35; x.setLineDash([]); x.globalAlpha = 0.8;
  x.beginPath(); x.moveTo(5 + t / 2 - 3, H + 30); x.lineTo(5 + t / 2 - 3, H * 0.45); x.arc(5 + W / 2, H * 0.45 + 4, W / 2 - t / 2 - 3, Math.PI, Math.PI * 1.35); x.stroke();
  x.globalAlpha = 1;
  // franjas amarillas en las patas
  for (const lx of [5 + t / 2, 5 + W - t / 2]) for (let k = 0; k < 3; k++) { x.fillStyle = col2; x.fillRect(lx - t / 2 + 1.5, H - 10 + k * 18, t - 3, 7); }
  // bandera de cuadros arriba
  const fw = finish ? 150 : 104, fh = finish ? 40 : 30, fx = 5 + W / 2 - fw / 2, fy = finish ? 8 : 10;
  rr(x, fx - 3, fy - 3, fw + 6, fh + 6, 8); x.fillStyle = "#FFFFFF"; x.fill(); outline(x);
  const sq = fh / 3;
  for (let i = 0; i < Math.ceil(fw / sq); i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) { x.fillStyle = OUTLINE; x.fillRect(fx + i * sq, fy + j * sq, Math.min(sq, fx + fw - (fx + i * sq)), sq); }
  // insignia con el número o "META"
  const bx = 5 + W / 2, by = fy + fh + (finish ? 26 : 22);
  x.beginPath(); x.arc(bx, by, finish ? 24 : 18, 0, Math.PI * 2); x.fillStyle = col2; x.fill(); outline(x);
  x.fillStyle = OUTLINE; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = `400 ${finish ? 15 : 20}px "Titan One", "Arial Black", sans-serif`;
  x.fillText(finish ? "META" : String(n), bx, by + 1);
  return { c, ox: -(W + 10) / 2, oy: -(H + 36), w: W + 10, h: H + 40 };
}

/* ---------- Torre y tobogán (geometría fija del recorrido) ---------- */
export function towerSprite(w, h) {
  const { c, x } = canvas(w + 8, h + 10);
  // columna inflable con anillos
  rr(x, 18, 30, w - 28, h - 26, 16); inflateFill(x, 18, 30, w - 28, h - 26, PAL.yellow); x.fill(); outline(x);
  for (let yy = 60; yy < h; yy += 44) { x.strokeStyle = shade(PAL.yellow, 0.72); x.lineWidth = 1.6; x.beginPath(); x.moveTo(22, yy); x.lineTo(w - 14, yy); x.stroke(); }
  // escalera pintada
  x.strokeStyle = "rgba(27,31,59,.35)"; x.lineWidth = 2;
  for (let yy = 50; yy < h - 10; yy += 18) { x.beginPath(); x.moveTo(w / 2 - 10, yy); x.lineTo(w / 2 + 10, yy); x.stroke(); }
  // plataforma superior
  rr(x, 4, 4, w, 34, 16); inflateFill(x, 4, 4, w, 34, PAL.coral); x.fill(); outline(x);
  shine(x, 4, 4, w, 16);
  return { c, ox: -4, oy: -4, w: w + 8, h: h + 10 };
}
export function slideSprite(sl, yOf) {
  const w = sl.x1 - sl.x0, top = sl.y0 + 40, H = top + 20;
  const { c, x } = canvas(w + 20, H);
  const Y = (wx) => top - yOf(wx) + 4; // de altura del mundo a y del sprite
  const pts = [];
  for (let k = 0; k <= 40; k++) { const wx = sl.x0 + (k / 40) * w; pts.push([k / 40 * w + 10, Y(wx)]); }
  // soportes
  x.strokeStyle = OUTLINE; x.lineWidth = 5;
  for (let k = 1; k < 5; k++) { const p = pts[k * 8]; x.beginPath(); x.moveTo(p[0], p[1] + 10); x.lineTo(p[0], H); x.stroke(); x.strokeStyle = PAL.yellow; x.lineWidth = 3; x.beginPath(); x.moveTo(p[0], p[1] + 10); x.lineTo(p[0], H); x.stroke(); x.strokeStyle = OUTLINE; x.lineWidth = 5; }
  // canal (tubo azul con borde)
  const band = (off, col, lw) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py + off) : x.moveTo(px, py + off))); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = "round"; x.lineJoin = "round"; x.stroke(); };
  band(8, OUTLINE, 24); band(8, PAL.blue, 18); band(4, "#8FE3FF", 7); band(2, "#FFFFFF", 2.2);
  return { c, ox: -10, oy: -(top + 4), w: w + 20, h: H };
}

/* ---------- Podio ---------- */
export function podiumSprite() {
  const W = 250, H = 120;
  const { c, x } = canvas(W + 8, H + 8);
  const block = (bx, bw, bh, col, n) => {
    rr(x, bx, H - bh + 4, bw, bh, 12); inflateFill(x, bx, H - bh + 4, bw, bh, col); x.fill(); outline(x);
    shine(x, bx, H - bh + 4, bw, 16);
    x.fillStyle = "#FFFFFF"; x.font = `400 ${n === 1 ? 34 : 26}px "Titan One", "Arial Black", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
    x.lineWidth = 4; x.strokeStyle = OUTLINE; x.strokeText(String(n), bx + bw / 2, H - bh + 4 + bh * 0.55); x.fillText(String(n), bx + bw / 2, H - bh + 4 + bh * 0.55);
  };
  block(4, 80, 70, PAL.blue, 2);
  block(168, 80, 52, PAL.lime, 3);
  block(84, 84, 100, PAL.yellow, 1);
  return { c, ox: -(W + 8) / 2, oy: -(H + 4), w: W + 8, h: H + 8, tops: { 1: 100, 2: 70, 3: 52 }, xs: { 1: 0, 2: -80, 3: 83 } };
}

/* ---------- Boya (marca de reaparición) ---------- */
export function buoySprite() {
  const { c, x } = canvas(30, 44);
  x.strokeStyle = OUTLINE; x.lineWidth = 2; x.beginPath(); x.moveTo(15, 18); x.lineTo(15, 3); x.stroke();
  x.beginPath(); x.moveTo(15, 3); x.lineTo(26, 7); x.lineTo(15, 11); x.closePath(); x.fillStyle = PAL.yellow; x.fill(); outline(x, 1.6);
  x.beginPath(); x.ellipse(15, 28, 11, 12, 0, 0, Math.PI * 2); x.fillStyle = PAL.coral; x.fill(); outline(x);
  x.fillStyle = "#FFFFFF"; x.fillRect(5, 25, 20, 5);
  x.globalAlpha = 0.6; x.beginPath(); x.ellipse(11, 22, 3, 4, -0.3, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
  return { c, ox: -15, oy: -36, w: 30, h: 44 };
}

/* ---------- Burbuja con foto ---------- */
export function bubbleSprite(img) {
  const R = 32, d = R * 2 + 6;
  const { c, x } = canvas(d, d);
  const cx = d / 2, cy = d / 2;
  // polaroid inclinada
  x.save(); x.translate(cx, cy); x.rotate(-0.12);
  rr(x, -15, -19, 30, 36, 3); x.fillStyle = "#FFFFFF"; x.fill(); outline(x, 1.8);
  if (img) { try { x.drawImage(img, -12, -16, 24, 24); } catch { /* sin imagen */ } }
  else { x.fillStyle = "#BDEFF0"; x.fillRect(-12, -16, 24, 24); }
  x.restore();
  // burbuja
  const g = x.createRadialGradient(cx - 9, cy - 11, 2, cx, cy, R);
  g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.55, "rgba(180,245,255,.12)"); g.addColorStop(1, "rgba(120,220,255,.45)");
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fillStyle = g; x.fill();
  x.lineWidth = 2; x.strokeStyle = "rgba(255,255,255,.95)"; x.stroke();
  x.beginPath(); x.arc(cx, cy, R, 0.2, 1.3); x.lineWidth = 2.2; x.strokeStyle = "rgba(61,90,254,.55)"; x.stroke();
  x.beginPath(); x.ellipse(cx - 12, cy - 14, 7, 4, -0.6, 0, Math.PI * 2); x.fillStyle = "rgba(255,255,255,.85)"; x.fill();
  return { c, ox: -d / 2, oy: -d / 2, w: d, h: d };
}

/* ---------- Fondo en parallax ---------- */
export function sunSprite() {
  const { c, x } = canvas(220, 220);
  const g = x.createRadialGradient(110, 110, 30, 110, 110, 110);
  g.addColorStop(0, "rgba(255,244,190,1)"); g.addColorStop(0.35, "rgba(255,236,160,.85)"); g.addColorStop(0.45, "rgba(255,240,190,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 220, 220);
  x.beginPath(); x.arc(110, 110, 42, 0, Math.PI * 2); x.fillStyle = "#FFF3B0"; x.fill();
  return { c, ox: -110, oy: -110, w: 220, h: 220 };
}
export function cloudSprite(seed) {
  const W = 190, H = 80;
  const { c, x } = canvas(W, H);
  const puffs = seed % 2 ? [[40, 50, 26], [75, 36, 32], [115, 44, 28], [150, 54, 22], [95, 58, 26]] : [[38, 52, 22], [70, 40, 28], [108, 34, 30], [142, 48, 24], [90, 58, 26]];
  x.fillStyle = "rgba(255,255,255,.95)";
  for (const [px, py, r] of puffs) { x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = "rgba(200,238,255,.55)";
  x.fillRect(20, 58, 150, 12);
  return { c, ox: 0, oy: 0, w: W, h: H };
}
/** Isla lejana con montañas y palmeras (capa lejana). */
export function farIslandSprite() {
  const W = 900, H = 190;
  const { c, x } = canvas(W, H);
  // montañas azuladas
  x.fillStyle = "#9DD7E6";
  x.beginPath(); x.moveTo(60, 170); x.lineTo(210, 40); x.lineTo(300, 110); x.lineTo(390, 60); x.lineTo(560, 170); x.closePath(); x.fill();
  x.fillStyle = "#B8E6EF";
  x.beginPath(); x.moveTo(420, 170); x.lineTo(560, 70); x.lineTo(720, 170); x.closePath(); x.fill();
  // isla verde con playa
  x.fillStyle = "#7FC9A4";
  x.beginPath(); x.ellipse(330, 172, 260, 34, 0, Math.PI, 0); x.fill();
  x.fillStyle = "#FFE9C2"; x.fillRect(90, 168, 480, 8);
  // palmeras
  const palm = (px, ph, lean) => {
    x.strokeStyle = "#8C6A4A"; x.lineWidth = 5; x.lineCap = "round";
    x.beginPath(); x.moveTo(px, 170); x.quadraticCurveTo(px + lean, 170 - ph / 2, px + lean * 1.4, 170 - ph); x.stroke();
    x.fillStyle = "#4FB38A";
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; x.beginPath(); x.ellipse(px + lean * 1.4 + Math.cos(a) * 14, 170 - ph + Math.sin(a) * 5 + 3, 17, 5, a, 0, Math.PI * 2); x.fill(); }
  };
  palm(170, 70, 8); palm(210, 56, -6); palm(420, 76, 10); palm(470, 60, -8); palm(520, 48, 6);
  return { c, ox: 0, oy: -H, w: W, h: H };
}
/** Capa media: flotadores, boyas lejanas y una bandera de meta a lo lejos. */
export function midLayerSprite() {
  const W = 1200, H = 120;
  const { c, x } = canvas(W, H);
  const ring = (px, col) => {
    x.beginPath(); x.ellipse(px, H - 18, 30, 11, 0, 0, Math.PI * 2); x.fillStyle = col; x.fill(); outline(x, 2);
    x.beginPath(); x.ellipse(px, H - 20, 13, 4.5, 0, 0, Math.PI * 2); x.fillStyle = "#6FD9CF"; x.fill(); outline(x, 1.6);
    x.fillStyle = "rgba(255,255,255,.6)"; x.fillRect(px - 22, H - 25, 8, 3);
  };
  ring(120, PAL.coral); ring(560, PAL.yellow); ring(930, PAL.lime);
  // boyas con banderín
  for (const px of [330, 760, 1100]) {
    x.beginPath(); x.ellipse(px, H - 18, 9, 11, 0, 0, Math.PI * 2); x.fillStyle = "#FFFFFF"; x.fill(); outline(x, 1.8);
    x.fillStyle = PAL.coral; x.fillRect(px - 9, H - 22, 18, 5);
  }
  // bandera de meta lejana
  x.strokeStyle = OUTLINE; x.lineWidth = 3; x.beginPath(); x.moveTo(460, H - 12); x.lineTo(460, 10); x.stroke();
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { x.fillStyle = (i + j) % 2 ? "#FFFFFF" : OUTLINE; x.fillRect(462 + i * 8, 12 + j * 8, 8, 8); }
  // pato de hule... no: un flotador de rayas
  x.beginPath(); x.ellipse(250, H - 16, 40, 9, 0, 0, Math.PI * 2); x.fillStyle = PAL.blue; x.fill(); outline(x, 2);
  x.fillStyle = "#FFFFFF"; for (let k = -2; k <= 2; k++) x.fillRect(250 + k * 14 - 3, H - 24, 5, 15);
  return { c, ox: 0, oy: -H, w: W, h: H };
}
/** Degradado del agua (columna de 1 px de ancho, se estira). */
export function waterGradient(h) {
  const cv = document.createElement("canvas"); cv.width = 1; cv.height = Math.max(2, Math.ceil(h));
  const x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, "#46D6C8"); g.addColorStop(0.18, PAL.water); g.addColorStop(1, PAL.waterDeep);
  x.fillStyle = g; x.fillRect(0, 0, 1, cv.height);
  return cv;
}
export function skyGradient(h) {
  const cv = document.createElement("canvas"); cv.width = 1; cv.height = Math.max(2, Math.ceil(h));
  const x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0, PAL.skyTop); g.addColorStop(1, PAL.skyBottom);
  x.fillStyle = g; x.fillRect(0, 0, 1, cv.height);
  return cv;
}

/** Dibuja un sprite en coordenadas del mundo (x, y = altura; y hacia arriba). */
export function drawSprite(ctx, sp, x, y, sx = 1, sy = 1, rot = 0) {
  if (!rot && sx === 1 && sy === 1) { ctx.drawImage(sp.c, x + sp.ox, -y + sp.oy, sp.w, sp.h); return; }
  ctx.save(); ctx.translate(x, -y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
  ctx.drawImage(sp.c, sp.ox, sp.oy, sp.w, sp.h);
  ctx.restore();
}
