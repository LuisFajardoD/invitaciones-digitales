// Capítulo 3: la constelación. El número {age} y el nombre se dibujan en un canvas fuera de pantalla, se
// muestrean puntos del contorno, se ordenan en trazos limpios (vecino más cercano) y se vuelven estrellas 3D.
// Las líneas de luz se dibujan con el scroll (drawRange). Tocar una estrella la hace brillar.
import * as THREE from "three";
import { halo } from "./materials.js";
import { sampleText } from "../ui/text-sample.js";

export function createConstellation({ age, name, width = 46 }) {
  const group = new THREE.Group(); group.name = "constellation";
  const A = sampleText(String(age), { font: "600 330px Fredoka, system-ui, sans-serif", spacing: 16, canvasW: 700, canvasH: 380 });
  const B = sampleText(name, { font: "600 170px Fredoka, system-ui, sans-serif", spacing: 13, canvasW: 1100, canvasH: 240 });
  const stars = [], segs = [];
  const add = (S, scale, oy) => {
    const base = stars.length;
    S.points.forEach(([x, y]) => stars.push(new THREE.Vector3(x * scale, y * scale + oy, (Math.random() - 0.5) * 1.5)));
    S.lines.forEach((line) => { for (let i = 0; i < line.length - 1; i++) segs.push([base + line[i], base + line[i + 1]]); });
  };
  add(A, width * 0.72, width * 0.16);
  add(B, width, -width * 0.2);
  // estrellas
  const n = stars.length;
  const pos = new Float32Array(n * 3), boost = new Float32Array(n), ord = new Float32Array(n);
  stars.forEach((v, i) => pos.set([v.x, v.y, v.z], i * 3));
  // orden de aparición = primer segmento en el que participa
  ord.fill(1);
  segs.forEach(([a, b], k) => { const t = k / segs.length; ord[a] = Math.min(ord[a], t); ord[b] = Math.min(ord[b], t); });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("boost", new THREE.BufferAttribute(boost, 1));
  g.setAttribute("ord", new THREE.BufferAttribute(ord, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, progress: { value: 0 }, pixelRatio: { value: 1 }, done: { value: 0 }, color: { value: new THREE.Color("#FFD27A") } },
    vertexShader: /* glsl */`
      attribute float boost; attribute float ord; uniform float time, progress, pixelRatio, done;
      varying float vA; varying float vB;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float on = smoothstep(ord - 0.02, ord + 0.03, progress);
        vA = 0.35 + 0.65 * on; vB = boost;
        float tw = 0.8 + 0.2 * sin(time * 3.0 + position.x * 3.1 + position.y * 1.7);
        gl_PointSize = (5.0 + on * 5.0 + boost * 16.0 + done * 3.0) * tw * pixelRatio * (40.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 color; varying float vA; varying float vB;
      void main() { vec2 p = gl_PointCoord - 0.5; float d = length(p); float a = smoothstep(0.5, 0.0, d); a = a * a * (vA + vB);
        vec3 c = mix(color, vec3(1.0), 0.5 * a + vB * 0.5); gl_FragColor = vec4(c * a, a);
        #include <colorspace_fragment>
      }`
  });
  const points = new THREE.Points(g, starMat); points.frustumCulled = false; group.add(points);
  // líneas de luz (quads finos por segmento, para que tengan grosor en móvil)
  const lp = new Float32Array(segs.length * 4 * 3), side = new Float32Array(segs.length * 4), other = new Float32Array(segs.length * 4 * 3), index = [];
  segs.forEach(([a, b], k) => {
    const A1 = stars[a], B1 = stars[b];
    [[A1, B1, -1], [A1, B1, 1], [B1, A1, 1], [B1, A1, -1]].forEach(([p, q, s], j) => { lp.set([p.x, p.y, p.z], (k * 4 + j) * 3); other.set([q.x, q.y, q.z], (k * 4 + j) * 3); side[k * 4 + j] = s; });
    const o = k * 4; index.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3)); lg.setAttribute("other", new THREE.BufferAttribute(other, 3)); lg.setAttribute("side", new THREE.BufferAttribute(side, 1));
  lg.setIndex(index);
  const lineMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { width: { value: 0.09 }, alpha: { value: 0.8 }, color: { value: new THREE.Color("#FFE7B0") } },
    vertexShader: /* glsl */`
      attribute vec3 other; attribute float side; uniform float width; varying float vS;
      void main() { vec3 dir = normalize(other - position); vec3 n = normalize(cross(dir, vec3(0.0, 0.0, 1.0))); vS = side;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + n * side * width, 1.0); }`,
    fragmentShader: "uniform vec3 color; uniform float alpha; varying float vS; void main(){ float a = (1.0 - abs(vS)) * 0.0 + smoothstep(1.0, 0.0, abs(vS)) * alpha; gl_FragColor = vec4(color * a, a);\n#include <colorspace_fragment>\n}"
  });
  const lines = new THREE.Mesh(lg, lineMat); lines.frustumCulled = false; group.add(lines);
  const flash = halo("#FFE7B0", width * 1.6, 0); flash.position.set(0, 0, -1); group.add(flash);
  let flashT = -1, doneShown = false;
  const tmpV = new THREE.Vector3();
  return {
    group, points, starCount: n, segCount: segs.length,
    /** progress 0–1: cuánto de la constelación está trazado. Devuelve true el frame en que se completa. */
    update(dt, t, progress, pixelRatio) {
      starMat.uniforms.time.value = t; starMat.uniforms.progress.value = progress; starMat.uniforms.pixelRatio.value = pixelRatio;
      lg.setDrawRange(0, Math.floor(segs.length * Math.min(1, progress)) * 6);
      for (let i = 0; i < n; i++) if (boost[i] > 0) boost[i] = Math.max(0, boost[i] - dt * 0.9);
      g.attributes.boost.needsUpdate = true;
      let completed = false;
      if (progress >= 1 && !doneShown) { doneShown = true; flashT = 0; completed = true; }
      if (progress < 0.85) doneShown = false;
      starMat.uniforms.done.value = doneShown ? 1 : 0;
      if (flashT >= 0) { flashT += dt; flash.material.opacity = Math.sin(Math.min(1, flashT / 1.2) * Math.PI) * 0.7; if (flashT > 1.2) flashT = -1; }
      return completed;
    },
    /** Rayo de toque: devuelve true si tocó una estrella (y la hace brillar). */
    tap(raycaster) {
      raycaster.params.Points.threshold = 0.9;
      const hit = raycaster.intersectObject(points, false)[0];
      if (!hit) return false;
      boost[hit.index] = 1;
      // también las vecinas cercanas, más tenue
      stars[hit.index] && stars.forEach((v, i) => { if (i !== hit.index && v.distanceTo(stars[hit.index]) < 2.5) boost[i] = Math.max(boost[i], 0.5); });
      g.attributes.boost.needsUpdate = true;
      tmpV.copy(stars[hit.index]);
      return true;
    }
  };
}
