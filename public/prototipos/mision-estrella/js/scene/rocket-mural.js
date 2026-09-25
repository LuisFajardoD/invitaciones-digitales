// Mural de la tripulación sobre el cohete: placa esmaltada curvada al casco, con marco dorado, remaches y título;
// encima, parches bordados (disco con grosor, relieve de hilo por normal map compartido: satín diagonal al centro,
// puntadas radiales en el borde merrow, orilla levantada; brillo de hilo) de los mockGuests + el del invitado
// ("TÚ", con brillo). Animación de "coser": el parche vuela desde la cámara hasta su lugar y las puntadas recorren
// su borde.
import * as THREE from "three";
import { drawPatch } from "../ui/patch.js";
import { halo, pbr, heightToNormal, canvasTex } from "./materials.js";
import { easeInOut, missionName } from "../util.js";
import { bodyRadiusAt } from "../characters/rocket-procedural.js";

const SIZE = 256;
const MINE_SLOT = 1, MOCK_SLOTS = [0, 2, 3, 4, 5]; // el parche del invitado va arriba al centro

/** Relieve de bordado común a todos los parches (misma distribución: borde, banda de texto y tela central). */
let embNrm = null;
function embroideryNormal() {
  if (embNrm) return embNrm;
  const S = 256, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const c = cv.getContext("2d"), cx = S / 2, R = S * 0.47;
  c.fillStyle = "#606060"; c.fillRect(0, 0, S, S);
  // tela central: satín diagonal
  c.save(); c.beginPath(); c.arc(cx, cx, R * 0.64, 0, Math.PI * 2); c.clip();
  c.fillStyle = "#8a8a8a"; c.fillRect(0, 0, S, S);
  for (let x = -S; x < S * 2; x += 3) { c.strokeStyle = x % 6 ? "#9a9a9a" : "#7a7a7a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + S, S); c.stroke(); }
  c.restore();
  // banda de texto: tejido fino
  c.save(); c.beginPath(); c.arc(cx, cx, R * 0.9, 0, Math.PI * 2); c.arc(cx, cx, R * 0.64, 0, Math.PI * 2, true); c.clip();
  c.fillStyle = "#808080"; c.fillRect(0, 0, S, S);
  for (let x = -S; x < S * 2; x += 4) { c.strokeStyle = "#8c8c8c"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, S); c.lineTo(x + S, 0); c.stroke(); }
  c.restore();
  // borde merrow: puntadas radiales levantadas
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    c.strokeStyle = "#c8c8c8"; c.lineWidth = 3.2; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.915, cx + Math.sin(a) * R * 0.915); c.lineTo(cx + Math.cos(a + 0.03) * R * 0.99, cx + Math.sin(a + 0.03) * R * 0.99); c.stroke();
  }
  // costuras (anillos punteados) hundidas
  c.strokeStyle = "#484848"; c.lineWidth = 3; c.setLineDash([5.5, 4.5]);
  for (const k of [0.64, 0.88]) { c.beginPath(); c.arc(cx, cx, R * k, 0, Math.PI * 2); c.stroke(); }
  embNrm = heightToNormal(cv, 3.2, { wrap: false });
  embNrm.repeat.setScalar(0.94); embNrm.offset.setScalar(0.03); // misma escala que el dibujo del parche
  return embNrm;
}
const geoCache = new Map();
/** Frente (círculo con UV estándar) y canto (anillo abierto) del parche, compartidos por radio. */
function patchGeos(radius) {
  if (!geoCache.has(radius)) {
    const front = new THREE.CircleGeometry(radius * 0.94, 48); front.translate(0, 0, 0.007);
    const edge = new THREE.CylinderGeometry(radius * 0.94, radius * 0.92, 0.014, 48, 1, true); edge.rotateX(Math.PI / 2);
    geoCache.set(radius, { front, edge });
  }
  return geoCache.get(radius);
}
let edgeMat = null;
function patchMesh(opts, radius = 0.2) {
  const cv = document.createElement("canvas"); cv.width = cv.height = SIZE;
  drawPatch(cv.getContext("2d"), SIZE, opts);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // el dibujo llena el 94 % del canvas: el círculo usa sólo esa parte (sin orilla transparente)
  tex.repeat.setScalar(0.94); tex.offset.setScalar(0.03);
  // cara frontal: color del parche, relieve de hilo y brillo de hilo (rugosidad media)
  const face = pbr("#ffffff", { map: tex, normalMap: embroideryNormal(), normalScale: 0.9, rough: 0.52, metal: 0.04, env: 0.7, rim: 0.4, emissive: "#ffffff", ei: 0.12 });
  face.emissiveMap = tex;
  edgeMat ??= pbr("#D9CFEA", { rough: 0.75, env: 0.25, rim: 0.3 });
  const { front, edge } = patchGeos(radius);
  const m = new THREE.Group();
  m.add(new THREE.Mesh(front, face), new THREE.Mesh(edge, edgeMat));
  m.userData = { cv, tex, opts };
  return m;
}

