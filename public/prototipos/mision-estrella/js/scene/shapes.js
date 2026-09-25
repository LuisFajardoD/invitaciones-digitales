// Geometrías compartidas del acabado final: caja redondeada (regalos, módulos, satélites), corazón con volumen,
// y ruido 3D suave para deformar rocas. Todo se construye una vez y se reutiliza entre objetos.
import * as THREE from "three";

/**
 * Caja con esquinas y aristas redondeadas (algoritmo de RoundedBoxGeometry de three/examples): UV por cara 0–1.
 * seg = segmentos de la curva de cada arista.
 */
export function roundedBox(w = 1, h = 1, d = 1, radius = 0.1, seg = 3) {
  const n = seg * 2 + 1, r = Math.min(w / 2, h / 2, d / 2, radius);
  const geo = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const box = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r), p = new THREE.Vector3(), q = new THREE.Vector3(), half = 0.5 / n;
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i); q.copy(p);
    q.x -= Math.sign(q.x) * half; q.y -= Math.sign(q.y) * half; q.z -= Math.sign(q.z) * half;
    q.normalize();
    pos.setXYZ(i, box.x * Math.sign(p.x) + q.x * r, box.y * Math.sign(p.y) + q.y * r, box.z * Math.sign(p.z) + q.z * r);
    nor.setXYZ(i, q.x, q.y, q.z);
  }
  return geo;
}

/** Corazón acolchado (extrusión con bisel redondo), centrado, de ancho ≈ size y apuntando hacia abajo (−Y). */
export function heartGeometry(size = 1, { depth = 0.28, curve = 8 } = {}) {
  const s = new THREE.Shape(), k = size / 2.2;
  s.moveTo(0, -1.05 * k);
  s.bezierCurveTo(-0.3 * k, -0.72 * k, -1.1 * k, -0.28 * k, -1.1 * k, 0.28 * k);
  s.bezierCurveTo(-1.1 * k, 0.86 * k, -0.42 * k, 1.08 * k, 0, 0.62 * k);
  s.bezierCurveTo(0.42 * k, 1.08 * k, 1.1 * k, 0.86 * k, 1.1 * k, 0.28 * k);
  s.bezierCurveTo(1.1 * k, -0.28 * k, 0.3 * k, -0.72 * k, 0, -1.05 * k);
  const geo = new THREE.ExtrudeGeometry(s, { depth: depth * k, bevelEnabled: true, bevelThickness: 0.32 * k, bevelSize: 0.26 * k, bevelSegments: curve, curveSegments: curve * 2 });
  geo.center(); geo.computeVertexNormals();
  return geo;
}

/* ---------- Ruido 3D (valor con interpolación suave) ---------- */
function hash(x, y, z, seed) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683) + Math.imul(seed, 144665)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
/** Ruido de valor 3D en [0, 1]. */
export function noise3(x, y, z, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz, seed);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), xf), L(c(0, 1, 0), c(1, 1, 0), xf), yf), L(L(c(0, 0, 1), c(1, 0, 1), xf), L(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
}
/** Ruido fractal (varias octavas) en [≈-1, 1]. */
export function fbm3(x, y, z, seed = 0, oct = 4) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += a * (noise3(x * f, y * f, z * f, seed + i * 17) * 2 - 1); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}
