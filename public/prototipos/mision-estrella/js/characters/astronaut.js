// Controlador único del astronauta: usa el GLB de models.js (uno con animaciones o uno por pose) y, si no hay
// o falla, el procedural. La escena sólo habla con esta API: root, setPose, requestPose, update, visor, parche.
// Los cambios de pose entre GLB distintos se aplican sólo cuando la escena lo permite (transición de cámara o
// fuera de cuadro) con un micro fundido de escala, para que nunca se vea el cambio.
import * as THREE from "three";
import { models } from "../models.js";
import { createProceduralAstronaut } from "./astronaut-procedural.js";
import { loadGLB, adapt, proceduralMotion } from "./model-adapter.js";

export function createAstronaut({ suitColor, accentColor }) {
  const root = new THREE.Group(); root.name = "astronaut-root";
  const holder = new THREE.Group(); root.add(holder);
  const proc = createProceduralAstronaut({ suitColor, accentColor });
  holder.add(proc.root);
  let visorTex = null, patchTex = null;
  const glb = {}; // pose → { root, mixer, actions, parts } (o "all" para un GLB con animaciones)
  let active = proc, activeKey = "procedural", pose = "fly", pending = null, swapT = -1;
  const cfg = models.astronaut;

  function applyTextures(target) {
    if (!target) return;
    if (visorTex && target.parts?.visor) { target.parts.visor.material.map = visorTex; target.parts.visor.material.needsUpdate = true; }
    if (patchTex && target.parts?.patch) { const m = target.parts.patch.material; if (m) { m.map = patchTex; m.needsUpdate = true; } }
  }
  function modelFor(p) { return glb[p] || glb.all || null; }
  function show(p) {
    const m = modelFor(p);
    const want = m ? (glb[p] ? p : "all") : "procedural";
    if (want !== activeKey) {
      holder.clear();
      active = want === "procedural" ? proc : m;
      holder.add(active.root);
      activeKey = want;
      applyTextures(active);
    }
    if (active === proc) proc.setPose(p);
    else if (active.actions) {
      const a = active.actions[p] || active.actions.fly;
      Object.values(active.actions).forEach((x) => { if (x !== a) x.fadeOut(0.3); });
      a?.reset().fadeIn(0.3).play();
    }
  }
  async function loadAll() {
    const common = { height: cfg.height, suitColor, accentColor };
    const jobs = [];
    if (cfg.url) jobs.push(loadGLB(cfg.url).then((g) => { glb.all = adapt(g, common); }).catch((e) => console.warn("[modelos] astronauta:", e.message)));
    for (const [p, url] of Object.entries(cfg.poses || {})) if (url) jobs.push(loadGLB(url).then((g) => { glb[p] = adapt(g, common); }).catch((e) => console.warn(`[modelos] pose ${p}:`, e.message)));
    await Promise.all(jobs);
    if (Object.keys(glb).length) { pending = pose; swapT = 0; }
  }
  loadAll();

  return {
    root,
    get pose() { return pose; },
    get kind() { return activeKey; },
    /** Cambia de pose. `safe` = la escena garantiza que el cambio no se ve (transición o fuera de cuadro). */
    setPose(p, { safe = true } = {}) {
      if (p === pose && !pending) return;
      pose = p;
      const needsSwap = (modelFor(p) ? (glb[p] ? p : "all") : "procedural") !== activeKey;
      if (!needsSwap) { show(p); return; }
      if (safe) { pending = p; swapT = 0; } else pending = p;
    },
    /** Llamar cuando la cámara está en transición o el astronauta está fuera de cuadro. */
    allowSwap() { if (pending && swapT < 0) swapT = 0; },
    snapPose(p) { pose = p; pending = null; show(p); if (active === proc) proc.snapPose(p); },
    setVisorTexture(t) { visorTex = t; proc.setVisorTexture(t); applyTextures(active); Object.values(glb).forEach(applyTextures); },
    setPatchTexture(t) { patchTex = t; proc.setPatchTexture(t); applyTextures(active); Object.values(glb).forEach(applyTextures); },
    visorWorld(out = new THREE.Vector3()) { const v = active.parts?.visor || proc.visor; return v.getWorldPosition(out); },
    update(dt, t) {
      if (pending && swapT >= 0) { // micro fundido: encoge → cambia → crece (≈ 0.18 s)
        swapT += dt;
        const k = swapT / 0.09;
        if (k < 1) holder.scale.setScalar(1 - 0.08 * k);
        else if (pending) { show(pending); pending = null; }
      } else if (holder.scale.x < 1) holder.scale.setScalar(Math.min(1, holder.scale.x + dt * 0.9));
      if (!pending && swapT >= 0 && holder.scale.x >= 1) swapT = -1;
      if (active === proc) proc.update(dt, t);
      else { active.mixer?.update(dt); if (!active.actions || !Object.keys(active.actions).length) proceduralMotion(active.root, t, pose); }
    }
  };
}
