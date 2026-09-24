// Construcción de la isla (secuencia cinematográfica, ~6 s + monumento):
//  · El suelo se arma por COLUMNAS completas (roca abajo, tierra y pasto arriba) que caen desde fuera
//    del cuadro, con squash & stretch y polvo; en oleadas desde el punto cercano a la cámara hacia el
//    fondo, con ±0.15 s de variación por columna (nada de anillos ni capas).
//  · Cada construcción cae completa como un solo objeto cuando su suelo ya existe (rebote, polvo grande,
//    golpe grave y un leve shake), en orden: Casa, Torre, Mirador, Sendero (banderines del suelo), Cofre, Muro.
//  · Agua y arena aparecen al final con un fundido y una onda suave.
// Todo con InstancedMesh (matrices por instancia) y grupos por zona; sin crear objetos por frame.
// Después, el monumento se construye bloque a bloque (como antes).
import * as THREE from "../../vendor/three.module.min.js";
import { easeIn, easeOutBack, clamp } from "../util.js";

const _m = new THREE.Matrix4();
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const LAND = 0.28; // squash al aterrizar (s)
const WAVE = 3.8; // la última oleada de columnas arranca hacia los 3.8 s
const LATE0 = 3.9, LATE_SPAN = 0.8; // agua y arena: fundido + onda al final del acto 2
// Construcciones grandes: [zona, momento mínimo (s), altura aprox. de la construcción]
const BIG = [["house", 2.6, 13], ["tower", 3.0, 17], ["tree", 3.4, 14], ["path", 3.8, 6], ["chest", 4.4, 5], ["wall", 4.8, 9]];
const GRASS_DUST = ["#8BD46E", "#C98E5A", "#FFF6E5", "#7CC862"];

function writeInstance(mesh, i, dy, sx, sy) {
  const b = mesh.userData.base;
  const s = b[i * 4 + 3];
  _m.makeScale(s * sx, s * sy, s * sx);
  _m.setPosition(b[i * 4], b[i * 4 + 1] + dy - (1 - sy) * s * 0.5, b[i * 4 + 2]);
  mesh.setMatrixAt(i, _m);
}
function hideAll(mesh) {
  _m.makeScale(0, 0, 0);
  for (let i = 0; i < mesh.count; i++) mesh.setMatrixAt(i, _m);
  mesh.instanceMatrix.needsUpdate = true;
}
function showAll(mesh) {
  for (let i = 0; i < mesh.count; i++) writeInstance(mesh, i, 0, 1, 1);
  mesh.instanceMatrix.needsUpdate = true;
}
const isDescendant = (o, g) => { for (let p = o; p; p = p.parent) if (p === g) return true; return false; };
const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

