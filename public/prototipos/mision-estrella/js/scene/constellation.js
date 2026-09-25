// Capítulo 3: la constelación. El número {age} y el nombre se escriben "con un solo trazo de pluma": se toma el
// trazo central de cada letra (sampleStroke: esqueleto de una fuente redondeada) y sobre él se ponen
//  · estrellas principales en los puntos clave (extremos, cruces y curvas), con halo suave, destello en cruz en las
//    más grandes, tamaños y colores variados (blanco cálido, dorado, algún toque azulado) y titileo propio;
//  · líneas de constelación finas y luminosas entre ellas, con degradado entre los colores de sus estrellas, que se
//    dibujan con el scroll (también a mitad de tramo);
//  · polvo estelar: miles de estrellitas a lo largo de los trazos (con dispersión), un poco más atrás (parallax).
// Al completarse, una onda de brillo recorre el letrero de izquierda a derecha con campanitas; tocar una estrella la
// hace brillar. Detrás, un velo tenue baja el campo de estrellas general para que el nombre destaque.
// Todo en 3 draw calls de estrellas/líneas (Points + una malla de quads) + el velo.
import * as THREE from "three";
import { halo } from "./materials.js";
import { sampleStroke } from "../ui/text-sample.js";

const FONT = "600 {s}px Fredoka, system-ui, sans-serif";
/** Nombre en una o dos líneas: los nombres largos se parten en el espacio más cercano a la mitad. */
function nameLines(name) {
  const n = name.trim();
  if (n.length <= 12 || !n.includes(" ")) return [n];
  const mid = n.length / 2; let best = -1;
  for (let i = 0; i < n.length; i++) if (n[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return [n.slice(0, best), n.slice(best + 1)];
}

export function createConstellation({ age, name, width = 22, onChime = null }) {
  const group = new THREE.Group(); group.name = "constellation";
  const rnd = mulberry(7 + name.length * 13 + Number(age));
  // --- trazos en el mundo: el número arriba (más grande) y el nombre debajo (una o dos líneas)
  const lines = nameLines(name);
  const NW = 1100, AW = 500;
  const A = sampleStroke(String(age), { font: FONT.replace("{s}", 300), canvasW: AW, canvasH: 360, keyEps: 0.05 });
  const Bs = lines.map((l) => sampleStroke(l, { font: FONT.replace("{s}", 200), canvasW: NW, canvasH: 280, keyEps: 0.06 }));
  const NWW = width * 0.86; // ancho del nombre: deja margen a los lados (y a la guía de capítulos)
  const nameH = Math.max(...Bs.map((b) => b.height)) * NWW; // alto de las letras del nombre (mundo)
  const ageScale = (nameH * 2.3) / Math.max(1e-3, A.height); // el número mide ~2.3 veces el nombre
  const lineGap = nameH * 1.45, ageH = A.height * ageScale;
  const blockH = ageH + nameH * 0.9 + lineGap * lines.length;
  const strokes = []; // { pts: [Vector3…], key: [índices], dot, closed }
  const put = (S, scale, oy) => S.strokes.forEach((s) => strokes.push({ pts: s.pts.map(([x, y]) => new THREE.Vector3(x * scale, y * scale + oy, 0)), key: s.key, dot: s.dot, closed: s.closed }));
  const top = blockH / 2;
  put(A, ageScale, top - ageH / 2);
  Bs.forEach((B, k) => put(B, NWW, top - ageH - nameH * 0.9 - lineGap * k - nameH * 0.3));
  const strokeW = Math.max(...Bs.map((b) => b.stroke)) * NWW; // grosor de las letras de la fuente (mundo)

  // --- estrellas principales (sin duplicados en cruces y cierres) y tramos entre ellas, en orden de escritura
  const stars = [], segs = [];
  const starAt = (v, big) => {
    for (let i = 0; i < stars.length; i++) if (stars[i].p.distanceTo(v) < strokeW * 0.45) { stars[i].big = Math.max(stars[i].big, big); return i; }
    stars.push({ p: v.clone(), big, ord: 1 }); return stars.length - 1;
  };
  let total = 0;
  strokes.forEach((s) => {
    if (s.dot) { starAt(s.pts[0], 1); return; }
    const K = s.key.map((i, j) => starAt(s.pts[i], j === 0 || j === s.key.length - 1 ? 1 : 0.55));
    for (let j = 0; j < K.length - 1; j++) {
      if (K[j] === K[j + 1]) continue;
      // la línea sigue la curva real del trazo entre las dos estrellas (letra redondeada, legible)
      const path = s.pts.slice(s.key[j], s.key[j + 1] + 1).map((v) => v.clone());
      path[0].copy(stars[K[j]].p); path[path.length - 1].copy(stars[K[j + 1]].p);
      let L = 0; for (let q = 1; q < path.length; q++) L += path[q].distanceTo(path[q - 1]);
      segs.push({ a: K[j], b: K[j + 1], t0: total, L, path }); total += L;
    }
  });
  segs.forEach((g) => { g.t0 /= total; g.t1 = g.t0 + g.L / total; stars[g.a].ord = Math.min(stars[g.a].ord, g.t0); stars[g.b].ord = Math.min(stars[g.b].ord, g.t1); });
  // los puntos (de la "i") aparecen al terminar su letra: su orden = el del tramo más cercano
  stars.forEach((s) => { if (s.ord < 1) return; let best = 1, bd = Infinity; segs.forEach((g) => { const d = stars[g.a].p.distanceTo(s.p); if (d < bd) { bd = d; best = g.t1; } }); s.ord = best; });
  // grado de cada estrella (en cuántos tramos participa): los cruces y extremos brillan más
  const degree = new Array(stars.length).fill(0); segs.forEach((g) => { degree[g.a]++; degree[g.b]++; });
  const palette = [new THREE.Color("#FFF4E0"), new THREE.Color("#FFE2A8"), new THREE.Color("#FFD27A"), new THREE.Color("#FFF8F0"), new THREE.Color("#CFE3FF")];
  const pickColor = (r) => palette[r < 0.32 ? 0 : r < 0.55 ? 1 : r < 0.72 ? 2 : r < 0.9 ? 3 : 4];

  // --- estrellas principales: Points con tamaño, color y fase propios
  const n = stars.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n), ord = new Float32Array(n), boost = new Float32Array(n);
  stars.forEach((s, i) => {
    pos.set([s.p.x, s.p.y, s.p.z], i * 3);
    const c = pickColor(rnd()); col.set([c.r, c.g, c.b], i * 3); s.c = c;
    const key = s.big >= 1 || degree[i] !== 2 ? 1 : 0; // extremos, cruces y puntos: estrellas grandes
    size[i] = key ? 1.0 + rnd() * 0.55 : 0.55 + rnd() * 0.35;
    phase[i] = rnd() * 6.283; ord[i] = s.ord;
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  sg.setAttribute("size", new THREE.BufferAttribute(size, 1)); sg.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
  sg.setAttribute("ord", new THREE.BufferAttribute(ord, 1)); sg.setAttribute("boost", new THREE.BufferAttribute(boost, 1));
  const common = { time: { value: 0 }, progress: { value: 0 }, pixelRatio: { value: 1 }, wave: { value: -1e3 }, waveW: { value: width * 0.09 }, done: { value: 0 } };
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...common, unit: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float size, phase, ord, boost;
      uniform float time, progress, pixelRatio, wave, waveW, done, unit;
      varying vec3 vC; varying float vA; varying float vF;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float on = smoothstep(ord - 0.015, ord + 0.02, progress);
        float tw = 0.78 + 0.22 * sin(time * (1.7 + fract(phase * 3.7) * 2.2) + phase) * sin(time * 0.63 + phase * 1.9);
        float w = exp(-pow((position.x - wave) / waveW, 2.0));
        vC = color; vA = (0.12 + 0.88 * on) * tw * (1.0 + w * 1.6 + boost * 1.4 + done * 0.15); vF = size * (on + boost);
        gl_PointSize = (3.0 + size * 15.0 * (0.45 + 0.55 * on) + boost * 18.0 + w * 10.0 * size) * pixelRatio * unit / max(1.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying float vA; varying float vF;
      void main() {
        vec2 p = gl_PointCoord - 0.5; float d = length(p);
        float core = smoothstep(0.12, 0.0, d), glow = exp(-d * d * 22.0) * 0.75;
        // destello en cruz sutil, sólo en las estrellas grandes
        float cr = (exp(-abs(p.x) * 60.0) + exp(-abs(p.y) * 60.0)) * smoothstep(0.5, 0.0, d) * smoothstep(0.9, 1.35, vF) * 0.5;
        float a = (core + glow + cr) * vA;
        vec3 c = mix(vC, vec3(1.0), core * 0.6);
        gl_FragColor = vec4(c * a, a);
        #include <colorspace_fragment>
      }`
  });
  const points = new THREE.Points(sg, starMat); points.frustumCulled = false; points.renderOrder = 3; group.add(points);

  // --- líneas de constelación: siguen la curva del trazo entre cada par de estrellas (un quad fino por tramito),
  // degradado entre los colores de las dos estrellas, se dibujan con el progreso
  const pieces = []; // [p, q, uP, uQ, seg]
  segs.forEach((g) => { let acc = 0; for (let q = 1; q < g.path.length; q++) { const d = g.path[q].distanceTo(g.path[q - 1]); pieces.push([g.path[q - 1], g.path[q], acc / g.L, (acc + d) / g.L, g]); acc += d; } });
  const L = segs.length, NP = pieces.length;
  const lp = new Float32Array(NP * 12), oth = new Float32Array(NP * 12), sd = new Float32Array(NP * 4), lat = new Float32Array(NP * 4), al = new Float32Array(NP * 4), t0 = new Float32Array(NP * 4), t1 = new Float32Array(NP * 4), ca = new Float32Array(NP * 12), cb = new Float32Array(NP * 12), idx = [];
  pieces.forEach(([p, q, up, uq, g], k) => {
    const P = stars[g.a].c, Q = stars[g.b].c;
    // (en la punta q la normal se invierte: con lados −1/+1 los vértices quedan en q+n y q−n → quad completo)
    [[p, q, -1, up], [p, q, 1, up], [q, p, -1, uq], [q, p, 1, uq]].forEach(([a, b, s, u], j) => {
      const o = k * 4 + j;
      lp.set([a.x, a.y, a.z], o * 3); oth.set([b.x, b.y, b.z], o * 3); sd[o] = s; lat[o] = j < 2 ? s : -s; al[o] = u; t0[o] = g.t0; t1[o] = g.t1;
      ca.set([P.r, P.g, P.b], o * 3); cb.set([Q.r, Q.g, Q.b], o * 3);
    });
    const o = k * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.BufferAttribute(lp, 3)); lg.setAttribute("other", new THREE.BufferAttribute(oth, 3));
  lg.setAttribute("side", new THREE.BufferAttribute(sd, 1)); lg.setAttribute("lat", new THREE.BufferAttribute(lat, 1)); lg.setAttribute("along", new THREE.BufferAttribute(al, 1));
  lg.setAttribute("t0", new THREE.BufferAttribute(t0, 1)); lg.setAttribute("t1", new THREE.BufferAttribute(t1, 1));
  lg.setAttribute("ca", new THREE.BufferAttribute(ca, 3)); lg.setAttribute("cb", new THREE.BufferAttribute(cb, 3));
  lg.setIndex(idx);
  const lineMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...common, width: { value: strokeW * 0.16 } },
    vertexShader: /* glsl */`
      attribute vec3 other, ca, cb; attribute float side, lat, along, t0, t1; uniform float width;
      varying float vS; varying float vA; varying float vT0; varying float vT1; varying vec3 vC; varying float vX;
      void main() {
        // (dir: de esta punta hacia la otra; along = 1 en la punta Q: el lado se invierte para que el quad no se cruce)
        vec3 dir = normalize(other - position); vec3 n = normalize(cross(dir, vec3(0.0, 0.0, 1.0)));
        vS = lat; vA = along; vT0 = t0; vT1 = t1; vC = mix(ca, cb, along); vX = position.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + n * side * width, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float time, progress, wave, waveW, done;
      varying float vS; varying float vA; varying float vT0; varying float vT1; varying vec3 vC; varying float vX;
      void main() {
        float drawn = clamp((progress - vT0) / max(1e-4, vT1 - vT0), 0.0, 1.0); // cuánto del tramo está trazado
        if (vA > drawn) discard;
        float ends = smoothstep(0.0, 0.14, vA) * smoothstep(1.0, 0.86, vA); // se afina junto a las estrellas
        float d = abs(vS);
        float core = smoothstep(0.35, 0.0, d), glow = exp(-d * d * 4.0) * 0.4;
        float fresh = smoothstep(0.1, 0.0, drawn - vA) * (1.0 - step(1.0, drawn)) * 0.9; // la punta que avanza brilla
        float w = exp(-pow((vX - wave) / waveW, 2.0));
        float a = (core + glow) * (0.3 + 0.7 * ends) * (0.55 + fresh + w * 1.3 + done * 0.1) * (0.9 + 0.1 * sin(time * 2.0 + vX));
        vec3 c = mix(vC, vec3(1.0), core * 0.35);
        gl_FragColor = vec4(c * a, a);
        #include <colorspace_fragment>
      }`
  });
  const lineMesh = new THREE.Mesh(lg, lineMat); lineMesh.frustumCulled = false; lineMesh.renderOrder = 2; group.add(lineMesh);

  // --- polvo estelar: a lo largo de los trazos, con dispersión (y una bruma más abierta), un poco más atrás
  let pathLen = 0; strokes.forEach((s) => { for (let i = 1; i < s.pts.length; i++) pathLen += s.pts[i].distanceTo(s.pts[i - 1]); });
  const DUST = 7000, dust = [], dt0 = [];
  let acc = 0;
  strokes.forEach((s) => {
    if (s.dot) { for (let k = 0; k < 14; k++) dust.push([s.pts[0], null, rnd()]), dt0.push(-1); return; }
    for (let i = 1; i < s.pts.length; i++) {
      const a = s.pts[i - 1], b = s.pts[i], seg = a.distanceTo(b), m = (seg / pathLen) * DUST;
      let cnt = Math.floor(m + rnd());
      while (cnt-- > 0) dust.push([a, b, rnd()]);
      acc += seg;
    }
  });
  const D = dust.length, dp = new Float32Array(D * 3), dc = new Float32Array(D * 3), ds = new Float32Array(D), dph = new Float32Array(D), dord = new Float32Array(D);
  const tmp = new THREE.Vector3(), nrm = new THREE.Vector3(), gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
  dust.forEach(([a, b, f], i) => {
    const far = rnd() < 0.1, sig = strokeW * (far ? 1.0 : 0.2);
    if (b) { tmp.lerpVectors(a, b, f); nrm.set(-(b.y - a.y), b.x - a.x, 0).normalize(); } else { tmp.copy(a); nrm.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), rnd() * 6.283); }
    tmp.addScaledVector(nrm, gauss() * sig); tmp.x += gauss() * sig * 0.35; tmp.y += gauss() * sig * 0.35;
    tmp.z = -0.9 + gauss() * 0.45; // detrás de las estrellas principales: parallax al moverse la cámara
    dp.set([tmp.x, tmp.y, tmp.z], i * 3);
    const c = pickColor(rnd()); dc.set([c.r, c.g, c.b], i * 3);
    ds[i] = (far ? 0.35 : 0.5) + Math.pow(rnd(), 3) * 1.1; dph[i] = rnd() * 6.283;
  });
  // orden de aparición del polvo: el del punto más cercano del recorrido (aparece mientras se traza su letra)
  const sampleOrd = []; segs.forEach((g) => { for (let k = 0; k <= 6; k++) sampleOrd.push([tmp.lerpVectors(stars[g.a].p, stars[g.b].p, k / 6).clone(), g.t0 + (g.t1 - g.t0) * (k / 6)]); });
  for (let i = 0; i < D; i++) { let best = 1, bd = Infinity; const x = dp[i * 3], y = dp[i * 3 + 1]; for (const [q, t] of sampleOrd) { const d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < bd) { bd = d; best = t; } } dord[i] = best; }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dg.setAttribute("color", new THREE.BufferAttribute(dc, 3));
  dg.setAttribute("size", new THREE.BufferAttribute(ds, 1)); dg.setAttribute("phase", new THREE.BufferAttribute(dph, 1)); dg.setAttribute("ord", new THREE.BufferAttribute(dord, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...common, unit: { value: 1 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float size, phase, ord;
      uniform float time, progress, pixelRatio, wave, waveW, unit;
      varying vec3 vC; varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float on = smoothstep(ord - 0.01, ord + 0.06, progress);
        float tw = 0.55 + 0.45 * sin(time * (2.0 + fract(phase * 5.3) * 3.0) + phase);
        float w = exp(-pow((position.x - wave) / waveW, 2.0));
        vC = color; vA = on * tw * (0.55 + w * 1.4);
        gl_PointSize = (1.4 + size * 3.0) * pixelRatio * unit / max(1.0, -mv.z) * (1.0 + w * 0.6);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying float vA;
      void main() { vec2 p = gl_PointCoord - 0.5; float a = exp(-dot(p, p) * 18.0) * vA; gl_FragColor = vec4(vC * a, a);
        #include <colorspace_fragment>
      }`
  });
  const dustPts = new THREE.Points(dg, dustMat); dustPts.frustumCulled = false; dustPts.renderOrder = 1; group.add(dustPts);

  // --- velo tenue detrás del letrero (baja un poco el campo de estrellas general) y destello final
  const bw = width * 1.5, bh = blockH * 2.0;
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { opacity: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float opacity; varying vec2 vUv; void main() { vec2 p = (vUv - 0.5) * 2.0; float a = smoothstep(1.0, 0.15, length(p)) * opacity; gl_FragColor = vec4(0.03, 0.02, 0.09, a); }"
  }));
  veil.position.z = -3; veil.renderOrder = -1; group.add(veil);
  const flash = halo("#FFE7B0", width * 1.4, 0); flash.position.set(0, 0, -1); group.add(flash);

  // unidad de tamaño de los puntos (px a 1 unidad de distancia): se escala con el ancho del letrero
  starMat.uniforms.unit.value = dustMat.uniforms.unit.value = 40 * (width / 22);
  const U = [starMat.uniforms, lineMat.uniforms, dustMat.uniforms];
  const xMin = Math.min(...stars.map((s) => s.p.x)), xMax = Math.max(...stars.map((s) => s.p.x));
  let flashT = -1, waveT = -1, doneShown = false, chimeNext = 0;
  const CHIMES = 5, WAVE_T = 1.6;
  return {
    group, points, starCount: n, segCount: L, dustCount: D, lines,
    /** progress 0–1: cuánto de la constelación está trazado. Devuelve true el cuadro en que se completa. */
    update(dt, t, progress, pixelRatio) {
      for (const u of U) { u.time.value = t; u.progress.value = progress; u.pixelRatio.value = pixelRatio; }
      for (let i = 0; i < n; i++) if (boost[i] > 0) boost[i] = Math.max(0, boost[i] - dt * 0.9);
      sg.attributes.boost.needsUpdate = true;
      veil.material.uniforms.opacity.value = 0.4 * Math.min(1, progress * 3 + 0.3);
      let completed = false;
      if (progress >= 1 && !doneShown) { doneShown = true; flashT = 0; waveT = 0; chimeNext = 0; completed = true; }
      if (progress < 0.85) doneShown = false;
      for (const u of U) u.done.value = doneShown ? 1 : 0;
      // onda de brillo de izquierda a derecha, con campanitas que suben al pasar
      if (waveT >= 0) {
        waveT += dt; const k = waveT / WAVE_T;
        const x = xMin - width * 0.1 + (xMax - xMin + width * 0.2) * k;
        for (const u of U) u.wave.value = x;
        while (chimeNext < CHIMES && k >= chimeNext / (CHIMES - 1) * 0.92) { onChime?.(chimeNext); chimeNext++; }
        if (k >= 1) { waveT = -1; for (const u of U) u.wave.value = -1e3; }
      }
      if (flashT >= 0) { flashT += dt; flash.material.opacity = Math.sin(Math.min(1, flashT / 1.2) * Math.PI) * 0.45; if (flashT > 1.2) flashT = -1; }
      return completed;
    },
    /** Rayo de toque: devuelve true si tocó una estrella (y la hace brillar). */
    tap(raycaster) {
      raycaster.params.Points.threshold = 0.9;
      const hit = raycaster.intersectObject(points, false)[0];
      if (!hit) return false;
      boost[hit.index] = 1;
      stars.forEach((s, i) => { if (i !== hit.index && s.p.distanceTo(stars[hit.index].p) < strokeW * 3) boost[i] = Math.max(boost[i], 0.45); });
      sg.attributes.boost.needsUpdate = true;
      return true;
    }
  };
}

/** Aleatorio con semilla (el letrero se ve igual en cada visita). */
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
