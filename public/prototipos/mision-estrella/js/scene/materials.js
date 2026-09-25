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
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying vec3 vWN; varying vec3 vWP;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * normal);
        vec4 mv = viewMatrix * wp;
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
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
