// Tema Isla Cubo: isla isométrica de bloques flotando al atardecer, pergamino con esquinas
// escalonadas, botones de madera y caramelo, Bungee + Nunito.
import { islaBlock } from "../js/avatars.js";

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Isla isométrica compacta (misma técnica que la versión sin WebGL de la invitación). */
function islandSVG(accent = "#4CC9F0") {
  const S = 9;
  const iso = (x, y, z) => [160 + (x - z) * S * 0.87, 84 + (x + z) * S * 0.5 - y * S];
  const cubes = [];
  const add = (x, y, z, c) => cubes.push({ x, y, z, c });
  for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) {
    const r = Math.hypot(x, z);
    if (r > 6.3 + Math.sin(Math.atan2(z, x) * 3) * 0.6) continue;
    const depth = Math.round(1 + (1 - r / 6.5) * 4);
    for (let y = -depth; y <= 0; y++) add(x, y, z, y === 0 ? "#8BD46E" : y > -2 ? "#C98E5A" : "#9C8F86");
  }
  for (let x = -4; x <= -2; x++) for (let z = 1; z <= 2; z++) { add(x, 1, z, "#FFF6E5"); add(x, 2, z, "#FF6B6B"); }
  for (let y = 1; y <= 4; y++) add(3, y, -2, y === 3 ? "#FFD23F" : "#D8CFC4");
  add(3, 5, -2, "#E4574C");
  for (let y = 1; y <= 2; y++) add(-3, y, -3, "#A8683A");
  [[-4, -3], [-3, -4], [-2, -3], [-3, -2], [-3, -3]].forEach(([x, z]) => add(x, 3, z, "#6CC24A"));
  add(2, 1, 3, "#A8683A"); add(3, 1, 3, "#F2C94C");
  [[0, 1, -1], [1, 1, -1], [0, 2, -1]].forEach(([x, y, z]) => add(x, y, z, accent));
  cubes.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y);
  const poly = ({ x, y, z, c }) => {
    const [px, py] = iso(x, y, z), w = S * 0.87, hh = S * 0.5;
    return `<polygon points="${px},${py - hh} ${px + w},${py} ${px},${py + hh} ${px - w},${py}" fill="${shade(c, 1.08)}"/><polygon points="${px - w},${py} ${px},${py + hh} ${px},${py + hh + S} ${px - w},${py + S}" fill="${shade(c, 0.86)}"/><polygon points="${px + w},${py} ${px},${py + hh} ${px},${py + hh + S} ${px + w},${py + S}" fill="${shade(c, 0.7)}"/>`;
  };
  return `<g stroke="rgba(91,58,30,.35)" stroke-width=".6" stroke-linejoin="round">${cubes.map(poly).join("")}</g>`;
}

export default {
  id: "isla-cubo",
  avatarStyle: "isla-block",
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@400;700;900&display=swap",
    display: "'Bungee', 'Arial Black', sans-serif",
    body: "'Nunito', system-ui, sans-serif",
    displayWeight: 400
  },
  tokens: {
    bg: "#FBEFD9", surface: "#FFF6E5", surfaceAlt: "#FFFBF2",
    text: "#3A2410", muted: "#7A5B3E",
    primary: "#F6B04A", onPrimary: "#5B3A1E", accent: "#4CC9F0",
    success: "#3F8A26", warn: "#C23B3B",
    line: "#5B3A1E", lineStrong: "#5B3A1E",
    radius: "8px", radiusSm: "7px",
    borderWidth: "3px", shadow: "0 5px 0 #C4761F, 0 5px 0 3px #5B3A1E", pressShadow: "0 0 0 #C4761F, 0 0 0 3px #5B3A1E",
    heroBg: "linear-gradient(180deg, #FF9E6B 0%, #D9A0E0 55%, #B388FF 100%)", heroText: "#FFF6E5",
    wallBg: "repeating-linear-gradient(0deg, transparent 0 38px, rgba(91,58,30,.14) 38px 41px), repeating-linear-gradient(90deg, #D8CFC4 0 58px, #C4B8AC 58px 61px)", wallText: "#3A2410", noteBg: "#FFFBF2"
  },
  vocabulary: { guests: "Exploradores", list: "Bloques en el muro", confirmed: "Bloques colocados", guest: "explorador", wallHint: "Toca un bloque para ver su respuesta" },
  ui: { panel: "stepped", button: "wood" },

  renderHero(container, ev) {
    const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#FFE8EC" opacity=".9"><rect x="0" y="12" width="60" height="18" rx="6"/><rect x="12" y="0" width="30" height="26" rx="6"/><rect x="34" y="6" width="22" height="20" rx="6"/></g>`;
    container.innerHTML = `<svg viewBox="0 0 320 170" role="img" aria-label="La isla de bloques de ${ev.childName}">
      <circle cx="262" cy="118" r="44" fill="#FFE7A8" opacity=".55"/>
      ${cloud(14, 30, 1)}${cloud(236, 20, 0.8)}${cloud(40, 128, 0.7)}${cloud(240, 136, 0.9)}
      <g class="hero-float">${islandSVG()}</g>
    </svg>`;
  },
  renderGuestAvatar(r, size = 44) {
    return islaBlock({ color: r.avatar?.color, symbol: r.avatar?.symbol }, size);
  }
};
