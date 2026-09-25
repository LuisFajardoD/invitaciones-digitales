// Estación espacial PROVISIONAL (models.js): módulos redondeados, ventanitas iluminadas, paneles solares y una
// pantalla holográfica con un mapa ilustrado genérico (SVG → textura) con el salón marcado.
import * as THREE from "three";
import { vinyl, canvasTex, halo } from "./materials.js";
import { modelOrBuild } from "../characters/rocket.js";
import { demoData } from "../data.js";
import { mapSVG } from "../ui/map.js";

function mapTexture() {
  const tex = canvasTex(1024, 640, (c) => { c.fillStyle = "#20306B"; c.fillRect(0, 0, 1024, 640); });
  const img = new Image();
  img.onload = () => { const c = tex.image.getContext("2d"); c.drawImage(img, 0, 0, 1024, 640); tex.needsUpdate = true; };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mapSVG())}`;
  return tex;
}

export function createStation() {
  const group = new THREE.Group(); group.name = "station-set";
  const { holder } = modelOrBuild("station", () => {
    const root = new THREE.Group();
    const white = vinyl("#FFF7EC"), lav = vinyl("#C9C2E8"), pink = vinyl("#FF8FA3");
    const hub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 24), white); root.add(hub);
    [-1, 1].forEach((s) => {
      const mod = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 1.9, 8, 24), s < 0 ? white : lav); mod.rotation.z = Math.PI / 2; mod.position.x = s * 2.4; root.add(mod);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.09, 8, 32), pink); ring.rotation.y = Math.PI / 2; ring.position.x = s * 1.55; root.add(ring);
    });
    const top = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.8, 6, 16), lav); top.position.y = 1.55; root.add(top);
    // ventanitas iluminadas (geometrías fusionadas en un solo mesh)
    const winGeo = new THREE.CircleGeometry(0.16, 16), wins = [];
    const addWin = (x, y, z, ry = 0) => { const g = winGeo.clone(); g.rotateY(ry); g.translate(x, y, z); wins.push(g); };
    [-3.1, -2.4, -1.7].forEach((x) => addWin(x, 0.25, 0.86)); [1.7, 2.4, 3.1].forEach((x) => addWin(x, 0.25, 0.86));
    addWin(0, 1.6, 0.57);
    const merged = new THREE.Mesh(mergeGeometries(wins), new THREE.MeshBasicMaterial({ color: "#FFE7A8", toneMapped: false })); root.add(merged);
    // paneles solares
    const panelTex = canvasTex(256, 128, (c, w, hh) => { c.fillStyle = "#3D5FCF"; c.fillRect(0, 0, w, hh); c.strokeStyle = "#9FD8FF"; c.lineWidth = 3; for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, hh); c.stroke(); } for (let y = 0; y <= hh; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
    const pm = vinyl("#ffffff", { map: panelTex, emissive: new THREE.Color("#1a2a6a"), emissiveIntensity: 0.5, rim: 0.4 });
    [-1, 1].forEach((s) => {
      const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), lav); truss.position.set(0, 0, 0); truss.rotation.x = Math.PI / 2; truss.position.z = s * 1.9; root.add(truss);
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 1.4), pm); p.position.set(0, 0, s * 3.3); root.add(p);
    });
    return { root };
  });
  group.add(holder);
  // pantalla holográfica
  const screen = new THREE.Group(); screen.position.set(0, 2.2, 1.6); screen.rotation.x = -0.08; group.add(screen);
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.12), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { map: { value: mapTexture() }, time: { value: 0 }, show: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform sampler2D map; uniform float time, show; varying vec2 vUv; void main(){ vec3 c = texture2D(map, vUv).rgb; float scan = 0.9 + 0.1 * sin(vUv.y * 180.0 - time * 6.0); float edge = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x) * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y); float a = show * edge * 0.92; gl_FragColor = vec4(c * scan + vec3(0.1, 0.25, 0.3) * (1.0 - edge), a);\n#include <colorspace_fragment>\n}"
  }));
  screen.add(holo);
  const beam = halo("#6FD6E8", 4.5, 0.25); beam.position.set(0, -0.6, -0.2); screen.add(beam);
  return {
    group, screen,
    update(dt, t, show) { holo.material.uniforms.time.value = t; holo.material.uniforms.show.value = show * (0.9 + 0.1 * Math.sin(t * 13)); beam.material.opacity = 0.15 + show * 0.2; holder.rotation.y = Math.sin(t * 0.1) * 0.08; }
  };
}

/** Fusión mínima de geometrías no indexadas/indexadas del mismo tipo (ventanitas). */
function mergeGeometries(list) {
  const pos = [], nor = [], idx = []; let off = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    const ix = g.index ? g.index.array : [...Array(p.count).keys()];
    for (const i of ix) idx.push(i + off);
    off += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); out.setIndex(idx);
  return out;
}
