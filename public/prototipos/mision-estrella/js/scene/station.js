// Capítulo 5: estación espacial amigable (acabado final, mismo universo que el cohete). Silueta compacta en "T"
// para el encuadre vertical: núcleo esférico con collares de acoplamiento, dos módulos cilíndricos con paneles,
// costuras, remaches y franja rosa (textura + normal map en canvas), ventanas con marco y luz cálida interior,
// escotillas redondas con volante, anillos de unión metálicos con pernos, módulo superior con cúpula, armazón
// (truss) de vigas que sube hasta las alas solares (celdas, marco y brazo articulado), plato parabólico y antena,
// luces de navegación roja/verde que parpadean y la pantalla holográfica del mapa del salón (proyector, haz de luz,
// líneas de escaneo suaves, borde brillante y leve parpadeo).
// Geometrías y materiales compartidos; vigas, pernos y celdas instanciados. En calidad baja: menos segmentos.
import * as THREE from "three";
import { pbr, canvasTex, halo, heightToNormal, rng, solarTexture } from "./materials.js";
import { modelOrBuild } from "../characters/rocket.js";
import { mapSVG } from "../ui/map.js";

function mapTexture() {
  const tex = canvasTex(1024, 640, (c) => { c.fillStyle = "#20306B"; c.fillRect(0, 0, 1024, 640); });
  const img = new Image();
  img.onload = () => { const c = tex.image.getContext("2d"); c.drawImage(img, 0, 0, 1024, 640); tex.needsUpdate = true; };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mapSVG())}`;
  return tex;
}

/** Casco de los módulos: color (casi blanco, lo tiñe el material) + normal map de costuras y remaches. */
function hullTextures() {
  const W = 1024, H = 512, r = rng(21);
  const col = document.createElement("canvas"); col.width = W; col.height = H;
  const hgt = document.createElement("canvas"); hgt.width = W; hgt.height = H;
  const c = col.getContext("2d"), hc = hgt.getContext("2d", { willReadFrequently: true });
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#FFFFFF"); g.addColorStop(1, "#F1ECF6");
  c.fillStyle = g; c.fillRect(0, 0, W, H); hc.fillStyle = "#808080"; hc.fillRect(0, 0, W, H);
  // desgaste sutil: manchitas lavanda muy suaves
  for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H, rr = 8 + r() * 30, gg = c.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, "rgba(150,130,190,.07)"); gg.addColorStop(1, "rgba(150,130,190,0)"); c.fillStyle = gg; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  // franja rosa con filete dorado (a lo largo del módulo: v ≈ 0.62)
  const by = H * 0.6;
  c.fillStyle = "#FF8FA3"; c.fillRect(0, by, W, 30); c.fillStyle = "#FFD27A"; c.fillRect(0, by - 5, W, 3); c.fillRect(0, by + 32, W, 3);
  hc.fillStyle = "#8a8a8a"; hc.fillRect(0, by, W, 30);
  // costuras: anillos (horizontales en la textura) y paneles alrededor (verticales)
  const seam = (x0, y0, x1, y1) => {
    c.strokeStyle = "rgba(95,80,140,.32)"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 1.5, y0 + 1.5); c.lineTo(x1 + 1.5, y1 + 1.5); c.stroke();
    hc.strokeStyle = "#2c2c2c"; hc.lineWidth = 5; hc.beginPath(); hc.moveTo(x0, y0); hc.lineTo(x1, y1); hc.stroke();
  };
  const rivet = (x, y) => {
    const rg = hc.createRadialGradient(x, y, 0, x, y, 4.2); rg.addColorStop(0, "#e2e2e2"); rg.addColorStop(1, "#808080");
    hc.fillStyle = rg; hc.beginPath(); hc.arc(x, y, 4.2, 0, Math.PI * 2); hc.fill();
    c.fillStyle = "rgba(120,105,165,.28)"; c.beginPath(); c.arc(x + 0.8, y + 0.8, 2.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(x - 0.6, y - 0.6, 1.4, 0, Math.PI * 2); c.fill();
  };
  const rows = [0.08, 0.36, 0.86].map((v) => v * H);
  rows.forEach((y) => { seam(0, y, W, y); for (let x = 10; x < W; x += 24) { rivet(x, y - 8); rivet(x, y + 8); } });
  for (let k = 0; k < 10; k++) { const x = (k / 10) * W; seam(x, rows[0], x, rows[1]); seam(x + W / 20, rows[1], x + W / 20, by - 6); seam(x, by + 36, x, rows[2]); }
  // rótulo amable en un panel
  c.fillStyle = "#6F5FB0"; c.font = "600 34px Fredoka, system-ui, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("ESTACIÓN GLOOBI", W * 0.25, H * 0.22);
  const map = new THREE.CanvasTexture(col); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; map.wrapS = THREE.RepeatWrapping;
  return { map, normalMap: heightToNormal(hgt, 3) };
}

export function createStation({ low = false } = {}) {
  const group = new THREE.Group(); group.name = "station-set";
  const S = low ? 0.55 : 1; // factor de segmentos
  const seg = (n) => Math.max(6, Math.round(n * S));
  const lights = [];
  const { holder } = modelOrBuild("station", () => {
    const root = new THREE.Group();
    const tex = hullTextures();
    const hull = pbr("#F6F1FA", { rough: 0.5, map: tex.map, normalMap: tex.normalMap, normalScale: 0.7, env: 0.55 });
    const hullLav = pbr("#DCD3F5", { rough: 0.5, map: tex.map, normalMap: tex.normalMap, normalScale: 0.7, env: 0.55 });
    const steel = pbr("#A49DCB", { rough: 0.36, metal: 0.6, env: 1, rim: 0.4 });
    const gold = pbr("#FFC96B", { rough: 0.3, metal: 0.7, emissive: "#6a4a10", ei: 0.12, env: 1, rim: 0.4 });
    const pink = pbr("#FF8FA3", { rough: 0.4, metal: 0.05, env: 0.6 });
    const cells = pbr("#ffffff", { rough: 0.28, metal: 0.35, map: solarTexture(), env: 1.3, emissive: "#1a2266", ei: 0.35, rim: 0.3 });
    const winGlow = new THREE.MeshBasicMaterial({ color: "#FFD9A0", toneMapped: false });
    const winGlass = pbr("#2E3470", { rough: 0.12, metal: 0.2, env: 1.4, emissive: "#FFB870", ei: 0.35 });

    // --- núcleo
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.95, seg(40), seg(28)), hull); hub.scale.set(1, 0.94, 1); root.add(hub);
    // --- módulos laterales (cilindro + tapas redondeadas)
    const modGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.25, seg(48), 1, true);
    const capGeo = new THREE.SphereGeometry(0.62, seg(40), seg(20), 0, Math.PI * 2, 0, Math.PI / 2);
    const ringGeo = new THREE.TorusGeometry(0.66, 0.07, seg(12), seg(48));
    const thinRing = new THREE.TorusGeometry(0.645, 0.025, 8, seg(48));
    for (const s of [-1, 1]) {
      const mod = new THREE.Group(); mod.position.x = s * 1.72; root.add(mod);
      const body = new THREE.Mesh(modGeo, s < 0 ? hull : hullLav); body.rotation.z = Math.PI / 2; body.rotation.x = s < 0 ? 0 : Math.PI; mod.add(body);
      const cap = new THREE.Mesh(capGeo, s < 0 ? hull : hullLav); cap.scale.set(1, 0.55, 1); cap.rotation.z = -s * Math.PI / 2; cap.position.x = s * 0.625; mod.add(cap);
      // anillos de unión (acero + filete dorado) en ambos extremos del cilindro
      for (const e of [-1, 1]) {
        const ring = new THREE.Mesh(ringGeo, steel); ring.rotation.y = Math.PI / 2; ring.position.x = e * 0.63; mod.add(ring);
        const g2 = new THREE.Mesh(thinRing, gold); g2.rotation.y = Math.PI / 2; g2.position.x = e * 0.54; mod.add(g2);
      }
      // escotilla redonda en la tapa, con volante
      const hatch = new THREE.Group(); hatch.position.x = s * 0.93; hatch.rotation.y = s * Math.PI / 2; mod.add(hatch);
      hatch.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.06, seg(28)).rotateX(Math.PI / 2), steel));
      const hw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, seg(24)), gold); hw.position.z = 0.05; hatch.add(hw);
      for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.022, 0.022), gold); sp.rotation.z = (k / 3) * Math.PI; sp.position.z = 0.05; hatch.add(sp); }
      // ventanas con marco y luz cálida (al frente)
      for (const wx of [-0.38, 0.12]) {
        const win = new THREE.Group(); win.position.set(wx, 0.08, 0.6); mod.add(win);
        const frame = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 8, seg(24)), steel); win.add(frame);
        const glass = new THREE.Mesh(new THREE.CircleGeometry(0.125, seg(24)), winGlass); glass.position.z = -0.005; win.add(glass);
        const inner = new THREE.Mesh(new THREE.CircleGeometry(0.075, seg(18)), winGlow); inner.position.z = -0.012; win.add(inner);
        if (!low) { const hl = halo("#FFCC88", 0.55, 0.35); hl.position.z = 0.05; win.add(hl); lights.push({ sprite: hl, kind: "win", ph: wx * 7 + s }); }
      }
      // luces de navegación: roja a la izquierda, verde a la derecha (en la punta)
      const nav = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: s < 0 ? "#FF5A6E" : "#6BFFB0", toneMapped: false }));
      nav.position.set(s * 0.72, 0.5, 0); mod.add(nav);
      const nh = halo(s < 0 ? "#FF5A6E" : "#6BFFB0", 0.9, 0.8); nh.position.copy(nav.position); mod.add(nh);
      lights.push({ sprite: nh, bulb: nav, kind: "nav", ph: s < 0 ? 0 : 0.5 });
    }
    // collares de acoplamiento en el núcleo
    for (const s of [-1, 1]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.3, seg(32)), steel); col.rotation.z = Math.PI / 2; col.position.x = s * 0.98; root.add(col); }
    // --- módulo superior con cúpula de observación
    const up = new THREE.Group(); up.position.y = 1.0; root.add(up);
    up.add(new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.7, seg(36)), hullLav).translateY(0.35));
    const upRing = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.05, 8, seg(36)), steel); upRing.rotation.x = Math.PI / 2; upRing.position.y = 0.72; up.add(upRing);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, seg(32), seg(16), 0, Math.PI * 2, 0, Math.PI / 2), winGlass); dome.position.y = 0.72; up.add(dome);
    for (let k = 0; k < 6; k++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.018, 6, seg(20), Math.PI / 2), steel); rib.rotation.y = (k / 6) * Math.PI * 2; rib.position.y = 0.72; up.add(rib); }
    // --- armazón (truss) que sube detrás hasta las alas solares: rieles + diagonales instanciados
    const trussH = 2.3, tz = -0.35, ty0 = 1.8, half = 0.2;
    const strut = new THREE.BoxGeometry(0.045, 1, 0.045);
    const bars = [];
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3();
    const bar = (p0, p1) => { d.subVectors(p1, p0); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); M.compose(a.addVectors(p0, p1).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1)); bars.push(M.clone()); };
    const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
    corners.forEach(([x, z]) => bar(new THREE.Vector3(x, ty0, tz + z), new THREE.Vector3(x, ty0 + trussH, tz + z)));
    const steps = low ? 4 : 7;
    for (let k = 0; k < steps; k++) {
      const y0 = ty0 + (k / steps) * trussH, y1 = ty0 + ((k + 1) / steps) * trussH;
      for (let c2 = 0; c2 < 4; c2++) {
        const [x0, z0] = corners[c2], [x1, z1] = corners[(c2 + 1) % 4];
        bar(new THREE.Vector3(x0, y0, tz + z0), new THREE.Vector3(x1, y0, tz + z1));
        bar(new THREE.Vector3(x0, k % 2 ? y0 : y1, tz + z0), new THREE.Vector3(x1, k % 2 ? y1 : y0, tz + z1));
      }
    }
    const truss = new THREE.InstancedMesh(strut, steel, bars.length); bars.forEach((m, i) => truss.setMatrixAt(i, m)); root.add(truss);
    // --- alas solares: brazo articulado (codo dorado) + dos paneles con marco por lado
    const topY = ty0 + trussH - 0.25;
    const panelGeo = new THREE.BoxGeometry(1.05, 0.72, 0.03), frameGeo = new THREE.BoxGeometry(1.1, 0.04, 0.05), frameGeoV = new THREE.BoxGeometry(0.04, 0.76, 0.05);
    for (const s of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(s * half, topY, tz); root.add(arm);
      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), gold); arm.add(joint);
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 10), steel); boom.rotation.z = Math.PI / 2; boom.position.x = s * 1.35; arm.add(boom);
      const wing = new THREE.Group(); wing.position.x = s * 1.4; wing.rotation.x = -0.35; arm.add(wing);
      for (const px of [-0.58, 0.58]) {
        for (const py of [0.42, -0.42]) {
          const pnl = new THREE.Mesh(panelGeo, cells); pnl.position.set(px, py, 0); wing.add(pnl);
          for (const fy of [-0.38, 0.38]) { const f = new THREE.Mesh(frameGeo, steel); f.position.set(px, py + fy, 0); wing.add(f); }
          for (const fx of [-0.55, 0.55]) { const f = new THREE.Mesh(frameGeoV, steel); f.position.set(px + fx, py, 0); wing.add(f); }
        }
      }
    }
    // punta del armazón: baliza blanca
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: "#FFF7EC", toneMapped: false })); beacon.position.set(0, ty0 + trussH + 0.1, tz); root.add(beacon);
    const bh = halo("#FFF7EC", 1.1, 0.7); bh.position.copy(beacon.position); root.add(bh); lights.push({ sprite: bh, bulb: beacon, kind: "strobe", ph: 0 });
    // --- plato parabólico (módulo derecho) y antena (izquierdo)
    const prof = []; for (let k = 0; k <= 10; k++) { const x = (k / 10) * 0.42; prof.push(new THREE.Vector2(x, x * x * 1.1)); }
    const dish = new THREE.Group(); dish.position.set(1.95, 0.72, -0.1); dish.rotation.set(-0.5, 0, -0.6); root.add(dish);
    const dm = pbr("#FFF7EC", { rough: 0.45, metal: 0.1, env: 0.8, side: THREE.DoubleSide }); dish.add(new THREE.Mesh(new THREE.LatheGeometry(prof, seg(32)), dm));
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), steel); feed.position.y = 0.18; dish.add(feed);
    const horn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), gold); horn.position.y = 0.37; dish.add(horn);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), steel); mast.position.set(1.85, 0.62, -0.1); root.add(mast);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.8, 6), steel); ant.position.set(-1.9, 0.95, -0.15); ant.rotation.z = 0.25; root.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), pink); tip.position.set(-2.0, 1.34, -0.15); root.add(tip);
    // --- proyector del holograma (al frente del núcleo)
    const proj = new THREE.Group(); proj.position.set(0, 0.62, 0.8); proj.rotation.x = 0.55; root.add(proj);
    proj.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, seg(24)), steel));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, seg(24)), new THREE.MeshBasicMaterial({ color: "#8FF3FF", toneMapped: false })); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.065; proj.add(lens);
    const pr = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, seg(24)), gold); pr.rotation.x = Math.PI / 2; pr.position.y = 0.06; proj.add(pr);
    return { root };
  });
  group.add(holder);

  // pantalla holográfica: mapa con tinte turquesa, escaneo suave, borde brillante y parpadeo leve
  const screen = new THREE.Group(); screen.position.set(0, 2.2, 1.6); screen.rotation.x = -0.08; group.add(screen);
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.12), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { map: { value: mapTexture() }, time: { value: 0 }, show: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform float time, show; varying vec2 vUv;
      void main() {
        float glitch = step(0.985, fract(sin(floor(time * 3.0) * 91.7) * 43758.5)) * step(abs(vUv.y - fract(time * 0.7)), 0.03);
        vec2 uv = vUv + vec2(glitch * 0.012, 0.0);
        vec3 c = texture2D(map, uv).rgb;
        c = mix(c, c * vec3(0.8, 1.05, 1.15) + vec3(0.02, 0.06, 0.08), 0.35);
        float scan = 0.93 + 0.07 * sin(uv.y * 240.0 - time * 5.0);
        float band = 0.12 * smoothstep(0.08, 0.0, abs(uv.y - fract(time * 0.18)));
        float ex = min(uv.x, 1.0 - uv.x), ey = min(uv.y, 1.0 - uv.y), e = min(ex * 1.6, ey);
        float edge = smoothstep(0.0, 0.035, e);
        float rimLine = smoothstep(0.035, 0.012, e) * smoothstep(0.0, 0.006, e);
        vec3 col = c * scan + vec3(0.45, 0.95, 1.0) * (band + rimLine * 0.9);
        float a = show * (edge * 0.9 + rimLine * 0.6);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`
  }));
  screen.add(holo);
  // haz del proyector (cono aditivo con degradado) y resplandor
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { show: { value: 0 }, time: { value: 0 } },
    vertexShader: "varying float vY; varying vec2 vUv; void main(){ vY = uv.y; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform float show, time; varying float vY; varying vec2 vUv; void main(){ float a = show * 0.2 * pow(1.0 - vY, 1.4) * (0.85 + 0.15 * sin(vUv.x * 40.0 + time * 3.0)); gl_FragColor = vec4(vec3(0.45, 0.9, 1.0) * a, a); }"
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 0.16, 1.45, 4, 1, true), beamMat);
  beam.rotation.y = Math.PI / 4; beam.scale.set(1, 1, 0.35); beam.position.set(0, -1.5, -0.55); screen.add(beam);
  const glow = halo("#6FD6E8", 4.5, 0.2); glow.position.set(0, -0.2, -0.2); screen.add(glow);

  return {
    group, screen,
    update(dt, t, show) {
      holo.material.uniforms.time.value = t;
      holo.material.uniforms.show.value = show * (0.93 + 0.05 * Math.sin(t * 13) + 0.02 * Math.sin(t * 31));
      beamMat.uniforms.show.value = show; beamMat.uniforms.time.value = t;
      glow.material.opacity = 0.1 + show * 0.18;
      holder.rotation.y = Math.sin(t * 0.1) * 0.08;
      for (const L of lights) {
        if (L.kind === "nav") { const on = ((t * 0.7 + L.ph) % 1) < 0.18; L.sprite.material.opacity = on ? 0.9 : 0.1; L.bulb.scale.setScalar(on ? 1.15 : 0.85); }
        else if (L.kind === "strobe") { const k = (t % 2.2); L.sprite.material.opacity = k < 0.08 || (k > 0.2 && k < 0.28) ? 0.95 : 0.05; }
        else L.sprite.material.opacity = 0.28 + 0.06 * Math.sin(t * 2.3 + L.ph);
      }
    }
  };
}
