// Capítulo 7 (segunda parte): la carga de la misión. Cada regalo es una caja redondeada envuelta en papel pastel
// (textura de papel con estampado sutil + normal map de fibras), listón cruzado satinado y un moño de dos lazos con
// volumen, dentro de una burbuja de cristal (fresnel, tornasol suave, reflejo del cielo y brillo que se mueve).
// Las burbujas flotan con balanceo lento y los regalos giran despacio dentro.
// "Tu presencia" (highlight) es la más grande y cercana: caja dorada con listón crema de la que sale un corazón rosa
// luminoso que late (escala + halo aditivo), con destellos dorados ocasionales.
// Interacción: hitMeshes (burbujas) para tocar un regalo; focus(i) = destello al girar la cámara hacia él.
// Geometrías y materiales compartidos entre regalos; en calidad baja, menos segmentos y sin destellos.
import * as THREE from "three";
import { pbr, paperNormal, halo, glowTexture, ENV, canvasTex, rng } from "./materials.js";
import { roundedBox, heartGeometry } from "./shapes.js";
import { createSprites } from "./particles.js";
import { demoData } from "../data.js";

// [papel, listón] en la paleta de la invitación; el dorado es para "Tu presencia"
const WRAPS = [["#FF8FA3", "#FFF7EC"], ["#6FD6E8", "#FFD27A"], ["#B9A2FF", "#FFF7EC"], ["#FF8FA3", "#FFD27A"], ["#6FD6E8", "#FFF7EC"]];
const GOLD = ["#FFD27A", "#FFF7EC"];

/** Papel de regalo: casi blanco con estrellitas y puntos en relieve pintado (el color lo pone el material). */
function paperMap() {
  return canvasTex(256, 256, (c, w) => {
    const r = rng(5);
    c.fillStyle = "#FFFFFF"; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 1800; i++) { const v = 238 + r() * 17; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(r() * w, r() * w, 1.2, 1.2); }
    const star = (x, y, s) => { c.beginPath(); for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? s * 0.45 : s; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
    for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
      const x = (gx + (gy % 2) * 0.5) * (w / 4) + 32, y = gy * (w / 4) + 32;
      c.fillStyle = "rgba(255,255,255,.95)"; star(x % w, y, 11);
      c.fillStyle = "rgba(120,100,160,.10)"; star((x % w) + 1.5, y + 1.5, 11);
      c.fillStyle = "rgba(120,100,160,.12)"; c.beginPath(); c.arc((x + 32) % w, y + 32, 3.2, 0, Math.PI * 2); c.fill();
    }
  });
}

