// Materiales compartidos: "vinil" (lambert + luz de borde rosa/turquesa), vidrio de casco (fresnel con reflejo
// del cielo y brillo especular que se mueve al girar), halos aditivos y texturas generadas en canvas.
import * as THREE from "three";

/** Uniforms globales de la luz de borde: todos los materiales vinil los comparten. */
export const RIM = {
  rimA: { value: new THREE.Color("#FF8FA3") }, // rosa (lado izquierdo)
  rimB: { value: new THREE.Color("#6FD6E8") }, // turquesa (lado derecho)
  rimStrength: { value: 0.55 },
  rimPower: { value: 2.6 }
};
export const ENV = { envMap: { value: null } }; // textura equirectangular del cielo (nebulosa)
export const STUDIO = { texture: null }; // reflejo "de estudio" para materiales PBR (cohete)

/**
 * Entorno de estudio para reflejos (una sola vez, PMREM): cúpula lavanda → índigo, luz cálida principal y
 * luces de borde rosa y turquesa. Da brillo de juguete de colección a metales y pintura sin verse frío.
 */
export function createStudioEnv(renderer) {
  if (STUDIO.texture) return STUDIO.texture;
  const scene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { top: { value: new THREE.Color("#B8AEE0") }, mid: { value: new THREE.Color("#5E4E9A") }, bot: { value: new THREE.Color("#2A2266") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top, mid, bot; varying vec3 vP; void main(){ vec3 c = mix(bot, mid, smoothstep(-0.6, 0.1, vP.y)); c = mix(c, top, smoothstep(0.1, 0.9, vP.y)); gl_FragColor = vec4(c, 1.0); }"
  }));
  scene.add(dome);
  const panel = (color, intensity, pos, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.copy(pos); m.lookAt(0, 0, 0); scene.add(m); };
  panel("#FFE3C4", 1.25, new THREE.Vector3(5, 6, 5), 5, 3.5);   // principal cálida
  panel("#FF8FA3", 0.9, new THREE.Vector3(-7, 1, 2), 2.5, 6);  // borde rosa
  panel("#6FD6E8", 0.9, new THREE.Vector3(6, 0, -5), 2.5, 6);  // borde turquesa
  panel("#FFFFFF", 0.7, new THREE.Vector3(0, 9, 0), 4, 4);     // cenital suave
  const pm = new THREE.PMREMGenerator(renderer);
  STUDIO.texture = pm.fromScene(scene, 0.02).texture;
  pm.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return STUDIO.texture;
}

