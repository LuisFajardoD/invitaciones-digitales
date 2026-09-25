// Superficie lunar procedural, renderizada UNA vez en la GPU a dos texturas equirectangulares (color + normal map):
// mares oscuros, tierras altas, cráteres en 3 escalas (cuenco, borde elevado, pico central en los grandes),
// rayos brillantes alrededor de algunos cráteres y grano fino. Se evalúa sobre la esfera (3D): sin costuras.
// La usan la Luna (cap. 4) y la luna creciente de la portada. Tonos cálidos para el "espacio de cuento".
import * as THREE from "three";

const SURFACE = /* glsl */`
  precision highp float;
  vec3 hash33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.02 + 7.1; a *= 0.5; } return s; }
  // Campo de cráteres (una escala): altura y "frescura" (para los rayos y el borde brillante)
  vec2 craters(vec3 d, float scale, float density, float seed) {
    vec3 p = d * scale; vec3 ip = floor(p);
    float hgt = 0.0, fresh = 0.0;
    for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
      vec3 c = ip + vec3(float(x), float(y), float(z));
      vec3 rnd = hash33(c + seed);
      if (rnd.z > density) continue;
      vec3 center = c + 0.2 + 0.6 * rnd;
      float r = 0.18 + 0.32 * hash13(c + seed + 5.3);
      float dist = length(p - center) / r;
      if (dist > 1.6) continue;
      float bowl = dist < 1.0 ? -(1.0 - dist * dist) * 0.9 : 0.0;
      float rim = exp(-pow((dist - 1.0) / 0.2, 2.0)) * 0.45;
      float peak = r > 0.4 ? exp(-dist * dist / 0.02) * 0.35 : 0.0;
      float ejecta = dist > 1.0 ? exp(-(dist - 1.0) * 3.0) * 0.08 : 0.0;
      hgt += (bowl + rim + peak + ejecta) * r;
      fresh = max(fresh, (1.0 - smoothstep(0.9, 1.5, dist)) * step(0.6, hash13(c + seed + 9.1)));
    }
    return vec2(hgt, fresh);
  }
  float maria(vec3 d) { return smoothstep(0.47, 0.6, fbm(d * 1.5 + vec3(3.1, 1.7, 5.2))); }
  float heightAt(vec3 d) {
    float h = (fbm(d * 4.0) - 0.5) * 0.25;
    h -= maria(d) * 0.12;
    h += craters(d, 5.0, 0.35, 1.0).x * 0.55;
    h += craters(d, 11.0, 0.28, 2.0).x * 0.3;
    h += craters(d, 26.0, 0.3, 3.0).x * 0.12;
    return h;
  }
  vec3 dirFromUv(vec2 uv) { // mismo mapeo que SphereGeometry
    float phi = uv.x * 6.2831853, theta = (1.0 - uv.y) * 3.1415926;
    return vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
  }
`;

function pass(renderer, w, h, frag) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping });
  const mat = new THREE.RawShaderMaterial({
    vertexShader: "attribute vec3 position; varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `${SURFACE}\nvarying vec2 vUv;\n${frag}`, depthTest: false, depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat), scene = new THREE.Scene(); scene.add(quad);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(scene, new THREE.Camera()); renderer.setRenderTarget(prev);
  quad.geometry.dispose(); mat.dispose();
  rt.texture.wrapS = THREE.RepeatWrapping; rt.texture.anisotropy = 4;
  return rt.texture;
}

let cached = null;
/** Genera { map, normalMap } (una vez). w = ancho (alto = w/2). */
export function moonSurface(renderer, w = 1024) {
  if (cached) return cached;
  const h = w / 2;
  // color (valores en espacio sRGB: la textura se marca como sRGB)
  const map = pass(renderer, w, h, /* glsl */`
    void main() {
      vec3 d = dirFromUv(vUv);
      float m = maria(d);
      vec2 c1 = craters(d, 5.0, 0.35, 1.0), c2 = craters(d, 11.0, 0.28, 2.0), c3 = craters(d, 26.0, 0.3, 3.0);
      vec3 high = vec3(0.95, 0.91, 0.84), low = vec3(0.55, 0.53, 0.55);
      vec3 col = mix(high, low, m);
      col *= 0.9 + 0.2 * fbm(d * 9.0);
      col *= 0.92 + 0.1 * vnoise(d * 80.0);
      // fondo de cráter un poco más oscuro, borde fresco más claro
      col *= 1.0 + clamp(c1.x + c2.x * 0.7, -0.25, 0.2) * 0.6;
      // rayos de cráteres frescos (vetas radiales brillantes)
      float rays = 0.0;
      vec3 A = normalize(vec3(0.3, -0.45, 0.84)), B = normalize(vec3(-0.6, 0.5, 0.62));
      for (int k = 0; k < 2; k++) {
        vec3 cc = k == 0 ? A : B;
        float ang = acos(clamp(dot(d, cc), -1.0, 1.0));
        vec3 t = normalize(cross(cc, vec3(0.0, 1.0, 0.0))), b = cross(cc, t);
        float az = atan(dot(d, b), dot(d, t));
        float streak = pow(max(0.0, sin(az * 17.0 + fbm(d * 6.0) * 6.0)), 6.0);
        rays += streak * smoothstep(0.9, 0.05, ang) * smoothstep(0.02, 0.08, ang);
      }
      col += vec3(0.1, 0.09, 0.07) * rays + vec3(0.06) * (c2.y + c3.y) * 0.5;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`);
  map.colorSpace = THREE.SRGBColorSpace;
  // normal map (espacio tangente de SphereGeometry: T = este (+u), B = norte (+v))
  const normalMap = pass(renderer, w, h, /* glsl */`
    void main() {
      vec3 d = dirFromUv(vUv);
      float phi = vUv.x * 6.2831853, theta = (1.0 - vUv.y) * 3.1415926;
      vec3 E = vec3(sin(phi), 0.0, cos(phi));
      vec3 N = vec3(cos(phi) * cos(theta), sin(theta), -sin(phi) * cos(theta));
      float e = 0.0025;
      float dE = heightAt(normalize(d + E * e)) - heightAt(normalize(d - E * e));
      float dN = heightAt(normalize(d + N * e)) - heightAt(normalize(d - N * e));
      vec3 n = normalize(vec3(-dE * 18.0, -dN * 18.0, 1.0));
      gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    }`);
  cached = { map, normalMap };
  return cached;
}
/** Ya generada (o null si aún no). */
export const moonSurfaceReady = () => cached;
