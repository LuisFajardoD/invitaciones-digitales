// Cohete hecho con código (se puede reemplazar por un GLB desde models.js).
// Panzón y redondo, "juguete de colección": casco con paneles, costuras y remaches (textura + normal map
// generados en canvas), franjas pintadas, emblema con la edad, punta con accentColor y remate dorado, ventana con
// marco y tornillos (es también la escotilla), tres aletas con filo dorado y patas, propulsores de maniobra,
// tobera con anillos y un panel pintado en el lado +X para el mural de la tripulación.
// Materiales PBR suaves con reflejo de estudio (studioEnv) + luz de borde de la escena.
// Altura ≈ 4.6 (tobera en y = -0.4, punta en y ≈ 3.95). Piezas con nombre: body, nose, window, window_frame,
// hatch, fins, nozzle, mural_area.
import * as THREE from "three";
import { addRim, glassMaterial, STUDIO } from "../scene/materials.js";
import { demoData } from "../data.js";

// Perfil del cuerpo (radio, y) → curva suave con puntos equiespaciados (la textura no se estira)
const BODY = [[0.001, 0], [0.5, 0.02], [0.82, 0.25], [0.99, 0.75], [1.05, 1.45], [1.0, 2.15], [0.84, 2.75], [0.58, 3.2]];
const NOSE = [[0.58, 3.2], [0.42, 3.5], [0.22, 3.76], [0.001, 3.88]];
const curve = new THREE.CatmullRomCurve3(BODY.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, "centripetal");
const PROFILE = curve.getSpacedPoints(90).map((p) => new THREE.Vector2(Math.max(0.001, p.x), p.y));
PROFILE[0].set(0.001, 0);
export function bodyRadiusAt(y) {
  for (let i = 0; i < PROFILE.length - 1; i++) { const a = PROFILE[i], b = PROFILE[i + 1]; if (y >= a.y && y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / Math.max(1e-6, b.y - a.y)); }
  return 0.58;
}
/** v de la textura (0 abajo, 1 arriba) para una altura y. */
function vForY(y) {
  for (let i = 0; i < PROFILE.length - 1; i++) { const a = PROFILE[i], b = PROFILE[i + 1]; if (y >= a.y && y <= b.y) return (i + (y - a.y) / Math.max(1e-6, b.y - a.y)) / (PROFILE.length - 1); }
  return y <= 0 ? 0 : 1;
}

