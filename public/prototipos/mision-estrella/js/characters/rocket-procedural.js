// Cohete hecho con código (se puede reemplazar por un GLB desde models.js).
// Panzón y redondo, "juguete de colección": casco con paneles, costuras y remaches (textura + normal map
// generados en canvas), franjas pintadas, emblema con la edad, punta del color del tema y remate dorado, ventana con
// marco y tornillos (es también la escotilla), tres aletas con filo dorado y patas, propulsores de maniobra,
// tobera con anillos y un panel pintado en el lado +X para el mural de la tripulación.
// Materiales PBR suaves con reflejo de estudio (studioEnv) + luz de borde de la escena.
// Altura ≈ 4.6 (tobera en y = -0.4, punta en y ≈ 3.95). Piezas con nombre: body, nose, window, window_frame,
// hatch, fins, nozzle, mural_area.
import * as THREE from "three";
import { addRim, glassMaterial, STUDIO, onTheme, themed } from "../scene/materials.js";
import { demoData } from "../data.js";

// Escotilla de salida (al frente, +Z): centro en y = HATCH_Y y paso libre de radio HATCH_R. El astronauta sale por
// ella en pose "fly" (su silueta de frente cabe en un círculo de radio 0.51; ancho con brazos 0.85): diámetro de paso
// 1.2 = 1.41 × ese ancho. La tapa y sus herrajes son los de la ventana original escalados en proporción.
export const HATCH_Y = 2.05, HATCH_R = 0.6, HATCH_TILT = 0.12; // tilt: la escotilla sigue la pendiente del casco
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
// Colores del tema (themes.js): franja baja y emblema = primario, franja alta y marco del mural = secundario,
// filetes y estrellitas = dorado del tema. Al cambiar de tema sólo se repinta el color (el relieve no cambia).
function hullTextures({ bodyColor }) {
  const S = 1024;
  const col = document.createElement("canvas"); col.width = col.height = S;
  const hgt = document.createElement("canvas"); hgt.width = hgt.height = S;
  const c0 = col.getContext("2d"), h0 = hgt.getContext("2d", { willReadFrequently: true });
  const sink = document.createElement("canvas").getContext("2d"); // relieve descartado al repintar sólo el color
  let map = null, normalMap = null;
  onTheme((T) => {
    paintHull(c0, map ? sink : h0, T.hex, bodyColor, S);
    if (!map) {
      normalFromHeight(h0, S);
      map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.wrapS = THREE.RepeatWrapping;
      normalMap = new THREE.CanvasTexture(hgt); normalMap.wrapS = THREE.RepeatWrapping;
    } else map.needsUpdate = true;
  });
  return { map, normalMap };
}
function paintHull(c, hc, th, bodyColor, S) {
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
    c.fillStyle = th.gold; c.fillRect(0, a - 5, S, 3); c.fillRect(0, b + 2, S, 3);
    hc.fillStyle = "#8A8A8A"; hc.fillRect(0, a, S, b - a);
  };
  band(0.45, 0.62, th.primary);
  band(2.86, 2.93, th.secondary);
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
  c.strokeStyle = th.secondary; c.lineWidth = 4; c.setLineDash([10, 7]); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#3B2A7A"; c.font = "600 24px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("TRIPULACIÓN", mu, mt + 22);
  // emblema con la edad bajo la escotilla (u = 0, cruza el borde de la textura: se dibuja a ambos lados); más abajo y
  // un poco más chico que antes para dejar aire bajo el marco de la escotilla grande
  const ey = Y(1.05), er = 40 / 46;
  for (const ex of [0, S]) {
    c.fillStyle = th.gold; c.beginPath(); c.arc(ex, ey, 46 * er, 0, Math.PI * 2); c.fill();
    c.fillStyle = th.primary; c.beginPath(); c.arc(ex, ey, 39 * er, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#FFF7EC"; c.font = `600 ${Math.round(50 * er)}px Fredoka, system-ui, sans-serif`; c.fillText(String(demoData.child.age), ex, ey + 2);
    c.strokeStyle = "#FFF7EC"; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.arc(ex, ey, 34 * er, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    hc.fillStyle = "#8C8C8C"; hc.beginPath(); hc.arc(ex, ey, 46 * er, 0, Math.PI * 2); hc.fill();
  }
  // estrellitas pintadas junto a la franja
  c.fillStyle = th.gold;
  for (let k = 0; k < 10; k++) { const x = (k / 10 + 0.05) * S, y = Y(0.75); c.beginPath(); for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 - Math.PI / 2, rr = j % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
}
/** Normal map a partir de la altura (una sola vez). */
function normalFromHeight(hc, S) {
  const src = hc.getImageData(0, 0, S, S).data, nm = hc.createImageData(S, S);
  const H = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * 3.2, dy = (H(x, y + 1) - H(x, y - 1)) * 3.2;
    const l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
    nm.data[i] = (-dx / l * 0.5 + 0.5) * 255; nm.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; nm.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; nm.data[i + 3] = 255;
  }
  hc.putImageData(nm, 0, 0);
}

/* ---------- Materiales PBR suaves ---------- */
function pbr(color, { rough = 0.45, metal = 0.05, map = null, normalMap = null, emissive = null, ei = 0, rim = 0.5, env = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map, normalMap });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei; }
  if (STUDIO.texture) { m.envMap = STUDIO.texture; m.envMapIntensity = env; }
  return addRim(m, rim);
}