/** Inyecta la luz de borde en cualquier material con iluminación (Lambert, Standard, Toon). */
export function addRim(mat, strength = 1) {
  if (mat.userData.rimK) { mat.userData.rimK.value = strength; return mat; } // material compartido: una sola vez
  const prev = mat.onBeforeCompile;
  mat.userData.rimK = { value: strength };
  mat.onBeforeCompile = (sh, r) => {
    prev?.(sh, r);
    Object.assign(sh.uniforms, RIM, { rimK: mat.userData.rimK });
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform vec3 rimA; uniform vec3 rimB; uniform float rimStrength; uniform float rimPower; uniform float rimK;\nvoid main() {")
      .replace("#include <opaque_fragment>", `{
        vec3 vdirR = normalize(vViewPosition);
        float frR = pow(1.0 - clamp(dot(normal, vdirR), 0.0, 1.0), rimPower);
        vec3 rimCol = mix(rimA, rimB, smoothstep(-0.5, 0.5, normal.x));
        outgoingLight += rimCol * frR * rimStrength * rimK;
      }
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => `rim-${mat.type}`;
  return mat;
}
/** Material suave tipo juguete de vinil. */
export function vinyl(color, { emissive = 0x000000, emissiveIntensity = 1, rim = 1, map = null, side } = {}) {
  const m = new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity, map });
  if (side) m.side = side;
  return addRim(m, rim);
}

/** Vidrio del casco: fresnel + reflejo del cielo + brillo especular. Sin transmisión física. */
export function glassMaterial({ tint = "#B9D8FF", strength = 1 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...ENV, tint: { value: new THREE.Color(tint) }, strength: { value: strength }, time: { value: 0 } },
    // con piel (SkinnedMesh del GLB) el vidrio sigue al hueso de la cabeza; sin piel los chunks no hacen nada
    vertexShader: /* glsl */`
      #include <common>
      #include <skinning_pars_vertex>
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      void main() {
        #include <skinbase_vertex>
        #include <beginnormal_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);
        vec4 mv = viewMatrix * wp;
        vN = normalize(normalMatrix * objectNormal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D envMap; uniform vec3 tint; uniform float strength;
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      const float PI = 3.14159265;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);
        vec3 wv = normalize(vWP - cameraPosition);
        vec3 r = reflect(wv, normalize(vWN));
        vec2 uv = vec2(atan(r.z, r.x) / (2.0 * PI) + 0.5, asin(clamp(r.y, -1.0, 1.0)) / PI + 0.5);
        vec3 env = texture2D(envMap, uv).rgb;
        vec3 L = normalize(vec3(-0.5, 0.75, 0.45));
        float spec = pow(max(dot(reflect(-L, n), v), 0.0), 70.0);
        float spec2 = pow(max(dot(reflect(-normalize(vec3(0.6, 0.2, 0.8)), n), v), 0.0), 18.0) * 0.18;
        vec3 col = env * (0.35 + fr * 1.1) + tint * fr * 0.35 + vec3(1.0, 0.97, 0.92) * (spec * 1.3 + spec2);
        float a = clamp((0.1 + fr * 0.62 + spec * 0.9 + spec2) * strength, 0.0, 1.0);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- Acabado final compartido ("realismo estilizado") ---------- */
/**
 * Material PBR suave con reflejo de estudio y luz de borde (mismo acabado que el cohete y las lunas).
 * Se usa para todos los recursos finales; reutilizar la instancia entre objetos del mismo acabado.
 */
export function pbr(color, { rough = 0.45, metal = 0.05, map = null, normalMap = null, normalScale = 1, roughnessMap = null, emissive = null, ei = 0, rim = 0.5, env = 1, side, transparent = false, opacity = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map, normalMap, roughnessMap, transparent, opacity });
  if (normalMap) m.normalScale = new THREE.Vector2(normalScale, normalScale);
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei; }
  if (side) m.side = side;
  if (STUDIO.texture) { m.envMap = STUDIO.texture; m.envMapIntensity = env; }
  return addRim(m, rim);
}
/** Pseudoaleatorio con semilla (texturas y formas reproducibles). */
export function rng(seed = 1) { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
/** Normal map a partir de un canvas de altura en gris (se escribe en el mismo canvas y se devuelve la textura). */
export function heightToNormal(cv, strength = 3, { wrap = true } = {}) {
  const S = cv.width, T = cv.height, c = cv.getContext("2d", { willReadFrequently: true });
  const src = c.getImageData(0, 0, S, T).data, out = c.createImageData(S, T);
  const H = (x, y) => src[((((y % T) + T) % T) * S + (((x % S) + S) % S)) * 4] / 255;
  for (let y = 0; y < T; y++) for (let x = 0; x < S; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
    out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  c.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** Canvas de altura con ruido fino (fibras de papel, poro de pintura): base para normal maps de microdetalle. */
export function grainCanvas(size = 256, { seed = 3, fibers = 900, speck = 2600, base = 128 } = {}) {
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  const c = cv.getContext("2d"), r = rng(seed);
  c.fillStyle = `rgb(${base},${base},${base})`; c.fillRect(0, 0, size, size);
  for (let i = 0; i < speck; i++) { const v = 100 + r() * 60; c.fillStyle = `rgba(${v},${v},${v},.5)`; c.fillRect(r() * size, r() * size, 1 + r() * 1.5, 1 + r() * 1.5); }
  c.lineCap = "round";
  for (let i = 0; i < fibers; i++) {
    const x = r() * size, y = r() * size, a = r() * Math.PI, l = 3 + r() * 10, v = r() < 0.5 ? 150 : 108;
    c.strokeStyle = `rgba(${v},${v},${v},.35)`; c.lineWidth = 0.6 + r() * 0.8;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { c.beginPath(); c.moveTo(x + ox, y + oy); c.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); c.stroke(); }
  }
  return cv;
}
let solarTex = null;
/** Celdas solares (compartidas: estación y satélites): azul lavanda con rejilla plateada y reflejo en diagonal. */
export function solarTexture() {
  return (solarTex ??= canvasTex(512, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#5B6FE0"); g.addColorStop(0.5, "#3E4FB8"); g.addColorStop(1, "#6B5FD0");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const cw = w / 8, ch = h / 4;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) {
      const gg = c.createLinearGradient(x * cw, y * ch, (x + 1) * cw, (y + 1) * ch); gg.addColorStop(0, "rgba(255,255,255,.10)"); gg.addColorStop(1, "rgba(20,20,80,.12)");
      c.fillStyle = gg; c.fillRect(x * cw + 3, y * ch + 3, cw - 6, ch - 6);
      c.strokeStyle = "rgba(160,200,255,.35)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x * cw + cw / 2, y * ch + 3); c.lineTo(x * cw + cw / 2, (y + 1) * ch - 3); c.stroke();
    }
    c.strokeStyle = "#D9E4FF"; c.lineWidth = 4;
    for (let x = 0; x <= 8; x++) { c.beginPath(); c.moveTo(x * cw, 0); c.lineTo(x * cw, h); c.stroke(); }
    for (let y = 0; y <= 4; y++) { c.beginPath(); c.moveTo(0, y * ch); c.lineTo(w, y * ch); c.stroke(); }
  }));
}
let foilNrm = null;
/** Normal map de lámina térmica arrugada (satélites, detalles dorados). */
export function foilNormal() {
  return (foilNrm ??= (() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const c = cv.getContext("2d"), r = rng(31);
    c.fillStyle = "#808080"; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      const x = r() * 256, y = r() * 256, v = 90 + r() * 90;
      c.fillStyle = `rgb(${v},${v},${v})`; c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 4; k++) c.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 90);
      c.closePath(); c.fill();
    }
    c.filter = "blur(1.2px)"; c.drawImage(cv, 0, 0); c.filter = "none";
    return heightToNormal(cv, 2.6);
  })());
}
let paperNrm = null;
/** Normal map de papel (una sola vez, compartido: regalos, polaroids, mural). */
export function paperNormal() { return (paperNrm ??= heightToNormal(grainCanvas(256, { seed: 11 }), 2.2)); }

