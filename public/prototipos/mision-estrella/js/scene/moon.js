// La Luna (capítulo 4) con la fecha proyectada como luz cálida sobre su superficie y 4 satélites en órbita
// con la cuenta regresiva; y la media luna de la portada. Luna y media luna son PROVISIONALES (models.js).
import * as THREE from "three";
import { vinyl, craterNormalMap, canvasTex, halo } from "./materials.js";
import { modelOrBuild } from "../characters/rocket.js";
import { eventInfo, eventPhase, splitDuration, pad2, clock } from "../util.js";

const CREAM = "#F3E6CF";
let normals = null;
const moonMaterial = (strength = 0.55, repeat = 1) => {
  normals ??= craterNormalMap(512);
  const m = vinyl(CREAM, { rim: 0.8 });
  const n = repeat === 1 ? normals : normals.clone();
  if (repeat !== 1) { n.repeat.set(repeat, repeat); n.needsUpdate = true; }
  m.normalMap = n; m.normalScale = new THREE.Vector2(strength, strength);
  return m;
};

/** Media luna de juguete (extruida con bisel). Tamaño ≈ 2.2 de alto. */
export function createCrescent() {
  return modelOrBuild("crescent", () => {
    const R = 1, r = 0.84, c2 = new THREE.Vector2(0.46, 0.12);
    const d = c2.length(), a = (R * R - r * r + d * d) / (2 * d), hh = Math.sqrt(R * R - a * a);
    const u = c2.clone().normalize(), perp = new THREE.Vector2(-u.y, u.x);
    const P1 = u.clone().multiplyScalar(a).addScaledVector(perp, hh), P2 = u.clone().multiplyScalar(a).addScaledVector(perp, -hh);
    const ang = (p, c) => Math.atan2(p.y - c.y, p.x - c.x);
    const pts = [];
    // arco exterior de P1 a P2 pasando por el lado opuesto a c2
    let a0 = ang(P1, new THREE.Vector2()), a1 = ang(P2, new THREE.Vector2());
    const away = Math.atan2(-u.y, -u.x);
    const norm = (x) => { while (x < 0) x += Math.PI * 2; return x % (Math.PI * 2); };
    const ccwOK = norm(away - a0) < norm(a1 - a0); // ¿el camino antihorario pasa por "away"?
    const span = ccwOK ? norm(a1 - a0) : -norm(a0 - a1);
    for (let i = 0; i <= 48; i++) { const t = a0 + span * (i / 48); pts.push(new THREE.Vector2(Math.cos(t) * R, Math.sin(t) * R)); }
    // arco interior de P2 a P1 (del círculo desplazado), por el lado que queda dentro
    const b0 = ang(P2, c2), b1 = ang(P1, c2);
    const bSpanCcw = norm(b1 - b0), mid = b0 + bSpanCcw / 2;
    const inside = Math.hypot(c2.x + Math.cos(mid) * r, c2.y + Math.sin(mid) * r) < R;
    const bSpan = inside ? bSpanCcw : -norm(b0 - b1);
    for (let i = 1; i < 48; i++) { const t = b0 + bSpan * (i / 48); pts.push(new THREE.Vector2(c2.x + Math.cos(t) * r, c2.y + Math.sin(t) * r)); }
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.36, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.16, bevelSegments: 6, curveSegments: 32 });
    geo.center();
    const mesh = new THREE.Mesh(geo, moonMaterial(0.25, 0.35)); // la extrusión usa UV en unidades: menos repetición
    const root = new THREE.Group(); root.add(mesh);
    return { root };
  });
}

/** Textura emisiva con la fecha (día de la semana, día y mes). */
function dateTexture(text) {
  return canvasTex(1024, 512, (c, w, hh) => {
    c.textAlign = "center"; c.textBaseline = "middle";
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
    const root = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 48), moonMaterial());
    return { root };
  });
  group.add(holder);
  const glow = halo("#FFE7C2", 46, 0.22); group.add(glow);
  // fecha proyectada: casquete ligeramente por encima de la superficie, orientado hacia la cámara del capítulo
  const info = eventInfo();
  const decal = new THREE.Mesh(new THREE.SphereGeometry(12.08, 48, 32, Math.PI / 2 - 0.62, 1.24, Math.PI / 2 - 0.4, 0.8), new THREE.MeshBasicMaterial({
    map: dateTexture({ top: info.weekday.toUpperCase(), mid: String(info.dayNum), bottom: info.month.toUpperCase() }),
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false
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
