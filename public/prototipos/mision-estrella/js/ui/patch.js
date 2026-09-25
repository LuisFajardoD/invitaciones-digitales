// Parche de misión bordado: símbolos, dibujo en canvas (vista previa del formulario y textura 3D del mural)
// y versión SVG (versión ilustrada y tema del panel RSVP). Mismo diseño en los tres lugares.
export const PATCH_COLORS = ["#FF8FA3", "#6FD6E8", "#B9A2FF", "#FFD27A", "#9BE5B4", "#FFB38A"];
export const PATCH_SYMBOLS = ["star", "rocket", "planet", "heart", "moon", "comet"];
export const SYMBOL_LABELS = { star: "Estrella", rocket: "Cohete", planet: "Planeta", heart: "Corazón", moon: "Luna", comet: "Cometa" };
const INK = "#1E1B4B", CREAM = "#FFF7EC";

/** Símbolos en un cuadro de 24×24: trazos { d, fill } o { d, stroke: ancho }. */
export const SYMBOLS = {
  star: [{ d: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z", fill: true }],
  heart: [{ d: "M12 21s-8-5-9.6-10C1.2 7.2 3.6 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.8 3.2 4.6 7C20 16 12 21 12 21z", fill: true }],
  moon: [{ d: "M15 2.6a9.4 9.4 0 1 0 6.4 15.9A7.6 7.6 0 0 1 15 2.6z", fill: true }],
  planet: [{ d: "M12 6.6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8z", fill: true }, { d: "M2.4 14.2a10 3.1 -17 1 0 19.2-4.4a10 3.1 -17 1 0-19.2 4.4z", stroke: 1.7 }],
  rocket: [{ d: "M12 1.8c3 2.3 4.5 5.7 4.5 9.5v3.9l2.5 2.6v2.6l-4-1.6H9l-4 1.6v-2.6l2.5-2.6v-3.9C7.5 7.5 9 4.1 12 1.8zM12 7.4a2 2 0 1 0 0 4a2 2 0 1 0 0-4z", fill: true, evenodd: true }, { d: "M10 20h4l-2 3.2z", fill: true }],
  comet: [{ d: "M16 3.8a3.8 3.8 0 1 1 0 7.6a3.8 3.8 0 1 1 0-7.6z", fill: true }, { d: "M13.2 10.6L3 20.8M11.6 7.6L4.2 12M16.6 12.6L12.2 19.8", stroke: 2 }]
};

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Texto en arco (arriba: de izquierda a derecha por encima; abajo: por debajo). */
function arcText(ctx, text, cx, cy, r, top, size) {
  ctx.save();
  ctx.font = `600 ${size}px Fredoka, "Figtree", system-ui, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + size * 0.06);
  const total = widths.reduce((a, b) => a + b, 0);
  const maxAng = Math.PI * 0.82;
  const scale = Math.min(1, (maxAng * r) / total);
  let ang = -(total * scale) / r / 2;
  chars.forEach((c, i) => {
    const w = (widths[i] * scale) / r;
    const a = ang + w / 2;
    ctx.save();
    if (top) { ctx.translate(cx + Math.sin(a) * r, cy - Math.cos(a) * r); ctx.rotate(a); }
    else { ctx.translate(cx + Math.sin(a) * r, cy + Math.cos(a) * r); ctx.rotate(-a); }
    ctx.scale(scale, 1);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    ang += w;
  });
  ctx.restore();
}

/**
 * Dibuja el parche en un canvas cuadrado de lado S. opts: { color, symbol, top, bottom, you, stitch (0–1) }.
 * stitch < 1 dibuja sólo una parte de las puntadas (animación de coser).
 */
export function drawPatch(ctx, S, { color = PATCH_COLORS[0], symbol = "star", top = "", bottom = "", you = false, stitch = 1 } = {}) {
  const c = S / 2, R = S * 0.47;
  ctx.clearRect(0, 0, S, S);
  // borde bordado (merrow): anillo oscuro con puntadas radiales
  ctx.fillStyle = shade(color, 0.55); ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(color, 0.72); ctx.lineWidth = S * 0.012;
  for (let i = 0; i < 110; i++) { const a = (i / 110) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * R * 0.92, c + Math.sin(a) * R * 0.92); ctx.lineTo(c + Math.cos(a + 0.03) * R * 0.995, c + Math.sin(a + 0.03) * R * 0.995); ctx.stroke(); }
  // banda de texto
  ctx.fillStyle = shade(color, 0.78); ctx.beginPath(); ctx.arc(c, c, R * 0.9, 0, Math.PI * 2); ctx.fill();
  // tela central con trama sutil
  ctx.save(); ctx.beginPath(); ctx.arc(c, c, R * 0.64, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = Math.max(1, S * 0.004);
  for (let x = -S; x < S * 2; x += S * 0.022) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + S, S); ctx.stroke(); }
  ctx.strokeStyle = "rgba(30,27,75,.06)";
  for (let x = -S; x < S * 2; x += S * 0.022) { ctx.beginPath(); ctx.moveTo(x, S); ctx.lineTo(x + S, 0); ctx.stroke(); }
  const g = ctx.createRadialGradient(c - R * 0.2, c - R * 0.25, R * 0.05, c, c, R * 0.7);
  g.addColorStop(0, "rgba(255,255,255,.28)"); g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  ctx.restore();
  // símbolo bordado
  ctx.save();
  const k = (S * 0.5) / 24;
  ctx.translate(c - 12 * k, c - 12 * k + S * 0.005); ctx.scale(k, k);
  for (const pass of [0, 1]) {
    for (const p of SYMBOLS[symbol] || SYMBOLS.star) {
      const path = new Path2D(p.d);
      if (pass === 0) { ctx.save(); ctx.translate(0.5, 0.8); ctx.fillStyle = ctx.strokeStyle = "rgba(30,27,75,.35)"; ctx.lineWidth = (p.stroke || 0) + 0.6; ctx.lineCap = "round"; if (p.fill) ctx.fill(path, p.evenodd ? "evenodd" : "nonzero"); else ctx.stroke(path); ctx.restore(); continue; }
      ctx.fillStyle = ctx.strokeStyle = CREAM; ctx.lineWidth = p.stroke || 1; ctx.lineCap = "round";
      if (p.fill) ctx.fill(path, p.evenodd ? "evenodd" : "nonzero"); else ctx.stroke(path);
    }
  }
  ctx.restore();
  // textos en arco
  ctx.fillStyle = CREAM;
  if (top) arcText(ctx, top.toUpperCase(), c, c, R * 0.77, true, S * 0.1);
  if (bottom) arcText(ctx, bottom.toUpperCase(), c, c, R * 0.77, false, S * 0.075);
  // puntadas (costura) alrededor de la tela y del borde
  ctx.save();
  ctx.strokeStyle = CREAM; ctx.lineWidth = S * 0.012; ctx.lineCap = "round"; ctx.setLineDash([S * 0.022, S * 0.018]);
  const end = -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, stitch));
  if (stitch > 0) { ctx.beginPath(); ctx.arc(c, c, R * 0.64, -Math.PI / 2, end); ctx.stroke(); ctx.beginPath(); ctx.arc(c, c, R * 0.88, -Math.PI / 2, end); ctx.stroke(); }
  ctx.restore();
  if (you) { // etiqueta "TÚ"
    const w = S * 0.3, hh = S * 0.13, x = c - w / 2, y = S - hh * 1.05;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, hh, hh / 2) : ctx.rect(x, y, w, hh); ctx.fill();
    ctx.fillStyle = "#FFD27A"; ctx.font = `600 ${hh * 0.72}px Fredoka, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("TÚ", c, y + hh * 0.55);
  }
}

/** Canvas nuevo con el parche. */
export function patchCanvas(size, opts) {
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  drawPatch(cv.getContext("2d"), size, opts);
  return cv;
}

const escXml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** Símbolo como SVG (dentro de un <g> ya escalado a 24×24). */
export function symbolSVG(symbol, color = CREAM) {
  return (SYMBOLS[symbol] || SYMBOLS.star).map((p) => p.fill
    ? `<path d="${p.d}" fill="${color}"${p.evenodd ? ' fill-rule="evenodd"' : ""}/>`
    : `<path d="${p.d}" fill="none" stroke="${color}" stroke-width="${p.stroke}" stroke-linecap="round"/>`).join("");
}
let svgId = 0;
/** Parche en SVG (versión ilustrada y panel RSVP). */
export function patchSVG({ color = PATCH_COLORS[0], symbol = "star", top = "", bottom = "", you = false } = {}, size = 64) {
  const id = `pt${++svgId}`;
  const ticks = Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return `M${(50 + Math.cos(a) * 43.5).toFixed(1)} ${(50 + Math.sin(a) * 43.5).toFixed(1)}L${(50 + Math.cos(a + 0.05) * 47).toFixed(1)} ${(50 + Math.sin(a + 0.05) * 47).toFixed(1)}`; }).join("");
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><path id="${id}t" d="M16 50a34 34 0 0 1 68 0"/><path id="${id}b" d="M17 50a33 33 0 0 0 66 0"/>
    <pattern id="${id}w" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v3" stroke="#fff" stroke-opacity=".12" stroke-width="1"/></pattern></defs>
    <circle cx="50" cy="50" r="47" fill="${shade(color, 0.55)}"/>
    <path d="${ticks}" stroke="${shade(color, 0.72)}" stroke-width="1.4"/>
    <circle cx="50" cy="50" r="42" fill="${shade(color, 0.78)}"/>
    <circle cx="50" cy="50" r="30" fill="${color}"/><circle cx="50" cy="50" r="30" fill="url(#${id}w)"/>
    <g transform="translate(26.5 26.8) scale(1.96)">${symbolSVG(symbol, "rgba(30,27,75,.3)").replace(/<path /g, '<path transform="translate(.3 .5)" ')}${symbolSVG(symbol)}</g>
    <circle cx="50" cy="50" r="30" fill="none" stroke="${CREAM}" stroke-width="1.3" stroke-dasharray="2.2 1.8"/>
    <circle cx="50" cy="50" r="41.3" fill="none" stroke="${CREAM}" stroke-width="1.3" stroke-dasharray="2.2 1.8"/>
    ${top ? `<text font-family="Fredoka, system-ui, sans-serif" font-weight="600" font-size="9.5" fill="${CREAM}" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${escXml(String(top).toUpperCase().slice(0, 16))}</textPath></text>` : ""}
    ${bottom ? `<text font-family="Fredoka, system-ui, sans-serif" font-weight="600" font-size="7" fill="${CREAM}" text-anchor="middle" dominant-baseline="hanging"><textPath href="#${id}b" startOffset="50%">${escXml(String(bottom).toUpperCase().slice(0, 24))}</textPath></text>` : ""}
    ${you ? `<rect x="35" y="86" width="30" height="13" rx="6.5" fill="${INK}"/><text x="50" y="95.5" font-family="Fredoka, system-ui, sans-serif" font-weight="600" font-size="9" fill="#FFD27A" text-anchor="middle">TÚ</text>` : ""}
  </svg>`;
}
