// Controlador del cohete: GLB de models.js (si hay) o el procedural. Expone la misma API a la escena:
// root, slots del mural (posición + normal sobre la superficie), ventana, escotilla y propulsores (humo).
import * as THREE from "three";
import { models } from "../models.js";
import { createProceduralRocket } from "./rocket-procedural.js";
import { loadGLB, adapt } from "./model-adapter.js";

export function createRocket() { // (colores: tema en vivo, ver materials.js → THEME3D)
  const holder = new THREE.Group(); holder.name = "rocket-holder";
  const proc = createProceduralRocket();
  holder.add(proc.root);
  const api = {
    root: holder, kind: "procedural",
    slots: proc.slots, boosters: proc.boosters,
    windowWorld: (o) => proc.windowWorld(o), setHatch: (k) => proc.setHatch(k), setInterior: (v) => proc.setInterior(v),
    hatchWorld: (c, n) => proc.hatchWorld(c, n),
    update: (t) => proc.update(t),
    cabinVisible: true
  };
  const cfg = models.rocket;
  if (cfg.url) {
    loadGLB(cfg.url).then((g) => {
      const m = adapt(g, { height: cfg.height, visorPhoto: false });
      // base del modelo en y = -0.4 como el procedural
      const box = new THREE.Box3().setFromObject(m.root); m.root.position.y += -0.4 - box.min.y;
      holder.clear(); holder.add(m.root);
      api.kind = "glb";
      m.root.updateMatrixWorld(true);
      // Propulsores: piezas llamadas booster/engine/nozzle/thruster (si no, la base central).
      const boosters = [];
      m.root.traverse((o) => { if (o.isMesh && /booster|engine|nozzle|thruster|propuls/i.test(o.name)) { const b = new THREE.Box3().setFromObject(o); boosters.push(new THREE.Vector3((b.min.x + b.max.x) / 2, b.min.y, (b.min.z + b.max.z) / 2)); } });
      api.boosters = boosters.length ? boosters : [new THREE.Vector3(0, -0.4, 0)];
      // Mural: se proyectan los parches sobre la superficie (lado +X, o la pieza "mural"/"tank").
      const target = []; let muralPart = null;
      m.root.traverse((o) => { if (o.isMesh) { target.push(o); if (/mural|tank|tanque/i.test(o.name)) muralPart = o; } });
      const rb = new THREE.Box3().setFromObject(muralPart || m.root), rc = rb.getCenter(new THREE.Vector3()), rs = rb.getSize(new THREE.Vector3());
      const ray = new THREE.Raycaster(), slots = [];
      [0.62, 0.45].forEach((fy) => [-0.28, 0, 0.28].forEach((fz) => {
        const origin = new THREE.Vector3(rb.max.x + 2, rb.min.y + rs.y * fy, rc.z + rs.z * fz);
        ray.set(origin, new THREE.Vector3(-1, 0, 0));
        const hit = ray.intersectObjects(target, false)[0];
        if (!hit) return;
        const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(1, 0, 0);
        const p = holder.worldToLocal(hit.point.clone()).addScaledVector(n, 0.012);
        slots.push({ pos: p, normal: n, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n) });
      }));
      if (slots.length >= 6) api.slots.splice(0, api.slots.length, ...slots);
      api.cabinVisible = false;
      api.setHatch = () => {}; api.setInterior = () => {}; api.update = () => {};
      // ventana: pieza "window"/"hatch" del GLB (si no, la parte frontal superior)
      let win = null; m.root.traverse((o) => { if (!win && o.isMesh && /window|hatch|ventana|cockpit/i.test(o.name)) win = o; });
      const wb = new THREE.Box3().setFromObject(win || m.root);
      const wp = win ? wb.getCenter(new THREE.Vector3()) : new THREE.Vector3(0, wb.min.y + (wb.max.y - wb.min.y) * 0.72, wb.max.z);
      const wLocal = holder.worldToLocal(wp.clone());
      api.windowWorld = (o = new THREE.Vector3()) => holder.localToWorld(o.copy(wLocal));
      // escotilla del GLB: centro de la ventana, normal +Z del cohete, radio según el tamaño de la pieza
      const wr = Math.max(0.3, Math.min(wb.max.x - wb.min.x, wb.max.y - wb.min.y) / 2);
      api.hatchWorld = (c = new THREE.Vector3(), n = new THREE.Vector3()) => { api.windowWorld(c); n.set(0, 0, 1).transformDirection(holder.matrixWorld); return wr; };
      api.onSwap?.();
    }).catch((e) => console.warn("[modelos] cohete:", e.message));
  }
  return api;
}

/** Luna, media luna o estación: GLB si hay, si no el procedural (build()). Devuelve un grupo que se rellena. */
export function modelOrBuild(key, build) {
  const holder = new THREE.Group(); holder.name = `${key}-holder`;
  const built = build(); holder.add(built.root);
  const cfg = models[key];
  if (cfg?.url) {
    loadGLB(cfg.url).then((g) => {
      const m = adapt(g, { height: cfg.height, visorPhoto: false });
      built.root.visible = false;
      holder.add(m.root);
      built.onGLB?.(m.root);
    }).catch((e) => console.warn(`[modelos] ${key}:`, e.message));
  }
  return { holder, built };
}
