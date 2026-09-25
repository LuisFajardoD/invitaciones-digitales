// Cohete PROVISIONAL hecho con código (se reemplaza por un GLB desde models.js).
// Panzón y redondo, de juguete: punta con accentColor, ventana circular con marco dorado (es también la
// escotilla), tres aletas curvas, tobera y un mural lateral (lado +X) para los parches de la tripulación.
// Altura ≈ 4.6 (tobera en y = -0.4, punta en y = 3.9). Piezas con nombre: nose, window, window_frame, hatch,
// fins, nozzle, mural_area. Ver model-adapter.js para usar un GLB.
import * as THREE from "three";
import { vinyl, glassMaterial } from "../scene/materials.js";

// Perfil del cuerpo (radio, y)
const BODY = [[0.001, 0], [0.5, 0.02], [0.82, 0.25], [0.99, 0.75], [1.05, 1.45], [1.0, 2.15], [0.84, 2.75], [0.58, 3.2]];
const NOSE = [[0.58, 3.2], [0.42, 3.5], [0.22, 3.76], [0.001, 3.88]];
export function bodyRadiusAt(y) {
  for (let i = 0; i < BODY.length - 1; i++) { const [r0, y0] = BODY[i], [r1, y1] = BODY[i + 1]; if (y >= y0 && y <= y1) return r0 + (r1 - r0) * ((y - y0) / (y1 - y0)); }
  return 0.58;
}
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

export function createProceduralRocket({ bodyColor = "#FFF7EC", accentColor = "#FF8FA3" } = {}) {
  const root = new THREE.Group(); root.name = "rocket";
  const body = new THREE.Mesh(lathe(BODY, 56), vinyl(bodyColor)); body.name = "body"; root.add(body);
  const nose = new THREE.Mesh(lathe(NOSE, 48), vinyl(accentColor)); nose.name = "nose"; root.add(nose);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.05, 10, 48), vinyl("#FFD27A", { emissive: new THREE.Color("#7a5412"), emissiveIntensity: 0.3 })); band.rotation.x = Math.PI / 2; band.position.y = 3.2; root.add(band);
  const nozzle = new THREE.Mesh(lathe([[0.3, 0.05], [0.36, -0.12], [0.5, -0.38], [0.44, -0.4], [0.3, -0.2], [0.2, -0.05]], 32), vinyl("#8C84B8", { side: THREE.DoubleSide })); nozzle.name = "nozzle"; root.add(nozzle);
  // aletas curvas (forma extruida con bisel)
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.bezierCurveTo(0.35, 0.05, 0.62, -0.25, 0.7, -0.75); fin.bezierCurveTo(0.55, -0.72, 0.35, -0.55, 0.05, -0.45); fin.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 16 });
  finGeo.translate(0, 0, -0.04);
  const finMat = vinyl(accentColor);
  const fins = new THREE.Group(); fins.name = "fins"; root.add(fins);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 3; // ninguna aleta tapa la ventana (+Z) ni el mural (+X)
    const f = new THREE.Mesh(finGeo, finMat); f.position.set(Math.sin(a) * 0.82, 0.78, Math.cos(a) * 0.82); f.rotation.y = a - Math.PI / 2;
    fins.add(f);
  }
  // ventana / escotilla al frente (+Z)
  const wy = 2.2, wr = bodyRadiusAt(wy);
  const windowGroup = new THREE.Group(); windowGroup.position.set(0, wy, wr - 0.02); windowGroup.rotation.x = -0.12; root.add(windowGroup);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 12, 48), vinyl("#FFD27A", { emissive: new THREE.Color("#8a5f15"), emissiveIntensity: 0.35 })); frame.name = "window_frame"; frame.position.z = 0.03; windowGroup.add(frame);
  const inside = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), new THREE.MeshBasicMaterial({ color: "#2A2560" })); inside.position.z = -0.08; windowGroup.add(inside);
  const hatchPivot = new THREE.Group(); hatchPivot.position.set(-0.36, 0, 0.04); windowGroup.add(hatchPivot); // bisagra a la izquierda
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), glassMaterial({ tint: "#9FD8FF", strength: 1.15 })); hatch.name = "hatch"; hatch.position.x = 0.36; hatch.renderOrder = 3; hatchPivot.add(hatch);
  const hatchBack = new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), new THREE.MeshBasicMaterial({ color: "#3B2A7A", transparent: true, opacity: 0.35, depthWrite: false })); hatchBack.position.set(0.36, 0, -0.005); hatchPivot.add(hatchBack);
  // interior oscuro (para ver al astronauta por la ventana en el capítulo final)
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), new THREE.MeshBasicMaterial({ color: "#1A1640", side: THREE.BackSide })); cabin.position.set(0, wy, wr - 0.55); root.add(cabin);
  // zona del mural (lado +X): marco sutil + rótulo
  const mural = new THREE.Group(); mural.name = "mural_area"; root.add(mural);
  const slots = [];
  const rows = [1.75, 1.2], cols = [-0.42, 0, 0.42];
  rows.forEach((y) => cols.forEach((a) => {
    const r = bodyRadiusAt(y) + 0.012, ang = Math.PI / 2 + a;
    const pos = new THREE.Vector3(Math.sin(ang) * r, y, Math.cos(ang) * r);
    const n = new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    slots.push({ pos, normal: n, quat: q });
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
