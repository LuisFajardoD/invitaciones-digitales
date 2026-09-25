// Mural de la tripulación sobre el cohete: parches bordados de los mockGuests + el del invitado ("TÚ", con brillo).
// Animación de "coser": el parche vuela desde la cámara hasta su lugar y las puntadas recorren su borde.
import * as THREE from "three";
import { drawPatch } from "../ui/patch.js";
import { halo } from "./materials.js";
import { easeInOut, missionName } from "../util.js";

const SIZE = 256;
const MINE_SLOT = 1, MOCK_SLOTS = [0, 2, 3, 4, 5]; // el parche del invitado va arriba al centro
function patchMesh(opts, radius = 0.2) {
  const cv = document.createElement("canvas"); cv.width = cv.height = SIZE;
  drawPatch(cv.getContext("2d"), SIZE, opts);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), new THREE.MeshLambertMaterial({ map: tex, transparent: true, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.18 }));
  m.userData = { cv, tex, opts };
  return m;
}
const redraw = (m, patch) => { Object.assign(m.userData.opts, patch); drawPatch(m.userData.cv.getContext("2d"), SIZE, m.userData.opts); m.userData.tex.needsUpdate = true; };

export function createMural(rocket, { mockGuests }) {
  const group = new THREE.Group(); group.name = "mural";
  rocket.root.add(group);
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
