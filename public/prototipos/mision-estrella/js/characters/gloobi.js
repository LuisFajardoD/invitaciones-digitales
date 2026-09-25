// Gloobi, la mascota de la marca: un pequeño planeta celeste con anillo dorado, carita y brillo propio.
// Módulo independiente (reutilizable en el home y el panel RSVP): createGloobi({ THREE, size }) → controlador.
// Comportamientos: dormir (zzz), despertar, reír con squash & stretch, girar de felicidad, señalar,
// mirar hacia un punto, seguir a un objetivo con retraso orgánico y parpadear cada 3–6 s.
import * as THREE from "three";
import { vinyl, halo, canvasTex, addRim, STUDIO } from "../scene/materials.js";

const BODY = "#8ED8F8", LIGHT = "#B7E8FC", DARK = "#6FC3EA", RING = "#FFC96B", INK = "#1E1B4B", CHEEK = "#FF8FA3";

/* ---------- Texturas (alta resolución, una sola vez) ---------- */
function bodyTexture() {
  // manchas del planeta con transición suave (degradados amplios + desenfoque final)
  return canvasTex(1024, 512, (c, w, hh) => {
    c.fillStyle = BODY; c.fillRect(0, 0, w, hh);
    const blob = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r * 1.2); g.addColorStop(0, col); g.addColorStop(0.55, col); g.addColorStop(1, "rgba(142,216,248,0)"); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 1.6, r * 1.1, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; };
    const spots = [[60, 70, 38, LIGHT], [170, 190, 30, DARK], [300, 60, 44, DARK], [420, 170, 40, LIGHT], [480, 60, 26, LIGHT], [230, 110, 22, LIGHT], [360, 210, 30, DARK], [100, 200, 24, LIGHT]];
    for (const [x, y, r, col] of spots) for (const ox of [0, 512, -512]) blob((x + ox) * 2, y * 2, r * 2, col, 0.8);
    c.filter = "blur(6px)"; c.drawImage(c.canvas, 0, 0); c.filter = "none";
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(40,80,140,.12)");
    c.fillStyle = g; c.fillRect(0, 0, w, hh);
  });
}
/** Ojo abierto (malla aparte, así puede mirar un poco hacia la cámara): iris oscuro con doble brillo. */
function eyeTexture() {
  return canvasTex(128, 160, (c, w, h) => {
    const cx = w / 2, cy = h / 2, rx = w * 0.46, ry = h * 0.46;
    c.fillStyle = INK; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3B2A7A"; c.beginPath(); c.ellipse(cx, cy + ry * 0.42, rx * 0.72, ry * 0.36, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(cx - rx * 0.3, cy - ry * 0.36, rx * 0.36, ry * 0.3, -0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx + rx * 0.36, cy + ry * 0.22, rx * 0.15, 0, Math.PI * 2); c.fill();
  });
}
/** Caras intercambiables: "smile" | "wow" | "laugh" | "sleep" | "blink". eyes = false → sin ojos abiertos (van aparte). */
function faceTexture(kind, { eyes = true } = {}) {
  return canvasTex(1024, 768, (c, w, hh) => {
    c.scale(2, 2); w /= 2; hh /= 2;
    const ex = 150, cx = w / 2, ey = 170;
    c.lineCap = "round"; c.lineJoin = "round";
    // cachetes
    for (const s of [-1, 1]) { const g = c.createRadialGradient(cx + s * 175, 235, 0, cx + s * 175, 235, 58); g.addColorStop(0, "rgba(255,143,163,.85)"); g.addColorStop(1, "rgba(255,143,163,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(cx + s * 175, 235, 62, 42, 0, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = INK; c.fillStyle = INK;
    const closedEye = (x, happy) => { c.lineWidth = 17; c.beginPath(); if (happy) c.arc(x, ey + 18, 40, Math.PI * 1.15, Math.PI * 1.85); else c.arc(x, ey - 14, 40, Math.PI * 0.18, Math.PI * 0.82); c.stroke(); };
    const openEye = (x, big) => {
      const rx = big ? 50 : 44, ry = big ? 62 : 56;
      c.fillStyle = INK; c.beginPath(); c.ellipse(x, ey, rx, ry, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#3B2A7A"; c.beginPath(); c.ellipse(x, ey + ry * 0.42, rx * 0.7, ry * 0.36, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x - rx * 0.32, ey - ry * 0.36, rx * 0.34, ry * 0.3, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(x + rx * 0.35, ey + ry * 0.22, rx * 0.14, 0, Math.PI * 2); c.fill();
    };
    if (kind === "sleep" || kind === "blink" || kind === "laugh") { closedEye(cx - ex, kind === "laugh"); closedEye(cx + ex, kind === "laugh"); }
    else if (eyes) { openEye(cx - ex, kind === "wow"); openEye(cx + ex, kind === "wow"); }
    c.fillStyle = INK; c.strokeStyle = INK;
    if (kind === "wow") { c.beginPath(); c.ellipse(cx, 285, 26, 32, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = CHEEK; c.beginPath(); c.ellipse(cx, 300, 14, 10, 0, 0, Math.PI * 2); c.fill(); }
    else if (kind === "laugh") { c.beginPath(); c.moveTo(cx - 62, 262); c.quadraticCurveTo(cx, 272, cx + 62, 262); c.quadraticCurveTo(cx + 50, 345, cx, 348); c.quadraticCurveTo(cx - 50, 345, cx - 62, 262); c.fill(); c.fillStyle = CHEEK; c.beginPath(); c.ellipse(cx, 326, 28, 16, 0, 0, Math.PI * 2); c.fill(); }
    else if (kind === "sleep") { c.lineWidth = 12; c.beginPath(); c.ellipse(cx, 280, 14, 10, 0, 0, Math.PI * 2); c.stroke(); }
    else { c.lineWidth = 14; c.beginPath(); c.arc(cx, 245, 48, Math.PI * 0.18, Math.PI * 0.82); c.stroke(); }
  });
}
function zTexture() {
  return canvasTex(64, 64, (c) => { c.font = "600 50px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#FFF7EC"; c.fillText("z", 32, 34); });
}

/**
 * Crea a Gloobi. size = radio del planeta en unidades de escena.
 * Devuelve { root, body, update(dt, t, camera), setMode, laugh, spin, point, lookAt, follow, hit, setExpression }.
 */
export function createGloobi({ size = 0.18 } = {}) {
  const r = size;
  const root = new THREE.Group(); root.name = "gloobi";
  const wobble = new THREE.Group(); root.add(wobble); // squash & stretch
  // cuerpo tipo gomita: capa brillante (clearcoat), brillo suave de tela en los bordes (sheen, dispersión sutil de la
  // luz) y su brillo propio; sigue siendo caricatura (nada de realismo)
  const bodyMat = new THREE.MeshPhysicalMaterial({ map: bodyTexture(), roughness: 0.48, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.22, sheen: 0.6, sheenColor: new THREE.Color("#CFF3FF"), sheenRoughness: 0.5, emissive: new THREE.Color("#2b86b8"), emissiveIntensity: 0.3 });
  if (STUDIO.texture) { bodyMat.envMap = STUDIO.texture; bodyMat.envMapIntensity = 0.55; }
  addRim(bodyMat, 1.25);
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), bodyMat);
  body.name = "gloobi-body";
  wobble.add(body);
  // carita (segmento de esfera al frente, con transparencia); los ojos abiertos son mallas aparte
  const faces = { smile: faceTexture("smile", { eyes: false }), wow: faceTexture("wow", { eyes: false }), laugh: faceTexture("laugh"), sleep: faceTexture("sleep"), blink: faceTexture("blink") };
  const faceMat = new THREE.MeshBasicMaterial({ map: faces.sleep, transparent: true, depthWrite: false, toneMapped: false });
  const face = new THREE.Mesh(new THREE.SphereGeometry(r * 1.004, 40, 30, Math.PI / 2 - 0.98, 1.96, Math.PI / 2 - 0.78, 1.5), faceMat);
  face.renderOrder = 2;
  wobble.add(face);
  // ojos: sobre la superficie en el lugar que marca la textura; se asoman un poquito hacia la cámara
  const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const eyeGeo = new THREE.PlaneGeometry(r * 0.34, r * 0.44);
  const EYE = [new THREE.Vector3(-0.539, 0.115, 0.834), new THREE.Vector3(0.539, 0.115, 0.834)];
  const eyes = EYE.map((n) => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.renderOrder = 3; e.userData.n = n.clone().normalize(); wobble.add(e); return e; });
  // anillo dorado: banda plana con grosor y cantos redondeados (torno), metálica con reflejos; gira sobre su propio
  // eje (nunca se pone de canto como un "palito")
  const prof = [];
  const rin = r * 1.28, rout = r * 1.62, th = r * 0.075, rc = th * 0.5;
  for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + (k / 6) * Math.PI; prof.push(new THREE.Vector2(rout - rc + Math.cos(a) * rc, Math.sin(a) * rc)); }
  for (let k = 0; k <= 6; k++) { const a = Math.PI / 2 + (k / 6) * Math.PI; prof.push(new THREE.Vector2(rin + rc + Math.cos(a) * rc, Math.sin(a) * rc)); }
  prof.push(prof[0].clone());
  const ringMat = new THREE.MeshStandardMaterial({ color: RING, roughness: 0.26, metalness: 0.85, emissive: new THREE.Color("#8a5a14"), emissiveIntensity: 0.28 });
  if (STUDIO.texture) { ringMat.envMap = STUDIO.texture; ringMat.envMapIntensity = 1.3; }
  addRim(ringMat, 0.5);
  const ringPivot = new THREE.Group(); ringPivot.rotation.set(1.18 - Math.PI / 2, 0, 0.32); wobble.add(ringPivot);
  const ring = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), ringMat);
  ringPivot.add(ring);
  // bracitos (para señalar y celebrar)
  const armGeo = new THREE.SphereGeometry(r * 0.2, 16, 12);
  const armMat = vinyl(DARK, { emissive: new THREE.Color("#2b86b8"), emissiveIntensity: 0.25 });
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * r * 0.92, -r * 0.1, 0);
    const a = new THREE.Mesh(armGeo, armMat); a.scale.set(0.8, 1.35, 0.8); a.position.set(s * r * 0.12, -r * 0.14, 0);
    pivot.add(a); wobble.add(pivot);
    return pivot;
  });
  // brillo propio
  const glow = halo("#8ED8F8", r * 6, 0.55); root.add(glow);
  const glow2 = halo("#FFC96B", r * 3.2, 0.18); root.add(glow2);
  // zzz
  const zMat = new THREE.SpriteMaterial({ map: zTexture(), transparent: true, depthWrite: false });
  const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(zMat.clone()); s.scale.setScalar(r * 0.9); s.visible = false; root.add(s); return s; });

  const st = {
    mode: "sleep", expr: "sleep", laughT: -1, spinT: -1, pointDir: 0, blinkAt: 3 + Math.random() * 3, blinkT: -1,
    look: null, lookV: new THREE.Vector3(), lookQ: new THREE.Quaternion(), vel: new THREE.Vector3(), prev: new THREE.Vector3(), target: null, hasPrev: false,
    wowT: -1, faceLocked: null,
    hist: [], lookDir: new THREE.Vector3(0, 0, 1), lookVel: new THREE.Vector3(), lookInit: false
  };
  // imitación de la mirada: retraso (s) y resorte (rigidez, amortiguación → ζ ≈ 0.45: un rebote leve)
  const LOOK_DELAY = 0.22, LOOK_K = 110, LOOK_C = 9.5;
  const tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const eyeLook = new THREE.Vector3(0, 0, 1), eyeN = new THREE.Vector3(), eyeTo = new THREE.Vector3();
  const setFace = (k) => { if (faceMat.map !== faces[k]) { faceMat.map = faces[k]; faceMat.needsUpdate = true; } st.expr = k; };

  const api = {
    root, body, hitMeshes: [body, face],
    /** "sleep" | "awake" */
    setMode(m) { st.mode = m; if (m === "sleep") setFace("sleep"); else if (st.expr === "sleep") setFace("smile"); },
    setExpression(k) { st.faceLocked = k; if (k) setFace(k); else setFace(st.mode === "sleep" ? "sleep" : "smile"); },
    laugh() { st.laughT = 0; },
    spin() { st.spinT = 0; },
    wow(ms = 1200) { st.wowT = ms / 1000; },
    /** Gesto tierno al voltear hacia la cámara: un parpadeo (ahora mismo, sin esperar al parpadeo automático). */
    blink() { if (st.mode !== "sleep" && st.laughT < 0 && !st.faceLocked && st.wowT <= 0) st.blinkAt = 0; },
    /** -1 = abajo, 0 = nada. */
    point(dir) { st.pointDir = dir; },
    /** Punto del mundo al que mira (null = a la cámara). */
    lookAt(v) { st.look = v ? st.lookV.copy(v) : null; },
    /** Objetivo a seguir (Vector3 que se lee cada frame) o null para quedarse donde está. */
    follow(v) { st.target = v; },
    teleport(v) { root.position.copy(v); st.prev.copy(v); st.vel.set(0, 0, 0); },
    update(dt, t, camera) {
      // seguimiento con retraso orgánico
      if (st.target) {
        const k = 1 - Math.exp(-3.2 * dt);
        root.position.lerp(st.target, k);
      }
      if (!st.hasPrev) { st.prev.copy(root.position); st.hasPrev = true; }
      tmpV.subVectors(root.position, st.prev).divideScalar(Math.max(dt, 1e-3));
      st.vel.lerp(tmpV, 1 - Math.exp(-8 * dt));
      st.prev.copy(root.position);
      const sleeping = st.mode === "sleep";
      // flotar
      wobble.position.y = Math.sin(t * (sleeping ? 1.2 : 2.1)) * r * (sleeping ? 0.08 : 0.16);
      // squash & stretch por velocidad + respiración + risa
      const speed = Math.min(1, st.vel.length() / (r * 25));
      let sy = 1 + speed * 0.18 + Math.sin(t * (sleeping ? 1.6 : 2.4)) * (sleeping ? 0.035 : 0.02), sx = 1 / Math.sqrt(sy);
      if (st.laughT >= 0) {
        st.laughT += dt;
        const k = st.laughT, e = Math.exp(-k * 3.2);
        sy += Math.sin(k * 22) * 0.2 * e; sx = 1 / Math.sqrt(sy);
        wobble.position.y += Math.abs(Math.sin(k * 11)) * r * 0.5 * e;
        if (!st.faceLocked) setFace("laugh");
        if (k > 1.3) { st.laughT = -1; if (!st.faceLocked) setFace(sleeping ? "sleep" : "smile"); }
      }
      wobble.scale.set(sx, sy, sx);
      // giro de felicidad
      let spinY = 0;
      if (st.spinT >= 0) { st.spinT += dt; const k = Math.min(1, st.spinT / 1.4); spinY = (1 - Math.pow(1 - k, 3)) * Math.PI * 4; wobble.position.y += Math.sin(k * Math.PI) * r * 1.4; if (k >= 1) st.spinT = -1; }
      // mirar (a la cámara o a un punto) imitando al astronauta: la dirección deseada llega con un retraso de ~0.22 s
      // y la sigue un resorte poco amortiguado (un leve rebote al terminar de voltear)
      const lookPt = st.look || camera?.position;
      if (lookPt) {
        st.hist.push({ t, d: tmpV.subVectors(lookPt, root.position).normalize().clone() });
        while (st.hist.length > 2 && st.hist[1].t <= t - LOOK_DELAY) st.hist.shift();
        const want = st.hist[0].d;
        if (!st.lookInit) { st.lookDir.copy(want); st.lookInit = true; }
        const h = Math.min(dt, 1 / 30); // resorte estable aun con cuadros lentos
        st.lookVel.addScaledVector(tmpV.subVectors(want, st.lookDir), LOOK_K * h).multiplyScalar(Math.max(0, 1 - LOOK_C * h));
        st.lookDir.addScaledVector(st.lookVel, h).normalize();
        tmpM.lookAt(tmpV.copy(root.position).add(st.lookDir), root.position, up); // +Z hacia el objetivo
        st.lookQ.setFromRotationMatrix(tmpM);
      }
      root.quaternion.copy(st.lookQ);
      wobble.rotation.set(sleeping ? 0.25 : Math.sin(t * 1.3) * 0.06, spinY, sleeping ? 0.18 : Math.sin(t * 0.9) * 0.08);
      ring.rotation.y = t * 0.35; // gira sobre su eje: los reflejos se mueven, la silueta no cambia
      ringPivot.rotation.z = 0.32 + Math.sin(t * 0.7) * 0.06;
      // ojos: abiertos sólo con caras de ojos abiertos; se desplazan un poco hacia la cámara
      const open = st.expr === "smile" || st.expr === "wow";
      if (camera) { wobble.updateMatrixWorld(); eyeLook.copy(camera.position); wobble.worldToLocal(eyeLook).normalize(); }
      eyes.forEach((e) => {
        e.visible = open;
        if (!open) return;
        eyeN.copy(e.userData.n).addScaledVector(eyeLook, 0.07).normalize();
        e.position.copy(eyeN).multiplyScalar(r * 1.012);
        e.lookAt(wobble.localToWorld(eyeTo.copy(eyeN).multiplyScalar(r * 3))); // lookAt usa coordenadas de mundo
        e.scale.setScalar(st.expr === "wow" ? 1.12 : 1);
      });
      // parpadeo cada 3–6 s
      if (!sleeping && st.laughT < 0 && !st.faceLocked) {
        if (st.wowT > 0) { st.wowT -= dt; setFace(st.wowT > 0 ? "wow" : "smile"); }
        else {
          st.blinkAt -= dt;
          if (st.blinkAt <= 0 && st.blinkT < 0) { st.blinkT = 0.13; setFace("blink"); }
          if (st.blinkT >= 0) { st.blinkT -= dt; if (st.blinkT < 0) { setFace("smile"); st.blinkAt = 3 + Math.random() * 3; } }
        }
      }
      // brazos: señalar abajo, celebrar al girar, balanceo suave
      arms.forEach((p, i) => {
        const s = i === 0 ? -1 : 1;
        let z = s * (0.25 + Math.sin(t * 2 + i) * 0.08), x = 0;
        if (st.pointDir < 0 && i === 1) { z = 0.15; x = -0.2 + Math.sin(t * 6) * 0.25; }
        if (st.spinT >= 0 || st.laughT >= 0) z = s * (2.2 + Math.sin(t * 14) * 0.2);
        if (sleeping) z = s * 0.1;
        p.rotation.z = THREE.MathUtils.damp(p.rotation.z, z, 10, dt);
        p.rotation.x = THREE.MathUtils.damp(p.rotation.x, x, 10, dt);
      });
      // halo que respira
      glow.material.opacity = 0.45 + Math.sin(t * 1.7) * 0.08 + (st.laughT >= 0 || st.spinT >= 0 ? 0.25 : 0);
      // zzz
      zs.forEach((z, i) => {
        z.visible = sleeping;
        if (!sleeping) return;
        const k = ((t * 0.45 + i / 3) % 1);
        z.position.set(r * (0.9 + k * 0.9 + Math.sin(k * 6 + i) * 0.15), r * (0.7 + k * 2.2), 0);
        z.material.opacity = Math.sin(k * Math.PI) * 0.9;
        z.scale.setScalar(r * (0.5 + k * 0.7));
      });
    },
    /** true si el rayo toca a Gloobi. */
    hit(raycaster) { return raycaster.intersectObjects([body, face], false).length > 0; }
  };
  root.userData.gloobi = api;
  return api;
}
