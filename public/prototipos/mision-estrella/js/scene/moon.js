// La Luna (capítulo 4) con la fecha proyectada como luz cálida sobre su superficie y 4 satélites en órbita
// con la cuenta regresiva; y la luna creciente de la portada. Ambas usan la superficie lunar procedural
// (moon-surface.js: mares, cráteres con borde y pico central, rayos, relieve). Reemplazables desde models.js.
import * as THREE from "three";
import { vinyl, craterNormalMap, canvasTex, halo, addRim } from "./materials.js";
import { modelOrBuild } from "../characters/rocket.js";
import { moonSurfaceReady } from "./moon-surface.js";
import { eventInfo, eventPhase, splitDuration, pad2, clock } from "../util.js";

/** Material lunar: superficie procedural si ya está generada; si no, el crema con cráteres suaves. */
function moonMaterial(normalScale = 1) {
  const s = moonSurfaceReady();
  if (!s) { const m = vinyl("#F3E6CF", { rim: 0.8 }); m.normalMap = craterNormalMap(512); m.normalScale = new THREE.Vector2(0.5, 0.5); return m; }
  const m = new THREE.MeshStandardMaterial({ map: s.map, normalMap: s.normalMap, roughness: 0.96, metalness: 0, color: "#FFF6EA" });
  m.normalScale = new THREE.Vector2(normalScale, normalScale);
  m.emissive = new THREE.Color("#2A2250"); m.emissiveIntensity = 0.35; // el lado oscuro no queda negro
  return addRim(m, 0.6);
}

/**
 * Luna creciente de la portada: volumen orgánico (grueso al centro, puntas afiladas) sobre un arco, con la
 * superficie lunar proyectada desde su centro (el polo de la proyección mira a la cámara: sin deformar el borde).
 * Tamaño ≈ 2.3 de alto; la abertura queda hacia +X.
 */
