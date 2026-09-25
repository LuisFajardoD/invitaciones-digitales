// Nebulosa: shader de ruido fbm suave renderizado UNA sola vez a una textura equirectangular al cargar
// (no por frame). La usan el cielo y el reflejo del vidrio del casco. Espacio índigo → violeta, nebulosas en
// rosa, durazno y turquesa. Nada de negro puro.
import * as THREE from "three";

const NOISE = /* glsl */`
  vec3 hash3(vec3 p) { p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453) * 2.0 - 1.0; }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash3(i), f), dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * noise3(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;

/** Renderiza la nebulosa a una textura (w×h) y la devuelve. */
export function renderNebula(renderer, { w = 1024, h = 512 } = {}) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  rt.texture.wrapS = THREE.RepeatWrapping;
  const c = (hex) => new THREE.Color(hex);
  const mat = new THREE.RawShaderMaterial({
    uniforms: {
      cIndigo: { value: c("#1E1B4B") }, cViolet: { value: c("#3B2A7A") }, cDeep: { value: c("#171440") },
      cPink: { value: c("#FF8FA3") }, cPeach: { value: c("#FFC9A0") }, cTeal: { value: c("#6FD6E8") }, cGold: { value: c("#FFD27A") }
    },
    vertexShader: "attribute vec3 position; varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 cIndigo, cViolet, cDeep, cPink, cPeach, cTeal, cGold;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415926;
        vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));
        vec3 col = mix(cDeep, cIndigo, smoothstep(-0.9, 0.2, d.y));
        col = mix(col, cViolet, smoothstep(0.0, 0.7, fbm(d * 1.3 + 3.0) + 0.25) * 0.8);
        // nubes de nebulosa (tres colores en capas suaves)
        float n1 = fbm(d * 2.2 + vec3(1.7, 0.3, 4.1)), n2 = fbm(d * 2.8 + vec3(8.2, 2.1, 0.7)), n3 = fbm(d * 3.4 + vec3(5.5, 7.3, 2.2));
        float band = exp(-pow((d.y - 0.12 - 0.25 * sin(lon * 1.5)) * 2.2, 2.0)); // banda principal
        col += cPink * smoothstep(0.05, 0.55, n1) * band * 0.55;
        col += cPeach * smoothstep(0.15, 0.6, n2) * band * 0.35;
        col += cTeal * smoothstep(0.1, 0.6, n3) * (0.35 + 0.65 * (1.0 - band)) * 0.32 * smoothstep(-0.3, 0.3, d.x + n1);
        // filamentos finos dentro de la banda (segunda escala de detalle)
        float fil = fbm(d * 6.5 + vec3(n1 * 1.5, n2, 0.0));
        col += mix(cPink, cTeal, smoothstep(-0.2, 0.3, n3)) * smoothstep(0.18, 0.5, fil) * band * 0.18;
        // vetas de polvo oscuro (profundidad por capas): oscurecen suavemente la banda
        float lane = smoothstep(0.1, 0.45, fbm(d * 3.9 + vec3(2.4, 9.1, 3.3))) * band;
        col = mix(col, col * vec3(0.55, 0.5, 0.75), lane * 0.55);
        // nudos brillantes (regiones de formación estelar) y polvo dorado muy tenue
        float knot = smoothstep(0.42, 0.62, n1 + fil * 0.4) * band;
        col += mix(cPeach, vec3(1.0), 0.4) * knot * 0.22;
        float dust = smoothstep(0.35, 0.6, fbm(d * 7.0)) * 0.12;
        col += cGold * dust * band;
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const scene = new THREE.Scene(); scene.add(quad);
  const cam = new THREE.Camera();
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(prev);
  quad.geometry.dispose(); mat.dispose();
  return rt.texture;
}
