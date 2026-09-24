// Mundo 3D (WebGL): renderer, escena, luces, isla, cámara, ciclo del día y efectos.
// Expone la misma API que la versión sin WebGL (fallback.js) para que la interfaz no dependa del 3D.
import * as THREE from "../../vendor/three.module.min.js";
import { bevelBoxGeometry, voxelMesh } from "./voxels.js";
import { buildIsland, digitVoxels } from "./island.js";
import { createDayCycle } from "./daycycle.js";
import { createCameraRig } from "./camera-rig.js";
import { createFx } from "./fx.js";
import { createBuilder } from "./build-anim.js";
import { createPicker } from "./picking.js";
import { SYMBOLS, SYMBOL_KEYS } from "../symbols.js";
import { prefersReduced, clamp, lerp, easeOutBack, easeOut, easeInOut } from "../util.js";

/** ¿Hay WebGL? (sin crear el renderer completo) */
export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

const _m = new THREE.Matrix4();
const _c = new THREE.Color();

export async function createWorld({ container, skyEl, starsEl, frameEl, data, audio, onProgress = () => {} }) {
  onProgress(0.1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = "world-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.append(renderer.domElement);

  const size = { w: 1, h: 1 };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x886655, 1.3);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 10, far: 160 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.04;
  scene.add(hemi, sun, sun.target);

  onProgress(0.3);
  await new Promise((r) => setTimeout(r, 0));
  const geo = bevelBoxGeometry(0.09);
  const island = buildIsland(data, geo);
  onProgress(0.6);
  await new Promise((r) => setTimeout(r, 0));

  const root = new THREE.Group();
  scene.add(root);
  const M = island.meshes;
  const GR = island.groups; // un grupo por zona (y por árbol pequeño)
  root.add(M.ground, M.rock, M.misc, M.water, ...Object.values(GR));

  /* ---------- Halo cálido del letrero (sólo de noche, muy sutil) ---------- */
  const MI = island.info.monument;
  const haloSign = (() => {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 64;
    const cx = cv.getContext("2d");
    const g = cx.createRadialGradient(128, 32, 4, 128, 32, 128);
    g.addColorStop(0, "rgba(255,214,150,1)"); g.addColorStop(0.55, "rgba(255,190,120,.55)"); g.addColorStop(1, "rgba(255,190,120,0)");
    cx.setTransform(1, 0, 0, 0.25, 0, 24); // elipse aplanada del ancho del letrero
    cx.fillStyle = g; cx.fillRect(0, -200, 256, 400);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(MI.width * 0.98, MI.height * 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    // Sobre la cara del tablero, detrás de las letras: ilumina el contorno de cada letra
    m.position.set(MI.center.x, MI.center.y, MI.front + 0.02);
    m.visible = false;
    return m;
  })();
  GR.monument.add(haloSign);
  M.digits.material = island.materials.accent;
  const fx = createFx({ THREE, scene, root, geo, island, data });
  GR.tree.add(fx.frames); // los marcos de fotos giran dentro de la zona del Mirador
  GR.wall.add(fx.portal);

  /* ---------- Bloques de invitados en el muro ---------- */
  const SLOTS = island.info.wallSlots;
  const WI = island.info.wallInfo;
  const GS = WI.slotScale;
  const guestMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0 });
  // De noche cada bloque brilla con SU color: la emisión se multiplica por el color de la instancia
  guestMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("vec3 totalEmissiveRadiance = emissive;", "vec3 totalEmissiveRadiance = emissive * vColor;");
  };
  const guestMesh = voxelMesh([], guestMat, { geometry: geo, capacity: SLOTS.length, jitterColor: false });
  guestMesh.castShadow = true;
  // Bloques de invitados (con sus placas y marcador "TÚ") en un grupo que aparece con "pop" al final
  // de la construcción, escalando desde el centro del muro (pivote en el centro, contenido compensado).
  const slotC = SLOTS.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / SLOTS.length);
  const guestPivot = new THREE.Group();
  guestPivot.position.copy(slotC);
  const guestGroup = new THREE.Group();
  guestGroup.position.copy(slotC).negate();
  guestPivot.add(guestGroup);
  GR.wall.add(guestPivot);
  guestGroup.add(guestMesh);
  // Atlas de símbolos (6 celdas) → placas en la cara frontal, un InstancedMesh por símbolo
  const atlas = document.createElement("canvas");
  atlas.width = 64 * SYMBOL_KEYS.length; atlas.height = 64;
  const ax = atlas.getContext("2d");
  SYMBOL_KEYS.forEach((k, i) => {
    ax.save(); ax.translate(i * 64 + 6, 6); ax.scale(52 / 24, 52 / 24);
    const p = new Path2D(SYMBOLS[k].d);
    ax.lineJoin = "round"; ax.lineWidth = 2.2; ax.strokeStyle = "#5B3A1E"; ax.stroke(p);
    ax.fillStyle = "#FFFFFF"; ax.fill(p, "evenodd");
    ax.restore();
  });
  const atlasTex = new THREE.CanvasTexture(atlas);
  atlasTex.colorSpace = THREE.SRGBColorSpace;
  const plateMat = new THREE.MeshBasicMaterial({ map: atlasTex, transparent: true, alphaTest: 0.35 });
  const plates = {};
  SYMBOL_KEYS.forEach((k, i) => {
    const g = new THREE.PlaneGeometry(0.72 * GS, 0.72 * GS);
    const uv = g.attributes.uv;
    for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / SYMBOL_KEYS.length);
    const m = new THREE.InstancedMesh(g, plateMat, SLOTS.length);
    m.count = 0; m.visible = false; m.frustumCulled = false;
    guestGroup.add(m);
    plates[k] = m;
  });
  let guests = []; // { name, color, symbol, me }
  const plateQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), WI.rotY);
  const _p = new THREE.Vector3(), _s = new THREE.Vector3();
  function writeGuests(skipIndex = -1) {
    guestMesh.count = guests.length;
    const counts = {};
    SYMBOL_KEYS.forEach((k) => (counts[k] = 0));
    guests.forEach((g, i) => {
      const p = SLOTS[i];
      if (!p) return;
      const hide = i === skipIndex ? 0 : 1;
      _m.makeScale(GS * hide, GS * hide, GS * hide).setPosition(p.x, p.y, p.z);
      guestMesh.setMatrixAt(i, _m);
      guestMesh.setColorAt(i, _c.set(g.color));
      const k = g.symbol in counts ? g.symbol : "star";
      _m.compose(_p.copy(p).addScaledVector(WI.front, GS * 0.52), plateQ, _s.set(hide, hide, 1));
      plates[k].setMatrixAt(counts[k]++, _m);
    });
    SYMBOL_KEYS.forEach((k) => { plates[k].count = counts[k]; plates[k].visible = counts[k] > 0; plates[k].instanceMatrix.needsUpdate = true; });
    guestMesh.instanceMatrix.needsUpdate = true;
    if (guestMesh.instanceColor) guestMesh.instanceColor.needsUpdate = true;
    placeMeMarker(skipIndex);
  }
  const guestBoxes = () => guests.map((g, i) => new THREE.Box3().setFromCenterAndSize(SLOTS[i], new THREE.Vector3(1.7, 1.7, 1.7)));

  /* ---------- Bloque del invitado actual: halo que pulsa + banderita "TÚ" ---------- */
  const haloCv = document.createElement("canvas");
  haloCv.width = haloCv.height = 64;
  const hx = haloCv.getContext("2d");
  const hg = hx.createRadialGradient(32, 32, 8, 32, 32, 32);
  hg.addColorStop(0, "rgba(255,246,229,.9)"); hg.addColorStop(0.5, "rgba(255,226,140,.45)"); hg.addColorStop(1, "rgba(255,226,140,0)");
  hx.fillStyle = hg; hx.fillRect(0, 0, 64, 64);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(haloCv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.visible = false;
  const flagCv = document.createElement("canvas");
  flagCv.width = 128; flagCv.height = 128;
  const fc = flagCv.getContext("2d");
  fc.fillStyle = "#5B3A1E"; fc.fillRect(10, 8, 10, 118);
  fc.fillStyle = "#FF6B6B"; fc.strokeStyle = "#5B3A1E"; fc.lineWidth = 6;
  fc.beginPath(); fc.moveTo(20, 12); fc.lineTo(118, 12); fc.lineTo(100, 42); fc.lineTo(118, 72); fc.lineTo(20, 72); fc.closePath(); fc.fill(); fc.stroke();
  fc.fillStyle = "#FFF6E5"; fc.font = "44px Bungee, 'Arial Black', sans-serif"; fc.textAlign = "center"; fc.textBaseline = "middle";
  fc.fillText("TÚ", 64, 45);
  const flagTex = new THREE.CanvasTexture(flagCv);
  flagTex.colorSpace = THREE.SRGBColorSpace;
  const meFlag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: flagTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
  meFlag.rotation.y = WI.rotY;
  meFlag.visible = false;
  guestGroup.add(halo, meFlag);
  function placeMeMarker(skipIndex = -1) {
    const i = guests.findIndex((g) => g.me);
    const on = i >= 0 && i !== skipIndex && SLOTS[i];
    halo.visible = meFlag.visible = !!on;
    if (!on) return;
    halo.position.copy(SLOTS[i]).addScaledVector(WI.front, 0.3);
    meFlag.position.copy(SLOTS[i]).add(new THREE.Vector3(0, GS * 0.5 + 0.75, 0)).addScaledVector(WI.front, 0.2);
  }

  onProgress(0.8);
  const day = createDayCycle({ scene, sun, hemi, skyEl, starsEl, cloudMat: fx.cloudMat, glowMat: island.materials.glow, waterMat: island.materials.water, frameEl });
  // Luces nocturnas (máx. 4 puntuales): monumento, casa, sendero y muro. Sólo se encienden de noche.
  const mc = island.stops[0].target;
  const LS = island.info.lanternSpots; // [sendero ×2, muro]
  const nightLights = [
    [mc.clone().add(new THREE.Vector3(0, 1.5, 6)), 60, 26],
    [island.info.houseLight, 30, 14],
    [LS[0].clone().lerp(LS[1], 0.5).add(new THREE.Vector3(0, 1, 0)), 28, 14],
    [LS[2].clone().add(new THREE.Vector3(0, 1, 0)), 30, 14]
  ].map(([pos, k, dist]) => { const l = new THREE.PointLight("#FFC978", 0, dist, 1.2); l.position.copy(pos); l.userData.k = k; root.add(l); return l; });
  // Resplandor dorado del cofre (al abrirse)
  const chestLight = new THREE.PointLight("#FFC24A", 0, 10, 1.4);
  chestLight.position.copy(island.info.chestGlow);
  root.add(chestLight);
  const chestAnim = { t: -1 };

  /* ---------- Manecillas del reloj (hora real) ---------- */
  const CL = island.info.clock;
  const hands = new THREE.Group();
  hands.position.copy(CL.center);
  hands.rotation.y = CL.rotY;
  const handMat = new THREE.MeshLambertMaterial({ color: "#4A2E16" });
  const mkHand = (len, w, z) => { const pivot = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.3), handMat); m.position.set(0, len / 2 - 0.2, z); pivot.add(m); hands.add(pivot); return pivot; };
  const hourHand = mkHand(1.35, 0.42, 0.15);
  const minuteHand = mkHand(2.0, 0.3, 0.35);
  const centerDot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({ color: "#F2C94C" }));
  centerDot.position.z = 0.5;
  hands.add(centerDot);
  // 12 marcas: 4 principales más grandes
  const marks = new THREE.InstancedMesh(geo, handMat, 12);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2, big = k % 3 === 0, s = big ? 0.5 : 0.28, r = big ? 1.62 : 1.72;
    _m.makeScale(s, s * (big ? 1.4 : 1), 0.3).setPosition(Math.sin(a) * r, Math.cos(a) * r, 0.05);
    const rot = new THREE.Matrix4().makeRotationZ(-a);
    marks.setMatrixAt(k, new THREE.Matrix4().makeTranslation(Math.sin(a) * r, Math.cos(a) * r, 0.05).multiply(rot).multiply(new THREE.Matrix4().makeScale(s, s * (big ? 1.5 : 1), 0.3)));
  }
  hands.add(marks);
  GR.tower.add(hands);
  let lastMinute = -1;
  function updateClock() {
    const d = new Date();
    const m = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    if (Math.floor(m * 4) === lastMinute) return false;
    lastMinute = Math.floor(m * 4);
    minuteHand.rotation.z = -((m % 60) / 60) * Math.PI * 2;
    hourHand.rotation.z = -(((m / 60) % 12) / 12) * Math.PI * 2;
    return true;
  }
  updateClock();
  const rig = createCameraRig(camera, () => size);
  const builder = createBuilder({ island, fx, audio });
  // Objetos que aparecen con "pop" al final de la construcción (manecillas y bloques del muro incluidos:
  // así no flotan en el aire mientras la isla se arma)
  builder.setPops([{ obj: hands, at: 0.88 }, { obj: fx.frames, at: 0.9 }, { obj: fx.portal, at: 0.92 }, { obj: guestPivot, at: 0.94 }]);
  const picker = createPicker({ camera, island, fx, root });
  picker.setWallBoxes(guestBoxes);

  /* ---------- Tamaño ---------- */
  function resize() {
    const r = container.getBoundingClientRect();
    size.w = Math.max(1, r.width); size.h = Math.max(1, r.height);
    renderer.setSize(size.w, size.h, false);
    needs = true;
  }
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  ro ? ro.observe(container) : window.addEventListener("resize", resize);

  /* ---------- Animaciones puntuales (con etiqueta: se pueden cancelar al navegar) ---------- */
  const anims = new Set();
  const timers = new Set();
  const animate = (fn, tag = null) => new Promise((res) => { anims.add({ fn, t0: performance.now(), res, tag }); needs = true; });
  const later = (ms, fn, tag = null) => { const rec = { tag, t: setTimeout(() => { timers.delete(rec); fn(); needs = true; }, ms) }; timers.add(rec); };
  /** Cancela animaciones y temporizadores de una etiqueta (sus promesas se resuelven). */
  function cancelTag(tag) {
    for (const a of [...anims]) if (a.tag === tag) { anims.delete(a); a.res(); }
    for (const r of [...timers]) if (r.tag === tag) { clearTimeout(r.t); timers.delete(r); }
  }

  /* ---------- Desvanecido por oclusión (por grupo de zona) ---------- */
  // Lo que queda entre la cámara y la protagonista baja a ~15 % de opacidad durante la parada.
  const FADE_TO = 0.15;
  const fades = new Map(); // Object3D → { cur, target }
  function setFade(obj, target, from) {
    const f = fades.get(obj) || { cur: from ?? 1, target: 1 };
    if (from != null) f.cur = from;
    f.target = target;
    fades.set(obj, f);
    needs = true;
  }
  function applyFade(obj, a) {
    obj.traverse((o) => {
      if (!o.material || o.isLight) return;
      const u = o.userData;
      if (a < 0.999) {
        if (!u.fadeMat) {
          u.srcMat = o.material;
          u.fadeMat = o.material.clone();
          u.fadeMat.onBeforeCompile = o.material.onBeforeCompile;
          u.fadeMat.transparent = true;
          u.srcShadow = o.castShadow;
        }
        o.material = u.fadeMat;
        u.fadeMat.opacity = (u.srcMat.opacity ?? 1) * a;
        u.fadeMat.depthWrite = a > 0.6;
        if (u.srcMat.emissive) { u.fadeMat.emissive.copy(u.srcMat.emissive); u.fadeMat.emissiveIntensity = u.srcMat.emissiveIntensity; }
        o.castShadow = false;
      } else if (u.fadeMat && o.material === u.fadeMat) {
        o.material = u.srcMat;
        o.castShadow = u.srcShadow;
      }
    });
  }
  function updateFades(dt) {
    if (!fades.size) return false;
    const k = 1 - Math.pow(0.0005, dt); // ~0.4 s
    for (const [obj, f] of fades) {
      f.cur += (f.target - f.cur) * k;
      if (Math.abs(f.target - f.cur) < 0.004) f.cur = f.target;
      applyFade(obj, f.cur);
      if (f.cur === 1 && f.target === 1) fades.delete(obj);
    }
    return true;
  }

  /* ---------- Rendimiento: DPR adaptativo y render bajo demanda ---------- */
  let needs = true, running = false, raf = 0, last = 0;
  let slowFor = 0, fpsAcc = 0, fpsN = 0, fps = 60, low = false;
  function degrade() {
    if (dpr > 1.5) dpr = 1.5;
    else if (dpr > 1) dpr = 1;
    else { low = true; fx.setLow(true); renderer.shadowMap.enabled = false; root.traverse((o) => { o.castShadow = false; }); }
    renderer.setPixelRatio(dpr);
    resize();
  }
  let floatT = 0;
  let flagsRaising = false;
  let shake = 0, buildToken = 0;
  function frame(now) {
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
    last = now;
    fpsAcc += dt; fpsN++;
    if (fpsAcc >= 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    if (fps < 45 && !low && document.visibilityState === "visible") { slowFor += dt; if (slowFor > 2) { slowFor = 0; degrade(); } } else slowFor = 0;

    let active = false;
    active = day.update(now) || active;
    const nightK = Math.max(0, day.state.glow - 0.4) / 0.6;
    nightLights.forEach((l) => { l.intensity = nightK * l.userData.k; });
    guestMat.emissiveIntensity = nightK * 0.45;
    haloSign.material.opacity = nightK * 0.22;
    haloSign.visible = nightK > 0.01 && M.monument.visible;
    if (updateClock()) active = true;
    // Halo del bloque propio: pulsa
    if (halo.visible) { const k = GS * (2.1 + Math.sin(now / 380) * 0.25); halo.scale.set(k, k, 1); halo.material.opacity = 0.55 + nightK * 0.35; }
    // Banderines: la tela ondea suavemente
    if (!prefersReduced()) {
      const fm = M.flags, fb = fm.userData.base, cloth = fm.userData.cloth, wv = island.info.flagWave;
      for (let i = 0; i < fm.count; i++) {
        if (!cloth[i] || flagsRaising) continue;
        const w = Math.sin(now / 420 + cloth[i] * 0.9 + i * 0.05) * 0.12 * cloth[i] * 0.5;
        const s = fb[i * 4 + 3];
        _m.makeScale(s, s, s).setPosition(fb[i * 4] + wv.x * w, fb[i * 4 + 1], fb[i * 4 + 2] + wv.z * w);
        fm.setMatrixAt(i, _m);
      }
      fm.instanceMatrix.needsUpdate = true;
    }
    // Resplandor del cofre al abrirse
    if (chestAnim.t >= 0) {
      chestAnim.t += dt;
      chestLight.intensity = Math.max(0, Math.sin(Math.min(1, chestAnim.t / 0.5) * Math.PI / 2) * 22 * (chestAnim.t < 3 ? 1 : Math.max(0.35, 1 - (chestAnim.t - 3) / 2)));
    }
    active = rig.update(now, dt) || active;
    // Leve shake de cámara cuando aterriza una construcción
    if (shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake * 0.7;
      shake = Math.max(0, shake - dt * 1.1);
      active = true;
    }
    active = builder.update(now, dt) || active;
    active = fx.update(now, dt, camera) || active;
    active = updateFades(dt) || active;
    for (const a of anims) {
      const done = a.fn((now - a.t0) / 1000, dt);
      if (done) { anims.delete(a); a.res(); }
      active = true;
    }
    if (!prefersReduced()) { floatT += dt; root.position.y = Math.sin(floatT * 0.6) * 0.25; active = true; }
    else root.position.y = 0;
    if (active || needs) {
      // Niebla relativa a la parada: lo que está más lejos que la protagonista se aclara y desatura
      const d = camera.position.distanceTo(rig.view.target);
      scene.fog.near = d + 3;
      scene.fog.far = d * 1.9 + 28;
      renderer.render(scene, camera);
      needs = false;
      world.onFrame?.();
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  resize();
  // Precompila todos los shaders con todo visible (evita tirones la primera vez que aparece algo)
  try { renderer.compile(scene, camera); } catch { /* sin precompilar */ }
  onProgress(1);

  /* ---------- Vistas ---------- */
  const OVERVIEW = { target: new THREE.Vector3(0, -4, 2), yaw: 22, pitch: 36, radius: island.plan.R + 4 };
  const stopView = (i) => { const s = island.stops[i]; return { target: s.target, yaw: s.yaw, pitch: s.pitch, radius: s.radius, halfH: s.halfH }; };
  const setView = (v) => { Object.assign(rig.view, { yaw: v.yaw, pitch: v.pitch, radius: v.radius, halfH: v.halfH }); rig.view.target = v.target.clone(); rig.snap(); needs = true; };

  /* ---------- Cámara final de una vista (para decidir qué se desvanece antes de llegar) ---------- */
  const tmpCam = new THREE.PerspectiveCamera();
  function camFor(v, insetPx = rig.insetTarget) {
    tmpCam.copy(camera);
    tmpCam.aspect = size.w / size.h;
    tmpCam.setViewOffset(size.w, size.h, 0, insetPx / 2, size.w, size.h);
    tmpCam.near = 0.5;
    tmpCam.updateProjectionMatrix();
    tmpCam.position.copy(rig.poseFor(v, insetPx));
    tmpCam.lookAt(v.target);
    tmpCam.updateMatrixWorld();
    return tmpCam;
  }
  const overlapR = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const viewDepth = (p, cam) => -_v.copy(p).applyMatrix4(cam.matrixWorldInverse).z;
  /**
   * Objetos de otras zonas que quedan ENTRE la cámara y la protagonista: más cerca que ella y
   * encima de su recuadro en pantalla o del tercio central del área visible.
   */
  function occludersFor(i, cam, insetPx = rig.insetTarget) {
    const s = island.stops[i];
    const objs = island.info.overlapObjects;
    const heroObj = objs.find((o) => o.zone === s.zone);
    const hero = heroObj && partsRect(heroObj.parts(), 0, cam);
    if (!hero) return [];
    const heroD = viewDepth(s.target, cam);
    const band = { x0: size.w / 3, x1: (size.w * 2) / 3, y0: 0, y1: size.h - insetPx };
    const out = [];
    for (const o of objs) {
      if (o.zone === s.zone || o.owner === s.zone || !GR[o.zone]) continue;
      const r = partsRect(o.parts(), 0, cam);
      if (!r || !(overlapR(r, hero) || overlapR(r, band))) continue;
      const c = new THREE.Vector3();
      o.parts().forEach((b) => c.add(b.getCenter(_v2)));
      c.multiplyScalar(1 / o.parts().length);
      if (viewDepth(c, cam) < heroD) out.push({ name: o.name, group: GR[o.zone] });
    }
    return out;
  }
  const _v2 = new THREE.Vector3();
  let occluding = [];
  function clearFades() { for (const [obj, f] of fades) if (obj !== M.flags) f.target = 1; occluding = []; needs = true; }
  function fadeOccluders(i) {
    clearFades();
    occluding = occludersFor(i, camFor(stopView(i)));
    occluding.forEach((o) => setFade(o.group, FADE_TO));
  }
  const fadeEl = document.createElement("div");
  fadeEl.className = "world-fade";
  container.append(fadeEl);
  async function cut(v) {
    fadeEl.classList.add("is-on");
    await new Promise((r) => setTimeout(r, 220));
    setView(v);
    fadeEl.classList.remove("is-on");
  }

  /* ---------- Dígitos de la torre ---------- */
  let digitsText = null;
  function setDigits(text, { animateIn = true } = {}) {
    if (text === digitsText) return;
    digitsText = text;
    const { list, s } = digitVoxels(text, island.info.digits);
    const mesh = M.digits;
    mesh.count = list.length;
    const base = mesh.userData.base;
    const fr = island.info.clock.front;
    list.forEach((v, i) => {
      base.set([v.x, v.y, v.z, s], i * 4);
      mesh.setColorAt(i, _c.set(v.color));
      _m.makeScale(s, s, s).setPosition(v.x, v.y, v.z);
      mesh.setMatrixAt(i, _m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (animateIn && !prefersReduced()) {
      const n = list.length;
      cancelTag("tower");
      animate((t) => {
        for (let i = 0; i < n; i++) {
          const q = clamp((t - (i / n) * 0.6) / 0.25, 0, 1);
          const k = s * easeOutBack(q);
          _m.makeScale(k, k, k).setPosition(base[i * 4] + fr.x * (1 - q) * 1.5, base[i * 4 + 1], base[i * 4 + 2] + fr.z * (1 - q) * 1.5);
          mesh.setMatrixAt(i, _m);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (t > 0.9) { for (let i = 0; i < n; i++) { _m.makeScale(s, s, s).setPosition(base[i * 4], base[i * 4 + 1], base[i * 4 + 2]); mesh.setMatrixAt(i, _m); } }
        return t > 0.9;
      }, "tower");
    }
    needs = true;
  }

  /* ---------- Banderines: q de cada uno (0 = bajo el suelo, 1 = arriba) ---------- */
  function writeFlags(qOf) {
    const mesh = M.flags, base = mesh.userData.base;
    island.info.flagInfo.forEach((f, fi) => {
      const q = clamp(qOf(fi), 0, 1);
      const e = q >= 1 ? 1 : Math.max(0.001, easeOutBack(q));
      for (let i = f.start; i < f.end; i++) {
        const k = base[i * 4 + 3] * e;
        _m.makeScale(k, k, k).setPosition(base[i * 4], base[i * 4 + 1] - (1 - q) * 2.5, base[i * 4 + 2]);
        mesh.setMatrixAt(i, _m);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    needs = true;
  }

  /* ---------- Debug: superposiciones en pantalla con la construcción protagonista ---------- */
  let activeStop = -1;
  const _v = new THREE.Vector3();
  /** Rectángulo en px (del canvas) de una caja 3D, recortada por el plano cercano; null si no se ve. */
  function screenRect(box, dy = 0, camera_ = camera) {
    const cam = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) cam.push(new THREE.Vector3(x, y + dy, z).applyMatrix4(camera_.matrixWorldInverse));
    const near = camera_.near + 1e-3;
    const pts = cam.filter((p) => -p.z >= near);
    // Aristas que cruzan el plano cercano: agrega el punto de corte
    for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) {
      const j = i ^ bit; if (j < i) continue;
      const a = cam[i], b = cam[j], da = -a.z - near, db = -b.z - near;
      if (da * db < 0) pts.push(a.clone().lerp(b, da / (da - db)));
    }
    if (!pts.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      _v.copy(p).applyMatrix4(camera_.projectionMatrix);
      const sx = (_v.x * 0.5 + 0.5) * size.w, sy = (-_v.y * 0.5 + 0.5) * size.h;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    if (x1 < 0 || y1 < 0 || x0 > size.w || y0 > size.h) return null;
    return { x0, y0, x1, y1 };
  }
  /** Recuadro que une los bloques visibles de una lista de cajas. */
  function partsRect(parts, dy = 0, cam = camera) {
    let r = null;
    for (const b of parts) {
      const q = screenRect(b, dy, cam);
      if (!q) continue;
      if (!r) r = { ...q };
      else { r.x0 = Math.min(r.x0, q.x0); r.y0 = Math.min(r.y0, q.y0); r.x1 = Math.max(r.x1, q.x1); r.y1 = Math.max(r.y1, q.y1); }
    }
    return r;
  }
  function overlaps() {
    const s = island.stops[activeStop];
    if (!s || rig.flying) return null;
    camera.updateMatrixWorld();
    const oy = root.position.y;
    const objs = island.info.overlapObjects;
    const heroObj = objs.find((o) => o.zone === s.zone);
    const hero = heroObj && partsRect(heroObj.parts(), oy);
    if (!hero) return null;
    const items = [];
    const band = { x0: size.w / 3, x1: (size.w * 2) / 3, y0: 0, y1: size.h - rig.inset };
    const faded = new Set(occluding.map((o) => o.name));
    // hit: toca el recuadro de la protagonista · center: está en el tercio central del área visible
    const test = (name, rect, zoneObj = true) => {
      if (!rect) return;
      items.push({ name, rect, hit: overlapR(rect, hero), center: zoneObj && overlapR(rect, band), faded: faded.has(name) });
    };
    objs.forEach((o) => { if (o !== heroObj && o.owner !== s.zone) test(o.name, partsRect(o.parts(), oy)); });
    fx.cloudBoxes().forEach((b, i) => test(`nube ${i + 1}`, screenRect(b), false));
    if (s.zone !== "house") test("perrito", screenRect(fx.dog.box, oy), false);
    return { stop: s.id, hero, band, items };
  }
  /** Datos del plano cenital (debug): zonas, árboles, borde de la isla y cámara + cono de cada parada. */
  function planData() {
    const P = island.plan;
    const hfov = (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * (size.w / size.h)) * 180) / Math.PI;
    const cams = island.stops.map((s, i) => {
      const v = stopView(i), p = rig.poseFor(v, rig.insetTarget);
      return { name: s.name, pos: [p.x, p.z], target: [v.target.x, v.target.z], hfov };
    });
    const ov = rig.poseFor(OVERVIEW, rig.insetTarget);
    cams.push({ name: "Vista de la isla", pos: [ov.x, ov.z], target: [OVERVIEW.target.x, OVERVIEW.target.z], hfov });
    const outline = Array.from({ length: 96 }, (_, k) => { const a = (k / 96) * Math.PI * 2, r = P.radiusAt(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const blocks = {};
    for (const o of island.info.overlapObjects) blocks[o.zone] = o.parts().map((b) => { b.getCenter(_v2); return [_v2.x, _v2.z]; });
    return { R: P.R, outline, zones: P.zones, gaps: P.gaps, trees: P.trees, blocks, cams, active: activeStop };
  }

  /* ---------- API pública (común con fallback) ---------- */
  const world = {
    kind: "webgl",
    scene, camera, renderer, island, rig, day, fx, builder, picker, root,
    stops: island.stops.map((s) => ({ id: s.id, name: s.name, time: s.time })),
    perf: { get fps() { return fps; }, get calls() { return renderer.info.render.calls; }, get tris() { return renderer.info.render.triangles; }, get dpr() { return dpr; }, get blocks() { return island.info.counts.main + island.info.counts.glow + island.info.counts.water; } },
    start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    invalidate() { needs = true; },
    setInset(px, instant = false) { rig.setInset(px, instant); needs = true; },
    setTime(key, ms = 1200) { day.go(key, prefersReduced() ? Math.min(ms, 400) : ms); needs = true; },
    get timeKey() { return day.key; },
    overlaps,
    plan: planData,
    get occluding() { return occluding.map((o) => o.name); },
    get activeStop() { return activeStop; },
    /**
     * Vuela a la parada i: una sola curva (~1.2 s, mismo easing para todas). Antes de salir decide
     * qué objetos quedan entre la cámara final y la protagonista y los desvanece; restaura los de
     * la parada anterior. Si llega otra navegación a medio vuelo, la curva nueva parte de donde va
     * la cámara (sin saltos) y la promesa anterior se resuelve con { interrupted: true }.
     */
    async goTo(i, { instant = false, duration = 1200 } = {}) {
      activeStop = i;
      const v = stopView(i);
      fadeOccluders(i);
      if (instant) { setView(v); return {}; }
      if (prefersReduced()) { await cut(v); return {}; }
      return rig.flyTo(v, { duration });
    },
    async overview({ instant = false } = {}) {
      activeStop = -1;
      clearFades();
      if (instant) { setView(OVERVIEW); return {}; }
      if (prefersReduced()) { await cut(OVERVIEW); return {}; }
      return rig.flyTo(OVERVIEW, { duration: 1300, arc: 0.6 });
    },
    /**
     * Construcción cinematográfica (~6 s + pausa):
     *  Acto 1 (0–2 s): cámara a ras de suelo en el borde frontal, mirando al centro; caen las
     *    columnas más cercanas desde fuera del cuadro.
     *  Acto 2 (2–6 s): la cámara retrocede y sube con easing continuo hasta la Vista de la isla;
     *    las columnas llegan en oleadas y cada construcción cae completa (shake + golpe).
     *  Acto 3: se asienta en la vista general, empiezan la cascada y los pájaros, pausa de 0.6 s.
     */
    async build() {
      const token = ++buildToken;
      const R = island.plan.R;
      const yaw = (OVERVIEW.yaw * Math.PI) / 180;
      const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); // borde frontal (lado de la vista general)
      // Justo fuera del borde frontal (todas las columnas caen delante), a 2–3 bloques sobre el suelo
      const P0 = dir.clone().multiplyScalar(R + 10).setY(3.6);
      const T0 = new THREE.Vector3(0, 2.2, 0); // hacia el centro, casi horizontal
      const ground = dir.clone().multiplyScalar(R - 5);
      rig.setInset(0, true);
      const P1 = rig.poseFor(OVERVIEW, 0), T1 = OVERVIEW.target.clone();
      fx.setLifeVisible(false);
      fx.clouds.visible = false; // la cámara cruza el anillo de nubes al retroceder: vuelven en el acto 3
      builder.reset();
      // Si la cámara viene de lejos (repetir la construcción), corte con fundido al punto inicial
      if (camera.position.distanceTo(P0) > 6) {
        fadeEl.classList.add("is-on");
        await new Promise((r) => setTimeout(r, 220));
        if (token !== buildToken) return;
        rig.hold(P0, T0);
        fadeEl.classList.remove("is-on");
      } else rig.hold(P0, T0);
      const done = builder.run({ ground, getCamera: () => camera, hooks: { shake: (k) => { shake = Math.max(shake, k); }, flagsRise: () => world.raiseFlags(), lowFps: () => fps < 50 } });
      const P0b = P0.clone().addScaledVector(dir, -0.8); // leve avance durante el acto 1
      const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
      const cam = animate((t) => {
        if (t < 2) { pos.lerpVectors(P0, P0b, easeInOut(t / 2)); tgt.copy(T0); }
        else { const e = easeInOut(clamp((t - 2) / 4, 0, 1)); pos.lerpVectors(P0b, P1, e); tgt.lerpVectors(T0, T1, e); }
        rig.hold(pos, tgt);
        return t >= 6;
      }, "build-cam");
      await done;
      await cam;
      if (token !== buildToken) return;
      // Acto 3: vista general, cascada y pájaros; pausa con la isla completa
      rig.release(OVERVIEW);
      fx.setLifeVisible(true);
      fx.clouds.visible = true;
      await new Promise((r) => setTimeout(r, 600));
    },
    /** Estado final inmediato de la isla (visitas repetidas, repetir construcción al terminar). */
    finishBuild() { builder.finish(); this.flagsUp(); fx.setLifeVisible(true); fx.clouds.visible = true; needs = true; },
    /** "Omitir": estado final en la vista del Monumento con el nombre ya construido. */
    skipBuild() {
      buildToken++;
      cancelTag("build-cam");
      builder.finish();
      this.flagsUp();
      fx.setLifeVisible(true);
      fx.clouds.visible = true;
      shake = 0;
      rig.release();
      activeStop = 0;
      fadeOccluders(0);
      rig.flyTo(stopView(0), { duration: 0 });
      rig.snap();
      needs = true;
    },
    /** Movimiento reducido: la isla completa aparece con un fundido (sin caídas ni cámara). */
    revealFade(ms = 900) {
      const el = renderer.domElement;
      el.style.transition = "none"; el.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = "1"; }));
    },
    /**
     * Repetir la construcción: la cámara se aleja a la vista de construcción mientras la isla se
     * desarma (los bloques suben y se dispersan hacia el cielo, ~1.2 s, con "whoosh").
     */
    async disassemble(T = 1.2) {
      activeStop = -1;
      clearFades();
      this.cancelSpecials();
      fx.setLifeVisible(false);
      audio.whoosh();
      const view = { target: new THREE.Vector3(0, -1, 0), yaw: -40, pitch: 28, radius: island.plan.R + 4 };
      const fly = prefersReduced() ? (setView(view), Promise.resolve()) : rig.flyTo(view, { duration: T * 1000, arc: 0.3 });
      await builder.disassemble(prefersReduced() ? 0.3 : T);
      await fly;
    },
    /** La cámara sube hacia la cima y se construye el monumento. */
    async monument() {
      const token = buildToken;
      activeStop = 0;
      const v = stopView(0);
      fadeOccluders(0);
      // Termina exactamente en el encuadre de la parada Monumento
      const fly = rig.flyTo(v, { duration: 1400, arc: 0.4 });
      await new Promise((r) => setTimeout(r, 650));
      if (token !== buildToken) return; // se omitió: el nombre ya está construido
      await builder.monument();
      await fly;
    },
    /** Proyección 3D → px de cada construcción (etiquetas de la vista de la isla). */
    labels() {
      const out = [];
      const v = new THREE.Vector3();
      island.stops.forEach((s, i) => {
        s.box.getCenter(v); v.y = s.box.max.y + 0.8 + root.position.y;
        v.project(camera);
        out.push({ i, x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h, visible: v.z < 1 });
      });
      return out;
    },
    /** Posición en pantalla de un bloque del muro (para su etiqueta). */
    guestScreen(i) {
      const v = SLOTS[i].clone(); v.y += 0.9 + root.position.y;
      v.project(camera);
      return { x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h };
    },
    pick(x, y) { return picker.pick(x, y, size.w, size.h); },
    orbitStart: () => rig.orbitStart(),
    orbitDrag: (dx) => { rig.orbitDrag(dx); needs = true; },
    orbitEnd: () => rig.orbitEnd(),
    dogJump() { fx.dog.jump(); needs = true; },
    setDays(text, opts) { setDigits(text, opts); },
    celebrateTower() { const c = island.info.clock.center; fx.sparkle(new THREE.Vector3(c.x, c.y + 2, c.z), 40, ["#FFD23F", "#FFFFFF", data.island.favoriteColor]); needs = true; },
    /* ----- Banderines del Sendero: estados estables y animación de entrada ----- */
    /** Estado inicial de la animación: todos bajo el suelo (sin tela ondeando). */
    flagsHide() { cancelTag("flags"); flagsRaising = true; writeFlags(() => 0); },
    /** Estado final estable: todos arriba; la tela vuelve a ondear. */
    flagsUp() { cancelTag("flags"); fades.delete(M.flags); applyFade(M.flags, 1); writeFlags(() => 1); flagsRaising = false; },
    /**
     * Salen del suelo en orden 1→4 (cada 0.25 s, rebote y "pop"); onFlag(i) al salir cada uno.
     * Con movimiento reducido: aparecen con un fundido, sin rebote.
     */
    raiseFlags({ onFlag = () => {} } = {}) {
      cancelTag("flags");
      const n = island.info.flagInfo.length, GAP = 0.25, DUR = 0.5;
      if (prefersReduced()) {
        writeFlags(() => 1);
        setFade(M.flags, 1, 0.001); // fundido de entrada
        for (let i = 0; i < n; i++) later(i * GAP * 1000, () => onFlag(i), "flags");
        return animate((t) => { if (t > 0.5) flagsRaising = false; return t > n * GAP + 0.4; }, "flags");
      }
      flagsRaising = true;
      const popped = new Set();
      return animate((t) => {
        writeFlags((fi) => {
          const q = clamp((t - fi * GAP) / DUR, 0, 1);
          if (q > 0 && !popped.has(fi)) { popped.add(fi); audio.blockPop(1 + fi * 0.2); onFlag(fi); }
          return q;
        });
        const done = t > (n - 1) * GAP + DUR;
        if (done) flagsRaising = false; // la tela empieza a ondear
        return done;
      }, "flags");
    },
    /** Tapa del cofre con rebote sobre su bisagra trasera; resplandor dorado, regalos y monedas. */
    openChest() {
      cancelTag("chest");
      const lid = island.extras.lidHinge;
      const pos = island.info.chestGlow.clone();
      audio.chest();
      chestAnim.t = 0;
      if (prefersReduced()) { lid.rotation.x = -1.9; fx.sparkle(pos, 10); needs = true; return Promise.resolve(); }
      lid.rotation.x = 0;
      later(240, () => { fx.sparkle(pos, 50, ["#FFD23F", "#FFE38A", "#FFF6E5"]); fx.gifts(pos); fx.coins(pos); }, "chest");
      return animate((t) => { lid.rotation.x = -1.95 * easeOutBack(clamp(t / 0.65, 0, 1), 2.4); return t > 0.65; }, "chest");
    },
    /** Estado estable del cofre: tapa cerrada, sin resplandor. */
    closeChest() { cancelTag("chest"); island.extras.lidHinge.rotation.x = 0; chestAnim.t = -1; chestLight.intensity = 0; needs = true; },
    /** Cancela las animaciones especiales pendientes de cualquier parada. */
    cancelSpecials() { ["flags", "chest", "tower"].forEach(cancelTag); },
    setGuests(list) { guests = list.slice(0, SLOTS.length); writeGuests(); needs = true; },
    get guestCount() { return guests.length; },
    /**
     * El bloque del invitado vuela en arco desde abajo y se coloca en el muro.
     * Con { fromSky: true } (repetir la construcción) cae desde el cielo directo a su lugar.
     */
    async placeGuest(g, { fromSky = false } = {}) {
      const idx = guests.findIndex((x) => x.me);
      if (idx >= 0) guests.splice(idx, 1);
      guests.push({ ...g, me: true });
      guests = guests.slice(-SLOTS.length);
      const i = guests.length - 1;
      writeGuests(i);
      const end = SLOTS[i].clone();
      const start = fromSky ? end.clone().add(new THREE.Vector3(0, 16, 0)) : camera.position.clone().add(new THREE.Vector3(0, -6, 0)).lerp(end, 0.25);
      if (!fromSky) start.y -= root.position.y;
      const tmp = voxelMesh([{ x: 0, y: 0, z: 0, color: g.color }], guestMat, { geometry: geo, jitterColor: false });
      root.add(tmp);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), plateMat);
      const si = Math.max(0, SYMBOL_KEYS.indexOf(g.symbol));
      const uv = plate.geometry.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setX(j, (si + uv.getX(j)) / SYMBOL_KEYS.length);
      plate.position.copy(WI.front).multiplyScalar(0.52);
      plate.rotation.y = WI.rotY;
      tmp.add(plate);
      const dur = prefersReduced() ? 0.01 : fromSky ? 0.8 : 1.1;
      await animate((t) => {
        const p = clamp(t / dur, 0, 1);
        const e = fromSky ? p * p : easeInOut(p); // desde el cielo: cae acelerando
        const pos = start.clone().lerp(end, e);
        if (!fromSky) pos.y += Math.sin(p * Math.PI) * 4;
        tmp.position.copy(pos);
        tmp.rotation.set(fromSky ? 0 : (1 - e) * 5, (1 - e) * (fromSky ? 3 : 7), 0);
        const k = fromSky ? GS : lerp(0.6, GS, e);
        tmp.scale.setScalar(k);
        return p >= 1;
      });
      // Aterriza con rebote, onda de polvo y "pop" fuerte
      audio.bigPop();
      fx.dust(end.clone().add(new THREE.Vector3(0, -0.6, 0)).addScaledVector(WI.front, 0.8), 30);
      await animate((t) => {
        const q = clamp(t / 0.35, 0, 1);
        const sy = 1 - 0.25 * Math.sin(q * Math.PI);
        tmp.scale.set(GS * (2 - sy), GS * sy, GS);
        tmp.rotation.set(0, 0, 0);
        tmp.position.copy(end);
        return q >= 1;
      });
      root.remove(tmp);
      writeGuests();
    },
    /** Noche: cielo con estrellas, ventanas y faroles encendidos, cascada brillante. */
    night(ms = 2000) { day.go("night", prefersReduced() ? 500 : ms); needs = true; },
    /** Fuegos artificiales de bloques sobre el monumento. */
    async fireworks(colors) {
      const c = island.info.monument.center;
      if (prefersReduced()) { fx.sparkle(c.clone().add(new THREE.Vector3(0, 4, 0)), 20, colors); audio.firework(); return; }
      const n = 5;
      for (let k = 0; k < n; k++) {
        const pos = c.clone().add(new THREE.Vector3((Math.random() - 0.5) * 16, 7 + Math.random() * 5, (Math.random() - 0.5) * 4));
        fx.firework(pos, [...colors, "#FFFFFF"]);
        audio.firework();
        needs = true;
        await new Promise((r) => setTimeout(r, 380 + Math.random() * 220));
      }
    },
    loadPhotos() { fx.loadPhotoTextures().then(() => { needs = true; }); },
    /** El marco de la foto i gira hacia la cámara del Mirador (~0.6 s) con un leve destello. */
    focusPhoto(i) { fx.focusFrame(i, rig.poseFor(stopView(4))); needs = true; },
    /** Pausa (visor abierto) o reanuda la rotación automática de los marcos. */
    pausePhotos(v) { fx.pauseFrames(v); needs = true; },
    dispose() { world.stop(); ro?.disconnect(); renderer.dispose(); renderer.domElement.remove(); }
  };
  return world;
}