/* ---------- Texturas en canvas ---------- */
export function canvasTex(w, h, draw, { srgb = true, mips = true } = {}) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = mips; if (!mips) t.minFilter = THREE.LinearFilter;
  t.anisotropy = 2;
  return t;
}
/** Disco suave para halos y partículas. */
let glowTex = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  glowTex = canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,.55)"); g.addColorStop(0.6, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  });
  return glowTex;
}
/** Destello de 4 puntas con centro suave (puntos de la trayectoria, cometas, estrellas especiales). */
let flareTex = null;
export function flareTexture() {
  if (flareTex) return flareTex;
  flareTex = canvasTex(128, 128, (c, w) => {
    const m = w / 2;
    const g = c.createRadialGradient(m, m, 0, m, m, m * 0.5); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, w);
    for (const [sx, sy] of [[1, 0.06], [0.06, 1], [0.55, 0.035], [0.035, 0.55]]) {
      c.save(); c.translate(m, m); if (sx < 0.6 && sy < 0.6) c.rotate(Math.PI / 4);
      const gg = c.createRadialGradient(0, 0, 0, 0, 0, m); gg.addColorStop(0, "rgba(255,255,255,.95)"); gg.addColorStop(1, "rgba(255,255,255,0)");
      c.scale(sx, sy); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, m, 0, Math.PI * 2); c.fill(); c.restore();
    }
  });
  return flareTex;
}
/** Halo aditivo (sprite barato). */
export function halo(color, size, opacity = 0.8) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
/** Nube suave (humo, nubes, nebulosas cercanas). */
let cloudTex = null;
export function cloudTexture() {
  if (cloudTex) return cloudTex;
  cloudTex = canvasTex(128, 128, (c, w) => {
    const R = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 14; i++) {
      const x = R(0.3, 0.7) * w, y = R(0.32, 0.68) * w, r = R(0.16, 0.32) * w;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, w);
    }
  });
  return cloudTex;
}
/**
 * Nube/humo con volumen "iluminado": varias bolitas (domos de altura) → sombreado por píxel con la luz del amanecer
 * arriba a la izquierda (crema/durazno) y sombra lavanda abajo; bordes suaves. Se genera una vez por semilla.
 * Para que la luz sea coherente, los sprites que la usan casi no rotan.
 */
