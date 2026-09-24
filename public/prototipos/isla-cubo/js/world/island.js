// Generación de la isla flotante de vóxeles y sus 7 construcciones (una por parada).
// Composición en anillo: cada construcción ocupa su propia zona cerca del borde y mira al centro;
// la cámara de cada parada se coloca del lado del centro y mira hacia afuera, así la protagonista
// se recorta contra el cielo. El centro (plaza, estanque, caminos) es bajo para no tapar nada.
import * as THREE from "../../vendor/three.module.min.js";
import { VoxelSet, voxelMesh, bevelTopGeometry, plainBoxGeometry } from "./voxels.js";
import { textBlocks, boldTextBlocks, cleanMonumentText } from "./font3d.js";
import { rng } from "../util.js";

export const PAL = {
  grass: "#8BD46E", grass2: "#7CC862", dirt: "#C98E5A", dirt2: "#B87C4A", rock: "#9C8F86", rock2: "#8A7E76",
  sand: "#F7E6B5", sand2: "#EFD89C", water: "#5FD3E6", wood: "#A8683A", wood2: "#96592E", woodDark: "#7A4A26", awn: "#FF6B6B", cream: "#FFF6E5",
  stone: "#D8CFC4", stone2: "#C4B8AC", roof: "#E4574C", roof2: "#D44B41", leaf: "#6CC24A", leaf2: "#58B447", leaf3: "#86D95C",
  gold: "#F2C94C", goldLight: "#FFE38A", window: "#FFE9A8", lantern: "#FFE08A", blossom: "#FF9FCB", darkStone: "#4A3F3A", panel: "#3E3431"
};

/** Colores por cara del letrero (sombreado horneado: no dependen de la luz ni de la hora). */
export const MON_COLORS = {
  letters: { top: "#FFFFFF", front: "#FFF6E5", side: "#E3D5BC" },
  eight: { top: "#FFF1A8", front: "#FFE68A", side: "#EDBE45" }
};
/** Medidas del letrero en bloques (rejilla propia, escalada para caber en MON_MAX_W unidades). */
const MON_MARGIN = 2, MON_EIGHT_GAP = 3, MON_MAX_W = 18, MON_BASE_H = 3;

const D = Math.PI / 180;
const PATH_A = 48; // dirección del sendero (grados): radial, de la plaza hacia el borde
const ring = (deg, r) => ({ x: Math.round(Math.cos(deg * D) * r * 2) / 2, z: Math.round(Math.sin(deg * D) * r * 2) / 2 });
// Plano de zonas: 7 zonas en anillo, cada una mirando al centro, con ≥10 bloques entre los bordes de
// zonas vecinas (contornos en ZONE_EXT). Cada cámara mira desde el lado del centro hacia afuera, así
// la protagonista se recorta contra el cielo y las vecinas quedan fuera de cuadro.
// rot: frente de la construcción → 0:+z  1:+x  2:-z  3:-x
export const LAYOUT = {
  monument: { x: 0, z: -28, rot: 0 },
  house: { ...ring(-25.3, 26), rot: 3 },
  tower: { ...ring(16.3, 27), rot: 3 },
  path: { ...ring(PATH_A, 12.5), rot: 2 },
  tree: { ...ring(108.5, 24), rot: 2 },
  chest: { ...ring(161.8, 27), rot: 1 },
  wall: { ...ring(206.8, 27), rot: 1 }
};
/** Contorno de cada zona en coordenadas locales [lx0, lx1, lz0 (atrás), lz1 (frente)]. */
const ZONE_EXT = {
  house: [-4.5, 4.5, -3.5, 7], // incluye el paseo del perrito al frente
  tower: [-3.5, 3.5, -3.5, 3.5],
  tree: [-5.5, 5.5, -5.5, 5.5], // copa y órbita de los marcos (≤5 desde el tronco)
  chest: [-6.5, 3.5, -5, 2.2], // cofre, palmera y manantial
  wall: [-6.5, 8.2, -1.5, 2] // muro, portal y farol
};
const PATH_STRIP = { d0: 4.5, d1: 15, w: 2.5 };
/** Órbita de los marcos de fotos del Mirador: pequeña, dentro de su zona (≤5 bloques del tronco). */
export const FRAME_R = 3.6;
export const R_BASE = 35;

