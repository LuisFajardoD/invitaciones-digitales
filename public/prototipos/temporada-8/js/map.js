// Mapa ilustrado genérico (vista desde arriba) en SVG: calles, río, lago, parque,
// casas y árboles de bloques, y el salón destacado en demoData.event.mapPin.
// Se usa en la pantalla Mapa y en la aproximación del salto.
import { rng, clamp } from "./util.js";

export const MAP_SIZE = 1000;
const NAVY = "#1B2A6B";

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const cx = x1 + dx * t, cy = y1 + dy * t;
  return Math.hypot(px - cx, py - cy);
}
const polyDist = (px, py, pts) => {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, py, ...pts[i], ...pts[i + 1]));
  return d;
};

/** Curva suave (Catmull-Rom → Bézier) a partir de puntos. */
function smoothPath(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function pinPoint(pin) {
  return { x: clamp(pin.x, 0.12, 0.88) * MAP_SIZE, y: clamp(pin.y, 0.12, 0.88) * MAP_SIZE };
}

let cache = new Map();

/** SVG completo del mapa (string). */
export function mapSVG(pin, { cls = "" } = {}) {
  const key = `${pin.x},${pin.y}`;
  if (!cache.has(key)) cache.set(key, buildMap(pin));
  return `<svg class="map-svg ${cls}" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${cache.get(key)}</svg>`;
}

function buildMap(pin) {
  const { x: px, y: py } = pinPoint(pin);
  const R = rng(8081);
  const mirror = px < MAP_SIZE / 2; // el río siempre queda del lado opuesto al salón
  const mx = (x) => (mirror ? MAP_SIZE - x : x);

  // Río y lago
  const river = [[-40, 110], [150, 150], [270, 290], [225, 450], [275, 610], [210, 760]].map(([x, y]) => [mx(x), y]);
  const lake = { x: mx(170), y: 830, rx: 150, ry: 95 };

  // Calles (relativas al salón)
  const roads = [];
  const hy = clamp(py + 112, 80, 920);
  const vx = clamp(px - 172, 80, 920);
  roads.push([-40, hy, 1040, hy], [vx, -40, vx, 1040]);
  roads.push(Math.abs(py - 150) > 230 ? [-40, 150, 1040, 150] : [-40, 870, 1040, 870]);
  roads.push(Math.abs(px - 860) > 240 ? [860, -40, 860, 1040] : [140, -40, 140, 1040]);

  // Parque
  let park = {
    x0: clamp(px + 130, 40, 960), x1: clamp(px + 440, 40, 960),
    y0: clamp(py + 160, 40, 960), y1: clamp(py + 420, 40, 960)
  };
  if (park.x1 - park.x0 < 170) park = { x0: clamp(px - 460, 40, 960), x1: clamp(px - 200, 40, 960), y0: park.y0, y1: park.y1 };
  const inPark = (x, y) => x > park.x0 && x < park.x1 && y > park.y0 && y < park.y1;

  const nearRoad = (x, y, m) => roads.some((r) => segDist(x, y, ...r) < m);
  const nearRiver = (x, y, m) => polyDist(x, y, river) < m;
  const inLake = (x, y, m = 0) => ((x - lake.x) / (lake.rx + m)) ** 2 + ((y - lake.y) / (lake.ry + m)) ** 2 < 1;
  const nearVenue = (x, y) => Math.abs(x - px) < 160 && Math.abs(y - py) < 140;

  let out = "";

  // Suelo con parches de pradera
  out += `<rect width="${MAP_SIZE}" height="${MAP_SIZE}" fill="#8FD86C"/>`;
  for (let i = 0; i < 26; i++) {
    const w = 90 + R() * 160, hh = 60 + R() * 120;
    out += `<rect x="${(R() * 1000 - w / 2).toFixed(0)}" y="${(R() * 1000 - hh / 2).toFixed(0)}" width="${w.toFixed(0)}" height="${hh.toFixed(0)}" rx="26" fill="${R() > 0.5 ? "#9FE07A" : "#82CD61"}" opacity=".75"/>`;
  }

  // Parque
  if (park.x1 - park.x0 > 120 && park.y1 - park.y0 > 120) {
    out += `<rect x="${park.x0}" y="${park.y0}" width="${park.x1 - park.x0}" height="${park.y1 - park.y0}" rx="40" fill="#B5EC8E" stroke="#6FBF53" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>`;
    const cx = (park.x0 + park.x1) / 2, cy = (park.y0 + park.y1) / 2;
    out += `<path d="M${park.x0 + 20} ${cy}H${park.x1 - 20}M${cx} ${park.y0 + 20}V${park.y1 - 20}" stroke="#F4E6C4" stroke-width="16" stroke-linecap="round"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="40" fill="#F4E6C4" stroke="#DCC89A" stroke-width="5"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="18" fill="#4CC9F0" stroke="${NAVY}" stroke-width="4"/>`;
  }

  // Río con orillas de arena
  const rp = smoothPath(river);
  out += `<ellipse cx="${lake.x}" cy="${lake.y}" rx="${lake.rx + 16}" ry="${lake.ry + 16}" fill="#F1DFAE"/>`;
  out += `<path d="${rp}" fill="none" stroke="#F1DFAE" stroke-width="100" stroke-linecap="round"/>`;
  out += `<ellipse cx="${lake.x}" cy="${lake.y}" rx="${lake.rx}" ry="${lake.ry}" fill="#44BDE8" stroke="#2A9FD6" stroke-width="5"/>`;
  out += `<path d="${rp}" fill="none" stroke="#44BDE8" stroke-width="72" stroke-linecap="round"/>`;
  out += `<path d="${rp}" fill="none" stroke="#8FE3FA" stroke-width="10" stroke-linecap="round" stroke-dasharray="26 40" opacity=".9"/>`;
  out += `<ellipse cx="${lake.x - 40}" cy="${lake.y - 25}" rx="44" ry="12" fill="#8FE3FA" opacity=".8"/>`;
  out += `<ellipse cx="${lake.x + 50}" cy="${lake.y + 20}" rx="26" ry="8" fill="#8FE3FA" opacity=".6"/>`;

  // Calles y puentes
  let bridges = "";
  for (const r of roads) {
    out += `<line x1="${r[0]}" y1="${r[1]}" x2="${r[2]}" y2="${r[3]}" stroke="#CDB68A" stroke-width="62"/>`;
    out += `<line x1="${r[0]}" y1="${r[1]}" x2="${r[2]}" y2="${r[3]}" stroke="#F4E8CC" stroke-width="50"/>`;
    out += `<line x1="${r[0]}" y1="${r[1]}" x2="${r[2]}" y2="${r[3]}" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="20 18" opacity=".9"/>`;
    // Detectar cruce con el río para dibujar puente
    const len = Math.hypot(r[2] - r[0], r[3] - r[1]);
    let t0 = null, t1 = null;
    for (let s = 0; s <= len; s += 4) {
      const x = r[0] + ((r[2] - r[0]) * s) / len, y = r[1] + ((r[3] - r[1]) * s) / len;
      if (polyDist(x, y, river) < 46 || inLake(x, y, 10)) { if (t0 == null) t0 = s; t1 = s; }
      else if (t0 != null && s - t1 > 30) break;
    }
    if (t0 != null) {
      const ux = (r[2] - r[0]) / len, uy = (r[3] - r[1]) / len;
      const a = [r[0] + ux * (t0 - 12), r[1] + uy * (t0 - 12)], b = [r[0] + ux * (t1 + 12), r[1] + uy * (t1 + 12)];
      const nx = -uy * 30, ny = ux * 30;
      bridges += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#D69A5C" stroke-width="56"/>`;
      bridges += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#B87A3E" stroke-width="50" stroke-dasharray="4 10"/>`;
      bridges += `<line x1="${a[0] + nx}" y1="${a[1] + ny}" x2="${b[0] + nx}" y2="${b[1] + ny}" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>`;
      bridges += `<line x1="${a[0] - nx}" y1="${a[1] - ny}" x2="${b[0] - nx}" y2="${b[1] - ny}" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>`;
    }
  }
  out += bridges;

  // Casas y árboles en rejilla con variación
  const roofs = ["#FF6B6B", "#4CC9F0", "#FFD23F", "#B388FF", "#FF9E6B", "#FFF8EC"];
  const greens = ["#3FAE4A", "#52C159", "#2F9A45"];
  const tree = (x, y, s) => {
    const g = greens[(R() * greens.length) | 0];
    return `<rect x="${x - s / 2 + 5}" y="${y - s / 2 + 7}" width="${s}" height="${s}" rx="${s * 0.28}" fill="${NAVY}" opacity=".22"/>` +
      `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="${s * 0.28}" fill="${g}" stroke="${NAVY}" stroke-width="3"/>` +
      `<rect x="${x - s / 2 + 5}" y="${y - s / 2 + 5}" width="${s * 0.4}" height="${s * 0.3}" rx="4" fill="#fff" opacity=".28"/>`;
  };
  const house = (x, y, w, hh) => {
    const c = roofs[(R() * roofs.length) | 0];
    const horizontal = w > hh;
    const ridge = horizontal
      ? `<line x1="${x - w / 2 + 6}" y1="${y}" x2="${x + w / 2 - 6}" y2="${y}" stroke="${NAVY}" stroke-width="3" opacity=".55"/>`
      : `<line x1="${x}" y1="${y - hh / 2 + 6}" x2="${x}" y2="${y + hh / 2 - 6}" stroke="${NAVY}" stroke-width="3" opacity=".55"/>`;
    const light = horizontal
      ? `<rect x="${x - w / 2 + 3}" y="${y - hh / 2 + 3}" width="${w - 6}" height="${hh / 2 - 3}" rx="5" fill="#fff" opacity=".28"/>`
      : `<rect x="${x - w / 2 + 3}" y="${y - hh / 2 + 3}" width="${w / 2 - 3}" height="${hh - 6}" rx="5" fill="#fff" opacity=".28"/>`;
    return `<rect x="${x - w / 2 + 7}" y="${y - hh / 2 + 9}" width="${w}" height="${hh}" rx="8" fill="${NAVY}" opacity=".25"/>` +
      `<rect x="${x - w / 2}" y="${y - hh / 2}" width="${w}" height="${hh}" rx="8" fill="${c}" stroke="${NAVY}" stroke-width="3.5"/>` + light + ridge;
  };

  let items = "";
  const STEP = 74;
  for (let gy = 40; gy < MAP_SIZE; gy += STEP) {
    for (let gx = 40; gx < MAP_SIZE; gx += STEP) {
      const x = gx + (R() - 0.5) * 20, y = gy + (R() - 0.5) * 20;
      const roll = R();
      if (nearVenue(x, y) || inLake(x, y, 30) || nearRiver(x, y, 78)) {
        if (!nearVenue(x, y) && !inLake(x, y, 10) && nearRiver(x, y, 110) && !nearRiver(x, y, 70) && !nearRoad(x, y, 50) && roll < 0.5) items += tree(x, y, 26 + R() * 10);
        continue;
      }
      if (inPark(x, y)) {
        if (!nearRoad(x, y, 46) && roll < 0.75) items += tree(x, y, 28 + R() * 14);
        continue;
      }
      if (nearRoad(x, y, 62)) continue;
      if (roll < 0.52) {
        const w = 44 + R() * 22, hh = 40 + R() * 20;
        items += house(x, y, w, hh);
      } else if (roll < 0.85) {
        items += tree(x + (R() - 0.5) * 12, y, 26 + R() * 14);
        if (R() < 0.4) items += tree(x + 22, y + 20, 20 + R() * 8);
      }
    }
  }
  out += items;

  // El salón: plaza + edificio destacado
  const bw = 170, bh = 120;
  out += `<rect x="${px - 130}" y="${py - 110}" width="260" height="${hy - py + 110 - 20}" rx="26" fill="#FFF8EC" stroke="#E2D2B0" stroke-width="6"/>`;
  out += `<path d="M${px - 110} ${py + 92}H${px + 110}" stroke="#E2D2B0" stroke-width="4" stroke-dasharray="14 12"/>`;
  out += `<rect x="${px - bw / 2 + 10}" y="${py - bh / 2 + 12}" width="${bw}" height="${bh}" rx="14" fill="${NAVY}" opacity=".3"/>`;
  out += `<rect x="${px - bw / 2}" y="${py - bh / 2}" width="${bw}" height="${bh}" rx="14" fill="#FFD23F" stroke="${NAVY}" stroke-width="5"/>`;
  for (let i = 0; i < 5; i++) {
    out += `<rect x="${px - bw / 2 + 12 + i * 31}" y="${py - bh / 2 + 6}" width="16" height="${bh - 12}" rx="5" fill="#FF6B6B" opacity=".9"/>`;
  }
  out += `<rect x="${px - 44}" y="${py - 30}" width="88" height="60" rx="12" fill="#FFF8EC" stroke="${NAVY}" stroke-width="5"/>`;
  out += `<path d="M${px} ${py - 22}l7 14 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2z" fill="#FFD23F" stroke="${NAVY}" stroke-width="3.5" stroke-linejoin="round"/>`;
  // Globos del salón
  [[-bw / 2 - 16, -bh / 2 + 10, "#FF6B6B"], [bw / 2 + 16, -bh / 2 + 10, "#4CC9F0"], [-bw / 2 - 12, bh / 2 - 8, "#B388FF"], [bw / 2 + 12, bh / 2 - 8, "#9BE564"]].forEach(([dx, dy, c]) => {
    out += `<circle cx="${px + dx}" cy="${py + dy}" r="15" fill="${c}" stroke="${NAVY}" stroke-width="3.5"/><circle cx="${px + dx - 5}" cy="${py + dy - 5}" r="4" fill="#fff" opacity=".6"/>`;
  });
  return out;
}

/** Capa de la zona (círculo) centrada en el salón. radius en unidades del mapa. */
export function zoneLayerSVG(pin, radius, { animated = true } = {}) {
  const { x, y } = pinPoint(pin);
  return `<svg class="zone-svg" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(${x} ${y})">
      <g class="zone-scale">
        <circle r="${radius + 1500}" fill="none" stroke="#3A2A8A" stroke-opacity=".27" stroke-width="3000"/>
        <circle class="zone-glow" r="${radius}" fill="none" stroke="#B388FF" stroke-width="26" opacity=".6"/>
        <circle r="${radius}" fill="none" stroke="#FFF8EC" stroke-width="7"/>
        <g class="${animated ? "zone-dash" : ""}"><circle r="${radius}" fill="none" stroke="#B388FF" stroke-width="7" stroke-dasharray="26 22"/></g>
      </g>
    </g>
  </svg>`;
}

/** Marcador animado del salón. */
export function pinSVG(pin) {
  const { x, y } = pinPoint(pin);
  return `<svg class="pin-svg" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="translate(${x} ${y - 70})">
      <ellipse class="map-pin-shadow" cx="0" cy="70" rx="30" ry="10" fill="${NAVY}" opacity=".35"/>
      <g class="map-pin-bob">
        <path d="M0 58C-10 40-42 18-42-12a42 42 0 0184 0C42 18 10 40 0 58z" fill="#FF6B6B" stroke="${NAVY}" stroke-width="7" stroke-linejoin="round"/>
        <circle cx="0" cy="-12" r="22" fill="#FFF8EC" stroke="${NAVY}" stroke-width="5"/>
        <path d="M0-26l4.4 9 10 1.4-7.2 7 1.7 9.9L0-3.4l-8.9 4.7 1.7-9.9-7.2-7 10-1.4z" fill="#FFD23F" stroke="${NAVY}" stroke-width="2.6" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
}
