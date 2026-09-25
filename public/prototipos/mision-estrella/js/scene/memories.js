// Capítulo 6: cinturón de recuerdos. 6 polaroids a distintas profundidades que giran lento, entre asteroides.
// Polaroids: papel con grosor real y leve curvatura, textura de papel (normal map), sombra suave detrás y un pedazo
// de cinta adhesiva en algunas; las fotos (máx. 1024 px) se cargan al acercarse al capítulo. Al tocar una, viaja
// hacia la cámara y se abre el visor HTML; al cerrar, regresa a su lugar.
// Asteroides: 3 formas irregulares (icosaedro deformado con ruido fractal, cráteres y grietas talladas), color por
// vértice (grises cálidos, lavanda) con cristales de mineral brillante; instanciados, rotación lenta, tamaños y
// profundidades distintas alrededor del recorrido (la cámara pasa entre ellos). En calidad baja: menos detalle.
import * as THREE from "three";
import { demoData } from "../data.js";
import { loadImage, easeInOut } from "../util.js";
import { pbr, paperNormal, canvasTex, rng } from "./materials.js";
import { fbm3 } from "./shapes.js";
import { mergeVertices } from "../../vendor/utils/BufferGeometryUtils.js";

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
  // sombra interior suave del marco (la foto queda "hundida" en el papel)
  const sg = c.createLinearGradient(0, m, 0, m + 10); sg.addColorStop(0, "rgba(40,30,80,.22)"); sg.addColorStop(1, "rgba(40,30,80,0)");
  c.fillStyle = sg; c.fillRect(m, m, pw, 10);
  c.fillStyle = "#3B2A7A"; c.font = "600 34px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(caption, S / 2, m + ph + (hh - m - ph) / 2, S - m * 2);
  return cv;
}

/** Placa de papel con grosor y leve curvatura (se curva a lo ancho, como papel fotográfico). */
function paperSlab(bend = 0.05) {
  const g = new THREE.BoxGeometry(W, H, 0.018, 14, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (W / 2); p.setZ(i, p.getZ(i) + bend * (x * x - 0.35)); }
  g.computeVertexNormals();
  return g;
}

/** Sombra suave (se dibuja detrás de cada polaroid). */
function shadowTexture() {
  return canvasTex(128, 160, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, "rgba(20,12,60,.55)"); g.addColorStop(0.6, "rgba(20,12,60,.25)"); g.addColorStop(1, "rgba(20,12,60,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }, { srgb: false });
}
/** Cinta adhesiva: crema translúcida con bordes dentados y fibras. */
function tapeTexture() {
  return canvasTex(128, 48, (c, w, h) => {
    const r = rng(9);
    c.beginPath(); c.moveTo(0, 0);
    for (let y = 0; y <= h; y += 4) c.lineTo(r() * 5, y);
    for (let x = 0; x <= w; x += 6) c.lineTo(x, h - r() * 2);
    for (let y = h; y >= 0; y -= 4) c.lineTo(w - r() * 5, y);
    c.closePath(); c.fillStyle = "rgba(255,244,214,.72)"; c.fill();
    c.strokeStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 30; i++) { c.beginPath(); const y = r() * h; c.moveTo(0, y); c.lineTo(w, y + (r() - 0.5) * 4); c.stroke(); }
  });
}

