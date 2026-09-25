// Renderizador: WebGLRenderer, escena, cámara, luces de "espacio de cuento" y bloom (sólo calidad alta,
// a media resolución). Tamaño ligado al escenario (maneja el cambio de alto de la barra del navegador).
import * as THREE from "three";
import { LEVELS } from "../quality.js";

export function createRenderer(canvas, { stage, level = "medium", maxDpr = 2, preserve = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: level !== "low", alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: preserve });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor("#1E1B4B");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 3000);

  // Luces: principal cálida, relleno lavanda, hemisférica índigo; la luz de borde rosa/turquesa va en los materiales.
  const hemi = new THREE.HemisphereLight("#CFC4FF", "#2A2266", 1.35); scene.add(hemi);
  const key = new THREE.DirectionalLight("#FFE3C4", 2.1); key.position.set(4, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight("#B9A2FF", 0.9); fill.position.set(-6, 1, 3); scene.add(fill);
  const back = new THREE.DirectionalLight("#6FD6E8", 0.8); back.position.set(2, -2, -6); scene.add(back);
  const lights = { hemi, key, fill, back };

  let q = LEVELS[level], composer = null, bloom = null, w = 1, h = 1, dpr = 1;
  async function setupBloom() {
    if (composer || !q.bloom) return;
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import("../../vendor/postprocessing/EffectComposer.js"), import("../../vendor/postprocessing/RenderPass.js"),
      import("../../vendor/postprocessing/UnrealBloomPass.js"), import("../../vendor/postprocessing/OutputPass.js")]);
    if (!q.bloom) return;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(Math.max(1, w / 2), Math.max(1, h / 2)), 0.55, 0.6, 0.72);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    resize(true);
  }
  function resize(force = false) {
    const nw = Math.max(1, stage.clientWidth), nh = Math.max(1, stage.clientHeight), nd = Math.min(q.dpr, maxDpr, window.devicePixelRatio || 1);
    if (!force && nw === w && nh === h && nd === dpr) return false;
    w = nw; h = nh; dpr = nd;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); bloom?.resolution.set(w / 2, h / 2); bloom?.setSize(Math.ceil(w * dpr / 2), Math.ceil(h * dpr / 2)); }
    return true;
  }
  resize(true);
  addEventListener("resize", () => resize());
  addEventListener("orientationchange", () => setTimeout(() => resize(), 250));
  if (typeof ResizeObserver === "function") new ResizeObserver(() => resize()).observe(stage);
  setupBloom();

  return {
    renderer, scene, camera, lights,
    get level() { return q.name; }, get quality() { return q; }, get dpr() { return dpr; }, get size() { return { w, h }; },
    setLevel(name) {
      q = LEVELS[name] || q;
      if (!q.bloom && composer) { composer.dispose?.(); composer = null; bloom = null; }
      resize(true); setupBloom();
    },
    resize,
    render() { if (composer) composer.render(); else renderer.render(scene, camera); },
    drawCalls: () => renderer.info.render.calls
  };
}