/** Placa esmaltada curvada al casco (lado +X) con marco dorado, remaches y título "TRIPULACIÓN". */
function muralPlaque() {
  const g = new THREE.Group(); g.name = "mural_plaque";
  const y0 = 0.92, y1 = 2.22, a0 = Math.PI / 2 - 0.66, a1 = Math.PI / 2 + 0.66, NU = 36, NV = 24;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const v = j / NV, u = i / NU, y = y0 + (y1 - y0) * v, a = a0 + (a1 - a0) * u, r = bodyRadiusAt(y) + 0.006;
    pos.push(Math.sin(a) * r, y, Math.cos(a) * r); uv.push(u, v);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const map = canvasTex(512, 512, (c, w) => {
    const gr = c.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, "#FFFBF4"); gr.addColorStop(1, "#F3ECFA"); c.fillStyle = gr; c.fillRect(0, 0, w, w);
    c.strokeStyle = "rgba(185,162,255,.9)"; c.lineWidth = 5; c.setLineDash([12, 9]); c.strokeRect(22, 22, w - 44, w - 44); c.setLineDash([]);
    c.fillStyle = "#3B2A7A"; c.font = "600 44px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("TRIPULACIÓN", w / 2, 58);
    c.fillStyle = "#FFD27A"; for (const x of [70, w - 70]) { c.beginPath(); for (let k = 0; k < 10; k++) { const aa = (k / 10) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 6 : 14; c.lineTo(x + Math.cos(aa) * rr, 58 + Math.sin(aa) * rr); } c.fill(); }
  });
  g.add(new THREE.Mesh(geo, pbr("#ffffff", { map, rough: 0.3, metal: 0.05, env: 0.9, rim: 0.4 })));
  // marco dorado (tubo por el borde) y remaches en las esquinas
  const gold = pbr("#FFC96B", { rough: 0.3, metal: 0.7, emissive: "#6a4a10", ei: 0.12, env: 1, rim: 0.4 });
  const P = (u, v) => { const y = y0 + (y1 - y0) * v, a = a0 + (a1 - a0) * u, r = bodyRadiusAt(y) + 0.012; return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); };
  const border = [];
  for (let k = 0; k <= 20; k++) border.push(P(k / 20, 0)); for (let k = 1; k <= 14; k++) border.push(P(1, k / 14));
  for (let k = 19; k >= 0; k--) border.push(P(k / 20, 1)); for (let k = 13; k >= 1; k--) border.push(P(0, k / 14));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(border, true, "catmullrom", 0.1), 160, 0.022, 8, true), gold));
  const rivet = new THREE.SphereGeometry(0.02, 10, 8);
  for (const [u, v] of [[0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]]) { const m = new THREE.Mesh(rivet, gold); m.position.copy(P(u, v)); g.add(m); }
  return g;
}
const redraw = (m, patch) => { Object.assign(m.userData.opts, patch); drawPatch(m.userData.cv.getContext("2d"), SIZE, m.userData.opts); m.userData.tex.needsUpdate = true; };

