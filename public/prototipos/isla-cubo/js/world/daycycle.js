// Ciclo del día: cada parada tiene una hora; al viajar se interpolan cielo, sol, luz, niebla y nubes.
// El cielo es un degradado CSS detrás del canvas transparente (barato y nítido); la niebla usa el color
// del horizonte para que la isla se funda con el cielo.
import * as THREE from "../../vendor/three.module.min.js";
import { lerp, easeInOut, mixHex } from "../util.js";

export const TIMES = {
  dawn: { top: "#FFD6A5", bottom: "#A0D8F1", sun: "#FFC58A", sunI: 2.1, sunDir: [1, 0.45, 0.55], hemiSky: "#FFE2C2", hemiGround: "#8C7A6B", hemiI: 1.25, cloud: "#FFF1E0", stars: 0, glow: 0.15, label: "Amanecer" },
  morning: { top: "#A8DDF6", bottom: "#E9F6FF", sun: "#FFF1D6", sunI: 2.5, sunDir: [0.75, 0.8, 0.6], hemiSky: "#EAF6FF", hemiGround: "#8E8074", hemiI: 1.35, cloud: "#FFFFFF", stars: 0, glow: 0, label: "Mañana" },
  noon: { top: "#7FD1F7", bottom: "#DFF4FF", sun: "#FFFFFF", sunI: 2.7, sunDir: [0.25, 1, 0.45], hemiSky: "#E6F6FF", hemiGround: "#8E8074", hemiI: 1.4, cloud: "#FFFFFF", stars: 0, glow: 0, label: "Mediodía" },
  afternoon: { top: "#8FD3F2", bottom: "#F6EBCF", sun: "#FFF0CF", sunI: 2.5, sunDir: [-0.45, 0.8, 0.6], hemiSky: "#F2F3E6", hemiGround: "#8E7B6C", hemiI: 1.3, cloud: "#FFFBF2", stars: 0, glow: 0, label: "Tarde" },
  golden: { top: "#FFC36B", bottom: "#FDE3B8", sun: "#FFD89A", sunI: 2.4, sunDir: [-0.8, 0.55, 0.6], hemiSky: "#FFF0D6", hemiGround: "#8E7560", hemiI: 1.25, cloud: "#FFF1DC", stars: 0, glow: 0.1, label: "Tarde dorada" },
  sunset: { top: "#FF9E6B", bottom: "#B388FF", sun: "#FF9A6B", sunI: 2.0, sunDir: [-1, 0.32, 0.5], hemiSky: "#FFC4A8", hemiGround: "#6E5A74", hemiI: 1.1, cloud: "#FFC9B8", stars: 0, glow: 0.35, label: "Atardecer" },
  pink: { top: "#FF9FCB", bottom: "#B388FF", sun: "#FF8FB8", sunI: 1.7, sunDir: [-1, 0.24, 0.35], hemiSky: "#F7B8D8", hemiGround: "#5E4F72", hemiI: 1.05, cloud: "#FFC2DE", stars: 0.1, glow: 0.55, label: "Atardecer rosado" },
  night: { top: "#1B2A6B", bottom: "#0B1238", sun: "#9DB7FF", sunI: 1.9, sunDir: [-0.35, 1, 0.55], hemiSky: "#7E94E6", hemiGround: "#343072", hemiI: 1.45, cloud: "#4B5694", stars: 1, glow: 1, label: "Noche" }
};
const COLOR_KEYS = ["top", "bottom", "sun", "hemiSky", "hemiGround", "cloud"];
const NUM_KEYS = ["sunI", "hemiI", "stars", "glow"];

function mix(a, b, t) {
  const o = {};
  for (const k of COLOR_KEYS) o[k] = mixHex(a[k], b[k], t);
  for (const k of NUM_KEYS) o[k] = lerp(a[k], b[k], t);
  o.sunDir = a.sunDir.map((v, i) => lerp(v, b.sunDir[i], t));
  return o;
}

export function createDayCycle({ scene, sun, hemi, skyEl, starsEl, cloudMat, glowMat, waterMat, frameEl }) {
  let current = { ...TIMES.dawn };
  let from = current, to = current, t0 = 0, dur = 0, active = false, key = "dawn";
  const fog = new THREE.Fog(TIMES.dawn.bottom, 70, 150);
  scene.fog = fog;
  const _c = new THREE.Color();

  function apply(s) {
    current = s;
    skyEl.style.setProperty("--sky-top", s.top);
    skyEl.style.setProperty("--sky-bottom", s.bottom);
    frameEl?.style.setProperty("--sky-top", s.top);
    frameEl?.style.setProperty("--sky-bottom", s.bottom);
    starsEl.style.opacity = String(s.stars);
    fog.color.set(mixHex(s.bottom, s.top, 0.25));
    sun.color.set(s.sun);
    sun.intensity = s.sunI;
    const d = new THREE.Vector3(...s.sunDir).normalize();
    sun.position.copy(d.multiplyScalar(60));
    hemi.color.set(s.hemiSky);
    hemi.groundColor.set(s.hemiGround);
    hemi.intensity = s.hemiI;
    cloudMat.color.set(s.cloud);
    glowMat.emissiveIntensity = s.glow * 1.25;
    waterMat.emissiveIntensity = 0.15 + s.glow * 0.45;
    _c.set(s.stars > 0.5 ? "#7FE7FF" : "#2FA8C8");
    waterMat.emissive.copy(_c);
  }
  apply(current);

  return {
    get key() { return key; },
    get state() { return current; },
    /** Cambia la hora del día con transición suave (dur en ms). */
    go(k, ms = 1200) {
      if (!TIMES[k]) return;
      key = k;
      from = { ...current, sunDir: [...current.sunDir] };
      to = TIMES[k];
      if (ms <= 0) { apply({ ...to }); active = false; return; }
      t0 = performance.now(); dur = ms; active = true;
    },
    update(now) {
      if (!active) return false;
      const p = Math.min(1, (now - t0) / dur);
      apply(mix(from, to, easeInOut(p)));
      if (p >= 1) active = false;
      return true;
    },
    isAnimating: () => active
  };
}
