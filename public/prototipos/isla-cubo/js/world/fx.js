// Vida y efectos de la isla: partículas de cubos (polvo, destellos, fuegos, regalos, corazones),
// nubes, pájaros de bloques, gotas de la cascada, el perrito, los marcos de fotos y el portal.
// Todo con pocos InstancedMesh para mantener bajos los draw calls.
import { voxelMesh } from "./voxels.js";
import { prefersReduced } from "../util.js";

export function createFx({ THREE, scene, root, geo, island, data }) {
  const info = island.info;
  let low = false;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
  const _c = new THREE.Color();

  /* ---------- Sistema de partículas (cubos sin iluminar) ---------- */
  const CAP = 520;
  const pMesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), CAP);
  pMesh.frustumCulled = false;
  const P = Array.from({ length: CAP }, () => ({ life: 0, age: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 1, size: 0.2, spin: 0 }));
  _m.makeScale(0, 0, 0);
  for (let i = 0; i < CAP; i++) { pMesh.setMatrixAt(i, _m); pMesh.setColorAt(i, _c.set("#ffffff")); }
  root.add(pMesh);
  let pCursor = 0, pAlive = 0;
  function emit(o) {
    const i = pCursor; pCursor = (pCursor + 1) % CAP;
    Object.assign(P[i], { age: 0, drag: 1, spin: Math.random() * 6, ...o });
    pMesh.setColorAt(i, _c.set(o.color || "#ffffff"));
    pMesh.instanceColor.needsUpdate = true;
    pAlive = Math.max(pAlive, 1);
  }
  const rand = (a, b) => a + Math.random() * (b - a);
  const scaleN = (n) => Math.max(1, Math.round(n * (low ? 0.45 : 1) * (prefersReduced() ? 0.35 : 1)));

  const api = {};
  /** Explosión genérica de cubos. */
  api.burst = ({ pos, colors = ["#FFD23F", "#FFFFFF"], count = 30, speed = 5, up = 0, gravity = 9, life = 1.1, size = 0.22, spread = 1, drag = 0.98 }) => {
    for (let k = 0; k < scaleN(count); k++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(rand(-1, 1));
      const v = speed * rand(0.4, 1);
      emit({
        x: pos.x, y: pos.y, z: pos.z,
        vx: Math.sin(ph) * Math.cos(th) * v * spread, vy: Math.cos(ph) * v + up, vz: Math.sin(ph) * Math.sin(th) * v * spread,
        g: gravity, drag, life: life * rand(0.7, 1.2), size: size * rand(0.7, 1.3), color: colors[(Math.random() * colors.length) | 0]
      });
    }
  };
  /** Onda de polvo de bloques a ras de suelo. */
  api.dust = (pos, count = 26, colors = ["#F4DDA4", "#FFF6E5", "#C9B8A6", "#FFFFFF"]) => {
    for (let k = 0; k < scaleN(count); k++) {
      const th = Math.random() * Math.PI * 2, v = rand(1.5, 4);
      emit({ x: pos.x, y: pos.y, z: pos.z, vx: Math.cos(th) * v, vy: rand(0.5, 2), vz: Math.sin(th) * v, g: 3, drag: 0.9, life: rand(0.5, 0.9), size: rand(0.15, 0.32), color: colors[(Math.random() * colors.length) | 0] });
    }
  };
  api.sparkle = (pos, count = 24, colors = ["#FFD23F", "#FFF6E5", "#FFFFFF"]) => api.burst({ pos, colors, count, speed: 4, gravity: -0.5, life: 1.2, size: 0.18, drag: 0.94 });
  api.firework = (pos, colors) => {
    const n = prefersReduced() ? 14 : 70;
    api.burst({ pos, colors, count: n, speed: 9, gravity: 3.5, life: 1.6, size: 0.26, drag: 0.955 });
    api.burst({ pos, colors: ["#FFFFFF"], count: 10, speed: 3, gravity: 2, life: 0.6, size: 0.16 });
  };
  /** Regalitos que suben y se desvanecen (encogen). */
  api.gifts = (pos) => {
    const cols = ["#FF6B6B", "#4CC9F0", "#B388FF", "#9BE564", "#FFD23F", "#FF9FCB"];
    for (let k = 0; k < scaleN(10); k++) emit({ x: pos.x + rand(-1, 1), y: pos.y, z: pos.z + rand(-0.5, 0.8), vx: rand(-0.6, 0.6), vy: rand(2.2, 3.4), vz: rand(-0.3, 0.6), g: 0, drag: 0.99, life: rand(1.6, 2.4), size: rand(0.35, 0.5), color: cols[k % cols.length] });
  };
  /** Monedas de bloque (planas y doradas) que suben girando y se desvanecen. */
  api.coins = (pos) => {
    for (let k = 0; k < scaleN(12); k++) emit({ x: pos.x + rand(-0.9, 0.9), y: pos.y, z: pos.z + rand(-0.9, 0.9), vx: rand(-0.8, 0.8), vy: rand(2.6, 4), vz: rand(-0.8, 0.8), g: 0.6, drag: 0.985, life: rand(1.4, 2.1), size: rand(0.28, 0.36), color: k % 3 ? "#F2C94C" : "#FFE38A" });
  };
  api.hearts = (pos) => {
    for (let k = 0; k < scaleN(8); k++) emit({ x: pos.x + rand(-0.4, 0.4), y: pos.y, z: pos.z + rand(-0.4, 0.4), vx: rand(-0.6, 0.6), vy: rand(1.8, 2.8), vz: rand(-0.6, 0.6), g: 0.2, drag: 0.98, life: rand(1, 1.5), size: rand(0.2, 0.3), color: k % 2 ? "#FF6B9A" : "#FF9FCB" });
  };

  function updateParticles(dt) {
    if (!pAlive) return false;
    let alive = 0;
    for (let i = 0; i < CAP; i++) {
      const p = P[i];
      if (p.age >= p.life) continue;
      p.age += dt;
      if (p.age >= p.life) { _m.makeScale(0, 0, 0); pMesh.setMatrixAt(i, _m); continue; }
      alive++;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d; p.vy = p.vy * d - p.g * dt; p.vz *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.spin += dt * 4;
      const k = p.size * Math.sqrt(1 - p.age / p.life);
      _q.setFromEuler(_e.set(p.spin, p.spin * 0.7, 0));
      _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(k, k, k));
      pMesh.setMatrixAt(i, _m);
    }
    pMesh.instanceMatrix.needsUpdate = true;
    pAlive = alive;
    return true;
  }

  /* ---------- Nubes (grupo que gira lento alrededor de la isla) ---------- */
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cloudVox = [];
  // Nubes altas por encima del letrero y nubes bajas por debajo de la isla: ninguna a la altura del
  // monumento, así al girar nunca pasan detrás (ni delante) de él.
  const CLOUDS = [[45, -14, 0], [50, 18, 1.2], [44, -19, 2.1], [54, 21, 3.0], [46, -13, 3.9], [52, -22, 4.8], [44, 24, 5.6]];
  CLOUDS.forEach(([r, y, a], ci) => {
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
    const n = 7 + (ci % 3) * 3;
    for (let k = 0; k < n; k++) {
      const s = 1.6 + Math.random() * 1.4;
      cloudVox.push({ x: cx + (Math.random() - 0.5) * 7, y: y + (Math.random() - 0.3) * 1.6, z: cz + (Math.random() - 0.5) * 4, color: "#FFFFFF", s, ci });
    }
  });
  const clouds = voxelMesh(cloudVox, cloudMat, { geometry: geo, jitterColor: false });
  const cloudGroup = new THREE.Group();
  cloudGroup.add(clouds);
  scene.add(cloudGroup);
  /** Caja de cada nube en su posición actual (el grupo gira): para el chequeo de superposiciones. */
  api.cloudBoxes = () => {
    const boxes = CLOUDS.map(() => new THREE.Box3());
    const q = new THREE.Vector3(), c = Math.cos(cloudGroup.rotation.y), s = Math.sin(cloudGroup.rotation.y);
    cloudVox.forEach((v) => {
      const r = v.s / 2;
      q.set(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
      boxes[v.ci].expandByPoint(q.clone().subScalar(r)).expandByPoint(q.clone().addScalar(r));
    });
    return boxes;
  };

  /* ---------- Pájaros de bloques ---------- */
  const BIRDS = 4;
  const birdMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), BIRDS * 3);
  birdMesh.frustumCulled = false;
  for (let i = 0; i < BIRDS * 3; i++) birdMesh.setColorAt(i, _c.set(i % 3 === 0 ? "#FFF6E5" : "#E8DCC8"));
  scene.add(birdMesh);
  const birds = Array.from({ length: BIRDS }, (_, i) => ({ r: 44 + i * 3, y: 15 + (i % 2) * 4, a: i * 1.7, speed: 0.09 + i * 0.015 }));
  function updateBirds(t) {
    birds.forEach((b, i) => {
      const a = b.a + t * b.speed;
      const x = Math.cos(a) * b.r, z = Math.sin(a) * b.r, y = b.y + Math.sin(t * 0.8 + i) * 0.8;
      const heading = -a;
      const flap = Math.sin(t * 9 + i) * 0.7;
      _q.setFromEuler(_e.set(0, heading, 0));
      _m.compose(_p.set(x, y, z), _q, _s.set(0.5, 0.35, 0.9));
      birdMesh.setMatrixAt(i * 3, _m);
      for (const side of [-1, 1]) {
        _q.setFromEuler(_e.set(0, heading, side * flap));
        const off = new THREE.Vector3(side * 0.55, 0.05, 0).applyEuler(new THREE.Euler(0, heading, 0));
        _m.compose(_p.set(x + off.x, y + off.y, z + off.z), _q, _s.set(0.7, 0.08, 0.45));
        birdMesh.setMatrixAt(i * 3 + (side < 0 ? 1 : 2), _m);
      }
    });
    birdMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- Gotas de la cascada ---------- */
  // Chorro ancho: más gotas, repartidas a lo ancho y empujadas hacia afuera de la isla
  const DROPS = 90;
  const dropMesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: "#C8F5FF", transparent: true, opacity: 0.88 }), DROPS);
  dropMesh.frustumCulled = false;
  const WT = info.waterfallTop;
  const out = new THREE.Vector3(WT.x, 0, WT.z).normalize();
  const drops = Array.from({ length: DROPS }, () => ({ y: WT.y - Math.random() * 16, w: (Math.random() - 0.5) * 3.2, o: Math.random() * 0.8, v: 6 + Math.random() * 4, s: 0.14 + Math.random() * 0.16 }));
  root.add(dropMesh);
  function updateDrops(dt) {
    drops.forEach((d, i) => {
      d.y -= d.v * dt;
      if (d.y < WT.y - 17) { d.y = WT.y - Math.random() * 1; }
      const fade = d.y < info.waterfallBottomY ? Math.max(0, 1 - (info.waterfallBottomY - d.y) / 7) : 1;
      const s = low && i % 2 ? 0 : d.s * fade;
      const push = d.o + (WT.y - d.y) * 0.05;
      _m.makeScale(s, s * 1.8, s).setPosition(WT.x + out.x * push - out.z * d.w * 0.5, d.y, WT.z + out.z * push + out.x * d.w * 0.5);
      dropMesh.setMatrixAt(i, _m);
    });
    dropMesh.instanceMatrix.needsUpdate = true;
  }

  /* ---------- Perrito de bloques (easter egg) ---------- */
  const DS = 0.28;
  const dogVox = [];
  const put = (x, y, z, c) => dogVox.push({ x, y, z, color: c });
  for (let x = -2; x <= 2; x++) for (let y = 0; y <= 1; y++) for (let z = 0; z <= 1; z++) put(x, y + 2, z, "#D9A066"); // cuerpo
  for (const [x, z] of [[-2, 0], [-2, 1], [2, 0], [2, 1]]) for (let y = 0; y <= 1; y++) put(x, y, z, "#C98A52"); // patas
  for (let x = 3; x <= 5; x++) for (let y = 3; y <= 5; y++) for (let z = 0; z <= 1; z++) put(x, y, z, x === 5 && y === 3 ? "#FFF6E5" : "#D9A066"); // cabeza
  put(6, 3, 0.5, "#3B2A1A"); // nariz
  put(5, 4.6, -0.3, "#3B2A1A"); put(5, 4.6, 1.3, "#3B2A1A"); // ojos
  put(3, 6, 0, "#8A5A2B"); put(3, 6, 1, "#8A5A2B"); // orejas
  put(-3, 4, 0.5, "#D9A066"); put(-4, 5, 0.5, "#FFF6E5"); // cola
  const dogMesh = voxelMesh(dogVox.map((v) => ({ ...v, x: v.x, y: v.y, z: v.z - 0.5 })), new THREE.MeshLambertMaterial({ color: 0xffffff }), { geometry: geo, scale: DS, jitterColor: false });
  const dog = new THREE.Group();
  dog.add(dogMesh);
  root.add(dog);
  // Paseo seguro: camina entre puntos de la rejilla segura frente a la casa (info.house.dogPoints: pasto
  // a ≥3 bloques del borde, sin agua, sin Sendero ni construcciones). Antes de cada paso comprueba que
  // haya suelo seguro debajo; si no, se detiene y da la vuelta. A veces olfatea o se sienta.
  const DP = info.house.dogPoints, dogSafe = info.house.dogSafe;
  const near0 = DP.reduce((best, p) => (!best || Math.hypot(p[0] - info.house.dogStart[0], p[1] - info.house.dogStart[1]) < Math.hypot(best[0] - info.house.dogStart[0], best[1] - info.house.dogStart[1]) ? p : best), null) || info.house.dogStart;
  const D = { x: near0[0], z: near0[1], h: 0, target: null, mode: "walk", timer: 0, walkT: 0, pose: 0, poseT: 0 };
  let dogJump = -1;
  const dogBox = new THREE.Box3();
  const clearLine = (ax, az, bx, bz) => {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.3);
    for (let k = 1; k <= n; k++) if (!dogSafe(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n)) return false;
    return true;
  };
  /** Siguiente punto: a 2–6 bloques, en línea recta sobre suelo seguro; "back" prefiere los de atrás. */
  function pickTarget(back = false) {
    const fx0 = Math.cos(D.h), fz0 = Math.sin(D.h);
    let best = null, bestScore = -Infinity;
    for (let tries = 0; tries < 24; tries++) {
      const p = DP[(Math.random() * DP.length) | 0];
      const d = Math.hypot(p[0] - D.x, p[1] - D.z);
      if (d < 1.5 || d > 6.5 || !clearLine(D.x, D.z, p[0], p[1])) continue;
      const ahead = ((p[0] - D.x) * fx0 + (p[1] - D.z) * fz0) / d;
      const score = (back ? -ahead : ahead * 0.3) + Math.random();
      if (score > bestScore) { bestScore = score; best = p; }
    }
    D.target = best || near0;
  }
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  function updateDog(dt) {
    if (!DP.length) { dog.visible = false; return; }
    let moving = false;
    if (D.mode === "sniff" || D.mode === "sit") {
      D.timer -= dt;
      if (D.timer <= 0) { D.mode = "walk"; pickTarget(); }
    } else {
      if (!D.target) pickTarget();
      const tx = D.target[0] - D.x, tz = D.target[1] - D.z, dist = Math.hypot(tx, tz);
      if (dist < 0.25) {
        const r = Math.random();
        if (r < 0.35) { D.mode = "sniff"; D.timer = 1.4 + Math.random() * 1.2; }
        else if (r < 0.55) { D.mode = "sit"; D.timer = 2.5 + Math.random() * 1.8; }
        else pickTarget();
      } else {
        // Giro suave hacia el objetivo (máx. 2.6 rad/s); avanza más lento mientras gira
        const dh = angDiff(D.h, Math.atan2(tz, tx));
        D.h += Math.sign(dh) * Math.min(Math.abs(dh), 2.6 * dt);
        const speed = 1.15 * Math.max(0, Math.cos(dh)) ** 2;
        const nx = D.x + Math.cos(D.h) * speed * dt, nz = D.z + Math.sin(D.h) * speed * dt;
        // Comprueba suelo seguro un poco más adelante del siguiente paso; si no hay, da la vuelta
        const look = Math.min(0.45, dist);
        if (speed > 0.01 && !dogSafe(nx + Math.cos(D.h) * look, nz + Math.sin(D.h) * look)) {
          if (!D.back || Math.abs(dh) < 0.2) { D.back = true; pickTarget(true); }
        } else if (speed > 0.01) { D.x = nx; D.z = nz; D.back = false; moving = true; }
      }
    }
    if (moving) D.walkT += dt;
    // Postura: olfatear (hocico abajo) o sentarse (lomo inclinado); transición suave
    const poseTarget = D.mode === "sniff" ? -0.2 : D.mode === "sit" ? 0.36 : 0;
    D.pose += (poseTarget - D.pose) * (1 - Math.pow(0.001, dt));
    D.poseT += dt;
    dogMesh.rotation.z = D.pose + (D.mode === "sniff" ? Math.sin(D.poseT * 10) * 0.05 : 0);
    dogMesh.position.y = Math.max(0, D.pose) * 0.5;
    const gy = 0.5 + (moving ? Math.abs(Math.sin(D.walkT * 12)) * 0.08 : 0);
    let y = gy, spin = 0;
    if (dogJump >= 0) {
      dogJump += dt / 0.8;
      const p = Math.min(1, dogJump);
      y = gy + Math.sin(p * Math.PI) * 2.2;
      spin = p * Math.PI * 2;
      if (p >= 1) dogJump = -1;
    }
    dog.position.set(D.x, y, D.z);
    dog.rotation.y = -D.h + spin;
    dogBox.setFromCenterAndSize(new THREE.Vector3(D.x, y + 1, D.z), new THREE.Vector3(2.4, 2.4, 2.4));
  }
  api.dog = {
    box: dogBox,
    get position() { return dog.position; },
    jump() { if (dogJump < 0) { dogJump = 0; setTimeout(() => api.hearts(dog.position.clone().add(new THREE.Vector3(0, 2, 0))), 250); } }
  };

  /* ---------- Marcos de fotos alrededor del árbol ---------- */
  const T = info.tree;
  const frames = new THREE.Group();
  frames.position.set(T.x, 0, T.z);
  root.add(frames);
  const photos = data.gallery.slice(0, 6);
  // Marcos de madera dorada en órbita pequeña bajo la copa (≤5 bloques del tronco, dentro de su zona)
  const frameBoxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: "#D9A441", emissive: new THREE.Color("#5A3A10"), emissiveIntensity: 0.15 }), Math.max(1, photos.length));
  frames.add(frameBoxes);
  const planes = [];
  const FR = info.frameRadius;
  photos.forEach((ph, i) => {
    const a = (i / photos.length) * Math.PI * 2;
    const y = [3.6, 4.8, 4.0, 5.1, 3.8, 4.5][i % 6];
    const x = Math.cos(a) * FR, z = Math.sin(a) * FR;
    const face = Math.atan2(x, z);
    _q.setFromEuler(_e.set(0, face, 0));
    _m.compose(_p.set(x, y, z), _q, _s.set(2.5, 3.2, 0.25));
    frameBoxes.setMatrixAt(i, _m);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.8), new THREE.MeshBasicMaterial({ color: "#FFF6E5", side: THREE.DoubleSide }));
    const off = new THREE.Vector3(0, 0, 0.14).applyEuler(new THREE.Euler(0, face, 0));
    plane.position.set(x + off.x, y, z + off.z);
    plane.rotation.y = face;
    frames.add(plane);
    planes.push({ plane, src: ph.src });
  });
  frameBoxes.castShadow = true;
  for (let i = 0; i < photos.length; i++) frameBoxes.setColorAt(i, _c.setRGB(1, 1, 1));

  /* ----- Marcos sincronizados con el carrusel: giro hacia la cámara, destello, pausa ----- */
  const fc = { tween: null, hold: 0, paused: false, flash: -1, flashT: 0 };
  const wrapPI = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  /** Gira los marcos (~0.6 s) para que el de la foto i quede de frente a `camPos` (coords. de la isla). */
  api.focusFrame = (i, camPos) => {
    const n = photos.length;
    if (!n || i < 0 || i >= n) return;
    const a = (i / n) * Math.PI * 2;
    const phi = Math.atan2(Math.cos(a), Math.sin(a)); // ángulo del marco en el grupo (como un yaw)
    const yawCam = Math.atan2(camPos.x - frames.position.x, camPos.z - frames.position.z);
    const from = frames.rotation.y;
    const to = from + wrapPI(yawCam - phi - from);
    const rm = prefersReduced();
    fc.tween = { from, to, t: 0, dur: rm ? 0.001 : 0.6 };
    fc.hold = 8; // se queda de frente un rato antes de seguir girando solo
    fc.flash = i; fc.flashT = 0.9;
    // Destello: chispas en la posición final del marco
    const y = [3.6, 4.8, 4.0, 5.1, 3.8, 4.5][i % 6];
    const lx = Math.cos(a) * FR, lz = Math.sin(a) * FR, c = Math.cos(to), s = Math.sin(to);
    setTimeout(() => api.sparkle(new THREE.Vector3(frames.position.x + lx * c + lz * s, y + 1.7, frames.position.z - lx * s + lz * c), rm ? 6 : 14, ["#FFE38A", "#FFF6E5", "#FFD23F"]), rm ? 0 : 450);
  };
  /** Mientras el visor está abierto, los marcos no giran solos. */
  api.pauseFrames = (v) => { fc.paused = !!v; };
  /** Raycasting contra los marcos y las fotos: devuelve el índice de la foto o null. */
  api.pickFrame = (ray) => {
    if (!frames.visible) return null;
    const hits = ray.intersectObjects([frameBoxes, ...planes.map((p) => p.plane)], false);
    if (!hits.length) return null;
    const hit = hits[0];
    if (hit.object === frameBoxes) return hit.instanceId ?? null;
    const k = planes.findIndex((p) => p.plane === hit.object);
    return k >= 0 ? k : null;
  };
  function updateFrames(dt, rm) {
    if (fc.tween) {
      const tw = fc.tween;
      tw.t += dt;
      const p = Math.min(1, tw.t / tw.dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      frames.rotation.y = tw.from + (tw.to - tw.from) * e;
      if (p >= 1) fc.tween = null;
    } else if (fc.paused) {
      /* quieto mientras el visor está abierto */
    } else if (fc.hold > 0) fc.hold -= dt;
    else if (!rm) frames.rotation.y += dt * 0.08;
    if (fc.flash >= 0) {
      fc.flashT = Math.max(0, fc.flashT - dt);
      const k = fc.flashT / 0.9;
      frameBoxes.setColorAt(fc.flash, _c.setRGB(1 + 0.9 * k, 1 + 0.7 * k, 1 + 0.35 * k));
      frameBoxes.instanceColor.needsUpdate = true;
      if (!fc.flashT) fc.flash = -1;
    }
  }
  let texturesLoaded = false;
  /** Carga diferida de las fotos como texturas pequeñas (máx. 512 px). */
  api.loadPhotoTextures = async () => {
    if (texturesLoaded) return;
    texturesLoaded = true;
    await Promise.all(planes.map(({ plane, src }) => new Promise((res) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = 384; cv.height = 512;
        const cx = cv.getContext("2d");
        const s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
        const w = img.naturalWidth * s, hh = img.naturalHeight * s;
        cx.drawImage(img, (cv.width - w) / 2, (cv.height - hh) / 2, w, hh);
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        plane.material.map = tex;
        plane.material.color.set("#ffffff");
        plane.material.needsUpdate = true;
        res();
      };
      img.onerror = res;
      img.src = src;
    })));
  };

  /* ---------- Portal ---------- */
  const pc = document.createElement("canvas");
  pc.width = pc.height = 128;
  const pctx = pc.getContext("2d");
  const grad = pctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.35, data.island.favoriteColor);
  grad.addColorStop(0.75, "rgba(179,136,255,0.85)");
  grad.addColorStop(1, "rgba(179,136,255,0)");
  pctx.fillStyle = grad;
  pctx.fillRect(0, 0, 128, 128);
  pctx.strokeStyle = "rgba(255,255,255,.6)"; pctx.lineWidth = 5;
  for (let k = 0; k < 3; k++) { pctx.beginPath(); pctx.arc(64, 64, 18 + k * 14, k, k + 3.6); pctx.stroke(); }
  const portalTex = new THREE.CanvasTexture(pc);
  portalTex.colorSpace = THREE.SRGBColorSpace;
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5.8), new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  portal.position.copy(info.portalCenter);
  portal.rotation.y = info.portalRotY || 0;
  root.add(portal);

  /* ---------- Bucle ---------- */
  let t = 0;
  api.cloudMat = cloudMat;
  api.frames = frames;
  api.portal = portal;
  api.clouds = cloudGroup;
  api.setLow = (v) => { low = v; birdMesh.visible = !v; };
  api.setLifeVisible = (v) => { birdMesh.visible = v && !low; dropMesh.visible = v; dog.visible = v; frames.visible = v; portal.visible = v; };
  api.update = (now, dt) => {
    t += dt;
    const rm = prefersReduced();
    if (!rm) cloudGroup.rotation.y += dt * 0.012;
    if (birdMesh.visible) updateBirds(t);
    if (dropMesh.visible) updateDrops(rm ? 0.003 : dt);
    if (dog.visible) updateDog(rm ? 0 : dt);
    updateFrames(dt, rm);
    portal.material.map.rotation = rm ? 0 : t * 0.4;
    portal.material.map.center.set(0.5, 0.5);
    const p = updateParticles(dt);
    return p || !rm;
  };
  return api;
}
