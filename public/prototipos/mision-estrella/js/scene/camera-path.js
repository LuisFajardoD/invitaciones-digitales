// Ayudantes de cámara: fotogramas clave por capítulo, mezcla con arco entre capítulos, posiciones en espacio
// de cámara y temblor (shake) determinista sin crear objetos por frame.
import * as THREE from "three";
import { smooth } from "../util.js";

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** keys: [[p, pos, target], ...] ordenados por p. Escribe en out.pos / out.tgt. */
export function samplePath(keys, p, out) {
  if (p <= keys[0][0]) { out.pos.copy(keys[0][1]); out.tgt.copy(keys[0][2]); return out; }
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, a0, t0] = keys[i], [p1, a1, t1] = keys[i + 1];
    if (p <= p1) { const k = smooth((p - p0) / (p1 - p0)); out.pos.lerpVectors(a0, a1, k); out.tgt.lerpVectors(t0, t1, k); return out; }
  }
  const last = keys[keys.length - 1]; out.pos.copy(last[1]); out.tgt.copy(last[2]);
  return out;
}

/** Mezcla dos encuadres con un arco (la cámara "vuela" entre capítulos). */
export function blendShots(a, b, k, out, arc = 0.12) {
  out.pos.lerpVectors(a.pos, b.pos, k);
  out.tgt.lerpVectors(a.tgt, b.tgt, k);
  const d = a.pos.distanceTo(b.pos);
  out.pos.y += Math.sin(k * Math.PI) * d * arc;
  return out;
}

const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
/** Punto en espacio de cámara (x derecha, y arriba, z hacia adelante) para un encuadre pos→tgt. */
export function camSpace(pos, tgt, x, y, z, out = new THREE.Vector3()) {
  _f.subVectors(tgt, pos).normalize();
  _r.crossVectors(_f, UP).normalize();
  _u.crossVectors(_r, _f).normalize();
  return out.copy(pos).addScaledVector(_r, x).addScaledVector(_u, y).addScaledVector(_f, z);
}

/** Temblor suave (suma de senos). */
export function shake(t, amp, out) {
  out.set(Math.sin(t * 37.1) + Math.sin(t * 23.7) * 0.6, Math.sin(t * 41.3 + 1.3) + Math.sin(t * 19.1) * 0.5, Math.sin(t * 29.9 + 2.1) * 0.7).multiplyScalar(amp);
  return out;
}

export const shot = () => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() });