/* ---------- Texturas del casco: color + altura (→ normal map) ---------- */
function hullTextures({ bodyColor, accentColor }) {
  const S = 1024;
  const col = document.createElement("canvas"); col.width = col.height = S;
  const hgt = document.createElement("canvas"); hgt.width = hgt.height = S;
  const c = col.getContext("2d"), hc = hgt.getContext("2d", { willReadFrequently: true });
  const Y = (y) => (1 - vForY(y)) * S; // y del cohete → y del canvas
  // base con degradado suave y un poco de hollín abajo
  const g = c.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.45, bodyColor); g.addColorStop(0.9, "#EFE6F0"); g.addColorStop(1, "#C9BFD6");
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  hc.fillStyle = "#808080"; hc.fillRect(0, 0, S, S);
  // franjas pintadas (con filete dorado) — altura ligeramente elevada (pintura)
  const band = (y0, y1, color) => {
    const a = Y(y1), b = Y(y0);
    c.fillStyle = color; c.fillRect(0, a, S, b - a);
    c.fillStyle = "#FFD27A"; c.fillRect(0, a - 5, S, 3); c.fillRect(0, b + 2, S, 3);
    hc.fillStyle = "#8A8A8A"; hc.fillRect(0, a, S, b - a);
  };
  band(0.45, 0.62, accentColor);
  band(2.86, 2.93, accentColor);
  // costuras de paneles (horizontales + verticales alternadas, como ladrillos) con remaches
  const seamsY = [0.3, 0.95, 1.95, 2.6, 3.05].map(Y);
  const seam = (x0, y0, x1, y1) => {
    c.strokeStyle = "rgba(90,80,130,.35)"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 1.5, y0 + 1.5); c.lineTo(x1 + 1.5, y1 + 1.5); c.stroke();
    hc.strokeStyle = "#2a2a2a"; hc.lineWidth = 5; hc.beginPath(); hc.moveTo(x0, y0); hc.lineTo(x1, y1); hc.stroke();
  };
  const rivets = (x0, y0, x1, y1, step = 18, off = 9) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / step);
    for (let k = 0; k <= n; k++) {
      const t = k / Math.max(1, n), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (const s of [-1, 1]) {
        const px = x1 === x0 ? x + s * off : x, py = y1 === y0 ? y + s * off : y;
        const rg = hc.createRadialGradient(px, py, 0, px, py, 4.5); rg.addColorStop(0, "#e0e0e0"); rg.addColorStop(1, "#808080");
        hc.fillStyle = rg; hc.beginPath(); hc.arc(px, py, 4.5, 0, Math.PI * 2); hc.fill();
        c.fillStyle = "rgba(120,110,160,.28)"; c.beginPath(); c.arc(px + 0.8, py + 0.8, 2.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(px - 0.6, py - 0.6, 1.6, 0, Math.PI * 2); c.fill();
      }
    }
  };
  seamsY.forEach((y) => { seam(0, y, S, y); rivets(0, y, S, y, 22, 8); });
  for (let r = 0; r < seamsY.length - 1; r++) {
    const cols = 8, shift = r % 2 ? 0.5 : 0;
    for (let k = 0; k < cols; k++) { const x = ((k + shift) / cols) * S; seam(x, seamsY[r], x, seamsY[r + 1]); }
  }
  // panel del mural (lado +X, u ≈ 0.25): marco pintado con puntada y rótulo
  const mu = 0.25 * S, mw = 0.2 * S, mt = Y(2.05), mb = Y(0.98);
  c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.roundRect ? c.roundRect(mu - mw / 2, mt, mw, mb - mt, 22) : c.rect(mu - mw / 2, mt, mw, mb - mt); c.fill();
  c.strokeStyle = "rgba(185,162,255,.9)"; c.lineWidth = 4; c.setLineDash([10, 7]); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#3B2A7A"; c.font = "600 24px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("TRIPULACIÓN", mu, mt + 22);
  // emblema con la edad bajo la ventana (u = 0, cruza el borde de la textura: se dibuja a ambos lados)
  const ey = Y(1.45);
  for (const ex of [0, S]) {
    c.fillStyle = "#FFD27A"; c.beginPath(); c.arc(ex, ey, 46, 0, Math.PI * 2); c.fill();
    c.fillStyle = accentColor; c.beginPath(); c.arc(ex, ey, 39, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#FFF7EC"; c.font = "600 50px Fredoka, system-ui, sans-serif"; c.fillText(String(demoData.child.age), ex, ey + 2);
    c.strokeStyle = "#FFF7EC"; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.arc(ex, ey, 34, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    hc.fillStyle = "#8C8C8C"; hc.beginPath(); hc.arc(ex, ey, 46, 0, Math.PI * 2); hc.fill();
  }
  // estrellitas pintadas junto a la franja
  c.fillStyle = "#FFD27A";
  for (let k = 0; k < 10; k++) { const x = (k / 10 + 0.05) * S, y = Y(0.75); c.beginPath(); for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
  // normal map a partir de la altura
  const src = hc.getImageData(0, 0, S, S).data, nm = hc.createImageData(S, S);
  const H = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * 3.2, dy = (H(x, y + 1) - H(x, y - 1)) * 3.2;
    const l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
    nm.data[i] = (-dx / l * 0.5 + 0.5) * 255; nm.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; nm.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; nm.data[i + 3] = 255;
  }
  hc.putImageData(nm, 0, 0);
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.wrapS = THREE.RepeatWrapping;
  const normalMap = new THREE.CanvasTexture(hgt); normalMap.wrapS = THREE.RepeatWrapping;
  return { map, normalMap };
}

/* ---------- Materiales PBR suaves ---------- */
function pbr(color, { rough = 0.45, metal = 0.05, map = null, normalMap = null, emissive = null, ei = 0, rim = 0.5, env = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map, normalMap });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei; }
  if (STUDIO.texture) { m.envMap = STUDIO.texture; m.envMapIntensity = env; }
  return addRim(m, rim);
}