export function createCrescent() {
  return modelOrBuild("crescent", () => {
    const RC = 0.8, RMAX = 0.36, TUB = 140, RAD = 40, A0 = THREE.MathUtils.degToRad(38), A1 = THREE.MathUtils.degToRad(322);
    const pos = [], nor = [], uv = [], idx = [];
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    // UV sin estirar: u a lo largo del arco, v alrededor de la sección (proporcional a su grosor);
    // la costura de v queda atrás (-Z), fuera de la vista de la cámara
    const RT = 1.2, arcLen = RC * (A1 - A0);
    for (let i = 0; i <= TUB; i++) {
      const t = i / TUB, a = A0 + (A1 - A0) * t;
      const r = Math.max(0.004, RMAX * Math.pow(Math.sin(Math.PI * t), 0.72));
      const cx = Math.cos(a) * RC, cy = Math.sin(a) * RC, rx = Math.cos(a), ry = Math.sin(a);
      for (let j = 0; j <= RAD; j++) {
        const s = (j / RAD) * 2 - 1, f = Math.PI / 2 + s * Math.PI; // f = π/2 mira a la cámara (+Z)
        const cf = Math.cos(f), sf = Math.sin(f) * 0.9; // sección un poco aplanada
        N.set(rx * cf, ry * cf, Math.sin(f)).normalize();
        P.set(cx + rx * r * cf, cy + ry * r * cf, r * sf);
        pos.push(P.x, P.y, P.z); nor.push(N.x, N.y, N.z);
        uv.push(0.2 + (t * arcLen) / (2 * Math.PI * RT), 0.5 + (s * r) / RT);
      }
    }
    for (let i = 0; i < TUB; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, b = a + RAD + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals(); // suaviza las puntas
    const mesh = new THREE.Mesh(geo, moonMaterial(0.8));
    mesh.position.x = -0.12; // centra el volumen (la abertura deja el arco corrido a la izquierda)
    const root = new THREE.Group(); root.add(mesh);
    return { root };
  });
}

/** Textura emisiva con la fecha (día de la semana, día y mes). */
function dateTexture(text) {
  return canvasTex(1024, 512, (c, w, hh) => {
    c.textAlign = "center"; c.textBaseline = "middle";
    // sombra suave detrás del texto: se lee sobre los cráteres
    c.save(); c.translate(w / 2, hh / 2); c.scale(1.85, 1); // elipse que se desvanece antes del borde
    const sh = c.createRadialGradient(0, 0, 10, 0, 0, hh * 0.49);
    sh.addColorStop(0, "rgba(40,28,70,.55)"); sh.addColorStop(0.6, "rgba(40,28,70,.3)"); sh.addColorStop(1, "rgba(40,28,70,0)");
    c.fillStyle = sh; c.fillRect(-w, -hh, w * 2, hh * 2); c.restore();
    const glow = (fn) => { c.shadowColor = "rgba(255,190,120,.95)"; c.shadowBlur = 38; fn(); c.shadowBlur = 14; fn(); c.shadowBlur = 0; fn(); };
    c.fillStyle = "#FFE7C2";
    c.font = "600 64px Fredoka, system-ui, sans-serif"; glow(() => c.fillText(text.top, w / 2, 96));
    c.font = "600 220px Fredoka, system-ui, sans-serif"; glow(() => c.fillText(text.mid, w / 2, 262));
    c.font = "600 78px Fredoka, system-ui, sans-serif"; glow(() => c.fillText(text.bottom, w / 2, 430));
  });
}
function numTexture() {
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 160;
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return { cv, t, last: "" };
}
function drawNum(n, value, label) {
  const key = value + label; if (n.last === key) return; n.last = key;
  const c = n.cv.getContext("2d"), w = n.cv.width, hh = n.cv.height;
  c.clearRect(0, 0, w, hh);
  c.fillStyle = "rgba(30,27,75,.82)"; c.beginPath(); c.roundRect ? c.roundRect(6, 6, w - 12, hh - 12, 30) : c.rect(6, 6, w - 12, hh - 12); c.fill();
  c.strokeStyle = "rgba(255,247,236,.35)"; c.lineWidth = 4; c.stroke();
  c.textAlign = "center"; c.fillStyle = "#FFD27A"; c.font = "600 78px Fredoka, system-ui, sans-serif"; c.textBaseline = "alphabetic"; c.fillText(value, w / 2, 94);
  c.fillStyle = "#FFF7EC"; c.font = "800 26px Figtree, system-ui, sans-serif"; c.fillText(label, w / 2, 134);
  n.t.needsUpdate = true;
}

export function createMoonSet() {
  const group = new THREE.Group(); group.name = "moon-set";
  const { holder } = modelOrBuild("moon", () => {
    const root = new THREE.Mesh(new THREE.SphereGeometry(12, 128, 80), moonMaterial(1));
    return { root };
  });
  group.add(holder);
  const glow = halo("#FFE7C2", 46, 0.22); group.add(glow);
  // fecha proyectada: casquete ligeramente por encima de la superficie, orientado hacia la cámara del capítulo
  const info = eventInfo();
  const decal = new THREE.Mesh(new THREE.SphereGeometry(12.08, 48, 32, Math.PI / 2 - 0.62, 1.24, Math.PI / 2 - 0.4, 0.8), new THREE.MeshBasicMaterial({
    map: dateTexture({ top: info.weekday.toUpperCase(), mid: String(info.dayNum), bottom: info.month.toUpperCase() }),
    transparent: true, opacity: 0, depthWrite: false, toneMapped: false
  }));
  const decalPivot = new THREE.Group(); decalPivot.add(decal); group.add(decalPivot);
  // satélites con la cuenta regresiva
  const satBody = new THREE.CapsuleGeometry(0.45, 0.5, 6, 12), panel = new THREE.BoxGeometry(1.5, 0.05, 0.6);
  const satMat = vinyl("#FFF7EC"), panelMat = vinyl("#6FA8F0", { emissive: new THREE.Color("#1d3a7a"), emissiveIntensity: 0.4 }), accent = vinyl("#FF8FA3");
  const labels = ["DÍAS", "HORAS", "MIN", "SEG"];
  const sats = labels.map((label, i) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(satBody, satMat); b.rotation.z = Math.PI / 2; g.add(b);
    [-1, 1].forEach((s) => { const p = new THREE.Mesh(panel, panelMat); p.position.x = s * 1.25; g.add(p); });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), accent); dish.position.y = 0.45; g.add(dish);
    const n = numTexture();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.3), new THREE.MeshBasicMaterial({ map: n.t, transparent: true, depthWrite: false, toneMapped: false }));
    sign.position.y = -1.3; g.add(sign);
    const blink = halo("#6FD6E8", 1.2, 0.8); blink.position.y = 0.72; g.add(blink);
    group.add(g);
    return { g, n, sign, blink, label, phase: (i / 4) * Math.PI * 2 };
  });
  let shown = 0, flicker = 0;
  function tickNumbers() {
    const ph = eventPhase(), now = clock.now(), ev = eventInfo();
    const left = splitDuration(ev.start - now), keys = ["d", "h", "m", "s"];
    sats.forEach((s, i) => { s.g.visible = ph === "countdown" || (ph === "today" && now < ev.start); drawNum(s.n, pad2(left[keys[i]]), s.label); });
  }
  let acc = 1;
  return {
    group, decal, sats,
    /** show: 0–1 (entrada de la fecha con parpadeo). camera: para orientar la fecha y los letreros. */
    update(dt, t, camera, show) {
      acc += dt; if (acc >= 0.5) { acc = 0; tickNumbers(); }
      decalPivot.lookAt(camera.position); // el casquete (+Z) mira hacia la cámara del capítulo
      if (show > shown) flicker = Math.max(flicker, 0.4);
      shown = show;
      flicker = Math.max(0, flicker - dt);
      const f = flicker > 0 ? (Math.sin(t * 60) > 0 ? 1 : 0.35) : 1;
      decal.material.opacity = show * f;
      glow.material.opacity = 0.18 + show * 0.12;
      sats.forEach((s, i) => {
        const a = t * 0.18 + s.phase;
        s.g.position.set(Math.cos(a) * 17, Math.sin(a * 1.3) * 3 + (i - 1.5) * 1.2, Math.sin(a) * 17);
        s.g.lookAt(camera.position);
        s.blink.material.opacity = 0.4 + 0.5 * Math.max(0, Math.sin(t * 4 + i));
      });
    }
  };
}
