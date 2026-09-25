// Adaptador de modelos GLB: carga (GLTFLoader + MeshoptDecoder), normaliza escala/pivote, encuentra piezas por
// nombre, mapea animaciones por palabras clave, aplica colores y la luz de borde de la escena.
// Si algo falla, quien llama usa el modelo procedural (models.js → build: "procedural").
import * as THREE from "three";
import { addRim, glassMaterial } from "../scene/materials.js";
import { frontCap, visorTexture } from "./astronaut-procedural.js";

// GLTFLoader + MeshoptDecoder se descargan sólo si models.js pide algún archivo (sin GLB no pesan nada).
let loaderP = null;
function getLoader() {
  loaderP ??= Promise.all([import("../../vendor/loaders/GLTFLoader.js"), import("../../vendor/libs/meshopt_decoder.module.js")])
    .then(([{ GLTFLoader }, { MeshoptDecoder }]) => { const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder); return l; });
  return loaderP;
}
const cache = new Map();
/** Carga un GLB (con caché). Rechaza si falla o tarda más de `timeout` ms. */
export function loadGLB(url, timeout = 20000) {
  if (!cache.has(url)) {
    cache.set(url, getLoader().then((loader) => new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error(`Tiempo agotado: ${url}`)), timeout);
      loader.load(url, (g) => { clearTimeout(to); res(g); }, undefined, (e) => { clearTimeout(to); rej(e); });
    })));
  }
  return cache.get(url);
}

const NAMES = {
  visor: /visor|face_?plate|faceplate/i,
  glass: /helmet_?glass|glass|cristal|vidrio/i,
  suit: /suit|body|traje/i,
  patch: /patch|parche|badge|emblem/i,
  helmet: /helmet|casco|head/i
};
const ANIMS = { fly: /idle|float|fly/i, wave: /wave|hello|hi\b|saludo/i, sleep: /sleep|dorm/i, celebrate: /celebrate|happy|jump|cheer/i, sit: /sit|seat/i };

/** Busca la primera pieza cuyo nombre (o el de su material) coincide. */
export function findPart(root, key) {
  let hit = null;
  root.traverse((o) => { if (hit || !o.isMesh) return; const mats = [].concat(o.material || []); if (NAMES[key].test(o.name) || mats.some((m) => NAMES[key].test(m.name || ""))) hit = o; });
  return hit;
}

/**
 * Normaliza un GLTF: escala por bounding box a `height`, centra el pivote, suaviza materiales (coherencia con
 * la escena: sin brillo plástico duro, luz de borde rosa/turquesa) y aplica suitColor/accentColor.
 * Devuelve { root, mixer, actions: { fly, wave, ... }, parts: { visor, glass, suit, patch } }.
 */
export function adapt(gltf, { height = 1, suitColor, accentColor, visorPhoto = true } = {}) {
  const src = gltf.scene;
  const box = new THREE.Box3().setFromObject(src), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const k = height / Math.max(1e-6, size.y);
  const inner = new THREE.Group(); inner.add(src);
  src.position.sub(center); inner.scale.setScalar(k);
  const root = new THREE.Group(); root.add(inner);
  src.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = true;
    const mats = [].concat(o.material);
    mats.forEach((m) => {
      if ("roughness" in m) m.roughness = Math.max(0.55, m.roughness ?? 1);
      if ("metalness" in m) m.metalness = Math.min(0.2, m.metalness ?? 0);
      addRim(m, 0.9);
      m.needsUpdate = true;
    });
  });
  const parts = { visor: findPart(src, "visor"), glass: findPart(src, "glass"), suit: findPart(src, "suit"), patch: findPart(src, "patch"), helmet: findPart(src, "helmet") };
  if (suitColor && parts.suit) [].concat(parts.suit.material).forEach((m) => m.color?.set(suitColor));
  if (accentColor && parts.patch) [].concat(parts.patch.material).forEach((m) => m.color?.set(accentColor));
  if (parts.glass) parts.glass.material = glassMaterial(); // vidrio con fresnel de la escena
  // Visor: si no existe como pieza, se crea un casquete curvo dentro del casco para la foto.
  if (visorPhoto && !parts.visor) {
    const hb = new THREE.Box3();
    if (parts.helmet) hb.setFromObject(parts.helmet); else { hb.copy(new THREE.Box3().setFromObject(root)); hb.min.y = hb.max.y - (hb.max.y - hb.min.y) * 0.45; }
    const hs = hb.getSize(new THREE.Vector3()), hc = hb.getCenter(new THREE.Vector3());
    const rad = Math.min(hs.x, hs.y) * 0.5;
    const cap = new THREE.Mesh(frontCap(rad * 0.98, 0.7), new THREE.MeshBasicMaterial({ map: visorTexture(null), toneMapped: false }));
    cap.name = "visor"; cap.position.copy(hc); root.add(cap);
    parts.visor = cap;
    if (!parts.glass) { const g = new THREE.Mesh(frontCap(rad * 1.02, 0.78), glassMaterial()); g.name = "helmet_glass"; g.position.copy(hc); g.renderOrder = 3; root.add(g); parts.glass = g; }
  } else if (parts.visor) {
    parts.visor.material = new THREE.MeshBasicMaterial({ map: visorTexture(null), toneMapped: false });
  }
  // Animaciones por palabras clave
  let mixer = null; const actions = {};
  if (gltf.animations?.length) {
    mixer = new THREE.AnimationMixer(src);
    for (const [pose, re] of Object.entries(ANIMS)) {
      const clip = gltf.animations.find((a) => re.test(a.name));
      if (clip) actions[pose] = mixer.clipAction(clip);
    }
    if (!Object.keys(actions).length) actions.fly = mixer.clipAction(gltf.animations[0]);
  }
  return { root, mixer, actions, parts };
}

/** Movimiento procedural para modelos sin animaciones (flotar, balanceo, giro suave). */
export function proceduralMotion(obj, t, pose) {
  const sleeping = pose === "sleep";
  obj.position.y = Math.sin(t * (sleeping ? 0.9 : 1.4)) * 0.03;
  obj.rotation.z = Math.sin(t * 0.7) * (sleeping ? 0.03 : 0.07);
  obj.rotation.x = Math.sin(t * 0.9) * 0.04;
  obj.rotation.y = pose === "celebrate" ? Math.sin(t * 3) * 0.25 : Math.sin(t * 0.4) * 0.12;
}