const litClouds = new Map();
export function litCloudTexture(seed = 5, { light = [255, 244, 232], warm = [255, 206, 178], shade = [178, 160, 222] } = {}) {
  if (litClouds.has(seed)) return litClouds.get(seed);
  const S = 256, hgt = new Float32Array(S * S), r = rng(seed);
  const blobs = Array.from({ length: 16 }, (_, i) => { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.26 * (i < 5 ? 0.5 : 1); return { x: 0.5 + Math.cos(a) * d, y: 0.54 + Math.sin(a) * d * 0.8, r: (i < 5 ? 0.2 : 0.11) + r() * 0.09 }; });
  for (const b of blobs) {
    const cx = b.x * S, cy = b.y * S, rr = b.r * S;
    for (let y = Math.max(0, Math.floor(cy - rr)); y < Math.min(S, cy + rr); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x < Math.min(S, cx + rr); x++) {
      const d = ((x - cx) ** 2 + (y - cy) ** 2) / (rr * rr);
      if (d < 1) hgt[y * S + x] = Math.max(hgt[y * S + x], Math.sqrt(1 - d) * rr / S);
    }
  }
  const cv = document.createElement("canvas"); cv.width = cv.height = S;
  const c = cv.getContext("2d"), img = c.createImageData(S, S);
  const L = new THREE.Vector3(-0.55, 0.6, 0.58).normalize();
  for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
    const i = y * S + x, h = hgt[i];
    if (h <= 0) continue;
    const nx = (hgt[i - 1] - hgt[i + 1]) * 40, ny = (hgt[i - S] - hgt[i + S]) * 40;
    const len = Math.hypot(nx, ny, 1), dl = Math.max(0, (nx * L.x - ny * L.y + L.z) / len);
    const k = Math.min(1, dl * 1.15), rim = Math.pow(1 - Math.min(1, h * S / 30), 3);
    const o = i * 4;
    for (let ch = 0; ch < 3; ch++) img.data[o + ch] = shade[ch] + (light[ch] - shade[ch]) * k + (warm[ch] - light[ch]) * rim * k * 0.6;
    img.data[o + 3] = Math.min(255, Math.pow(Math.min(1, h * S / 22), 0.8) * 255);
  }
  c.putImageData(img, 0, 0);
  c.filter = "blur(1.5px)"; c.drawImage(cv, 0, 0); c.filter = "none";
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  litClouds.set(seed, t);
  return t;
}
/** Mapa de normales de cráteres suaves (luna y media luna). */
export function craterNormalMap(size = 512, seed = 7) {
  const cv = document.createElement("canvas"); cv.width = cv.height = size;
  const c = cv.getContext("2d");
  const hgt = new Float32Array(size * size);
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let k = 0; k < 46; k++) {
    const cx = rnd() * size, cy = rnd() * size, r = (0.02 + rnd() * rnd() * 0.12) * size;
    for (let y = Math.floor(cy - r * 1.4); y < cy + r * 1.4; y++) for (let x = Math.floor(cx - r * 1.4); x < cx + r * 1.4; x++) {
      const xx = (x + size) % size, yy = (y + size) % size, d = Math.hypot(x - cx, y - cy) / r;
      if (d > 1.4) continue;
      const bowl = d < 1 ? -(1 - d * d) * 0.9 : 0, rimH = Math.exp(-((d - 1) ** 2) / 0.02) * 0.35;
      hgt[yy * size + xx] += (bowl + rimH) * (r / size) * 6;
    }
  }
  const img = c.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const dx = hgt[y * size + ((x + 1) % size)] - hgt[y * size + ((x - 1 + size) % size)];
    const dy = hgt[((y + 1) % size) * size + x] - hgt[((y - 1 + size) % size) * size + x];
    const n = new THREE.Vector3(-dx * 18, -dy * 18, 1).normalize();
    img.data[i * 4] = (n.x * 0.5 + 0.5) * 255; img.data[i * 4 + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i * 4 + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