export function createBuilder({ island, fx, audio }) {
  const M = island.meshes, GR = island.groups;
  const layered = M.layered;
  const waterMat = island.materials.water, waterOpacity = waterMat.opacity;
  let pops = []; // objetos no instanciados de cada zona (manecillas, marcos, portal, bloques del muro)
  let cine = null; // construcción de la isla
  let mono = null; // construcción del monumento
  let undo = null; // la isla se desarma (antes de repetir la construcción)
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

  /* ---------- Columnas del suelo (se calculan una vez) ---------- */
  let COL = null;
  function prepColumns() {
    const colMeshes = [M.rock, M.ground, M.misc];
    const map = new Map(), cols = [];
    const colOf = colMeshes.map((m) => new Int32Array(m.count));
    colMeshes.forEach((m, mi) => (m.userData.voxels || []).forEach((v, i) => {
      const x = Math.round(v.x), z = Math.round(v.z), k = x * 1000 + z;
      let c = map.get(k);
      if (c == null) { c = cols.length; map.set(k, c); cols.push({ x, z, top: -99, bottom: 99, hasTop: false, sand: false }); }
      colOf[mi][i] = c;
      const col = cols[c];
      if (mi < 2) { col.top = Math.max(col.top, v.y); col.bottom = Math.min(col.bottom, v.y); }
      if (mi === 1) col.hasTop = true;
      if (v.sand) col.sand = true;
    }));
    const n = cols.length;
    return { map, cols, colOf, colMeshes, n, start: new Float32Array(n), dur: new Float32Array(n), h: new Float32Array(n), late: new Uint8Array(n), state: new Uint8Array(n) };
  }
  const colAt = (x, z) => COL.map.get(Math.round(x) * 1000 + Math.round(z));

  /** Altura de aparición: por encima del borde superior del cuadro para la cámara actual. */
  function spawnHeight(camera, x, top, z, minH = 6, maxH = 42) {
    let y = top + 3;
    for (let k = 0; k < 14; k++) {
      _v.set(x, y, z).project(camera);
      if (_v.z > 1 || _v.y > 1.15) break;
      y += 2 + k * 1.5;
    }
    return clamp(y - top, minH, maxH);
  }

  function resetGroups(visible) {
    for (const g of Object.values(GR)) { g.visible = visible; g.position.set(0, 0, 0); g.scale.set(1, 1, 1); }
  }
  function showGroup(g) {
    g.traverse((o) => { if (o.isInstancedMesh && o.userData.base && o !== M.monument && o !== M.eight) showAll(o); });
    pops.forEach((p) => { if (isDescendant(p.obj, g)) { p.obj.visible = true; p.obj.scale.setScalar(1); } });
    if (g === GR.house) island.extras.strings.visible = true;
    g.visible = true;
  }
  function setGroup(d, sx, sy, dy) {
    const { g, c } = d;
    g.scale.set(sx, sy, sx);
    g.position.set(c.x - sx * c.x, c.y - sy * c.y + dy, c.z - sx * c.z);
  }

  const api = {
    /** Objetos no instanciados que aparecen con su zona (y se encogen al desarmar la isla). */
    setPops(list) { pops = list; },
    /** Oculta todo para empezar la construcción. */
    reset() {
      layered.forEach(hideAll);
      hideAll(M.monument); hideAll(M.eight);
      pops.forEach((p) => { p.obj.visible = false; });
      island.extras.strings.visible = false;
      resetGroups(false);
      waterMat.opacity = 0;
    },
    /**
     * Construye la isla. `ground` = punto del suelo cerca de la cámara (de ahí salen las oleadas);
     * `getCamera` para calcular desde dónde caen los bloques; `hooks`: shake(k), flagsRise().
     * Devuelve una promesa al terminar (~6 s).
     */
    run({ ground, getCamera, hooks = {} }) {
      if (!COL) COL = prepColumns();
      api.reset();
      const C = COL, R = island.plan.R;
      let dmax = 1;
      for (const col of C.cols) dmax = Math.max(dmax, Math.hypot(col.x - ground.x, col.z - ground.z));
      for (let c = 0; c < C.n; c++) {
        const col = C.cols[c];
        C.state[c] = 0; C.h[c] = -1;
        C.late[c] = !col.hasTop || col.sand ? 1 : 0;
        if (C.late[c]) C.start[c] = LATE0 + (Math.hypot(col.x, col.z) / R) * LATE_SPAN + rnd(c, 3) * 0.1;
        else C.start[c] = 0.12 + Math.pow(Math.hypot(col.x - ground.x, col.z - ground.z) / dmax, 0.85) * WAVE + (rnd(c, 7) - 0.5) * 0.3;
        C.dur[c] = 0.6;
      }
      // Cuándo termina el suelo bajo cada zona (las construcciones no caen antes)
      const groundDone = (test) => {
        let t = 0;
        for (let c = 0; c < C.n; c++) if (test(C.cols[c])) t = Math.max(t, C.start[c] + (C.late[c] ? 0.45 : 0.8 + LAND));
        return t;
      };
      const zones = Object.fromEntries(island.plan.zones.map((z) => [z.zone, z]));
      const center = (poly) => poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
      const drops = [];
      let prev = 0;
      for (const [zn, t0, top] of BIG) {
        const z = zones[zn], [cx, cz] = center(z.poly);
        const t = Math.max(prev + 0.4, t0, groundDone((col) => inPoly(col.x, col.z, z.poly)) + 0.1);
        prev = t;
        drops.push({ g: GR[zn], zone: zn, t, c: new THREE.Vector3(cx, 0.5, cz), top, big: true, rise: zn === "path" });
      }
      // Monumento (base y tablero) y árboles pequeños: caen en silencio con su suelo
      { const z = zones.monument, [cx, cz] = center(z.poly); drops.push({ g: GR.monument, t: groundDone((col) => inPoly(col.x, col.z, z.poly)) + 0.15, c: new THREE.Vector3(cx, 0.5, cz), top: 10, quiet: true }); }
      island.plan.trees.forEach((tr, i) => {
        const g = GR[`arbol-${i + 1}`]; if (!g) return;
        const c = colAt(tr.x, tr.z);
        drops.push({ g, t: (c != null ? C.start[c] + 0.8 + LAND : 3) + 0.1 + rnd(i, 9) * 0.2, c: new THREE.Vector3(tr.x, 0.5, tr.z), top: 6, quiet: true });
      });
      const end = Math.max(...drops.map((d) => d.t + 1), LATE0 + LATE_SPAN + 0.7, WAVE + 1.2);
      return new Promise((resolve) => { cine = { t0: performance.now(), resolve, drops, getCamera, hooks, end, lastPop: 0, lastDust: 0, landed: 0 }; });
    },
    /** Construye las letras del monumento y luego el "8" gigante con destellos (~2.5 s). */
    monument() {
      hideAll(M.monument); hideAll(M.eight);
      return new Promise((resolve) => { mono = { t0: performance.now(), resolve, sparkled: new Set(), eightDone: false }; });
    },
    /** La isla se desarma: los bloques se elevan y se dispersan hacia el cielo (~T s). */
    disassemble(T = 1.2) {
      const lists = [...layered, M.monument, M.eight];
      return new Promise((resolve) => { undo = { t0: performance.now(), T, lists, resolve }; });
    },
    get building() { return !!cine || !!mono || !!undo; },
    /** Estado final inmediato (Omitir, visitas repetidas, movimiento reducido). */
    finish() {
      resetGroups(true);
      layered.forEach(showAll);
      showAll(M.monument); showAll(M.eight);
      pops.forEach((p) => { p.obj.visible = true; p.obj.scale.setScalar(1); });
      island.extras.strings.visible = true;
      waterMat.opacity = waterOpacity;
      if (cine) { const r = cine.resolve; cine = null; r(); }
      if (mono) { const r = mono.resolve; mono = null; r(); }
      if (undo) { const r = undo.resolve; undo = null; r(); }
    },
    update(now) {
      let active = false;
      if (undo) {
        active = true;
        const t = (now - undo.t0) / 1000, T = undo.T;
        undo.lists.forEach((mesh, mi) => {
          const b = mesh.userData.base;
          for (let i = 0; i < mesh.count; i++) {
            const r1 = rnd(i, mi + 1), r2 = rnd(i, mi + 11), r3 = rnd(i, mi + 23);
            const q = clamp((t - r1 * T * 0.35) / (T * 0.65), 0, 1);
            const e = easeIn(q), s = b[i * 4 + 3] * Math.max(0.001, 1 - 0.8 * e);
            _m.makeScale(s, s, s).setPosition(b[i * 4] + (r2 - 0.5) * 12 * e, b[i * 4 + 1] + (18 + r3 * 16) * e, b[i * 4 + 2] + (r3 - 0.5) * 12 * e);
            mesh.setMatrixAt(i, _m);
          }
          mesh.instanceMatrix.needsUpdate = true;
        });
        const k = Math.max(0.0001, 1 - clamp(t / T, 0, 1));
        pops.forEach((p) => p.obj.scale.setScalar(k));
        if (t > T * 0.5) island.extras.strings.visible = false;
        if (t >= T) {
          undo.lists.forEach(hideAll);
          pops.forEach((p) => { p.obj.visible = false; });
          const r = undo.resolve; undo = null; r();
        }
      }
      if (cine) { active = true; updateCine(now); }
      if (mono) {
        active = true;
        const t = (now - mono.t0) / 1000;
        const n = M.monument.count;
        const letterDur = 1.35;
        for (let i = 0; i < n; i++) {
          const start = (i / n) * letterDur;
          const q = clamp((t - start) / 0.28, 0, 1);
          writeInstance(M.monument, i, (1 - q) * 1.2, easeOutBack(q), easeOutBack(q));
          if (q > 0 && !mono.sparkled.has(i) && i % 6 === 0) {
            mono.sparkled.add(i);
            const b = M.monument.userData.base;
            fx.sparkle(new THREE.Vector3(b[i * 4], b[i * 4 + 1], b[i * 4 + 2]), 3);
            audio.blockPop(1.2 + (i / n) * 0.8);
          }
        }
        M.monument.instanceMatrix.needsUpdate = true;
        const e0 = letterDur + 0.25;
        const ne = M.eight.count;
        for (let i = 0; i < ne; i++) {
          const q = clamp((t - e0 - (i / ne) * 0.5) / 0.3, 0, 1);
          writeInstance(M.eight, i, (1 - q) * 3, easeOutBack(q), easeOutBack(q));
        }
        M.eight.instanceMatrix.needsUpdate = true;
        if (t > e0 + 0.75 && !mono.eightDone) {
          mono.eightDone = true;
          const b = M.eight.userData.base;
          const c = new THREE.Vector3(b[0], b[1], b[2]);
          for (let i = 1; i < ne; i++) { c.x += b[i * 4]; c.y += b[i * 4 + 1]; c.z += b[i * 4 + 2]; }
          c.multiplyScalar(1 / ne);
          fx.sparkle(c, 60, ["#FFD23F", "#FFFFFF", "#FFF6E5", "#FF9FCB"]);
          audio.fanfare();
        }
        if (t > e0 + 1.25) { const r = mono.resolve; mono = null; r(); }
      }
      return active;
    }
  };

  /* ---------- Un frame de la construcción ---------- */
  function updateCine(now) {
    const J = cine, C = COL, t = (now - J.t0) / 1000;
    const camera = J.getCamera();
    camera.updateMatrixWorld();
    const progress = clamp(t / 6, 0, 1);
    let landedNow = 0;
    // 1) Columnas: sólo se escriben las que están en movimiento (y una vez al quedar quietas)
    for (let c = 0; c < C.n; c++) {
      const st = C.state[c];
      if (st === 3) continue;
      const tr = t - C.start[c];
      if (tr < 0) continue;
      if (st === 0) {
        C.state[c] = 1;
        if (!C.late[c]) { C.h[c] = spawnHeight(camera, C.cols[c].x, C.cols[c].top, C.cols[c].z); C.dur[c] = 0.32 + Math.sqrt(C.h[c]) * 0.07; }
      }
    }
    for (let mi = 0; mi < C.colMeshes.length; mi++) {
      const mesh = C.colMeshes[mi], colOf = C.colOf[mi], b = mesh.userData.base;
      let touched = false;
      for (let i = 0; i < mesh.count; i++) {
        const c = colOf[i], st = C.state[c];
        if (st === 0 || st === 3) continue;
        touched = true;
        const tr = t - C.start[c], col = C.cols[c];
        if (C.late[c]) {
          // Agua y arena: aparecen con un fundido y una onda suave
          const q = clamp(tr / 0.45, 0, 1), e = Math.max(0.001, easeOutBack(q));
          const s = b[i * 4 + 3] * e;
          _m.makeScale(s, s, s).setPosition(b[i * 4], b[i * 4 + 1] - (1 - q) * 0.8, b[i * 4 + 2]);
          mesh.setMatrixAt(i, _m);
          continue;
        }
        const fall = C.dur[c];
        if (tr < fall) {
          const f = easeIn(tr / fall);
          writeInstance(mesh, i, C.h[c] * (1 - f), 0.94, 1.08); // stretch mientras cae
        } else {
          const q = clamp((tr - fall) / LAND, 0, 1);
          const k = 0.26 * Math.sin(q * Math.PI) * (1 - 0.4 * q), sy = 1 - k, sx = 1 + k * 0.5;
          // squash de la columna entera hacia su base: el pasto baja y rebota
          const s = b[i * 4 + 3];
          _m.makeScale(s * sx, s * sy, s * sx).setPosition(b[i * 4], col.bottom + (b[i * 4 + 1] - col.bottom) * sy, b[i * 4 + 2]);
          mesh.setMatrixAt(i, _m);
        }
      }
      if (touched) mesh.instanceMatrix.needsUpdate = true;
    }
    // Estados: aterrizaje (sonido/polvo) y fin
    for (let c = 0; c < C.n; c++) {
      const st = C.state[c];
      if (st === 0 || st === 3) continue;
      const tr = t - C.start[c];
      const total = C.late[c] ? 0.45 : C.dur[c] + LAND;
      if (st === 1 && !C.late[c] && tr >= C.dur[c]) {
        C.state[c] = 2; landedNow++;
        const col = C.cols[c];
        // Polvo pequeño sólo cerca de la cámara (limitado por tiempo)
        // Si bajan los FPS se reduce el polvo, nunca la animación
        const low = J.hooks.lowFps?.();
        if (now - J.lastDust > (low ? 250 : 90) && Math.hypot(camera.position.x - col.x, camera.position.z - col.z) < 30) { J.lastDust = now; fx.dust(_c.set(col.x, col.top + 0.6, col.z), low ? 2 : 5, GRASS_DUST); }
      }
      if (tr >= total) C.state[c] = 3;
    }
    // Las columnas que ya quedaron quietas se escriben en su posición exacta (una sola vez)
    for (let mi = 0; mi < C.colMeshes.length; mi++) {
      const mesh = C.colMeshes[mi], colOf = C.colOf[mi];
      let touched = false;
      for (let i = 0; i < mesh.count; i++) {
        const c = colOf[i];
        if (C.state[c] === 3 && !C.late[c] && t - C.start[c] < C.dur[c] + LAND + 0.1) { writeInstance(mesh, i, 0, 1, 1); touched = true; }
        else if (C.state[c] === 3 && C.late[c] && t - C.start[c] < 0.6) { writeInstance(mesh, i, 0, 1, 1); touched = true; }
      }
      if (touched) mesh.instanceMatrix.needsUpdate = true;
    }
    // "Pop" suave por bloque: máx. ~12 por segundo, el tono sube durante los actos 1 y 2
    if (landedNow && now - J.lastPop > 83) { J.lastPop = now; audio.blockPop(0.7 + progress * 1.3); }
    // 2) Agua: fundido de opacidad y onda que se abre desde el centro
    const wq = clamp((t - LATE0) / (LATE_SPAN + 0.4), 0, 1);
    waterMat.opacity = waterOpacity * wq;
    if (t > LATE0 - 0.1) {
      const wm = M.water, b = wm.userData.base, R = island.plan.R;
      for (let i = 0; i < wm.count; i++) {
        const r = Math.hypot(b[i * 4], b[i * 4 + 2]) / R;
        const q = clamp((t - LATE0 - r * LATE_SPAN) / 0.5, 0, 1);
        const s = b[i * 4 + 3] * Math.max(0.001, q), wave = Math.sin(q * Math.PI) * 0.25;
        _m.makeScale(s, s, s).setPosition(b[i * 4], b[i * 4 + 1] + wave, b[i * 4 + 2]);
        wm.setMatrixAt(i, _m);
      }
      wm.instanceMatrix.needsUpdate = true;
    }
    // 3) Construcciones: cada una cae completa como un objeto
    for (const d of J.drops) {
      if (d.done) continue;
      const tr = t - d.t;
      if (tr < 0) continue;
      if (!d.started) {
        d.started = true;
        d.h = d.rise ? 0 : spawnHeight(camera, d.c.x, d.top, d.c.z, d.quiet ? 5 : 10, 40);
        showGroup(d.g);
        if (d.rise) J.hooks.flagsRise?.();
      }
      const fall = d.rise ? 0.01 : d.quiet ? 0.45 : 0.55;
      if (tr < fall) { setGroup(d, 0.96, 1.06, d.h * (1 - easeIn(tr / fall))); continue; }
      if (!d.landed) {
        d.landed = true;
        if (d.big) {
          audio.thud(d.rise ? 1.3 : 1);
          fx.dust(_c.set(d.c.x, 0.8, d.c.z), (d.rise ? 16 : 40) * (J.hooks.lowFps?.() ? 0.4 : 1), GRASS_DUST);
          if (!d.rise) J.hooks.shake?.(0.3);
        } else audio.blockPop(0.9);
      }
      const q = clamp((tr - fall) / 0.4, 0, 1);
      const k = (d.big ? 0.2 : 0.12) * Math.sin(q * Math.PI) * (1 - 0.4 * q);
      setGroup(d, 1 + k * 0.5, 1 - k, 0);
      if (q >= 1) { setGroup(d, 1, 1, 0); d.done = true; }
    }
    if (t >= J.end) {
      // Estado final exacto
      resetGroups(true);
      layered.forEach((m) => { if (m !== M.flags) showAll(m); });
      waterMat.opacity = waterOpacity;
      const r = J.resolve; cine = null; r();
    }
  }
  return api;
}