export function createMural(rocket, { mockGuests }) {
  const group = new THREE.Group(); group.name = "mural";
  rocket.root.add(group);
  if (rocket.kind === "procedural") group.add(muralPlaque()); // un cohete GLB trae su propio panel
  const bottom = missionName();
  const mocks = mockGuests.filter((g) => g.attending).slice(0, 5).map((g, i) => {
    const m = patchMesh({ color: g.avatar.color, symbol: g.avatar.symbol, top: g.guestName, bottom });
    group.add(m);
    return m;
  });
  let mine = null, mineGlow = null, sew = null;
  function place() {
    const slots = rocket.slots;
    mocks.forEach((m, i) => { const s = slots[MOCK_SLOTS[i]] || slots[i]; if (!s) return; m.position.copy(s.pos); m.quaternion.copy(s.quat); });
    if (mine && !sew) { const s = slots[MINE_SLOT]; mine.position.copy(s.pos); mine.quaternion.copy(s.quat); mineGlow.position.copy(s.pos).addScaledVector(s.normal, -0.02); }
  }
  place();
  rocket.onSwap = place;
  const tmp = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), dir = new THREE.Vector3();
  return {
    group,
    count: () => mocks.length + (mine ? 1 : 0),
    /** Pone (sin animación) el parche del invitado. */
    setMine(avatar, name) {
      if (!avatar) { if (mine) { group.remove(mine); group.remove(mineGlow); mine = null; } return; }
      if (!mine) { mine = patchMesh({ color: avatar.color, symbol: avatar.symbol, top: name, bottom, you: true }, 0.22); mineGlow = halo("#FFD27A", 0.9, 0.55); group.add(mineGlow); group.add(mine); }
      else redraw(mine, { color: avatar.color, symbol: avatar.symbol, top: name, you: true, stitch: 1 });
      place();
    },
    /** Animación completa: vuelo desde la cámara + costura. Resuelve al terminar. */
    sewMine(avatar, name, camera, audio) {
      this.setMine(avatar, name);
      redraw(mine, { stitch: 0 });
      mineGlow.material.opacity = 0;
      camera.getWorldDirection(dir);
      const startW = camera.position.clone().addScaledVector(dir, 1.1).addScaledVector(camera.up, -0.25);
      sew = { t: 0, phase: "fly", from: group.worldToLocal(startW.clone()), fromQ: new THREE.Quaternion(), audioDone: false };
      // orientación inicial: de cara a la cámara (en espacio local del grupo)
      const parentQ = group.getWorldQuaternion(new THREE.Quaternion()).invert();
      sew.fromQ.copy(parentQ.multiply(camera.quaternion));
      mine.position.copy(sew.from); mine.quaternion.copy(sew.fromQ);
      audio?.whoosh();
      return new Promise((r) => { sew.done = r; });
    },
    update(dt, t) {
      if (mineGlow && !sew) mineGlow.material.opacity = 0.35 + 0.25 * Math.sin(t * 2.5);
      if (!sew) return null;
      const s = rocket.slots[MINE_SLOT];
      sew.t += dt;
      if (sew.phase === "fly") {
        const k = easeInOut(sew.t / 1.1);
        tmp.lerpVectors(sew.from, s.pos, k).addScaledVector(s.normal, Math.sin(k * Math.PI) * 0.8);
        mine.position.copy(tmp);
        tmpQ.copy(sew.fromQ).slerp(s.quat, k); mine.quaternion.copy(tmpQ);
        mine.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.4);
        if (sew.t >= 1.1) { sew.phase = "stitch"; sew.t = 0; mine.scale.setScalar(1); mine.position.copy(s.pos); mine.quaternion.copy(s.quat); return "landed"; }
      } else if (sew.phase === "stitch") {
        const k = Math.min(1, sew.t / 1.3);
        redraw(mine, { stitch: k });
        mineGlow.position.copy(s.pos).addScaledVector(s.normal, -0.02);
        mineGlow.material.opacity = k * 0.6;
        if (k >= 1) { const d = sew.done; sew = null; d?.(); return "sewn"; }
      }
      return null;
    }
  };
}
