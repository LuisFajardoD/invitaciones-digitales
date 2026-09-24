// Vóxeles: geometría de bloque con biseles (chaflanes) y conjuntos de vóxeles → InstancedMesh.
import * as THREE from "../../vendor/three.module.min.js";

/**
 * Cubo unitario con aristas biseladas: 6 caras + 12 chaflanes + 8 esquinas (44 triángulos).
 * Normales planas por faceta: el chaflán capta la luz y da el aspecto de juguete redondeado.
 */
export function bevelBoxGeometry(bevel = 0.08) {
  const H = 0.5, I = 0.5 - bevel;
  const pos = [], nor = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function tri(a, b, c, n) {
    const e1 = b.clone().sub(a), e2 = c.clone().sub(a);
    if (e1.cross(e2).dot(n) < 0) [b, c] = [c, b];
    for (const p of [a, b, c]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
  }
  const quad = (a, b, c, d, n) => { tri(a, b, c, n); tri(a, c, d, n); };
  const axes = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
  // Caras
  for (const [a, b, c] of axes) {
    for (const s of [1, -1]) {
      const p = (u, v) => { const r = [0, 0, 0]; r[a] = s * H; r[b] = u; r[c] = v; return V(...r); };
      const n = [0, 0, 0]; n[a] = s;
      quad(p(-I, -I), p(I, -I), p(I, I), p(-I, I), V(...n));
    }
  }
  // Chaflanes de las aristas (entre dos caras)
  for (const [a, b, c] of axes) {
    for (const sa of [1, -1]) for (const sb of [1, -1]) {
      const p = (ua, ub, vc) => { const r = [0, 0, 0]; r[a] = ua; r[b] = ub; r[c] = vc; return V(...r); };
      const n = [0, 0, 0]; n[a] = sa; n[b] = sb;
      quad(p(sa * H, sb * I, -I), p(sa * H, sb * I, I), p(sa * I, sb * H, I), p(sa * I, sb * H, -I), V(...n).normalize());
    }
  }
  // Esquinas
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
    tri(V(sx * H, sy * I, sz * I), V(sx * I, sy * H, sz * I), V(sx * I, sy * I, sz * H), V(sx, sy, sz).normalize());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
}

/**
 * Bloque del suelo: sólo las 4 aristas superiores biseladas (a cuatro aguas); lados y base planos.
 * Así el pasto conserva el aspecto de losetas, pero los lados de la isla quedan sin ranuras:
 * sin chaflanes en los lados no hay costuras claras ni túneles entre bloques vecinos.
 */
export function bevelTopGeometry(bevel = 0.08) {
  const H = 0.5, I = 0.5 - bevel;
  const pos = [], nor = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function tri(a, b, c, n) {
    const e1 = b.clone().sub(a), e2 = c.clone().sub(a);
    if (e1.cross(e2).dot(n) < 0) [b, c] = [c, b];
    for (const p of [a, b, c]) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
  }
  const quad = (a, b, c, d, n) => { tri(a, b, c, n); tri(a, c, d, n); };
  quad(V(-I, H, -I), V(I, H, -I), V(I, H, I), V(-I, H, I), V(0, 1, 0)); // tapa
  quad(V(-H, -H, -H), V(H, -H, -H), V(H, -H, H), V(-H, -H, H), V(0, -1, 0)); // base
  for (const s of [1, -1]) {
    // lados ±x y ±z (completos hasta el inicio del chaflán) y chaflanes superiores
    quad(V(s * H, -H, -H), V(s * H, -H, H), V(s * H, I, H), V(s * H, I, -H), V(s, 0, 0));
    quad(V(-H, -H, s * H), V(H, -H, s * H), V(H, I, s * H), V(-H, I, s * H), V(0, 0, s));
    quad(V(s * H, I, -H), V(s * H, I, H), V(s * I, H, I), V(s * I, H, -I), V(s, 1, 0).normalize());
    quad(V(-H, I, s * H), V(H, I, s * H), V(I, H, s * I), V(-I, H, s * I), V(0, 1, s).normalize());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
}

/** Cubo unitario plano (roca y tierra bajo la superficie). */
export function plainBoxGeometry() {
  return new THREE.BoxGeometry(1, 1, 1);
}

const key = (x, y, z) => `${x},${y},${z}`;

/** Conjunto de vóxeles en coordenadas enteras. */
export class VoxelSet {
  constructor() { this.map = new Map(); }
  set(x, y, z, color, meta = {}) { this.map.set(key(x, y, z), { x, y, z, color, ...meta }); }
  get(x, y, z) { return this.map.get(key(x, y, z)); }
  has(x, y, z) { return this.map.has(key(x, y, z)); }
  delete(x, y, z) { this.map.delete(key(x, y, z)); }
  get size() { return this.map.size; }
  /** Sólo los vóxeles con al menos una cara expuesta (los interiores no se dibujan). */
  surface(solidTest = (v) => v) {
    const out = [];
    for (const v of this.map.values()) {
      const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      if (n.some(([dx, dy, dz]) => !solidTest(this.get(v.x + dx, v.y + dy, v.z + dz)))) out.push(v);
    }
    return out;
  }
}

/** Hash determinista por posición → variación de tono ±4 %. */
function jitter(x, y, z) {
  let n = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (((n ^ (n >>> 16)) >>> 0) / 4294967295 - 0.5) * 0.08;
}

const _m = new THREE.Matrix4();
const _c = new THREE.Color();

/**
 * Crea un InstancedMesh desde una lista de vóxeles { x, y, z, color, s? (escala) }.
 * offset/scale transforman la rejilla al mundo. Guarda posiciones base para animar.
 */
export function voxelMesh(list, material, { geometry, scale = 1, offset = [0, 0, 0], jitterColor = true, capacity = 0 } = {}) {
  const count = Math.max(list.length, capacity, 1);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.count = list.length;
  const base = new Float32Array(count * 4);
  list.forEach((v, i) => {
    const s = (v.s || 1) * scale;
    const px = offset[0] + v.x * scale, py = offset[1] + v.y * scale, pz = offset[2] + v.z * scale;
    base.set([px, py, pz, s], i * 4);
    _m.makeScale(s, s, s).setPosition(px, py, pz);
    mesh.setMatrixAt(i, _m);
    _c.set(v.color);
    if (jitterColor) { const j = 1 + jitter(v.x, v.y, v.z); _c.r *= j; _c.g *= j; _c.b *= j; }
    mesh.setColorAt(i, _c);
  });
  mesh.userData.base = base;
  mesh.userData.voxels = list;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

/** Pone la instancia i en su posición base con escala (sx,sy,sz) y desplazamiento vertical dy. */
export function setInstance(mesh, i, { dy = 0, sx = 1, sy = 1, sz = 1, dx = 0, dz = 0, rotY = 0 } = {}) {
  const b = mesh.userData.base;
  const s = b[i * 4 + 3];
  _m.makeRotationY(rotY);
  _m.scale(new THREE.Vector3(s * sx, s * sy, s * sz));
  _m.setPosition(b[i * 4] + dx, b[i * 4 + 1] + dy - (1 - sy) * s * 0.5, b[i * 4 + 2] + dz);
  mesh.setMatrixAt(i, _m);
}
