// La Tierra vista desde arriba (despegue, órbita, caminata): acabado final estilizado.
// Océanos con degradado de profundidad (más claros junto a las costas) y reflejo del sol; continentes estilizados
// por ruido (no copia de mapas) con playa, verdes variados, colinas lavanda y relieve sombreado; capa de nubes
// aparte que gira lento, con volumen iluminado y sombra sobre el suelo; franja cálida de amanecer en el
// terminador y atmósfera con fresnel turquesa suave. Todo en shader (sin texturas que descargar).
import * as THREE from "three";

const NOISE = /* glsl */`
  float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float fb(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p *= 2.07; a *= 0.5; } return s / 0.97; }
  float fb3(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vn(p); p *= 2.11; a *= 0.5; } return s / 0.875; }
`;
const VERT = "varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }";

export function createEarth({ radius = 600, low = false } = {}) {
  const group = new THREE.Group(); group.name = "earth";
  const c = (x) => new THREE.Color(x);
  const sun = new THREE.Vector3(0.45, 0.55, 0.55).normalize();
  const common = { time: { value: 0 }, sun: { value: sun }, cloudRot: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...common, deep: { value: c("#2F6FC4") }, shallow: { value: c("#6FD0E6") }, sand: { value: c("#F4DEAA") }, land: { value: c("#8FD19E") }, land2: { value: c("#C9DB8E") }, hill: { value: c("#B7A6D6") }, snow: { value: c("#FFF7EC") }, night: { value: c("#2A2266") }, dawn: { value: c("#FFB08A") } },
    vertexShader: VERT,
    fragmentShader: /* glsl */`
      uniform float time, cloudRot; uniform vec3 sun, deep, shallow, sand, land, land2, hill, snow, night, dawn;
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      ${NOISE}
      vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
      void main() {
        vec3 d = normalize(vP), n = normalize(vN), v = normalize(vV);
        float h = fb(d * 3.2 + vec3(1.7, 0.0, 0.0));
        float coast = 0.575; // ~⅓ tierra, ~⅔ océano
        float isLand = smoothstep(coast, coast + 0.012, h);
        // océano: profundo → claro junto a la costa
        vec3 col = mix(deep, shallow, smoothstep(coast - 0.16, coast, h));
        // tierra: playa, verdes variados, colinas lavanda, relieve sombreado
        float e = fb3(d * 22.0);
        vec3 terr = mix(land, land2, smoothstep(0.35, 0.75, fb3(d * 9.0 + 3.0)));
        terr = mix(terr, hill, smoothstep(0.66, 0.78, h) * 0.8);
        terr = mix(sand, terr, smoothstep(coast + 0.006, coast + 0.03, h));
        float hx = fb3(d * 22.0 + vec3(0.02, 0.0, 0.0)) - e, hy = fb3(d * 22.0 + vec3(0.0, 0.02, 0.0)) - e;
        float relief = clamp(0.92 + (hx * 0.7 - hy * 0.9) * 6.0, 0.7, 1.15);
        col = mix(col, terr * relief, isLand);
        // (sin casquetes polares: la cámara ve la Tierra desde arriba, justo sobre el polo)
        float polar = 0.0;
        // luz: día, noche índigo y franja cálida de amanecer en el terminador
        float ndl = dot(n, sun);
        float lit = smoothstep(-0.25, 0.45, ndl);
        col = mix(night, col, lit * 0.85 + 0.15);
        col = mix(col, col * dawn * 1.4, smoothstep(0.35, 0.0, abs(ndl + 0.05)) * 0.45);
        // sombra de las nubes (se proyecta un poco hacia el lado contrario al sol)
        vec3 cd = rotY(d, -cloudRot) - sun * 0.012;
        float cl = smoothstep(0.58, 0.76, fb(cd * 7.0 + vec3(0.0, 0.0, time * 0.002)));
        col *= 1.0 - cl * 0.22 * lit;
        // reflejo del sol en el océano
        vec3 hv = normalize(sun + v);
        float spec = pow(max(dot(n, hv), 0.0), 90.0) * (1.0 - isLand) * (1.0 - polar);
        col += vec3(1.0, 0.92, 0.8) * spec * 0.9 * lit;
        // fresnel turquesa suave
        float fr = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
        col += vec3(0.44, 0.84, 0.91) * fr * (0.35 + 0.5 * lit);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const seg = low ? [64, 40] : [128, 80];
  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, seg[0], seg[1]), mat);
  group.add(earth);
  // nubes: capa aparte con volumen suave (lado del sol claro, base lavanda), bordes difusos
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, seg[0], seg[1]), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...common, cloud: { value: c("#FFF7EC") }, shade: { value: c("#B9A8E0") }, dawn: { value: c("#FFC9A0") } },
    vertexShader: VERT,
    fragmentShader: /* glsl */`
      uniform float time; uniform vec3 sun, cloud, shade, dawn; varying vec3 vP; varying vec3 vN; varying vec3 vV;
      ${NOISE}
      void main() {
        vec3 d = normalize(vP), n = normalize(vN);
        vec3 q = d * 7.0 + vec3(0.0, 0.0, time * 0.002);
        float f = fb(q);
        float a = smoothstep(0.58, 0.76, f);
        float thick = smoothstep(0.66, 0.86, f);
        float ndl = dot(n, sun), lit = smoothstep(-0.2, 0.5, ndl);
        vec3 col = mix(shade, cloud, 0.45 + thick * 0.55);
        col = mix(col, col * dawn * 1.2, smoothstep(0.35, 0.0, abs(ndl + 0.05)) * 0.5);
        col *= 0.35 + lit * 0.75;
        gl_FragColor = vec4(col, a * 0.85);
        #include <colorspace_fragment>
      }`
  }));
  group.add(clouds);
  // atmósfera exterior: halo turquesa del lado del día, durazno en el terminador
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.045, seg[0], seg[1]), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { col: { value: c("#6FD6E8") }, col2: { value: c("#FFC9A0") }, sun: { value: sun } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: "uniform vec3 col, col2, sun; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 + dot(normalize(vN), normalize(vV)) * 1.15, 0.0, 1.0), 3.0); float day = smoothstep(-0.5, 0.6, dot(-normalize(vN), sun)); vec3 c = mix(col2, col, smoothstep(0.1, 0.9, f)); gl_FragColor = vec4(c * f * (0.45 + day * 0.75), f); \n#include <colorspace_fragment>\n }"
  }));
  group.add(atmo);
  return {
    group,
    update(dt, t) {
      mat.uniforms.time.value = t;
      earth.rotation.y = t * 0.004;
      clouds.rotation.y = t * 0.0065; // las nubes giran un poco más rápido que el suelo
      common.cloudRot.value = clouds.rotation.y - earth.rotation.y;
    }
  };
}