export function createProceduralRocket({ bodyColor = "#FFF7EC", accentColor = "#FF8FA3" } = {}) {
  const root = new THREE.Group(); root.name = "rocket";
  const tex = hullTextures({ bodyColor, accentColor });
  const hullMat = pbr("#F2EDF6", { rough: 0.5, map: tex.map, normalMap: tex.normalMap, env: 0.55 });
  hullMat.normalScale = new THREE.Vector2(0.7, 0.7);
  const gold = pbr("#FFC96B", { rough: 0.32, metal: 0.7, emissive: "#6a4a10", ei: 0.12, env: 1, rim: 0.4 });
  const accent = pbr(accentColor, { rough: 0.38, metal: 0.05, env: 0.6 });
  const steel = pbr("#9C95C4", { rough: 0.38, metal: 0.55, env: 1, rim: 0.4 });
  const dark = pbr("#3B3566", { rough: 0.5, metal: 0.3 });

  const body = new THREE.Mesh(new THREE.LatheGeometry(PROFILE, 96), hullMat); body.name = "body"; root.add(body);
  const nose = new THREE.Mesh(new THREE.LatheGeometry(NOSE.map(([r, y]) => new THREE.Vector2(r, y)), 64), accent); nose.name = "nose"; root.add(nose);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), gold); tip.position.y = 3.9; root.add(tip);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.05, 12, 64), gold); collar.rotation.x = Math.PI / 2; collar.position.y = 3.2; root.add(collar);
  const collar2 = new THREE.Mesh(new THREE.TorusGeometry(bodyRadiusAt(0.35) + 0.01, 0.035, 10, 64), gold); collar2.rotation.x = Math.PI / 2; collar2.position.y = 0.35; root.add(collar2);

  // tobera con anillos y resplandor interior
  const bell = [[0.28, 0.06], [0.3, -0.02], [0.36, -0.12], [0.44, -0.26], [0.52, -0.4], [0.49, -0.42], [0.42, -0.3], [0.33, -0.15], [0.22, -0.02]];
  const nozzle = new THREE.Mesh(new THREE.LatheGeometry(bell.map(([r, y]) => new THREE.Vector2(r, y)), 48), steel); nozzle.name = "nozzle"; nozzle.material.side = THREE.DoubleSide; root.add(nozzle);
  [[-0.14, 0.385], [-0.3, 0.47]].forEach(([y, r]) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 8, 48), gold); ring.rotation.x = Math.PI / 2; ring.position.y = y; root.add(ring); });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({ color: "#FFB38A", transparent: true, opacity: 0.55, toneMapped: false })); glow.rotation.x = Math.PI / 2; glow.position.y = -0.08; root.add(glow);

  // aletas curvas con filo dorado y pata redonda
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.bezierCurveTo(0.35, 0.05, 0.62, -0.25, 0.7, -0.75); fin.bezierCurveTo(0.55, -0.72, 0.35, -0.55, 0.05, -0.45); fin.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 24 });
  finGeo.translate(0, 0, -0.04);
  const edge = new THREE.CubicBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.35, 0.05, 0), new THREE.Vector3(0.62, -0.25, 0), new THREE.Vector3(0.7, -0.75, 0));
  const edgeGeo = new THREE.TubeGeometry(edge, 32, 0.035, 8, false);
  const fins = new THREE.Group(); fins.name = "fins"; root.add(fins);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 3; // ninguna aleta tapa la ventana (+Z) ni el mural (+X)
    const f = new THREE.Group(); f.position.set(Math.sin(a) * 0.82, 0.78, Math.cos(a) * 0.82); f.rotation.y = a - Math.PI / 2;
    f.add(new THREE.Mesh(finGeo, accent));
    f.add(new THREE.Mesh(edgeGeo, gold));
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), steel); pad.position.set(0.7, -0.78, 0); pad.scale.set(1.2, 0.7, 1.2); f.add(pad);
    fins.add(f);
  }
  // propulsores de maniobra (4 cápsulas con boquillas) cerca de la punta
  const rcsBody = new THREE.BoxGeometry(0.14, 0.2, 0.1), rcsNoz = new THREE.CylinderGeometry(0.025, 0.04, 0.06, 10);
  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((a) => {
    const g = new THREE.Group(), r = bodyRadiusAt(2.62);
    g.position.set(Math.sin(a) * r, 2.62, Math.cos(a) * r); g.rotation.y = a;
    const b = new THREE.Mesh(rcsBody, steel); b.position.z = 0.03; g.add(b);
    [-1, 1].forEach((s) => { const n = new THREE.Mesh(rcsNoz, dark); n.rotation.z = (s * Math.PI) / 2; n.position.set(s * 0.09, 0, 0.03); g.add(n); });
    root.add(g);
  });

  // ventana / escotilla al frente (+Z) con marco, tornillos y aro interior
  const wy = 2.2, wr = bodyRadiusAt(wy);
  const windowGroup = new THREE.Group(); windowGroup.position.set(0, wy, wr - 0.02); windowGroup.rotation.x = -0.12; root.add(windowGroup);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.065, 16, 64), gold); frame.name = "window_frame"; frame.position.z = 0.03; windowGroup.add(frame);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 8, 48), dark); inner.position.z = 0.01; windowGroup.add(inner);
  const boltGeo = new THREE.SphereGeometry(0.022, 10, 8);
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, b = new THREE.Mesh(boltGeo, steel); b.position.set(Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0.09); windowGroup.add(b); }
  const inside = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshBasicMaterial({ color: "#2A2560" })); inside.position.z = -0.08; windowGroup.add(inside);
  const hatchPivot = new THREE.Group(); hatchPivot.position.set(-0.36, 0, 0.04); windowGroup.add(hatchPivot); // bisagra a la izquierda
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), glassMaterial({ tint: "#9FD8FF", strength: 1.15 })); hatch.name = "hatch"; hatch.position.x = 0.36; hatch.renderOrder = 3; hatchPivot.add(hatch);
  const hatchBack = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), new THREE.MeshBasicMaterial({ color: "#3B2A7A", transparent: true, opacity: 0.35, depthWrite: false })); hatchBack.position.set(0.36, 0, -0.005); hatchPivot.add(hatchBack);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), steel); hinge.position.set(-0.38, 0, 0.06); windowGroup.add(hinge);
  // interior oscuro (para ver al astronauta por la ventana en el capítulo final)
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshBasicMaterial({ color: "#1A1640", side: THREE.BackSide })); cabin.position.set(0, wy, wr - 0.55); root.add(cabin);

  // mural (lado +X): posiciones sobre la superficie, dentro del panel pintado
  const mural = new THREE.Group(); mural.name = "mural_area"; root.add(mural);
  const slots = [];
  [1.75, 1.2].forEach((y) => [-0.42, 0, 0.42].forEach((a) => {
    const r = bodyRadiusAt(y) + 0.014, ang = Math.PI / 2 + a;
    const pos = new THREE.Vector3(Math.sin(ang) * r, y, Math.cos(ang) * r);
    const n = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
    slots.push({ pos, normal: n, quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n) });
  }));
  return {
    root, kind: "procedural", slots, windowGroup, hatchPivot, cabin, mural,
    // Oculta el fondo oscuro de la ventana para ver el interior (astronauta dentro o saliendo).
    setInterior(open) { inside.visible = !open; },
    nozzleY: -0.4,
    boosters: [new THREE.Vector3(0, -0.4, 0)], // de dónde sale el humo (un GLB puede tener varios)
    windowWorld(out = new THREE.Vector3()) { return windowGroup.getWorldPosition(out); },
    setHatch(open) { hatchPivot.rotation.y = -open * 1.9; }
  };
}