/** Burbuja de cristal: fresnel + tornasol pastel + reflejo del cielo + dos brillos que se mueven. Sin transmisión. */
function bubbleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...ENV, time: { value: 0 }, boost: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D envMap; uniform float time; uniform float boost;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      const float PI = 3.14159265;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);
        vec3 r = reflect(normalize(vWP - cameraPosition), normalize(vWN));
        vec3 env = texture2D(envMap, vec2(atan(r.z, r.x) / (2.0 * PI) + 0.5, asin(clamp(r.y, -1.0, 1.0)) / PI + 0.5)).rgb;
        vec3 irid = 0.62 + 0.38 * cos(6.2831 * (fr * 1.1 + vec3(0.0, 0.33, 0.67)) + time * 0.25);
        vec3 L1 = normalize(vec3(-0.55 + sin(time * 0.45) * 0.35, 0.75, 0.5));
        vec3 L2 = normalize(vec3(0.7, -0.2 + cos(time * 0.35) * 0.3, 0.6));
        float s1 = pow(max(dot(reflect(-L1, n), v), 0.0), 110.0), s2 = pow(max(dot(reflect(-L2, n), v), 0.0), 24.0) * 0.25;
        vec3 col = env * (0.2 + fr * 0.9) + irid * fr * 0.55 + vec3(1.0, 0.97, 0.92) * (s1 * 1.6 + s2);
        float a = clamp((0.035 + fr * 0.6) * boost + s1 * 0.95 + s2, 0.0, 1.0);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`
  });
}

export function createCargo({ low = false, particles = 1 } = {}) {
  const group = new THREE.Group(); group.name = "cargo";
  const gifts = [...demoData.gifts].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0)); // mismo orden que la tarjeta
  // --- compartido
  const seg = low ? 2 : 4;
  const boxGeo = roundedBox(1, 0.8, 1, 0.1, seg);
  const bandGeo = roundedBox(1.035, 0.835, 0.17, 0.05, low ? 1 : 2);
  const loopGeo = new THREE.TorusGeometry(0.17, 0.055, low ? 8 : 14, low ? 20 : 36);
  const knotGeo = new THREE.SphereGeometry(0.085, low ? 12 : 20, low ? 10 : 16);
  const tailGeo = roundedBox(0.12, 0.02, 0.34, 0.01, 1);
  const bubbleGeo = new THREE.SphereGeometry(1, low ? 28 : 56, low ? 20 : 40);
  const heartGeo = heartGeometry(0.46, { curve: low ? 4 : 8 });
  const map = paperMap(), nrm = paperNormal();
  const bubbleMat = bubbleMaterial();
  const mats = new Map();
  const mat = (key, make) => { if (!mats.has(key)) mats.set(key, make()); return mats.get(key); };
  // papel dorado: metálico suave con un poco de brillo propio cálido (sin verse bronce en el cielo oscuro)
  const paper = (color, gold) => mat(`p${color}`, () => gold
    ? pbr(color, { rough: 0.36, metal: 0.32, map, normalMap: nrm, normalScale: 0.4, env: 1.4, rim: 0.5, emissive: "#8a5c12", ei: 0.35 })
    : pbr(color, { rough: 0.62, metal: 0.02, map, normalMap: nrm, normalScale: 0.45, env: 0.45, rim: 0.45 }));
  const satin = (color) => mat(`s${color}`, () => pbr(color, { rough: 0.26, metal: 0.18, env: 1.25, rim: 0.35 }));
  const heartMat = pbr("#FF8FA3", { rough: 0.3, metal: 0, emissive: "#FF5F85", ei: 0.9, env: 0.6, rim: 0.8 });

  function makeGift(paperCol, ribbonCol, gold) {
    const box = new THREE.Group();
    box.add(new THREE.Mesh(boxGeo, paper(paperCol, gold)));
    const rib = satin(ribbonCol);
    const b1 = new THREE.Mesh(bandGeo, rib), b2 = new THREE.Mesh(bandGeo, rib); b2.rotation.y = Math.PI / 2; box.add(b1, b2);
    // moño: nudo, dos lazos inclinados hacia afuera y dos colas
    const bow = new THREE.Group(); bow.position.y = 0.43; box.add(bow);
    const knot = new THREE.Mesh(knotGeo, rib); knot.scale.set(1.1, 0.8, 1); bow.add(knot);
    for (const s of [-1, 1]) {
      const loop = new THREE.Mesh(loopGeo, rib);
      loop.position.set(s * 0.16, 0.09, 0); loop.rotation.set(0.25, s * 0.5, s * 0.62); loop.scale.set(1, 0.72, 0.55);
      bow.add(loop);
      const tail = new THREE.Mesh(tailGeo, rib);
      tail.position.set(s * 0.1, -0.005, 0.16); tail.rotation.set(0.12, s * 0.55, s * 0.06); bow.add(tail);
    }
    return box;
  }

  const pods = gifts.map((g, i) => {
    const top = !!g.highlight;
    const pod = new THREE.Group(); pod.name = `gift-${i}`;
    const [pc, rc] = top ? GOLD : WRAPS[(i - 1 + WRAPS.length) % WRAPS.length];
    const gift = makeGift(pc, rc, top);
    const inner = new THREE.Group(); inner.add(gift); pod.add(inner);
    const R = top ? 1.08 : 0.92;
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMat); bubble.scale.setScalar(R); bubble.renderOrder = 4; bubble.userData.index = i;
    pod.add(bubble);
    let heart = null, hHalo = null;
    if (top) {
      gift.scale.setScalar(0.92); gift.position.y = -0.14;
      heart = new THREE.Mesh(heartGeo, heartMat); heart.position.y = 0.52; inner.add(heart);
      hHalo = halo("#FF8FA3", 1.5, 0.5); hHalo.position.y = 0.52; inner.add(hHalo);
      pod.add(halo("#FFD27A", 3.4, 0.22));
    }
    // "Tu presencia" al frente y más grande; el resto en arco detrás y arriba (encuadre vertical del teléfono)
    const k = i - 1, side = k % 2 ? 1 : -1, row = Math.floor(k / 2);
    if (top) pod.position.set(0, 0.1, 1.5); else pod.position.set(side * (1.45 + row * 1.1), 1.45 - row * 1.6 + (side > 0 ? -0.2 : 0.1), -0.9 - row * 0.7);
    pod.scale.setScalar(top ? 1.3 : 1);
    pod.userData = { base: pod.position.clone(), inner, bubble, heart, hHalo, top, R, focus: 0 };
    group.add(pod);
    return pod;
  });

  // destellos: dorados alrededor de "Tu presencia" y ráfaga al enfocar un regalo
  const nSpark = low ? 0 : Math.round(40 * Math.max(0.5, particles));
  const sparks = nSpark ? createSprites({ count: nSpark, texture: glowTexture(), additive: true, renderOrder: 6 }) : null;
  if (sparks) { sparks.hideAll(); group.add(sparks.mesh); }
  const pool = Array.from({ length: nSpark }, () => ({ life: -1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1, c: "#FFD27A", max: 1 }));
  let cur = 0;
  const emit = (x, y, z, n, spread, cols) => {
    for (let k = 0; k < n && nSpark; k++) {
      const p = pool[cur]; cur = (cur + 1) % nSpark;
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.5) * Math.PI, sp = spread * (0.4 + Math.random() * 0.6);
      Object.assign(p, { life: 0, x, y, z, vx: Math.cos(a) * Math.cos(e) * sp, vy: Math.sin(e) * sp + 0.15, vz: Math.sin(a) * Math.cos(e) * sp, s: 0.06 + Math.random() * 0.12, c: cols[(Math.random() * cols.length) | 0], max: 0.7 + Math.random() * 0.7 });
    }
  };
  const tmp = new THREE.Vector3();

  return {
    group, pods, count: pods.length,
    hitMeshes: pods.map((p) => p.userData.bubble),
    /** Posición de mundo del centro de un regalo. */
    worldPos(i, out = new THREE.Vector3()) { return pods[i].userData.bubble.getWorldPosition(out); },
    /** Resalta un regalo (brillo de la burbuja) y lanza una ráfaga de destellos. */
    focus(i) {
      pods.forEach((p, k) => { p.userData.focus = k === i ? 1.6 : 0; });
      const p = pods[i]; if (!p) return;
      emit(p.position.x, p.position.y, p.position.z, 16, 1.4 * p.scale.x, ["#FFF7EC", "#FFD27A", p.userData.top ? "#FF8FA3" : "#6FD6E8"]);
    },
    update(dt, t, show) {
      bubbleMat.uniforms.time.value = t;
      pods.forEach((p, i) => {
        const u = p.userData;
        p.position.y = u.base.y + Math.sin(t * 0.8 + i * 1.7) * 0.18;
        p.position.x = u.base.x + Math.sin(t * 0.37 + i * 2.1) * 0.08;
        p.rotation.z = Math.sin(t * 0.5 + i) * 0.07;
        u.inner.rotation.set(Math.sin(t * 0.6 + i) * 0.12, t * 0.32 + i * 1.3, Math.sin(t * 0.45 + i * 0.7) * 0.08);
        u.focus = Math.max(0, u.focus - dt * 0.5);
        const f = Math.min(1, u.focus);
        u.inner.scale.setScalar(1 + f * 0.06);
        if (u.heart) {
          const beat = Math.pow(Math.max(0, Math.sin(t * 4.2)), 8) + Math.pow(Math.max(0, Math.sin(t * 4.2 - 0.9)), 8) * 0.6;
          u.heart.scale.setScalar(1 + beat * 0.12);
          u.heart.rotation.y = -u.inner.rotation.y + Math.sin(t * 0.7) * 0.35; // el corazón siempre de frente
          u.hHalo.material.opacity = (0.28 + beat * 0.45) * show;
          if (sparks && Math.random() < dt * 2.2 * show) { tmp.set((Math.random() - 0.5) * 2.4, (Math.random() - 0.3) * 2.2, (Math.random() - 0.5) * 1.6).multiplyScalar(p.scale.x * 0.8).add(p.position); emit(tmp.x, tmp.y, tmp.z, 1, 0.12, ["#FFD27A", "#FFF7EC"]); }
        }
      });
      if (sparks) {
        pool.forEach((p, i) => {
          if (p.life < 0) { sparks.hide(i); return; }
          p.life += dt;
          if (p.life > p.max) { p.life = -1; sparks.hide(i); return; }
          const k = p.life / p.max, drag = Math.exp(-2.5 * dt);
          p.vx *= drag; p.vy *= drag; p.vz *= drag;
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          sparks.set(i, p.x, p.y, p.z, p.s * Math.sin(k * Math.PI) * (1 + 0.3 * Math.sin(t * 20 + i)), t * 2 + i, p.c, Math.sin(k * Math.PI) * show);
        });
        sparks.commit();
      }
    }
  };
}
