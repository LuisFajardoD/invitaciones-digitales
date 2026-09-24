// Rig de cámara: vistas por parada, UN solo tipo de vuelo (curva con easing, igual para todas), encuadre
// por encima de la tarjeta (setViewOffset según la altura visible) y órbita corta (±25°) que regresa
// sola al soltar. Un vuelo nuevo a mitad de otro parte de la posición actual de la cámara (sin saltos)
// y resuelve la promesa del anterior con { interrupted: true }.
import * as THREE from "../../vendor/three.module.min.js";
import { clamp, lerp, easeInOut } from "../util.js";

const DEG = Math.PI / 180;

export function createCameraRig(camera, getSize) {
  const view = { target: new THREE.Vector3(0, 2, 0), yaw: 0, pitch: 30, radius: 30 };
  const pos = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  let inset = 0, insetTarget = 0; // px tapados por la tarjeta (y el dock)
  let orbitYaw = 0, orbitVel = 0, dragging = false;
  let flight = null;
  let manual = null; // pose explícita (coreografía de la construcción)

  /** Distancia para que "radius" quepa en el área visible (ancho y alto). */
  function distanceFor(radius, insetPx = inset, halfH = radius) {
    const { w, h } = getSize();
    const vis = clamp((h - insetPx) / h, 0.3, 1);
    const tv = Math.tan((camera.fov * DEG) / 2);
    const aspect = w / h;
    const dv = halfH / (tv * vis);
    const dw = radius / (tv * aspect);
    return Math.max(dv, dw) * 1.05;
  }
  function posFor(v, out, insetPx) {
    const d = distanceFor(v.radius, insetPx, v.halfH ?? v.radius);
    const y = v.yaw * DEG, p = v.pitch * DEG;
    out.set(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)).multiplyScalar(d).add(v.target);
    return out;
  }

  function applyOffset() {
    const { w, h } = getSize();
    camera.aspect = w / h;
    camera.setViewOffset(w, h, 0, inset / 2, w, h);
    camera.updateProjectionMatrix();
  }

  const rig = {
    view,
    get flying() { return !!flight; },
    get inset() { return inset; },
    get insetTarget() { return insetTarget; },
    setInset(px, instant = false) { insetTarget = px; if (instant) { inset = px; applyOffset(); } },
    /** Posición final de la cámara para una vista (con la tarjeta que tendrá al llegar). */
    poseFor: (v, insetPx = insetTarget) => posFor(v, new THREE.Vector3(), insetPx),
    /** Vuelo en arco (no línea recta) hacia una vista, desde donde esté la cámara ahora. */
    flyTo(v, { duration = 1200, arc = 1 } = {}) {
      if (flight) { const r = flight.resolve; flight = null; r({ interrupted: true }); }
      const startPos = camera.position.clone();
      const startTgt = tgt.clone();
      const endV = { target: v.target.clone(), yaw: v.yaw, pitch: v.pitch, radius: v.radius, halfH: v.halfH };
      return new Promise((resolve) => {
        if (duration <= 0) {
          Object.assign(view, endV); view.target = endV.target;
          resolve({}); return;
        }
        flight = { startPos, startTgt, endV, t0: performance.now(), duration, arc, resolve };
      });
    },
    /** Fija la cámara en una pose explícita (la construcción la mueve frame a frame). */
    hold(p, t) {
      if (flight) { const r = flight.resolve; flight = null; r({ interrupted: true }); }
      manual = manual || { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };
      manual.pos.copy(p); manual.tgt.copy(t);
    },
    /** Suelta la pose explícita y adopta una vista (sin salto si la pose coincide con ella). */
    release(v) {
      manual = null;
      if (v) { Object.assign(view, { yaw: v.yaw, pitch: v.pitch, radius: v.radius, halfH: v.halfH }); view.target = v.target.clone(); }
    },
    orbitStart() { dragging = true; },
    orbitDrag(dxPx) { orbitYaw = clamp(orbitYaw - dxPx * 0.25, -25, 25); },
    orbitEnd() { dragging = false; },
    update(now, dt) {
      let moving = false;
      if (Math.abs(inset - insetTarget) > 0.5) { inset = lerp(inset, insetTarget, 1 - Math.pow(0.001, dt)); moving = true; } else inset = insetTarget;
      applyOffset();
      // Órbita: resorte de regreso a 0 al soltar
      if (!dragging && Math.abs(orbitYaw) > 0.05) {
        orbitVel = orbitVel * Math.pow(0.02, dt) - orbitYaw * 9 * dt;
        orbitYaw += orbitVel * dt * 10;
        if (Math.abs(orbitYaw) < 0.05) { orbitYaw = 0; orbitVel = 0; }
        moving = true;
      }
      if (manual) {
        pos.copy(manual.pos); tgt.copy(manual.tgt);
      } else if (flight) {
        const p = clamp((now - flight.t0) / flight.duration, 0, 1);
        const e = easeInOut(p);
        const endPos = posFor(flight.endV, new THREE.Vector3(), insetTarget);
        // Punto de control elevado y hacia afuera: curva suave
        const mid = flight.startPos.clone().lerp(endPos, 0.5);
        const span = flight.startPos.distanceTo(endPos);
        const out = new THREE.Vector3(mid.x, 0, mid.z);
        if (out.lengthSq() < 1) out.set(0, 0, 1);
        out.normalize().multiplyScalar(span * 0.25 * flight.arc);
        const ctrl = mid.add(out).add(new THREE.Vector3(0, span * 0.28 * flight.arc, 0));
        const u = 1 - e;
        pos.set(0, 0, 0).addScaledVector(flight.startPos, u * u).addScaledVector(ctrl, 2 * u * e).addScaledVector(endPos, e * e);
        tgt.lerpVectors(flight.startTgt, flight.endV.target, e);
        if (p >= 1) {
          Object.assign(view, flight.endV);
          const r = flight.resolve; flight = null; r({});
        }
        moving = true;
      } else {
        posFor(view, pos); tgt.copy(view.target);
      }
      // Aplica órbita alrededor del objetivo
      if (orbitYaw !== 0 && !flight && !manual) {
        const off = pos.clone().sub(tgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbitYaw * DEG);
        pos.copy(tgt).add(off);
      }
      camera.position.copy(pos);
      camera.lookAt(tgt);
      return moving;
    },
    /** Coloca la cámara inmediatamente en la vista actual (sin vuelo). */
    snap() { posFor(view, pos); tgt.copy(view.target); camera.position.copy(pos); camera.lookAt(tgt); },
    distanceFor
  };
  tgt.copy(view.target);
  return rig;
}