/** Copia de la geometría del bloque con color por vértice según la orientación de cada faceta. */
function faceColored(geo, { top, front, side }) {
  const g = geo.clone();
  const n = g.attributes.normal;
  const cols = new Float32Array(n.count * 3);
  const T = new THREE.Color(top).convertSRGBToLinear(), F = new THREE.Color(front).convertSRGBToLinear(), S = new THREE.Color(side).convertSRGBToLinear();
  for (let i = 0; i < n.count; i++) {
    const x = Math.abs(n.getX(i)), y = n.getY(i), z = Math.abs(n.getZ(i));
    const c = y > 0.6 ? T : z >= x && z > Math.abs(y) ? F : S;
    cols.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g;
}

/** Sistema local de una construcción: frente = +z local; devuelve coordenadas de mundo. */
function frameOf({ x: cx, z: cz, rot }) {
  const f = (lx, lz) => rot === 0 ? [cx + lx, cz + lz] : rot === 1 ? [cx + lz, cz - lx] : rot === 2 ? [cx - lx, cz - lz] : [cx - lz, cz + lx];
  const dir = ([0, 0, 1], rot === 0 ? [0, 1] : rot === 1 ? [1, 0] : rot === 2 ? [0, -1] : [-1, 0]);
  return { f, front: new THREE.Vector3(dir[0], 0, dir[1]), right: new THREE.Vector3(...(rot === 0 ? [1, 0, 0] : rot === 1 ? [0, 0, -1] : rot === 2 ? [-1, 0, 0] : [0, 0, 1])), rotY: rot * Math.PI / 2 };
}
/** Yaw de cámara desde el lado del centro de la isla (con desvío en grados para 3/4). */
const yawCenter = (c, off = 0) => Math.atan2(-c.x, -c.z) / D + off;

export function buildIsland(data, geo) {
  const R = rng(20261114);
  const vox = new VoxelSet();
  const glow = new VoxelSet();
  const water = new VoxelSet();
  // Cada vóxel lleva la zona a la que pertenece (para el chequeo de superposiciones del modo debug)
  let zone = null;
  const P = (set, x, y, z, color, phase, extra = {}) => { set.set(x, y, z, color, { phase, zone, ...extra }); };
  // Colocar en coordenadas locales de una construcción
  const L = (fr) => (set, lx, y, lz, color, phase, extra) => { const [x, z] = fr.f(lx, lz); P(set, x, y, z, color, phase, extra); };

  /* ---------- Medidas del monumento (letrero) ---------- */
  // Rejilla del letrero: texto bold (trazos de 2 bloques) + 3 bloques + "8", margen de 2 bloques por
  // lado sobre tablero de piedra oscura, y una fila de favoriteColor como marco arriba y abajo.
  const text = cleanMonumentText(data.island.monumentText);
  const tb = boldTextBlocks(text, { spacing: Array.from(text).length > 5 ? 1 : 2 });
  const eb = boldTextBlocks("8");
  const textH = Math.max(tb.height, eb.height);
  const boardW = MON_MARGIN * 2 + tb.width + MON_EIGHT_GAP + eb.width;
  const boardH = 1 + MON_MARGIN * 2 + textH + 1;
  const ms = Math.min(0.5, MON_MAX_W / boardW); // tamaño de un bloque del letrero en unidades del mundo
  const MON = LAYOUT.monument;
  const lz = MON.z;
  const boardX0 = MON.x - (boardW * ms) / 2;
  const boardY0 = MON_BASE_H + 0.5; // se apoya sobre la base
  const boardZ0 = lz - 1.5; // cara trasera
  const boardTop = boardY0 + boardH * ms;
  const signFront = boardZ0 + 4 * ms; // frente de las letras (tablero 2 + letras 2)
  const px0 = Math.round(boardX0) - 1, px1 = Math.round(boardX0 + boardW * ms) + 1;

  /* ---------- Forma de la isla ---------- */
  const radiusAt = (a) => R_BASE + 1.3 * Math.sin(3 * a + 0.4) + 0.8 * Math.sin(5 * a + 1.3) + 0.5 * Math.sin(9 * a);
  const inside = (x, z) => Math.hypot(x, z) < radiusAt(Math.atan2(z, x));
  const near = (x, z, c, r) => Math.hypot(x - c.x, z - c.z) < r;
  const distSeg = (px, pz, [ax, az], [bx, bz]) => {
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(px - ax - dx * t, pz - az - dz * t);
  };
  // Manantial detrás del cofre que corre hacia el borde y cae como cascada; estanque en la plaza
  const CH = LAYOUT.chest, CF0 = frameOf(CH);
  const aC = Math.atan2(CH.z, CH.x);
  const spring = CF0.f(0, -4);
  const WF = (() => { // primera celda fuera de la isla en la dirección del cofre
    for (let r = Math.hypot(CH.x, CH.z); r < R_BASE + 6; r += 0.25) {
      const x = Math.round(Math.cos(aC) * r), z = Math.round(Math.sin(aC) * r);
      if (!inside(x, z)) return { x, z };
    }
    return { x: Math.round(Math.cos(aC) * (R_BASE + 1)), z: Math.round(Math.sin(aC) * (R_BASE + 1)) };
  })();
  const riverPts = [spring, [WF.x, WF.z]];
  const isRiver = (x, z) => {
    if (distSeg(x, z, riverPts[0], riverPts[1]) < 1.35) return true;
    if (Math.hypot(x - spring[0], z - spring[1]) < 1.8) return true;
    return Math.hypot(x - 0.5, z - 0.5) < 2.6;
  };
  const isBeach = (x, z) => (near(x, z, CH, 5.2) || Math.hypot(x - WF.x, z - WF.z) < 3.2) && !isRiver(x, z) && Math.hypot(x, z) > 9;
  // Caminos de piedra desde la plaza hasta el frente de cada construcción
  const fronts = ["house", "tower", "tree", "chest", "wall"].map((k) => {
    const c = LAYOUT[k], fr = frameOf(c);
    const [x, z] = fr.f(0, k === "tree" ? 6 : k === "chest" ? 3.5 : k === "wall" ? 2.5 : 4.5);
    const a = Math.atan2(z, x);
    return [[Math.cos(a) * 3.6, Math.sin(a) * 3.6], [x, z]];
  });
  fronts.push([[0, -3.6], [MON.x, lz + 4]]);
  const PATH = LAYOUT.path;
  const trail = [3.4, 6.8, 9.8, 12.5, 17].map((d, i) => [Math.cos((PATH_A + (i % 2 ? 4 : -3)) * D) * d, Math.sin((PATH_A + (i % 2 ? 4 : -3)) * D) * d]);
  const isTrail = (x, z) => { for (let i = 0; i < trail.length - 1; i++) if (distSeg(x, z, trail[i], trail[i + 1]) < 1.05) return true; return false; };
  const isPath = (x, z) => fronts.some(([a, b]) => distSeg(x, z, a, b) < 0.7) || (Math.hypot(x - 0.5, z - 0.5) < 3.8 && !isRiver(x, z));
  // Suelo plano: el letrero se apoya en su propia base corta (sin colina)
  const heightAt = () => 0;

  let minY = 0;
  const G = Math.ceil(R_BASE + 4);
  for (let x = -G; x <= G; x++) for (let z = -G; z <= G; z++) {
    if (!inside(x, z)) continue;
    const r = Math.hypot(x, z) / radiusAt(Math.atan2(z, x));
    const river = isRiver(x, z);
    const top = river ? -2 : heightAt(x, z);
    const depth = Math.round(2.5 + Math.pow(Math.max(0, 1 - r), 1.3) * 14 + (R() - 0.5) * 1.4);
    const bottom = -depth;
    minY = Math.min(minY, bottom);
    for (let y = bottom; y <= top; y++) {
      const fromTop = top - y;
      const isTop = y === top && !river;
      let color;
      if (isTop) {
        if (isBeach(x, z)) color = (x + z) % 3 ? PAL.sand : PAL.sand2;
        else if (isTrail(x, z)) color = (x + z) % 2 ? PAL.stone : PAL.stone2;
        else if (isPath(x, z)) color = (x * 3 + z) % 4 ? PAL.stone : PAL.stone2;
        else color = R() < 0.18 ? PAL.grass2 : PAL.grass;
      } else if (fromTop <= 2 && y >= -3) color = isBeach(x, z) && fromTop <= 1 ? PAL.sand2 : (R() < 0.3 ? PAL.dirt2 : PAL.dirt);
      else color = R() < 0.25 ? PAL.rock2 : PAL.rock;
      const phase = isTop ? 0.36 + Math.hypot(x, z) / (R_BASE * 3.5) : Math.max(0, Math.min(1, (y + 17) / 17)) * 0.34;
      P(vox, x, y, z, color, phase, { terrain: isTop ? "top" : "body", sand: isBeach(x, z) });
    }
    if (river) P(water, x, -1, z, PAL.water, 0.8 + R() * 0.04);
  }

  /* ---------- Contornos de zona (plano cenital) ---------- */
  const pdir = [Math.cos(PATH_A * D), Math.sin(PATH_A * D)], pperp = [-pdir[1], pdir[0]];
  const zonePoly = (k) => {
    if (k === "path") {
      const { d0, d1, w } = PATH_STRIP;
      return [[d0, -w], [d1, -w], [d1, w], [d0, w]].map(([a, b]) => [pdir[0] * a + pperp[0] * b, pdir[1] * a + pperp[1] * b]);
    }
    const fr = frameOf(LAYOUT[k]);
    const [a, b, c, e] = k === "monument" ? [px0 - 0.5 - MON.x, px1 + 0.5 - MON.x, -1.5, 4] : ZONE_EXT[k];
    return [fr.f(a, c), fr.f(b, c), fr.f(b, e), fr.f(a, e)];
  };
  const ZONES = ["monument", "house", "tower", "path", "tree", "chest", "wall"];
  const zonePolys = Object.fromEntries(ZONES.map((k) => [k, zonePoly(k)]));
  const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const polyDist = (x, z, poly) => inPoly(x, z, poly) ? 0 : Math.min(...poly.map((p, i) => distSeg(x, z, p, poly[(i + 1) % poly.length])));
  // Yaw de la cámara del Sendero: 3/4 elevado, desde el lado contrario al monumento
  const SENDERO_YAW = Math.atan2(-pdir[0], -pdir[1]) / D - 35;
  // Corredores de visión: del centro de la isla a cada zona (y un poco más allá, hasta el borde);
  // en el Sendero, desde su centro hacia su cámara. Ahí no se siembra nada alto.
  const pathMid0 = [pdir[0] * 9.2, pdir[1] * 9.2];
  const corridors = ZONES.map((k) => {
    // Sendero: de su cámara hasta más allá del camino (lo que se ve detrás de los banderines)
    if (k === "path") return { a: [pathMid0[0] - Math.sin(SENDERO_YAW * D) * 30, pathMid0[1] - Math.cos(SENDERO_YAW * D) * 30], b: [pathMid0[0] + Math.sin(SENDERO_YAW * D) * 22, pathMid0[1] + Math.cos(SENDERO_YAW * D) * 22], hw: 9 };
    const c = LAYOUT[k], hw = (k === "monument" ? (px1 - px0) / 2 + 1 : Math.max(...ZONE_EXT[k].slice(0, 2).map(Math.abs))) + 3;
    return { a: [0, 0], b: [c.x * 1.45, c.z * 1.45], hw };
  });
  const busy = (x, z) => isRiver(x, z) || isBeach(x, z) || isPath(x, z) || isTrail(x, z) || Math.hypot(x, z) < 7 || ZONES.some((k) => polyDist(x, z, zonePolys[k]) < 1.5);
  const treeBlocked = (x, z) => busy(x, z) || ZONES.some((k) => polyDist(x, z, zonePolys[k]) < 4) || corridors.some((c) => distSeg(x, z, c.a, c.b) < c.hw);
  // Árboles pequeños sólo en la franja exterior, entre zonas y fuera de todo corredor de cámara
  const smallTrees = [];
  for (let i = 0; i < 600 && smallTrees.length < 12; i++) {
    const a = R() * Math.PI * 2, d = R_BASE - 14 + R() * 11;
    const x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d);
    if (!inside(x, z) || Math.hypot(x, z) > radiusAt(Math.atan2(z, x)) - 3 || treeBlocked(x, z)) continue;
    if (smallTrees.some((t) => Math.hypot(t.x - x, t.z - z) < 4.5)) continue;
    smallTrees.push({ x, z });
  }
  const treeAt = (x, z, big, ph) => {
    const g = heightAt(x, z) + 1;
    const trunkH = big ? 3 : 2;
    for (let y = 0; y < trunkH; y++) P(vox, x, g + y, z, PAL.wood, ph + y * 0.004);
    const cy = g + trunkH + 1, r = big ? 1.9 : 1.4;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      if (Math.hypot(dx, dy * 1.2, dz) > r + 0.2) continue;
      P(vox, x + dx, cy + dy, z + dz, R() < 0.3 ? PAL.leaf2 : R() < 0.2 ? PAL.leaf3 : PAL.leaf, ph + 0.01 + (dy + 1) * 0.004);
    }
  };
  smallTrees.forEach((t, i) => { zone = `arbol-${i + 1}`; treeAt(t.x, t.z, i % 3 === 0, 0.5 + i * 0.006); });
  zone = null;
  for (let i = 0; i < 110; i++) {
    const x = Math.round((R() - 0.5) * R_BASE * 1.9), z = Math.round((R() - 0.5) * R_BASE * 1.9);
    if (!inside(x, z) || busy(x, z) || Math.hypot(x, z) > radiusAt(Math.atan2(z, x)) - 1.5) continue;
    const g = heightAt(x, z) + 1;
    if (vox.has(x, g, z)) continue;
    const c = ["#FF9FCB", "#FFD23F", "#FFFFFF", "#B388FF"][(R() * 4) | 0];
    P(vox, x, g - 0.25, z, c, 0.5 + R() * 0.05, { s: 0.5 });
  }

  /* ---------- 1. Monumento: letrero sobre base corta con dos escalones ---------- */
  zone = "monument";
  // Base de piedra de 3 bloques de alto (z: lz-1…lz+1) y dos escalones al frente (lz+2, lz+3)
  for (let x = px0; x <= px1; x++) {
    // Piedra media (más clara que el tablero, más apagada que las letras: no compite con ellas)
    for (let z = lz - 1; z <= lz + 1; z++) for (let y = 1; y <= MON_BASE_H; y++) P(vox, x, y, z, (x + y) % 3 ? PAL.rock : PAL.rock2, 0.58 + y / 60);
    if (x < px0 + 2 || x > px1 - 2) continue;
    for (let y = 1; y <= MON_BASE_H - 1; y++) P(vox, x, y, lz + 2, (x + y) % 3 ? PAL.rock2 : PAL.rock, 0.585 + y / 60);
    P(vox, x, 1, lz + 3, (x % 3) ? PAL.rock2 : PAL.rock, 0.59);
  }
  // Tablero (rejilla del letrero): 2 bloques de profundidad, marco de favoriteColor arriba y abajo
  const boardVox = [];
  for (let bx = 0; bx < boardW; bx++) for (let by = 0; by < boardH; by++) for (const bz of [0, 1]) {
    const frame = by === 0 || by === boardH - 1;
    boardVox.push({ x: bx, y: by, z: bz, color: frame ? data.island.favoriteColor : PAL.darkStone, phase: 0.6 + by / (boardH * 12) });
  }
  // Letras y "8": 2 bloques de profundidad, sobresalen al frente del tablero
  const tx0 = MON_MARGIN, ty0 = 1 + MON_MARGIN;
  const monumentVox = tb.blocks.flatMap((b) => [2, 3].map((d) => ({ x: tx0 + b.x, y: ty0 + b.y, z: d, color: "#FFFFFF", order: b.order * 2 + d })));
  const ex0 = tx0 + tb.width + MON_EIGHT_GAP;
  const eightVox = eb.blocks.flatMap((b) => [2, 3].map((d) => ({ x: ex0 + b.x, y: ty0 + b.y, z: d, color: "#FFFFFF", order: b.order * 2 + d })));
  const signOffset = [boardX0 + ms / 2, boardY0 + ms / 2, boardZ0 + ms / 2];
  const signBox = new THREE.Box3(new THREE.Vector3(boardX0, boardY0, boardZ0), new THREE.Vector3(boardX0 + boardW * ms, boardTop, signFront));
  // Faroles (sendero y muro). El monumento no lleva faroles: nada delante del letrero.
  const lanternSpots = [];
  const lantern = (x, z, h = 5, ph = 0.8) => {
    const g = heightAt(Math.round(x), Math.round(z)) + 1;
    for (let k = 0; k < h; k++) P(vox, x, g - 0.275 + k * 0.45, z, PAL.woodDark, ph, { s: 0.45 });
    P(glow, x, g - 0.2 + h * 0.45, z, PAL.lantern, ph + 0.01, { s: 0.7 });
    lanternSpots.push(new THREE.Vector3(x, g + h * 0.45, z));
  };

  /* ---------- 2. Casa de la Fiesta ---------- */
  zone = "house";
  const HF = frameOf(LAYOUT.house), H = L(HF);
  const hg = 1;
  for (let x = -3; x <= 3; x++) for (let z = -2; z <= 3; z++) {
    H(vox, x, hg, z, PAL.wood, 0.62);
    const edge = x === -3 || x === 3 || z === -2 || z === 3;
    if (!edge) continue;
    for (let y = hg + 1; y <= hg + 4; y++) {
      const corner = (x === -3 || x === 3) && (z === -2 || z === 3);
      const front = z === 3, ph = 0.62 + (y - hg) * 0.012;
      if (front && (x === 0 || x === -1) && y <= hg + 3) { H(vox, x, y, z, PAL.woodDark, ph); continue; }
      const win = !corner && y >= hg + 2 && y <= hg + 3 && ((front && (x === -2 || x === 2)) || ((x === -3 || x === 3) && z === 0) || (z === -2 && (x === -2 || x === 2)));
      if (win) H(glow, x, y, z, PAL.window, ph);
      else H(vox, x, y, z, corner ? PAL.wood : PAL.cream, ph);
    }
  }
  for (let step = 0; step <= 3; step++) {
    const y = hg + 5 + step, za = -3 + step, zb = 4 - step;
    if (za > zb) break;
    for (let x = -4; x <= 4; x++) for (const z of za === zb ? [za] : [za, zb]) H(vox, x, y, z, step % 2 ? PAL.roof2 : PAL.roof, 0.68 + step * 0.01);
    if (step > 0) for (const x of [-3, 3]) for (let z = za; z <= zb; z++) H(vox, x, y - 1, z, PAL.cream, 0.68);
  }
  for (let x = -2; x <= 2; x++) H(vox, x, hg + 4, 4, x % 2 ? PAL.awn : PAL.cream, 0.72);
  // Globos atados a los extremos de la cumbrera: flotan SOBRE la casa, dentro de su huella
  const ridgeY = hg + 8.5;
  const balloons = [[-3.3, 1.3, "#FF6B6B", 12.2, -3.5], [-2.2, -0.4, "#FFD23F", 11.4, -3.5], [3.3, 0.2, "#B388FF", 12.5, 3.5], [2.3, 1.7, "#4CC9F0", 11.5, 3.5]].map(([bx, bz, c, by, ax], i) => {
    const [x, z] = HF.f(bx, bz);
    const [axw, azw] = HF.f(ax, 0.5);
    return { x, y: by, z, color: c, phase: 0.74 + i * 0.01, anchor: [axw, ridgeY, azw] };
  });
  const houseLight = new THREE.Vector3(...(() => { const [x, z] = HF.f(0, 5); return [x, 3, z]; })());

  /* ---------- 3. Torre del Reloj ---------- */
  zone = "tower";
  const TF = frameOf(LAYOUT.tower), T = L(TF);
  const tg = 1, tTop = tg + 12;
  for (let y = tg; y <= tTop; y++) for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const edge = Math.abs(x) === 2 || Math.abs(z) === 2;
    if (!edge && y !== tTop) continue;
    const corner = Math.abs(x) === 2 && Math.abs(z) === 2;
    const band = y === tg + 6 || y === tTop;
    T(vox, x, y, z, corner || band ? PAL.wood : (y % 2 ? PAL.stone : PAL.stone2), 0.62 + (y - tg) * 0.008);
  }
  for (let s = 0; s <= 2; s++) for (let x = -3 + s; x <= 3 - s; x++) for (let z = -3 + s; z <= 3 - s; z++) {
    if (s < 2 && Math.abs(x) < 3 - s && Math.abs(z) < 3 - s) continue;
    T(vox, x, tTop + 1 + s, z, s % 2 ? PAL.roof : PAL.roof2, 0.74 + s * 0.01);
  }
  T(vox, 0, tTop + 4, 0, PAL.gold, 0.76);
  // Carátula: círculo escalonado crema con borde dorado, sobresale 1 bloque del frente
  const clockY = tg + 9;
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
    const d = Math.hypot(dx, dy);
    if (d > 3.15) continue;
    T(vox, dx, clockY + dy, 3, d > 2.25 ? PAL.gold : PAL.cream, 0.76);
  }
  // Panel de piedra oscura para los días (los dígitos son otro mesh)
  for (let x = -3; x <= 3; x++) for (let y = tg + 1; y <= tg + 5; y++) T(vox, x, y, 3, PAL.panel, 0.75);
  const [ccx, ccz] = TF.f(0, 3.5);
  const clock = { center: new THREE.Vector3(ccx, clockY, ccz), front: TF.front.clone(), rotY: TF.rotY };
  const [dax, daz] = TF.f(0, 3.55);
  const digits = { anchor: new THREE.Vector3(dax, tg + 1.3, daz), right: TF.right.clone(), maxW: 6.4, maxS: 0.62 };

  /* ---------- 4. El Sendero: banderines (otro mesh) y 2 faroles ---------- */
  zone = "path";
  const PF = frameOf(PATH);
  // 4 banderines a lo largo del sendero, alternando lados
  const tdir = [Math.cos(PATH_A * D), Math.sin(PATH_A * D)], tperp = [-tdir[1], tdir[0]];
  const flagPts = [5, 7.8, 10.6, 13.4].map((d, i) => ({ x: tdir[0] * d + tperp[0] * (i % 2 ? 1.7 : -1.7), z: tdir[1] * d + tperp[1] * (i % 2 ? 1.7 : -1.7) }));
  lantern(trail[1][0] - 1.5, trail[1][1] + 1.6, 3, 0.8);
  lantern(PATH.x + 1.8, PATH.z - 0.6, 3, 0.81);

  /* ---------- 5. El Mirador: árbol grande ---------- */
  zone = "tree";
  const TR = LAYOUT.tree;
  const trg = 1, trx = Math.round(TR.x), trz = Math.round(TR.z);
  for (let y = trg; y < trg + 6; y++) for (let x = trx - 1; x <= trx; x++) for (let z = trz - 1; z <= trz; z++) P(vox, x, y, z, y % 2 ? PAL.wood : PAL.woodDark, 0.62 + (y - trg) * 0.01);
  [[-2, 0], [1, -1], [-1, -2], [0, 1]].forEach(([dx, dz]) => P(vox, trx + dx, trg, trz + dz, PAL.woodDark, 0.63));
  const canopy = { x: trx - 0.5, y: trg + 9, z: trz - 0.5 };
  for (let dx = -5; dx <= 5; dx++) for (let dy = -3; dy <= 4; dy++) for (let dz = -5; dz <= 5; dz++) {
    const d = Math.hypot(dx / 4.8, dy / 3.6, dz / 4.8);
    if (d > 1 || (d > 0.85 && R() < 0.4)) continue;
    const c = R() < 0.08 ? PAL.blossom : R() < 0.3 ? PAL.leaf2 : R() < 0.25 ? PAL.leaf3 : PAL.leaf;
    P(vox, Math.round(canopy.x + dx), canopy.y + dy, Math.round(canopy.z + dz), c, 0.66 + (dy + 3) * 0.008);
  }

  /* ---------- 6. El Cofre (cuerpo 6×4 con tablones, herrajes y cerradura dorados) ---------- */
  zone = "chest";
  const CF = frameOf(CH), C = L(CF);
  for (let x = -3; x <= 2; x++) for (let z = -2; z <= 1; z++) for (let y = 1; y <= 2; y++) {
    const cornerX = x === -3 || x === 2, cornerZ = z === -2 || z === 1;
    const band = (cornerX && cornerZ) || (y === 2 && (cornerX || cornerZ) && (x === -3 || x === 2 || x === -1 || x === 0) && false);
    C(vox, x, y, z, band || (cornerX && cornerZ) ? PAL.gold : (x % 2 ? PAL.wood : PAL.wood2), 0.8);
  }
  // Cerradura dorada al frente (sobresale) con ojo oscuro
  C(vox, -0.5, 2, 1.6, PAL.gold, 0.82, { s: 0.7 });
  C(vox, -0.5, 1.85, 1.98, "#3A2A1A", 0.83, { s: 0.25 });
  // Palmera en la playa
  const [pax, paz] = CF.f(-4.5, -3); // lado sur de la playa (el manantial queda al norte)
  for (let y = 1; y <= 5; y++) P(vox, Math.round(pax), y, Math.round(paz), PAL.wood, 0.8 + y * 0.004);
  [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dz], i) =>
    P(vox, Math.round(pax) + dx, Math.abs(dx) + Math.abs(dz) > 1 ? 5 : 6, Math.round(paz) + dz, PAL.leaf, 0.82 + i * 0.002));

  /* ---------- Cascada: chorro ancho por el borde, junto al cofre ---------- */
  for (let y = -1; y >= -10; y--) for (let k = -1; k <= 1; k++) P(water, WF.x, y, WF.z + k, PAL.water, 0.86 + (-1 - y) * 0.008, { s: 0.92 });

  /* ---------- 7. Muro del Escuadrón y portal ---------- */
  zone = "wall";
  const WFm = frameOf(LAYOUT.wall), W = L(WFm);
  const wg = 1;
  // Muro de 10 bloques; el portal es un arco en su extremo, en el mismo plano
  for (let x = -5; x <= 4; x++) for (let y = wg; y <= wg + 5; y++) {
    const edge = x === -5 || x === 4 || y === wg + 5;
    W(vox, x, y, 0, edge ? PAL.wood : (x + y) % 2 ? PAL.stone : PAL.stone2, 0.64 + (y - wg) * 0.01);
    W(vox, x, y, -1, PAL.stone2, 0.64 + (y - wg) * 0.01);
  }
  const wallSlots = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 5; col++) {
    const [x, z] = WFm.f(-3.9 + col * 1.7, 0.95);
    wallSlots.push(new THREE.Vector3(x, wg + 1.9 + row * 1.9, z));
  }
  const wallInfo = { front: WFm.front.clone(), rotY: WFm.rotY, slotScale: 1.45 };
  for (let y = wg; y <= wg + 6; y++) for (const lx of [5.2, 8.2]) W(vox, lx, y, -0.5, y % 2 ? data.island.favoriteColor : "#B388FF", 0.7 + y * 0.008);
  for (let lx = 5.2; lx <= 8.2; lx++) W(vox, lx, wg + 7, -0.5, (lx - 5.2) % 2 ? data.island.favoriteColor : "#B388FF", 0.74);
  const portalCenter = (() => { const [x, z] = WFm.f(6.7, -0.5); return new THREE.Vector3(x, wg + 3.5, z); })();
  const portalRotY = WFm.rotY;
  lantern(...WFm.f(-6.5, 1.5), 4, 0.8);
  zone = null;

  /* ---------- Paseo seguro del perrito ---------- */
  // Celdas de pasto frente a la casa, a ≥3 bloques del borde, sin agua, sin el Sendero, sin playa y
  // sin nada construido encima (ni junto). El perrito sólo camina entre puntos de esta rejilla.
  const dogCells = new Set();
  const dogKey = (x, z) => `${x},${z}`;
  const blockedNear = (x, z) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 1; y <= 3; y++) if (vox.has(x + dx, y, z + dz) || glow.has(x + dx, y, z + dz)) return true;
    return false;
  };
  // Rejilla dentro del contorno de la zona de la casa (frente: lz 5…7)
  for (let lx = -4; lx <= 4; lx++) for (let lzz = 5; lzz <= 7; lzz++) {
    const [fx, fz] = HF.f(lx, lzz);
    const x = Math.round(fx), z = Math.round(fz);
    const g = vox.get(x, 0, z);
    if (!g || g.terrain !== "top") continue; // hay suelo (pasto/camino) bajo este punto
    if (Math.hypot(x, z) > radiusAt(Math.atan2(z, x)) - 3) continue;
    if (isRiver(x, z) || isTrail(x, z) || isBeach(x, z) || blockedNear(x, z)) continue;
    if (!inPoly(x, z, zonePolys.house)) continue;
    dogCells.add(dogKey(x, z));
  }
  const dogSafe = (x, z) => dogCells.has(dogKey(Math.round(x), Math.round(z)));
  const dogPoints = [...dogCells].map((k) => k.split(",").map(Number));

  /* ---------- Meshes ---------- */
  const mainMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const glowMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color("#FFB84D"), emissiveIntensity: 0 });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color("#2FA8C8"), emissiveIntensity: 0.15, transparent: true, opacity: 0.9 });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color("#FFF1D6"), emissiveIntensity: 0.1 });
  // Letras: sin iluminación, con el sombreado horneado por cara → mismo color a cualquier hora
  const letterMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });

  const surf = vox.surface((v) => v && !(v.s && v.s < 1));
  const topList = surf.filter((v) => v.terrain === "top");
  const bodyList = surf.filter((v) => v.terrain === "body");
  const miscList = surf.filter((v) => !v.terrain && !v.zone); // flores
  const waterList = [...water.map.values()];
  const phases = (list) => Float32Array.from(list, (v) => v.phase ?? 0.5);
  const tagged = (m, list) => { m.userData.phases = phases(list); m.castShadow = m.receiveShadow = true; return m; };
  // Suelo: pasto con bisel sólo arriba; tierra y roca con cubos planos (sin chaflanes → sin costuras claras)
  const ground = tagged(voxelMesh(topList, mainMat, { geometry: bevelTopGeometry(0.09) }), topList);
  const rock = tagged(voxelMesh(bodyList, mainMat, { geometry: plainBoxGeometry() }), bodyList);
  const misc = tagged(voxelMesh(miscList, mainMat, { geometry: geo }), miscList);
  // Un grupo por zona (y por árbol pequeño): así cada construcción se puede desvanecer por separado
  const groups = {};
  const zoneMeshes = [];
  const zoneNames = new Set([...surf.map((v) => v.zone), ...[...glow.map.values()].map((v) => v.zone)].filter(Boolean));
  for (const zn of zoneNames) {
    const g = (groups[zn] = new THREE.Group());
    g.name = zn;
    const ml = surf.filter((v) => !v.terrain && v.zone === zn);
    const gl = [...glow.map.values()].filter((v) => v.zone === zn);
    if (ml.length) { const m = tagged(voxelMesh(ml, mainMat, { geometry: geo }), ml); g.add(m); zoneMeshes.push(m); }
    if (gl.length) { const m = voxelMesh(gl, glowMat, { geometry: geo, jitterColor: false }); m.userData.phases = phases(gl); g.add(m); zoneMeshes.push(m); }
  }
  const glowList = [...glow.map.values()];
  const mainCount = surf.length - topList.length - bodyList.length;
  const waterMesh = voxelMesh(waterList, waterMat, { geometry: geo });
  const balloonMesh = voxelMesh(balloons.map((b) => ({ ...b, s: 1.15 })), mainMat, { geometry: geo, jitterColor: false });
  const boardMesh = voxelMesh(boardVox, mainMat, { geometry: geo, scale: ms, offset: signOffset });
  boardMesh.castShadow = boardMesh.receiveShadow = true;
  const monumentMesh = voxelMesh(monumentVox, letterMat, { geometry: faceColored(geo, MON_COLORS.letters), scale: ms, offset: signOffset, jitterColor: false });
  const eightMesh = voxelMesh(eightVox, letterMat, { geometry: faceColored(geo, MON_COLORS.eight), scale: ms, offset: signOffset, jitterColor: false });
  monumentMesh.castShadow = eightMesh.castShadow = true;
  const strPos = [];
  balloons.forEach((b) => strPos.push(...b.anchor, b.x, b.y - 0.6, b.z));
  const strings = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(strPos, 3)), new THREE.LineBasicMaterial({ color: 0x5b3a1e }));
  waterMesh.userData.phases = phases(waterList);
  balloonMesh.userData.phases = phases(balloons);
  boardMesh.userData.phases = phases(boardVox);

  /* ---------- Banderines del itinerario: altos, tela de colores que ondea, número en la base ---------- */
  const FS = 0.5; // escala de los bloques de bandera
  const flagVox = [], flagInfo = [];
  const clothCols = [["#FF6B6B", "#FFD23F"], [data.island.favoriteColor, "#FFF6E5"], ["#9BE564", "#B388FF"], ["#FF9FCB", data.island.favoriteColor]];
  flagPts.forEach((p, i) => {
    const g = heightAt(Math.round(p.x), Math.round(p.z)) + 1;
    const start = flagVox.length;
    for (let k = 0; k < 11; k++) flagVox.push({ x: p.x / FS, y: (g - 0.25 + k * FS) / FS, z: p.z / FS, color: PAL.woodDark });
    const clothStart = flagVox.length;
    for (let cx = 1; cx <= 4; cx++) for (let cy = 0; cy < 3; cy++) {
      const [wx, wz] = PF.f(cx * FS, 0);
      flagVox.push({ x: (p.x + wx - PATH.x) / FS, y: (g + 4.6 - cy * FS) / FS, z: (p.z + wz - PATH.z) / FS, color: clothCols[i][(cx + cy) % 2], cloth: cx });
    }
    const clothEnd = flagVox.length;
    // Plaquita con el número en la base (cara hacia la cámara del sendero)
    const [nx, nz] = PF.f(0, 0.45);
    const plaque = new THREE.Vector3(p.x + nx - PATH.x, g + 0.55, p.z + nz - PATH.z);
    flagVox.push({ x: (p.x + (nx - PATH.x) * 0.6) / FS, y: (g + 0.55) / FS, z: (p.z + (nz - PATH.z) * 0.6) / FS, color: PAL.panel, s: 2.3 });
    const nb = textBlocks(String(i + 1)).blocks;
    nb.forEach((b) => {
      const [ox, oz] = PF.f((b.x - 2) * 0.17, 0.9);
      flagVox.push({ x: (p.x + ox - PATH.x) / FS, y: (g + 0.02 + b.y * 0.17) / FS, z: (p.z + oz - PATH.z) / FS, color: "#FFF6E5", s: 0.34 });
    });
    flagInfo.push({ start, clothStart, clothEnd, end: flagVox.length, pos: new THREE.Vector3(p.x, g, p.z), plaque });
  });
  const flagMesh = voxelMesh(flagVox, mainMat, { geometry: geo, scale: FS, jitterColor: false });
  flagMesh.userData.cloth = flagVox.map((v) => v.cloth || 0);
  const flagWave = PF.front.clone();

  /* ---------- Tapa del cofre: escalonada, gira sobre su bisagra trasera ---------- */
  const lidVox = [];
  for (let x = -3; x <= 2; x++) for (let z = 0; z <= 3; z++) lidVox.push({ x, y: 0, z, color: (x === -3 || x === 2) ? PAL.gold : (x % 2 ? PAL.wood : PAL.wood2) });
  for (let x = -3; x <= 2; x++) for (let z = 1; z <= 2; z++) lidVox.push({ x, y: 1, z, color: (x === -3 || x === 2) ? PAL.gold : PAL.woodDark });
  const lidMesh = voxelMesh(lidVox, mainMat, { geometry: geo, jitterColor: false });
  lidMesh.position.set(0, 0.5, 0.5);
  const lidHinge = new THREE.Group(); // gira en X (abrir)
  lidHinge.add(lidMesh);
  const lidPivot = new THREE.Group(); // posición y orientación de la construcción
  const [lhx, lhz] = CF.f(0, -2.5);
  lidPivot.position.set(lhx, 2.5, lhz);
  lidPivot.rotation.y = CF.rotY;
  lidPivot.add(lidHinge);
  const [cgx, cgz] = CF.f(-0.5, -0.5);
  const chestGlow = new THREE.Vector3(cgx, 2.8, cgz);

  /* ---------- Dígitos de la torre ---------- */
  const digitsMesh = voxelMesh([], accentMat, { geometry: geo, scale: 1, capacity: 3 * 40, jitterColor: false });

  /* ---------- Paradas ---------- */
  const box = (c, sx, sy, sz, cy) => new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(c.x, cy, c.z), new THREE.Vector3(sx, sy, sz));
  const signW = boardW * ms;
  const signC = new THREE.Vector3(MON.x, (boardY0 + boardTop) / 2, (boardZ0 + signFront) / 2);
  const hc = HF.f(0, 0.5), tc = TF.f(0, 0.5), cc = CF.f(-0.5, 0);
  const wfMid = { x: (cc[0] + WF.x) / 2, z: (cc[1] + WF.z) / 2 };
  // Centro del Sendero: a mitad de los 4 banderines
  const pathMid = { x: (flagPts[0].x + flagPts[3].x) / 2, z: (flagPts[0].z + flagPts[3].z) / 2 };
  const wallC = WFm.f(-0.5, 0);
  // Cada cámara mira desde el lado del centro (yawCenter) → detrás de la protagonista sólo hay cielo.
  const stops = [
    // Letrero de frente: ocupa ~88 % del ancho; la base y los escalones quedan dentro del encuadre
    { id: "monumento", name: "Monumento", target: new THREE.Vector3(MON.x, (0.5 + boardTop) / 2 + 0.2, signC.z), radius: (px1 - px0 + 1) / 2 / 0.88, halfH: (boardTop - 0.5) / 2 + 1, yaw: 0, pitch: 10, time: "dawn",
      box: box({ x: MON.x, z: lz }, px1 - px0 + 1, boardTop, 5, boardTop / 2) },
    { id: "casa", name: "La Casa de la Fiesta", target: new THREE.Vector3(hc[0], 6.7, hc[1]), radius: 5.6, halfH: 7.6, yaw: yawCenter(LAYOUT.house), pitch: 14, time: "morning",
      box: box({ x: hc[0], z: hc[1] }, 9, 13.5, 9, 6.75) },
    { id: "torre", name: "Torre del Reloj", target: new THREE.Vector3(tc[0], 9, tc[1]), radius: 4.2, halfH: 10.8, yaw: yawCenter(LAYOUT.tower), pitch: 8, time: "noon",
      box: box({ x: tc[0], z: tc[1] }, 7, 17, 7, 8.5) },
    // Vista elevada de 3/4 del camino completo con sus 4 banderines (sin recorrido de cámara)
    { id: "sendero", name: "El Sendero", target: new THREE.Vector3(pathMid.x, 3, pathMid.z), radius: 6.4, halfH: 5.4, yaw: SENDERO_YAW, pitch: 38, time: "afternoon",
      box: box(pathMid, 8, 6, 8, 3) },
    { id: "mirador", name: "El Mirador", target: new THREE.Vector3(canopy.x, 7.2, canopy.z), radius: 6.2, halfH: 8.6, yaw: yawCenter(LAYOUT.tree), pitch: 11, time: "golden",
      box: box(canopy, 11, 15, 11, 7.5) },
    { id: "cofre", name: "El Cofre", target: new THREE.Vector3(wfMid.x, 1.6, wfMid.z), radius: 6.6, halfH: 4, yaw: yawCenter(LAYOUT.chest, 12), pitch: 26, time: "sunset",
      box: box({ x: cc[0], z: cc[1] }, 7, 5, 7, 2) },
    { id: "muro", name: "El Muro del Escuadrón", target: new THREE.Vector3(wallC[0], 3.6, wallC[1]), radius: 5.5 / 0.7 * 0.95, halfH: 4.2, yaw: yawCenter(LAYOUT.wall, 15), pitch: 9, time: "pink",
      box: box({ x: wallC[0], z: wallC[1] }, 12, 8, 12, 4) }
  ];

  ["monument", "house", "tower", "path", "tree", "chest", "wall"].forEach((z, i) => (stops[i].zone = z));

  /* ---------- Cajas por zona (chequeo de superposiciones en debug) ---------- */
  // Cada zona es una lista de cajas (una por bloque): el recuadro en pantalla sale de los bloques
  // visibles, no de una caja envolvente que exageraría la superposición.
  const zoneParts = new Map();
  const part = (name, c, h) => { if (!zoneParts.has(name)) zoneParts.set(name, []); zoneParts.get(name).push(new THREE.Box3().setFromCenterAndSize(c, new THREE.Vector3(h * 2, h * 2, h * 2))); };
  for (const set of [vox, glow]) for (const v of set.map.values()) if (v.zone) part(v.zone, new THREE.Vector3(v.x, v.y, v.z), (v.s || 1) / 2);
  zoneParts.get("monument").push(signBox.clone());
  flagVox.forEach((v) => part("path", new THREE.Vector3(v.x * FS, v.y * FS, v.z * FS), (v.s || 1) * FS / 2));
  // Marcos de fotos que giran alrededor del árbol: anillo de cajas a su radio
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; zoneParts.get("tree").push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(canopy.x + Math.cos(a) * FRAME_R, 3.9, canopy.z + Math.sin(a) * FRAME_R), new THREE.Vector3(2, 3.4, 2))); }
  balloons.forEach((b) => part("globos", new THREE.Vector3(b.x, b.y, b.z), 0.6));
  const NAMES = { monument: "Monumento", house: "Casa", tower: "Torre", path: "Sendero", tree: "Mirador", chest: "Cofre", wall: "Muro", globos: "globos de la casa" };
  const OWNER = { monument: "monument", house: "house", tower: "tower", path: "path", tree: "tree", chest: "chest", wall: "wall", globos: "house" };
  const overlapObjects = [...zoneParts].map(([k, parts]) => ({ zone: k, name: NAMES[k] || k.replace("arbol", "árbol"), owner: OWNER[k] || null, parts: () => parts }));

  // Piezas propias de cada zona dentro de su grupo (se desvanecen con ella)
  groups.monument.add(boardMesh, monumentMesh, eightMesh);
  groups.house.add(balloonMesh, strings);
  groups.path.add(flagMesh);
  groups.chest.add(lidPivot);
  groups.tower.add(digitsMesh);
  const zonePlan = ZONES.map((k) => ({ zone: k, name: NAMES[k], poly: zonePolys[k] }));
  const zoneGaps = [];
  for (let i = 0; i < ZONES.length; i++) for (let j = i + 1; j < ZONES.length; j++) {
    const A = zonePolys[ZONES[i]], Bp = zonePolys[ZONES[j]];
    let m = Infinity;
    for (const p of A) m = Math.min(m, polyDist(p[0], p[1], Bp));
    for (const p of Bp) m = Math.min(m, polyDist(p[0], p[1], A));
    zoneGaps.push({ a: ZONES[i], b: ZONES[j], d: m });
  }

  return {
    meshes: {
      ground, rock, misc, water: waterMesh, balloons: balloonMesh, board: boardMesh, monument: monumentMesh, eight: eightMesh, flags: flagMesh, lid: lidMesh, digits: digitsMesh,
      // Orden de la construcción inicial (todas las instancias que caen del cielo)
      layered: [rock, ground, misc, ...zoneMeshes, boardMesh, waterMesh, balloonMesh, flagMesh, lidMesh, digitsMesh]
    },
    groups,
    materials: { main: mainMat, glow: glowMat, water: waterMat, accent: accentMat, letters: letterMat },
    extras: { strings, lidPivot, lidHinge },
    stops,
    plan: { zones: zonePlan, gaps: zoneGaps, radiusAt, R: R_BASE, trees: smallTrees.map((t, i) => ({ name: `árbol-${i + 1}`, x: t.x, z: t.z })) },
    info: {
      flagInfo, flagWave, wallSlots, wallInfo, portalCenter, portalRotY, clock, digits, balloons, lanternSpots, houseLight, chestGlow,
      monument: { x0: boardX0, width: signW, height: boardTop - boardY0, z: lz, front: boardZ0 + 2 * ms, center: signC.clone(), box: signBox.clone() },
      overlapObjects,
      waterfallTop: new THREE.Vector3(WF.x - 0.5, -1, WF.z), waterfallBottomY: -10.5,
      tree: { x: canopy.x, z: canopy.z, y: trg }, chest: { x: cc[0], z: cc[1] },
      house: { x: LAYOUT.house.x, z: LAYOUT.house.z, dogPoints, dogSafe, dogStart: HF.f(0, 6) }, heightAt, minY,
      frameRadius: FRAME_R,
      counts: { main: mainCount + topList.length + bodyList.length + boardVox.length, glow: glowList.length, water: waterList.length }
    }
  };
}

/** Voxeliza los días restantes para la fachada de la torre (grandes, blanco crema, alineados al frente). */
export function digitVoxels(text, digits) {
  const tb = textBlocks(String(text), { spacing: 1 });
  const s = Math.min(digits.maxS, digits.maxW / Math.max(tb.width, 1));
  const out = tb.blocks.map((b) => {
    const off = (b.x - (tb.width - 1) / 2) * s;
    return { x: digits.anchor.x + digits.right.x * off, y: digits.anchor.y + b.y * s + s / 2, z: digits.anchor.z + digits.right.z * off, color: "#FFF6E5", order: b.order };
  });
  return { list: out, s };
}
