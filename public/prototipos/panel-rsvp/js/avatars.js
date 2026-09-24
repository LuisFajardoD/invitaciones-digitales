// Dibujos de avatar reutilizables por los temas. Reutiliza el arte de cada invitación:
// el mini personaje plano de Temporada 8 y los símbolos de los bloques de Isla Cubo.
import { flatAvatarSVG } from "../../temporada-8/js/icons.js";
import { SYMBOLS } from "../../isla-cubo/js/symbols.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function shade(hex, k) {
  const n = parseInt(String(hex).slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Mini personaje de bloques (Temporada 8), con su color y peinado. */
export function t8Character({ color = "#4CC9F0", hair = "short" } = {}, size = 44) {
  return flatAvatarSVG({ shirt: color, style: hair }, size);
}

/** Bloque isométrico con bisel, su color y su símbolo al frente (Isla Cubo). */
export function islaBlock({ color = "#FF6B6B", symbol = "star" } = {}, size = 44) {
  const B = "#5B3A1E", d = (SYMBOLS[symbol] || SYMBOLS.star).d;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <path d="M32 6 57 19.5v1.3L32 34.3 7 20.8v-1.3z" fill="${shade(color, 1.12)}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M7 20.8 32 34.3V59L8.8 46.4C7.7 45.8 7 44.7 7 43.4z" fill="${color}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M57 20.8 32 34.3V59l23.2-12.6c1.1-.6 1.8-1.7 1.8-3z" fill="${shade(color, 0.74)}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 20l18-9.6" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(10.5 27.5) skewY(28) scale(.72)"><path d="${d}" fill="#fff" stroke="${B}" stroke-width="2" stroke-linejoin="round" fill-rule="evenodd"/></g>
  </svg>`;
}

/** Círculo con iniciales (tema por defecto). */
export function initials(name = "", { color = "#6B7AFF", text = "#fff" } = {}, size = 44) {
  const ini = String(name).replace(/^(familia|abuelos|tía|tío)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return `<svg viewBox="0 0 44 44" width="${size}" height="${size}" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="${color}"/><text x="22" y="22" dy=".35em" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="${text}">${esc(ini)}</text></svg>`;
}
