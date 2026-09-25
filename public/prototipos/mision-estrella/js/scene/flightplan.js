// Capítulo 7 (primera parte): trayectoria orbital curva que se dibuja con el scroll, con un punto luminoso por
// cada evento del itinerario. Línea de luz con grosor variable (más gruesa al centro, afinada en las puntas y con
// pulsos suaves), núcleo brillante, resplandor exterior aditivo y un brillo que recorre el trazo; en cada punto un
// destello de 4 puntas que gira. El punto activo crece y brilla.
import * as THREE from "three";
import { halo, flareTexture } from "./materials.js";
import { demoData } from "../data.js";

/** Tubo con radio variable a lo largo (u = 0…1) a partir de un TubeGeometry. */
function taperedTube(curve, tubular, radial, radiusAt) {
  const g = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = g.attributes.position, uv = g.attributes.uv, c = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / (radial + 1)), u = ring / tubular;
    curve.getPointAt(Math.min(1, u), c);
    p.fromBufferAttribute(pos, i).sub(c).multiplyScalar(radiusAt(u)).add(c);
    pos.setXYZ(i, p.x, p.y, p.z);
    uv.setX(i, u);
  }
  g.computeVertexNormals();
  return g;
}

export function createFlightPlan() {
  const group = new THREE.Group(); group.name = "flightplan";
  const pts = [];
  for (let i = 0; i <= 60; i++) { const a = -0.3 + (i / 60) * Math.PI * 1.25; pts.push(new THREE.Vector3(Math.cos(a) * 9, Math.sin(a * 1.6) * 1.8 + (i / 60) * 2.5 - 1.2, Math.sin(a) * 5.5)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const radius = (u) => (0.035 + 0.045 * Math.sin(Math.PI * Math.min(1, u * 1.05))) * (1 + 0.18 * Math.sin(u * 40));
  const tube = taperedTube(curve, 260, 8, radius);
  const glowTube = taperedTube(curve, 130, 8, (u) => radius(u) * 3.2);
  const uniforms = { time: { value: 0 }, head: { value: 0 }, core: { value: new THREE.Color("#FFE7B0") }, edge: { value: new THREE.Color("#FFD27A") } };
  const vert = "varying vec3 vN; varying vec3 vV; varying float vU; void main(){ vU = uv.x; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }";
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms,
    vertexShader: vert,
    fragmentShader: /* glsl */`
      uniform float time, head; uniform vec3 core, edge; varying vec3 vN; varying vec3 vV; varying float vU;
      void main() {
        float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        float shimmer = 0.75 + 0.25 * sin(vU * 60.0 - time * 4.0);
        float nearHead = smoothstep(0.08, 0.0, head - vU);
        vec3 col = mix(edge, vec3(1.0, 0.98, 0.9), pow(f, 3.0)) * (0.85 + 0.5 * pow(f, 2.0)) * shimmer + core * nearHead * 0.6;
        gl_FragColor = vec4(col, 0.55 + 0.45 * f);
        #include <colorspace_fragment>
      }`
  });
  const path = new THREE.Mesh(tube, mat); group.add(path);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms,
    vertexShader: vert,
    fragmentShader: "uniform float time; uniform vec3 edge; varying vec3 vN; varying vec3 vV; varying float vU; void main(){ float f = pow(clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.0); float a = f * 0.3 * (0.8 + 0.2 * sin(vU * 25.0 - time * 3.0)); gl_FragColor = vec4(edge * a, a); }"
  });
  const glow = new THREE.Mesh(glowTube, glowMat); group.add(glow);
  const ghost = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: "#B9A2FF", transparent: true, opacity: 0.16, depthWrite: false })); group.add(ghost);
  const total = tube.index.count, totalGlow = glowTube.index.count;
  const flareMat = (col) => new THREE.SpriteMaterial({ map: flareTexture(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const events = demoData.itinerary.map((ev, i) => {
    const u = (i + 0.6) / (demoData.itinerary.length + 0.2);
    const p = curve.getPointAt(u);
    const col = ["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF"][i % 4];
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: "#FFF7EC", toneMapped: false })); dot.position.copy(p); group.add(dot);
    const glow2 = halo(col, 2.2, 0.6); glow2.position.copy(p); group.add(glow2);
    const flare = new THREE.Sprite(flareMat(col)); flare.position.copy(p); flare.scale.setScalar(1.6); group.add(flare);
    return { u, dot, glow: glow2, flare };
  });
  const head = halo("#FFF7EC", 1.6, 0.9); group.add(head);
  const headFlare = new THREE.Sprite(flareMat("#FFF7EC")); headFlare.scale.setScalar(1.2); group.add(headFlare);
  return {
    group, events, curve,
    /** progress 0–1 del trazo; devuelve el índice del evento activo (o -1). */
    update(dt, t, progress) {
      uniforms.time.value = t; uniforms.head.value = progress;
      path.geometry.setDrawRange(0, Math.floor(total * progress / 3) * 3);
      glow.geometry.setDrawRange(0, Math.floor(totalGlow * progress / 3) * 3);
      head.position.copy(curve.getPointAt(Math.max(0.001, Math.min(0.999, progress))));
      headFlare.position.copy(head.position); headFlare.material.rotation = t * 0.8;
      head.visible = headFlare.visible = progress > 0.01 && progress < 0.999;
      let active = -1;
      events.forEach((e, i) => {
        const reached = progress >= e.u - 0.02;
        if (reached) active = i;
        const s = reached ? 1 : 0.35;
        e.dot.scale.setScalar(THREE.MathUtils.damp(e.dot.scale.x, s * (active === i ? 1.35 : 1), 8, dt));
        e.glow.material.opacity = reached ? (0.45 + 0.25 * Math.sin(t * 3 + i)) * (active === i ? 1.4 : 0.8) : 0.08;
        e.flare.material.opacity = reached ? (0.55 + 0.35 * Math.sin(t * 2.2 + i * 1.3)) * (active === i ? 1.2 : 0.7) : 0;
        e.flare.material.rotation = t * 0.35 + i;
        e.flare.scale.setScalar(active === i ? 2.2 : 1.5);
      });
      return active;
    }
  };
}
