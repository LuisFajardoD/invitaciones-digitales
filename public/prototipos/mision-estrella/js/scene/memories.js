// Capítulo 6: cinturón de recuerdos. 6 polaroids a distintas profundidades que giran lento; las fotos
// (máx. 1024 px) se cargan al acercarse al capítulo. Al tocar una, viaja hacia la cámara y se abre el visor HTML;
// al cerrar, regresa a su lugar.
import * as THREE from "three";
import { demoData } from "../data.js";
import { loadImage, easeInOut } from "../util.js";

const W = 1.25, H = 1.55; // polaroid (foto 3:4 + margen inferior)
function polaroidCanvas(img, caption) {
  const S = 512, cv = document.createElement("canvas"); cv.width = S; cv.height = Math.round(S * (H / W));
  const c = cv.getContext("2d"), hh = cv.height;
  c.fillStyle = "#FFFDF8"; c.fillRect(0, 0, S, hh);
  const m = S * 0.07, pw = S - m * 2, ph = pw * (4 / 3);
  c.fillStyle = "#E9E4F5"; c.fillRect(m, m, pw, ph);
  if (img) {
    const k = Math.max(pw / img.width, ph / img.height);
    c.save(); c.beginPath(); c.rect(m, m, pw, ph); c.clip();
    c.drawImage(img, m + pw / 2 - (img.width * k) / 2, m + ph / 2 - (img.height * k) / 2, img.width * k, img.height * k);
    c.restore();
  }
  c.fillStyle = "#3B2A7A"; c.font = "600 34px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(caption, S / 2, m + ph + (hh - m - ph) / 2, S - m * 2);
  return cv;
}

export function createMemories({ anchor, dir }) {
  const group = new THREE.Group(); group.name = "memories";
  const geo = new THREE.PlaneGeometry(W, H);
  const items = demoData.gallery.map((p, i) => {
    const tex = new THREE.CanvasTexture(polaroidCanvas(null, p.caption)); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.25, emissiveMap: tex });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.index = i;
    // a lo largo del recorrido, alternando lados y profundidades
    // cerca del eje de la cámara (pantalla vertical): la cámara pasa entre ellas con parallax real
    const along = 4 + i * 4.4, side = i % 2 ? 1 : -1;
    const lateral = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const home = anchor.clone().addScaledVector(dir, along).addScaledVector(lateral, side * (0.55 + (i % 3) * 0.22)).add(new THREE.Vector3(0, 0.35 + (i % 3 - 1) * 0.4, 0));
    mesh.position.copy(home);
    group.add(mesh);
    return { mesh, tex, home, spin: 0.25 + (i % 3) * 0.12, phase: i * 1.7, fly: null, loaded: false };
  });
  let loading = false;
  const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpT = new THREE.Vector3(), tmpM = new THREE.Matrix4();
  return {
    group, items, meshes: items.map((it) => it.mesh),
    /** Carga las fotos (se llama al acercarse al capítulo). */
    async load() {
      if (loading) return; loading = true;
      await Promise.all(demoData.gallery.map(async (p, i) => {
        try {
          const img = await loadImage(p.src);
          const cv = polaroidCanvas(img, p.caption); // ≤ 1024 px
          items[i].tex.image = cv; items[i].tex.needsUpdate = true; items[i].loaded = true;
        } catch { /* se queda el marco vacío */ }
      }));
    },
    /** Viaje hacia la cámara; resuelve al llegar. La polaroid se queda frente a la cámara hasta flyBack(i). */
    flyTo(i) { const it = items[i]; it.fly = { t: 0, dur: 0.55, to: "camera", from: it.mesh.position.clone(), fromQ: it.mesh.quaternion.clone() }; return new Promise((r) => { it.fly.done = r; }); },
    flyBack(i) { const it = items[i]; if (!it) return; it.fly = { t: 0, dur: 0.6, to: "home", from: it.mesh.position.clone(), fromQ: it.mesh.quaternion.clone() }; },
    nearest(camera) { let best = null, bd = Infinity; for (const it of items) { const d = it.mesh.position.distanceTo(camera.position); if (d < bd && d > 1.2) { bd = d; best = it; } } return best?.mesh.position || null; },
    update(dt, t, camera) {
      for (const it of items) {
        const m = it.mesh;
        // orientación de reposo: de cara (aprox.) a la cámara, girando lento para que se lean
        tmpT.copy(it.home); tmpT.y += Math.sin(t * 0.6 + it.phase) * 0.12;
        tmpM.lookAt(camera.position, tmpT, camera.up); tmpQ.setFromRotationMatrix(tmpM);
        tmpQ.multiply(tmpQ2.setFromEuler(tmpE.set(Math.sin(t * 0.5 + it.phase) * 0.18, Math.sin(t * it.spin + it.phase) * 0.45, Math.sin(t * 0.4 + it.phase) * 0.08)));
        if (!it.fly) { m.position.copy(tmpT); m.quaternion.slerp(tmpQ, 1 - Math.exp(-3 * dt)); continue; }
        const f = it.fly;
        f.t = Math.min(f.dur, f.t + dt);
        const k = easeInOut(f.t / f.dur);
        if (f.to === "camera") {
          camera.getWorldDirection(tmpV);
          tmpV.multiplyScalar(1.6).add(camera.position);
          m.position.lerpVectors(f.from, tmpV, k);
          m.quaternion.slerpQuaternions(f.fromQ, camera.quaternion, k);
          if (f.t >= f.dur && f.done) { const d = f.done; f.done = null; d(); }
        } else {
          m.position.lerpVectors(f.from, tmpT, k);
          m.quaternion.slerpQuaternions(f.fromQ, tmpQ, k);
          if (f.t >= f.dur) it.fly = null;
        }
      }
    }
  };
}
