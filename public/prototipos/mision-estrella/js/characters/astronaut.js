// Controlador único del astronauta: usa el GLB de models.js (uno con animaciones o uno por pose) y, si no hay
// o falla, el procedural. La escena sólo habla con esta API: root, setPose, requestPose, update, visor, parche.
// Los cambios de pose entre GLB distintos se aplican sólo cuando la escena lo permite (transición de cámara o
// fuera de cuadro) con un micro fundido de escala, para que nunca se vea el cambio.
import * as THREE from "three";
import { models } from "../models.js";
import { createProceduralAstronaut, visorUniforms } from "./astronaut-procedural.js";
import { loadGLB, adapt, proceduralMotion } from "./model-adapter.js";

export function createAstronaut({ suitColor }) {
  const root = new THREE.Group(); root.name = "astronaut-root";
  const holder = new THREE.Group(); root.add(holder);
  const proc = createProceduralAstronaut({ suitColor });
  holder.add(proc.root);
  let visorSleep = null, visorAwake = null, patchTex = null;
  // Visor: foto dormido (map) y despierto (map2) con fundido cruzado; estos uniforms se comparten entre todos los
  // modelos (GLB y procedural) para que el cambio siga igual aunque cambie el modelo activo.
  const VU = visorUniforms();
  const FADE_PHOTO = 0.35, GLASS = 0.6; // s del fundido · reflejo del vidrio más sutil: la cara siempre se distingue
  let awakeK = 0, awakeTarget = 0;
  const glb = {}; // pose → { root, mixer, actions, parts } (o "all" para un GLB con animaciones)
  let active = proc, activeKey = "procedural", pose = "float", pending = null, swapT = -1;
  const cfg = models.astronaut;

  const FADE = 0.5; // fundido cruzado entre animaciones (s)
  // Las UV del GLB usan la convención glTF (sin volteo vertical): misma imagen, textura con flipY = false.
  const gltfTex = new WeakMap();
  function forGltf(t) {
    if (!gltfTex.has(t)) { const c = t.clone(); c.flipY = false; c.needsUpdate = true; gltfTex.set(t, c); }
    return gltfTex.get(t);
  }
  function applyTextures(target) {
    if (!target) return;
    const v = target.parts?.visor, u = v?.material?.userData?.visor;
    if (u) {
      u.mixK = VU.mixK; u.flash = VU.flash; u.gain = VU.gain; u.contrast = VU.contrast;
      const conv = (t) => (t && v.userData.gltfUV ? forGltf(t) : t);
      if (visorSleep || visorAwake) {
        v.material.map = conv(visorSleep || visorAwake); u.map2.value = conv(visorAwake || visorSleep);
        v.material.needsUpdate = true;
      } else u.map2.value = v.material.map;
    }
    const gm = target.parts?.glass?.material;
    if (gm?.uniforms?.strength) gm.uniforms.strength.value = GLASS;
    if (patchTex && target.parts?.patch) { const m = target.parts.patch.material; if (m) { m.map = patchTex; m.needsUpdate = true; } }
  }
  function modelFor(p) { return glb[p] || glb.all || null; }
  function show(p, fade = FADE) {
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
      const A = active.actions, a = A[p] || A.float || A.fly;
      if (!a || a === active.current) return;
      Object.values(A).forEach((x) => { if (x !== a && x.isRunning()) x.fadeOut(fade); });
      a.reset().setEffectiveWeight(1).fadeIn(active.current ? fade : 0).play();
      active.current = a;
    }
  }
  async function loadAll() {
    const common = { height: cfg.height, suitColor };
    const jobs = [];
    if (cfg.url) jobs.push(loadGLB(cfg.url, 20000, (f) => { glbProgress = f; }).then((g) => { glb.all = adapt(g, common); applyTextures(glb.all); }).catch((e) => console.warn("[modelos] astronauta:", e.message)));
    for (const [p, url] of Object.entries(cfg.poses || {})) if (url) jobs.push(loadGLB(url).then((g) => { glb[p] = adapt(g, common); applyTextures(glb[p]); }).catch((e) => console.warn(`[modelos] pose ${p}:`, e.message)));
    await Promise.all(jobs);
    glbProgress = 1; loaded = true;
    if (Object.keys(glb).length) { pending = pose; swapT = 0; }
  }
  // carga y "asentado" (para no mostrar nunca al astronauta a medio cargar ni en una pose fija): la descarga del
  // GLB (0–1) y cuántos cuadros seguidos lleva con el modelo definitivo, sin cambio pendiente, a tamaño completo y con
  // la animación de su pose ya aplicada por el mixer
  let glbProgress = cfg.url ? 0 : 1, loaded = false, settledFrames = 0;
  applyTextures(proc);
  const ready = loadAll(); // se resuelve al terminar de cargar (o fallar) los GLB: el procedural queda de respaldo
  let headYaw = 0, headTarget = 0;
  const headQ = new THREE.Quaternion(), headQW = new THREE.Quaternion(), Y_AXIS = new THREE.Vector3(0, 1, 0);
  const headApplied = { bone: null, q: new THREE.Quaternion() }; // giro de cabeza aplicado en el cuadro anterior

  return {
    root, ready,
    get pose() { return pose; },
    get kind() { return activeKey; },
    /** Descarga del modelo (0–1). */
    get loadProgress() { return glbProgress; },
    /** Cuadros seguidos con el modelo definitivo en su pose animada (0 = aún no: no mostrarlo). */
    get settledFrames() { return settledFrames; },
    /** Cambia de pose. `safe` = la escena garantiza que el cambio no se ve (transición o fuera de cuadro). */
    setPose(p, { safe = true, fade } = {}) {
      if (p === pose && !pending) return;
      pose = p;
      const needsSwap = (modelFor(p) ? (glb[p] ? p : "all") : "procedural") !== activeKey;
      if (!needsSwap) { show(p, fade ?? FADE); return; }
      if (safe) { pending = p; swapT = 0; } else pending = p;
    },
    /** Llamar cuando la cámara está en transición o el astronauta está fuera de cuadro. */
    allowSwap() { if (pending && swapT < 0) swapT = 0; },
    snapPose(p) { pose = p; pending = null; show(p); if (active === proc) proc.snapPose(p); },
    /** Fotos del visor: dormido (portada) y despierto (resto). */
    setVisorPhotos(sleepTex, awakeTex) { visorSleep = sleepTex; visorAwake = awakeTex; applyTextures(proc); Object.values(glb).forEach(applyTextures); },
    setVisorTexture(t) { this.setVisorPhotos(t, t); },
    /** Despierto (foto con ojos abiertos) o dormido; con fundido cruzado de 0.35 s y un destello, o `instant`. */
    setAwake(awake, { instant = false } = {}) { awakeTarget = awake ? 1 : 0; if (instant) awakeK = awakeTarget; },
    get awake() { return awakeTarget === 1; },
    /** Ajuste de la foto a la luz de la escena: gain = [r, g, b] (multiplica), contrast (1 = sin cambio). */
    setVisorLook(gain, contrast = 1) { VU.gain.value.setRGB(gain[0], gain[1], gain[2]); VU.contrast.value = contrast; },
    setPatchTexture(t) { patchTex = t; proc.setPatchTexture(t); applyTextures(active); Object.values(glb).forEach(applyTextures); },
    visorWorld(out = new THREE.Vector3()) {
      const a = active.parts?.visorAnchor;
      if (a) return a.bone.localToWorld(out.copy(a.offset));
      const v = active.parts?.visor || proc.visor; return v.getWorldPosition(out);
    },
    /** Base de la cabeza en el mundo. */
    headWorld(out = new THREE.Vector3()) { const hb = active.parts?.headBone || proc.parts?.head; return hb ? hb.getWorldPosition(out) : root.getWorldPosition(out); },
    /** Hacia dónde mira el casco (fwd) y su "arriba" (up), en el mundo, en la pose actual. */
    headAxes(fwd, up) {
      const hb = active.parts?.headBone || proc.parts?.head;
      if (!hb) { fwd.set(0, 0, 1).applyQuaternion(root.quaternion); up.set(0, 1, 0).applyQuaternion(root.quaternion); return; }
      hb.getWorldQuaternion(headQW);
      if (active.parts?.headRestInv) headQW.multiply(active.parts.headRestInv);
      fwd.set(0, 0, 1).applyQuaternion(headQW); up.set(0, 1, 0).applyQuaternion(headQW);
    },
    /** Punto del abrazo de "sleep" (entre las manos, frente al pecho) en el mundo; null si el modelo no lo tiene. */
    hugWorld(out = new THREE.Vector3()) { const a = active.parts?.hugAnchor; return a ? a.bone.localToWorld(out.copy(a.offset)) : null; },
    /** Radio del visor en unidades de mundo (para el encuadre y para que nada lo tape). */
    visorRadius() { const a = active.parts?.visorAnchor; return (a ? a.radius : 0.24) * root.scale.x; },
    /** Caja del astronauta tal como está ahora (incluye la pose animada si tiene piel). */
    box(out = new THREE.Box3()) { root.updateMatrixWorld(true); return out.setFromObject(root, true); },
    update(dt, t) {
      // fundido dormido ↔ despierto: la mezcla sigue una curva suave y el destello es máximo a la mitad
      if (awakeK !== awakeTarget) awakeK = awakeTarget > awakeK ? Math.min(awakeTarget, awakeK + dt / FADE_PHOTO) : Math.max(awakeTarget, awakeK - dt / FADE_PHOTO);
      VU.mixK.value = awakeK * awakeK * (3 - 2 * awakeK);
      VU.flash.value = Math.sin(Math.PI * awakeK);
      if (pending && swapT >= 0) { // micro fundido: encoge → cambia → crece (≈ 0.18 s)
        swapT += dt;
        const k = swapT / 0.09;
        if (k < 1) holder.scale.setScalar(1 - 0.08 * k);
        else if (pending) { show(pending); pending = null; }
      } else if (holder.scale.x < 1) holder.scale.setScalar(Math.min(1, holder.scale.x + dt * 0.9));
      if (!pending && swapT >= 0 && holder.scale.x >= 1) swapT = -1;
      // Giro de la cabeza encima de la animación: ABSOLUTO (pose del mixer + giro de este cuadro). El AnimationMixer
      // sólo reescribe un hueso si su valor cambió respecto al que él aplicó antes; en un cuadro con dt = 0 (o con la
      // animación quieta) no lo toca y un giro multiplicado sobre el cuadro anterior se acumulaba hasta dar la vuelta.
      // Por eso primero se quita el giro aplicado el cuadro anterior (el hueso vuelve a la pose del mixer), luego se
      // actualiza la animación y al final se aplica el giro nuevo.
      if (headApplied.bone) { headApplied.bone.quaternion.multiply(headQ.copy(headApplied.q).invert()); headApplied.bone = null; }
      if (active === proc) proc.update(dt, t);
      else { active.mixer?.update(dt); if (!active.actions || !Object.keys(active.actions).length) proceduralMotion(active.root, t, pose); }
      // asentado: modelo definitivo (el GLB; el procedural sólo si el GLB falló), sin cambio pendiente, a tamaño completo
      // y con la acción de su pose corriendo (el mixer ya la aplicó en este cuadro)
      const final = loaded && (active !== proc || !Object.keys(glb).length);
      const anim = active === proc || !active.actions || !Object.keys(active.actions).length || (active.current && active.current === (active.actions[pose] || active.actions.float || active.actions.fly) && active.current.isRunning());
      settledFrames = final && !pending && swapT < 0 && holder.scale.x >= 1 && anim ? settledFrames + 1 : 0;
      headYaw += (headTarget - headYaw) * (1 - Math.exp(-3 * dt));
      if (Math.abs(headYaw) > 0.002) {
        const hb = active.parts?.headBone || proc.parts?.head;
        if (hb) { headApplied.q.setFromAxisAngle(Y_AXIS, headYaw); hb.quaternion.multiply(headApplied.q); headApplied.bone = hb; }
      }
    },
    /** Giro de la cabeza (radianes, + = hacia la izquierda del astronauta) encima de la pose actual. */
    setHeadYaw(a, { instant = false } = {}) { headTarget = Math.max(-0.9, Math.min(0.9, a)); if (instant) headYaw = headTarget; }
  };
}