/** Asteroide: icosaedro deformado con ruido, cráteres y grietas; color por vértice. */
function rockGeometry(seed, detail) {
  // vértices compartidos: sombreado suave (el icosaedro viene sin índice y se vería facetado)
  const ico = new THREE.IcosahedronGeometry(1, detail); ico.deleteAttribute("normal"); ico.deleteAttribute("uv");
  const g = mergeVertices(ico), p = g.attributes.position, r = rng(seed * 97 + 3);
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const craters = Array.from({ length: 8 }, (_, k) => ({ c: new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(), s: k < 3 ? 0.32 + r() * 0.2 : 0.12 + r() * 0.12, d: k < 3 ? 0.14 + r() * 0.08 : 0.07 + r() * 0.05 }));
  const cracks = Array.from({ length: 2 }, () => new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize());
  const col = new Float32Array(p.count * 3), c = new THREE.Color();
  const WARM = new THREE.Color("#A89A90"), LAV = new THREE.Color("#A594CC"), LIGHT = new THREE.Color("#D2C5BA"), DARK = new THREE.Color("#5E5270");
  const squash = new THREE.Vector3(1 + r() * 0.35, 0.7 + r() * 0.25, 0.85 + r() * 0.3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); n.copy(v).normalize();
    let h = 1 + fbm3(n.x * 1.6, n.y * 1.6, n.z * 1.6, seed, 4) * 0.34 + fbm3(n.x * 6, n.y * 6, n.z * 6, seed + 5, 3) * 0.085;
    let cav = 0, rimK = 0, crack = 0;
    for (const k of craters) {
      const d = n.angleTo(k.c) / k.s;
      if (d < 1.3) { const bowl = d < 1 ? -(1 - d * d) * k.d : 0, rim = Math.exp(-((d - 1) ** 2) / 0.018) * k.d * 0.55; h += bowl + rim; cav = Math.max(cav, d < 1 ? 1 - d * d : 0); rimK = Math.max(rimK, rim / (k.d * 0.55)); }
    }
    for (const k of cracks) { const d = Math.abs(n.dot(k)) + fbm3(n.x * 4, n.y * 4, n.z * 4, seed + 9, 2) * 0.02; if (d < 0.04) { h -= (0.04 - d) * 1.4; crack = Math.max(crack, 1 - d / 0.04); } }
    v.copy(n).multiplyScalar(h).multiply(squash);
    p.setXYZ(i, v.x, v.y, v.z);
    // grises cálidos ↔ lavanda según ruido, manchas claras; fondo de cráteres y grietas oscuro, bordes más claros
    const t = fbm3(n.x * 2.3, n.y * 2.3, n.z * 2.3, seed + 11, 3) * 0.5 + 0.5, sp = fbm3(n.x * 7, n.y * 7, n.z * 7, seed + 13, 2);
    c.copy(WARM).lerp(LAV, THREE.MathUtils.smoothstep(t, 0.3, 0.75)).lerp(LIGHT, Math.max(0, sp) * 0.5 + rimK * 0.35);
    c.lerp(DARK, cav * 0.45 + crack * 0.7);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

export function createMemories({ anchor, dir, low = false, density = 1 }) {
  const group = new THREE.Group(); group.name = "memories";
  // --- polaroids
  const geo = paperSlab(), shadowGeo = new THREE.PlaneGeometry(W * 1.35, H * 1.3), tapeGeo = new THREE.PlaneGeometry(0.46, 0.17);
  const nrm = paperNormal();
  const edge = pbr("#F4EEE2", { rough: 0.85, normalMap: nrm, normalScale: 0.4, env: 0.25, rim: 0.3 });
  const back = pbr("#EFE8DA", { rough: 0.9, normalMap: nrm, normalScale: 0.6, env: 0.2, rim: 0.35 });
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 });
  const tapeMat = pbr("#FFF4D6", { rough: 0.35, metal: 0, map: tapeTexture(), transparent: true, env: 0.8, rim: 0.2 });
  tapeMat.depthWrite = false;
  const lateral = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  const items = demoData.gallery.map((p, i) => {
    const tex = new THREE.CanvasTexture(polaroidCanvas(null, p.caption)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const front = pbr("#ffffff", { rough: 0.62, map: tex, normalMap: nrm, normalScale: 0.18, env: 0.35, rim: 0.3, emissive: "#ffffff", ei: 0.22 });
    front.emissiveMap = tex;
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]); mesh.userData.index = i;
    const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.position.set(0.07, -0.09, -0.06); sh.renderOrder = -1; mesh.add(sh);
    if (i % 2 === 0) { const tp = new THREE.Mesh(tapeGeo, tapeMat); tp.position.set((i % 4 ? 0.28 : -0.28), H / 2 - 0.02, 0.03); tp.rotation.z = i % 4 ? -0.35 : 0.3; mesh.add(tp); }
    // a lo largo del recorrido, alternando lados y profundidades (la cámara pasa entre ellas con parallax real)
    const along = 4 + i * 4.4, side = i % 2 ? 1 : -1;
    const home = anchor.clone().addScaledVector(dir, along).addScaledVector(lateral, side * (0.55 + (i % 3) * 0.22)).add(new THREE.Vector3(0, 0.35 + (i % 3 - 1) * 0.4, 0));
    mesh.position.copy(home);
    group.add(mesh);
    return { mesh, tex, home, spin: 0.25 + (i % 3) * 0.12, phase: i * 1.7, fly: null, loaded: false };
  });

  // --- asteroides instanciados (3 formas) + cristales de mineral
  const detail = low ? 3 : 4;
  const rockGeos = [rockGeometry(1, detail), rockGeometry(2, detail), rockGeometry(3, detail)];
  const rockMat = pbr("#ffffff", { rough: 0.92, metal: 0.02, env: 0.25, rim: 0.55 }); rockMat.vertexColors = true;
  const N = Math.round((low ? 26 : 48) * density), r = rng(77);
  const rocks = [];
  // en anillo alrededor del recorrido (más alto que ancho: pantalla vertical), lejos de la línea de la cámara y de
  // las polaroids; los lejanos más grandes (profundidad)
  let tries = 0;
  while (rocks.length < N && tries++ < N * 20) {
    const along = -2 + r() * 36, th = r() * Math.PI * 2, rho = 1.25 + Math.pow(r(), 1.3) * 5;
    const lat = Math.cos(th) * rho * 0.75, up = Math.sin(th) * rho * 1.25 + 0.3;
    const pos = anchor.clone().addScaledVector(dir, along).addScaledVector(lateral, lat).add(new THREE.Vector3(0, up, 0));
    if (items.some((it) => it.home.distanceTo(pos) < 1.3)) continue;
    const far = (rho - 1.25) / 5, size = (0.07 + Math.pow(r(), 2.4) * 0.42) * (1 + far * 2.2);
    rocks.push({ pos, size, shape: rocks.length % 3, rot: new THREE.Euler(r() * 6, r() * 6, r() * 6), spin: new THREE.Vector3((r() - 0.5) * 0.3, (r() - 0.5) * 0.4, (r() - 0.5) * 0.2), bob: r() * 6 });
  }
  const inst = rockGeos.map((g, s) => { const m = new THREE.InstancedMesh(g, rockMat, rocks.filter((x) => x.shape === s).length); m.frustumCulled = false; group.add(m); return m; });
  const crystalGeo = new THREE.OctahedronGeometry(1, 0); crystalGeo.scale(0.5, 1.4, 0.5);
  const crystalMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }); // brillo propio, color por instancia
  rocks.forEach((rk, k) => { rk.crystal = rk.shape === 0 && k % 2 === 0; });
  const crystalOwners = rocks.filter((rk) => rk.crystal);
  const crystals = new THREE.InstancedMesh(crystalGeo, crystalMat, Math.max(2, crystalOwners.length * 2)); crystals.frustumCulled = false; group.add(crystals);
  const crystalCols = [new THREE.Color("#9FF3FF"), new THREE.Color("#FFB3C6"), new THREE.Color("#FFE3A3")];
  for (let k = 0; k < crystals.count; k++) crystals.setColorAt(k, crystalCols[k % 3]);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3(), O = new THREE.Vector3(), Qc = new THREE.Quaternion();
  function updateRocks(t) {
    const idx = [0, 0, 0];
    let ci = 0;
    for (const rk of rocks) {
      E.set(rk.rot.x + t * rk.spin.x, rk.rot.y + t * rk.spin.y, rk.rot.z + t * rk.spin.z); Q.setFromEuler(E);
      P.copy(rk.pos); P.y += Math.sin(t * 0.3 + rk.bob) * 0.08 * (1 + rk.size);
      M.compose(P, Q, S.setScalar(rk.size)); inst[rk.shape].setMatrixAt(idx[rk.shape]++, M);
      if (rk.crystal && ci < crystals.count - 1) {
        for (const a of [0, 1]) {
          O.set(a ? 0.45 : -0.3, 0.72, a ? 0.35 : -0.25).normalize().multiplyScalar(0.8).applyQuaternion(Q).multiplyScalar(rk.size).add(P);
          Qc.setFromEuler(E.set(a ? 0.35 : -0.4, 0, a ? -0.3 : 0.45)).premultiply(Q);
          M.compose(O, Qc, S.setScalar(rk.size * (a ? 0.55 : 0.4))); crystals.setMatrixAt(ci++, M);
        }
      }
    }
    for (let k = ci; k < crystals.count; k++) crystals.setMatrixAt(k, M.makeScale(0, 0, 0));
    inst.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    crystals.instanceMatrix.needsUpdate = true;
  }
  updateRocks(0);

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
      updateRocks(t);
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
