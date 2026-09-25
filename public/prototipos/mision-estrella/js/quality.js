// Calidad adaptativa: nivel inicial según una prueba rápida de GPU/dispositivo y, después, baja de nivel sola
// si el framerate cae de ~45 fps durante 2 s.
//   low:    DPR 1, sin bloom, menos partículas y estrellas
//   medium: DPR 1.5
//   high:   DPR 2, bloom a media resolución
export const LEVELS = {
  low: { name: "low", label: "baja", dpr: 1, bloom: false, stars: 0.5, particles: 0.45, nebula: 512 },
  medium: { name: "medium", label: "media", dpr: 1.5, bloom: false, stars: 0.8, particles: 0.75, nebula: 1024 },
  high: { name: "high", label: "alta", dpr: 2, bloom: true, stars: 1, particles: 1, nebula: 1024 }
};
const ORDER = ["low", "medium", "high"];

/** Nivel inicial. `gl` = contexto WebGL para leer el renderizador (si se puede). */
export function initialLevel(gl, { forced = null, showcase = false } = {}) {
  if (forced && LEVELS[forced]) return forced;
  if (showcase) return "medium";
  let gpu = "";
  try { const ext = gl?.getExtension("WEBGL_debug_renderer_info"); gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) || ""); } catch { /* sin info */ }
  const mobile = matchMedia?.("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) return "low";
  if (/mali-(4|t[678])|adreno \(tm\) (3|4|5[0-3])|powervr/i.test(gpu)) return "low";
  if (mobile && (mem <= 3 || cores <= 4)) return "low";
  if (mobile) return "medium";
  return "high";
}

/** Monitor de framerate: llama onDowngrade(nuevoNivel) si se sostiene < 45 fps durante 2 s. */
export function createMonitor(level, onDowngrade) {
  let cur = level, low = 0, frames = 0, acc = 0, fps = 60, grace = 2.5;
  return {
    get level() { return cur; }, get fps() { return fps; },
    set(l) { cur = l; low = 0; grace = 2.5; },
    tick(dt) {
      frames++; acc += dt;
      if (acc >= 0.5) { fps = Math.round(frames / acc); frames = 0; acc = 0; }
      if (grace > 0) { grace -= dt; return; }
      if (dt > 0.25) return; // pestaña regresando: no cuenta
      if (fps < 45) low += dt; else low = Math.max(0, low - dt * 0.5);
      if (low >= 2 && cur !== "low") { cur = ORDER[ORDER.indexOf(cur) - 1]; low = 0; grace = 3; onDowngrade?.(cur); }
    }
  };
}