const _q = new THREE.Quaternion(), _s = new THREE.Vector3();
/* ---------- Escotilla: vidrio de ojo de buey ---------- */
function porthole() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { tint: { value: new THREE.Color("#CFE9FF") } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: /* glsl */`
      uniform vec3 tint; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vec2 p = vUv * 2.0 - 1.0; float r = length(p);
        float d = p.x * 0.7071 + p.y * 0.7071;
        float s1 = smoothstep(0.17, 0.0, abs(d - 0.34)) * (1.0 - smoothstep(0.62, 0.95, r)); // reflejo ancho
        float s2 = smoothstep(0.05, 0.0, abs(d - 0.05)) * (1.0 - smoothstep(0.55, 0.9, r)) * 0.8; // reflejo fino
        float edge = smoothstep(0.7, 1.0, r);
        float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float hl = clamp(s1 * 0.55 + s2 * 0.6, 0.0, 1.0);
        vec3 col = mix(tint, vec3(1.0), hl);
        gl_FragColor = vec4(col, 0.13 + edge * 0.28 + hl * 0.55 + fr * 0.25);
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- Cabina ---------- */
/** Pared de la cabina (vuelta completa, u = 0.5 al fondo): crema cálida más clara al fondo y arriba (la luz ya
 * pintada), paneles lavanda con costuras y remaches, franja coral con filete dorado. */
function cabinTexture() {
  const W = 1024, H = 512, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  const gx = c.createLinearGradient(0, 0, W, 0);
  gx.addColorStop(0, "#D9B09E"); gx.addColorStop(0.3, "#F2D2BC"); gx.addColorStop(0.5, "#FFEAD6"); gx.addColorStop(0.7, "#F2D2BC"); gx.addColorStop(1, "#D9B09E");
  c.fillStyle = gx; c.fillRect(0, 0, W, H);
  const gy = c.createLinearGradient(0, 0, 0, H); gy.addColorStop(0, "rgba(255,246,232,.35)"); gy.addColorStop(0.55, "rgba(255,240,225,0)"); gy.addColorStop(1, "rgba(110,60,80,.28)");
  c.fillStyle = gy; c.fillRect(0, 0, W, H);
  const lamp = c.createRadialGradient(W * 0.5, H * 0.2, 4, W * 0.5, H * 0.2, W * 0.2); lamp.addColorStop(0, "rgba(255,214,160,.45)"); lamp.addColorStop(1, "rgba(255,214,160,0)");
  c.fillStyle = lamp; c.fillRect(0, 0, W, H);
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const rivet = (x, y) => { c.fillStyle = "rgba(120,85,110,.45)"; c.beginPath(); c.arc(x + 1, y + 1, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(x - 0.5, y - 0.5, 2.6, 0, Math.PI * 2); c.fill(); };
  const cols = 16, bands = [[0.07, 0.5], [0.62, 0.93]];
  for (let k = 0; k < cols; k++) for (const [a, b] of bands) {
    const x = (k / cols) * W + 7, y = a * H, w = W / cols - 14, h = (b - a) * H;
    rr(x, y, w, h, 12); c.fillStyle = "rgba(196,176,228,.16)"; c.fill();
    c.strokeStyle = "rgba(130,95,125,.38)"; c.lineWidth = 3; c.stroke();
    c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 1.2; rr(x + 2, y + 2, w - 4, h - 4, 10); c.stroke();
    for (const [rx, ry] of [[x + 10, y + 10], [x + w - 10, y + 10], [x + 10, y + h - 10], [x + w - 10, y + h - 10]]) rivet(rx, ry);
  }
  c.fillStyle = "#FF9C8F"; c.fillRect(0, H * 0.535, W, H * 0.05);
  c.fillStyle = "#F4C45E"; c.fillRect(0, H * 0.528, W, 4); c.fillRect(0, H * 0.585, W, 4);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
  return t;
}

function createCabin({ wy, steel, gold, dark }) {
  const group = new THREE.Group(); group.name = "cabin";
  const y0 = wy - 0.85, y1 = wy + 0.72, IN = 0.09;
  const prof = []; for (let k = 0; k <= 16; k++) { const y = y0 + (k / 16) * (y1 - y0); prof.push(new THREE.Vector2(bodyRadiusAt(y) - IN, y)); }
  // (BackSide: la pared cercana a la escotilla no tapa la vista; sólo se ve la curva del fondo)
  const wall = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), new THREE.MeshBasicMaterial({ map: cabinTexture(), side: THREE.BackSide })); group.add(wall);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(bodyRadiusAt(y0) - IN, 40), new THREE.MeshBasicMaterial({ color: "#B58C8C" })); floor.rotation.x = -Math.PI / 2; floor.position.y = y0; group.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(bodyRadiusAt(y1) - IN, 40), new THREE.MeshBasicMaterial({ color: "#F6DFCB" })); ceil.rotation.x = Math.PI / 2; ceil.position.y = y1; group.add(ceil);
  // asiento acolchado al fondo (cojín, rodillo al frente, respaldo con dos rodillos y cabecera) sobre un pedestal
  const pad = pbr("#FF9FA8", { rough: 0.85, metal: 0, emissive: "#5a2630", ei: 0.18, rim: 0.2, env: 0.3 });
  const sx = 0.08, sz = -0.52, sy = y0 + 0.36;
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, sy - y0, 12), steel); ped.position.set(sx, (sy + y0) / 2, sz); group.add(ped);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.4), pad); cushion.position.set(sx, sy + 0.05, sz); group.add(cushion);
  const roll = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.44, 4, 12), pad); roll.rotation.z = Math.PI / 2; roll.position.set(sx, sy + 0.08, sz + 0.2); group.add(roll);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.1), pad); back.position.set(sx, sy + 0.42, sz - 0.24); back.rotation.x = 0.12; group.add(back);
  for (const dx of [-0.15, 0.15]) { const r2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.4, 4, 12), pad); r2.position.set(sx + dx, sy + 0.42, sz - 0.18); r2.rotation.x = 0.12; group.add(r2); }
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 12), pad); head.rotation.z = Math.PI / 2; head.position.set(sx, sy + 0.8, sz - 0.26); group.add(head);
  // tablero a la izquierda, inclinado hacia la escotilla: pantallita y botones de colores que parpadean
  const board = new THREE.Group(); board.position.set(-0.46, y0 + 0.5, -0.5); board.rotation.set(-0.55, 0.75, 0, "YXZ"); group.add(board);
  board.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.07), pbr("#5A4C8C", { rough: 0.5, metal: 0.2, emissive: "#1c1640", ei: 0.4 })));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.09), new THREE.MeshBasicMaterial({ color: "#7FE3F0", toneMapped: false })); scr.position.set(-0.1, 0.03, 0.037); board.add(scr);
  const btnCols = ["#FF6F8A", "#6FE0F0", "#FFD25E", "#8BF0A8"].map((c) => new THREE.Color(c));
  const btnMats = btnCols.map((c) => new THREE.MeshBasicMaterial({ color: c.clone(), toneMapped: false }));
  const btnGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12).rotateX(Math.PI / 2);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(btnGeo, btnMats[k % 4]); b.position.set(0.04 + (k % 3) * 0.055, 0.045 - Math.floor(k / 3) * 0.07, 0.04); board.add(b); }
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6), steel); lever.position.set(-0.1, -0.07, 0.07); lever.rotation.x = 0.6; board.add(lever);
  const leverK = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), btnMats[0]); leverK.position.set(-0.1, -0.035, 0.1); board.add(leverK);
  // agarradera dorada en la pared derecha
  const grab = new THREE.Group(); grab.position.set(0.52, wy + 0.05, -0.55); grab.rotation.y = Math.atan2(-0.52, 0.55); group.add(grab); // (de frente al centro)
  const bar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.017, 8, 20, Math.PI), gold); bar.rotation.z = Math.PI / 2; bar.position.z = 0.02; grab.add(bar);
  for (const y of [-0.1, 0.1]) { const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.05, 10).rotateX(Math.PI / 2), steel); stud.position.set(0, y, 0); grab.add(stud); }
  // aplique en la pared del fondo, arriba: soporte, aro dorado y foquito cálido pequeño (se ve como lámpara)
  const lamp = new THREE.Group(); lamp.position.set(sx, y1 - 0.2, -(bodyRadiusAt(y1 - 0.2) - IN) + 0.08); group.add(lamp);
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.08), steel); bracket.position.z = -0.04; lamp.add(bracket);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16).rotateX(Math.PI / 2), steel); plate.position.z = -0.005; lamp.add(plate);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); shade.position.set(0, 0.012, 0.035); lamp.add(shade); // pantallita arriba
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), new THREE.MeshBasicMaterial({ color: "#FFF1C8", toneMapped: false })); bulb.position.set(0, -0.012, 0.045); lamp.add(bulb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20), gold); ring.rotation.x = Math.PI / 2; ring.position.set(0, -0.012, 0.045); lamp.add(ring); // aro que rodea el foco
  // luz cálida pequeña (alcance corto: sólo la cabina y lo que está en la escotilla)
  const light = new THREE.PointLight("#FFC98A", 2.2, 2.0, 2); light.position.set(0, wy + 0.3, -0.25); group.add(light);
  return {
    group,
    update(t) {
      for (let k = 0; k < 4; k++) { const on = ((t * (0.9 + k * 0.23) + k * 0.37) % 1) < 0.55; btnMats[k].color.copy(btnCols[k]).multiplyScalar(on ? 1 : 0.32); }
      scr.material.color.setRGB(0.5, 0.89, 0.94).multiplyScalar(0.85 + 0.15 * Math.sin(t * 5));
    }
  };
}

export function createProceduralRocket({ bodyColor = "#FFF7EC" } = {}) {
  const root = new THREE.Group(); root.name = "rocket";
  const tex = hullTextures({ bodyColor });
  const hullMat = pbr("#F2EDF6", { rough: 0.5, map: tex.map, normalMap: tex.normalMap, env: 0.55 });
  hullMat.normalScale = new THREE.Vector2(0.7, 0.7);
  // abertura real en el casco detrás de la escotilla: por ahí se ve la cabina y sale el astronauta (un poco mayor que
  // el collarín, que tapa el borde del corte)
  const WIN_Y = HATCH_Y, WIN_R = HATCH_R + 0.06, prevOBC = hullMat.onBeforeCompile;
  hullMat.onBeforeCompile = (sh, r) => {
    prevOBC?.(sh, r);
    sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 vObjP;\nvoid main() {\n  vObjP = position;");
    sh.fragmentShader = sh.fragmentShader.replace("void main() {", `varying vec3 vObjP;\nvoid main() {\n  if (vObjP.z > 0.3 && length(vec2(vObjP.x, vObjP.y - ${WIN_Y.toFixed(2)})) < ${WIN_R.toFixed(3)}) discard;`);
  };
  hullMat.customProgramCacheKey = () => "rim-hull-window";
  // colores del tema: punta y aletas = primario; remates dorados = dorado del tema (un poco más cálido: metal);
  // perilla de la escotilla = acento
  const gold = themed(pbr("#FFC96B", { rough: 0.32, metal: 0.7, emissive: "#6a4a10", ei: 0.12, env: 1, rim: 0.4 }), "gold");
  const accent = themed(pbr("#3D6BE0", { rough: 0.38, metal: 0.05, env: 0.6 }), "primary");
  const knobMat = themed(pbr("#FF9A4D", { rough: 0.38, metal: 0.05, env: 0.6 }), "accent");
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

  // escotilla al frente (+Z): marco dorado con remaches, collarín que entra al casco (el casco es curvo: sin él se
  // vería una rendija entre el marco plano y la superficie a los lados), tapa de vidrio con bisagra a la izquierda
  const wy = HATCH_Y, wr = bodyRadiusAt(wy), R = HATCH_R, K = R / 0.305; // K: escala de la tapa original (paso 0.305)
  const FT = 0.085, FR = R + FT; // tubo y radio del marco: su borde interior es el paso libre
  const windowGroup = new THREE.Group(); windowGroup.position.set(0, wy, wr - 0.02); windowGroup.rotation.x = -HATCH_TILT; root.add(windowGroup);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(FR, FT, 18, 96), gold); frame.name = "window_frame"; frame.position.z = 0.03; windowGroup.add(frame);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(R + 0.01, 0.022, 8, 80), dark); inner.position.z = -0.02; windowGroup.add(inner);
  const coaming = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.46, 72, 1, true), pbr("#8E86B8", { rough: 0.5, metal: 0.45, env: 0.8, rim: 0.3 }));
  coaming.material.side = THREE.DoubleSide; coaming.rotation.x = Math.PI / 2; coaming.position.z = -0.2; windowGroup.add(coaming);
  const boltGeo = new THREE.SphereGeometry(0.03, 10, 8);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, b = new THREE.Mesh(boltGeo, steel); b.position.set(Math.cos(a) * FR, Math.sin(a) * FR, 0.03 + FT * 0.92); windowGroup.add(b); }
  // tapa y herrajes: los de la ventana original, escalados K en un grupo (bisagra, aro, cierre con perilla)
  const door = new THREE.Group(); door.scale.setScalar(K); windowGroup.add(door);
  const hatchPivot = new THREE.Group(); hatchPivot.position.set(-0.36, 0, 0.04); door.add(hatchPivot); // bisagra a la izquierda
  // vidrio de ojo de buey: tinte celeste leve, dos reflejos diagonales y borde más denso (se lee como vidrio cerrado
  // aun de frente, y deja ver la cabina iluminada)
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.33, 48), porthole()); hatch.name = "hatch"; hatch.position.x = 0.36; hatch.renderOrder = 3; hatchPivot.add(hatch);
  // aro dorado de la tapa, visible dentro del marco (cerrada: "tapa dorada con vidrio"; abierta: gira con ella)
  const doorRim = new THREE.Mesh(new THREE.TorusGeometry(0.292, 0.03, 10, 64), gold); doorRim.position.set(0.36, 0, 0.012); hatchPivot.add(doorRim);
  const latch = new THREE.Group(); latch.position.set(0.66, 0, 0.03); hatchPivot.add(latch);
  latch.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.03), steel));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), knobMat); knob.position.z = 0.03; latch.add(knob);
  for (const y of [-0.09, 0.09]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), steel); k.position.set(-0.38, y, 0.06); door.add(k); }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), gold); pin.position.set(-0.38, 0, 0.06); door.add(pin);
  const seal = new THREE.Mesh(new THREE.TorusGeometry(R + 0.025, 0.018, 8, 80), dark); seal.position.z = 0.045 + FT * 0.5; windowGroup.add(seal);
  // cabina acogedora (se ve sólo por la escotilla: sigue el casco por dentro, 9 cm hacia adentro, así que nunca asoma
  // por fuera): pared curva con paneles, remaches y franja, luz cálida suave ya pintada en la textura (sin costo de
  // luces), piso y techo; asiento acolchado al fondo, tablero con botones que parpadean, agarradera y un aplique
  // pequeño con marco. Una sola luz puntual pequeña y cálida (alcance corto) para el astronauta y Gloobi.
  const cab = createCabin({ wy, steel, gold, dark });
  root.add(cab.group);

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
    root, kind: "procedural", slots, windowGroup, hatchPivot, cabin: cab.group, mural,
    // (la cabina iluminada siempre se ve por la escotilla, abierta o a través del vidrio)
    setInterior() {},
    /** Lucecitas del tablero. */
    update(t) { cab.update(t); },
    nozzleY: -0.4,
    boosters: [new THREE.Vector3(0, -0.4, 0)], // de dónde sale el humo (un GLB puede tener varios)
    windowWorld(out = new THREE.Vector3()) { return windowGroup.getWorldPosition(out); },
    /** Escotilla en el mundo: centro (plano del marco) y normal hacia afuera; devuelve el radio de paso libre. */
    hatchWorld(center = new THREE.Vector3(), normal = new THREE.Vector3()) {
      windowGroup.getWorldPosition(center);
      normal.set(0, 0, 1).applyQuaternion(windowGroup.getWorldQuaternion(_q));
      return HATCH_R * windowGroup.getWorldScale(_s).x;
    },
    setHatch(open) { hatchPivot.rotation.y = -open * 1.9; }
  };
}
