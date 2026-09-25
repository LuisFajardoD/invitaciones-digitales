// La Luna (capítulo 4) con la fecha proyectada como luz cálida sobre su superficie y 4 satélites en órbita
// con la cuenta regresiva; y la luna creciente de la portada. Ambas usan la superficie lunar procedural
// (moon-surface.js: mares, cráteres con borde y pico central, rayos, relieve). Reemplazables desde models.js.
import * as THREE from "three";
import { vinyl, craterNormalMap, canvasTex, halo, addRim, pbr, solarTexture, foilNormal } from "./materials.js";
import { roundedBox } from "./shapes.js";
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
/** Pantalla del satélite: vidrio índigo con número dorado luminoso y etiqueta (se redibuja sólo si cambia). */
function drawNum(n, value, label) {
  const key = value + label; if (n.last === key) return; n.last = key;
  const c = n.cv.getContext("2d"), w = n.cv.width, hh = n.cv.height;
  c.clearRect(0, 0, w, hh);
  const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, "#2A2568"); g.addColorStop(1, "#1A1648");
  c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(4, 4, w - 8, hh - 8, 26) : c.rect(4, 4, w - 8, hh - 8); c.fill();
  c.strokeStyle = "rgba(111,214,232,.55)"; c.lineWidth = 3; c.stroke();
  c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(10, 10, w - 20, (hh - 20) * 0.42); // reflejo del vidrio
  c.textAlign = "center"; c.textBaseline = "alphabetic";
  c.shadowColor = "rgba(255,190,110,.9)"; c.shadowBlur = 18;
  c.fillStyle = "#FFD27A"; c.font = "600 84px Fredoka, system-ui, sans-serif"; c.fillText(value, w / 2, 96);
  c.shadowBlur = 0; c.fillStyle = "#FFF7EC"; c.font = "800 26px Figtree, system-ui, sans-serif"; c.fillText(label, w / 2, 136);
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
  // satélites de la cuenta regresiva: cuerpo redondeado con lámina térmica dorada y franja blanca, alas solares con
  // marco y brazo, antena con mini plato, luz que parpadea y pantalla con el número (de frente a la cámara).
  // Flotan en arco delante de la Luna para que el número siempre se lea.
  const bodyGeo = roundedBox(1.0, 0.82, 0.82, 0.14, 3), bandGeo = roundedBox(1.03, 0.2, 0.85, 0.06, 2);
  const wingGeo = new THREE.BoxGeometry(1.15, 0.5, 0.03), wingFrame = new THREE.BoxGeometry(1.2, 0.035, 0.05), armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8);
  const screenFrameGeo = roundedBox(2.34, 1.5, 0.08, 0.12, 2);
  const foil = pbr("#FFC96B", { rough: 0.28, metal: 0.85, normalMap: foilNormal(), normalScale: 0.9, env: 1.3, emissive: "#5a3c08", ei: 0.18, rim: 0.4 });
  const white = pbr("#FFF7EC", { rough: 0.45, metal: 0.05, env: 0.6 });
  const steel = pbr("#A49DCB", { rough: 0.36, metal: 0.6, env: 1, rim: 0.4 });
  const cells = pbr("#ffffff", { rough: 0.28, metal: 0.35, map: solarTexture(), env: 1.3, emissive: "#1a2266", ei: 0.35, rim: 0.3 });
  const pink = pbr("#FF8FA3", { rough: 0.4, env: 0.6 });
  const dishGeo = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4);
  const labels = ["DÍAS", "HORAS", "MIN", "SEG"];
  const sats = labels.map((label, i) => {
    const g = new THREE.Group();
    const craft = new THREE.Group(); craft.position.y = 0.95; g.add(craft);
    craft.add(new THREE.Mesh(bodyGeo, foil), new THREE.Mesh(bandGeo, white));
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, steel); arm.rotation.z = Math.PI / 2; arm.position.x = s * 0.62; craft.add(arm);
      const wing = new THREE.Group(); wing.position.x = s * 1.12; wing.scale.set(0.72, 1, 1); craft.add(wing);
      wing.add(new THREE.Mesh(wingGeo, cells));
      for (const fy of [-0.26, 0.26]) { const f = new THREE.Mesh(wingFrame, steel); f.position.y = fy; wing.add(f); }
    }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6), steel); mast.position.set(0.25, 0.64, 0); craft.add(mast);
    const dish = new THREE.Mesh(dishGeo, white); dish.rotation.x = Math.PI; dish.position.set(-0.22, 0.56, 0.1); craft.add(dish);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), pink); light.position.set(0.25, 0.9, 0); craft.add(light);
    const blink = halo(i % 2 ? "#FF8FA3" : "#6FD6E8", 0.9, 0.8); blink.position.copy(light.position); craft.add(blink);
    // pantalla con marco (número legible)
    const n = numTexture();
    const frame = new THREE.Mesh(screenFrameGeo, steel); frame.position.set(0, -0.45, -0.05); g.add(frame);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.375), new THREE.MeshBasicMaterial({ map: n.t, transparent: true, toneMapped: false }));
    sign.position.set(0, -0.45, 0.005); g.add(sign);
    group.add(g);
    return { g, craft, n, sign, blink, label, phase: i * 1.7 };
  });
  let shown = 0, flicker = 0;
  function tickNumbers() {
    const ph = eventPhase(), now = clock.now(), ev = eventInfo();
    const left = splitDuration(ev.start - now), keys = ["d", "h", "m", "s"];
    sats.forEach((s, i) => { s.g.visible = ph === "countdown" || (ph === "today" && now < ev.start); drawNum(s.n, pad2(left[keys[i]]), s.label); });
  }
  let acc = 1;
  const tmpD = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpU = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0), low = new THREE.Vector3();
  let anchor = null;
  return {
    group, decal, sats,
    /** Cámara de reposo del capítulo (posición y objetivo en el mundo): los satélites se acomodan en su encuadre. */
    setAnchor(pos, tgt) { anchor = { pos: pos.clone(), tgt: tgt.clone() }; },
    /** show: 0–1 (entrada de la fecha con parpadeo). camera: para orientar la fecha y los letreros. */
    update(dt, t, camera, show) {
      acc += dt; if (acc >= 0.5) { acc = 0; tickNumbers(); }
      decalPivot.lookAt(low.copy(camera.position).setY(camera.position.y - 9)); // el casquete mira a la cámara, un poco más abajo (deja lugar a los satélites)
      if (show > shown) flicker = Math.max(flicker, 0.4);
      shown = show;
      flicker = Math.max(0, flicker - dt);
      const f = flicker > 0 ? (Math.sin(t * 60) > 0 ? 1 : 0.35) : 1;
      decal.material.opacity = show * f;
      glow.material.opacity = 0.18 + show * 0.12;
      // en fila, arriba del encuadre de reposo del capítulo (debajo del HUD y sobre la fecha), flotando;
      // posición fija en el mundo calculada desde la cámara de reposo (anchor) y el tamaño de pantalla actual
      if (anchor) {
        const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tanH = tanV * camera.aspect, D = 17;
        tmpD.subVectors(anchor.tgt, anchor.pos).normalize(); tmpS.crossVectors(tmpD, UPV).normalize(); tmpU.crossVectors(tmpS, tmpD);
        const scale = Math.min(0.55, (0.4 * D * tanH) / 2.2); // la pantalla ocupa ~20 % del ancho
        sats.forEach((s, i) => {
          const xn = (i - 1.5) * 0.47, yn = 0.46 + Math.sin(t * 0.7 + s.phase) * 0.012; // 0.46 + 0.32 del desplazamiento de la vista ≈ 11 % desde arriba
          s.g.position.copy(anchor.pos).addScaledVector(tmpD, D).addScaledVector(tmpS, xn * D * tanH).addScaledVector(tmpU, yn * D * tanV).sub(group.position);
          s.g.scale.setScalar(scale);
        });
      }
      sats.forEach((s, i) => {
        s.g.lookAt(camera.position);
        s.craft.rotation.set(Math.sin(t * 0.5 + s.phase) * 0.12, Math.sin(t * 0.35 + s.phase) * 0.35, Math.sin(t * 0.4 + s.phase) * 0.08);
        s.blink.material.opacity = ((t * 0.8 + i * 0.25) % 1) < 0.15 ? 0.95 : 0.12;
      });
    }
  };
}
