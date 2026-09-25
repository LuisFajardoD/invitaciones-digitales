// La Tierra vista desde arriba: esfera grande con continentes y nubes suaves (ruido en el shader, colores
// pastel) y atmósfera turquesa con fresnel. Se ve como curvatura al final del despegue y en la caminata.
import * as THREE from "three";

const NOISE = /* glsl */`
  float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float fb(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vn(p); p *= 2.07; a *= 0.5; } return s; }
`;

export function createEarth({ radius = 600 } = {}) {
  const group = new THREE.Group(); group.name = "earth";
  const c = (x) => new THREE.Color(x);
  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, sun: { value: new THREE.Vector3(0.4, 0.6, 0.5).normalize() },
      ocean: { value: c("#3E8FD6") }, oceanLight: { value: c("#7CCBEA") }, land: { value: c("#8FD19E") }, land2: { value: c("#E8D59A") }, cloud: { value: c("#FFF7EC") }, night: { value: c("#2A2266") } },
    vertexShader: "varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: /* glsl */`
      uniform float time; uniform vec3 sun, ocean, oceanLight, land, land2, cloud, night;
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      ${NOISE}
      void main() {
        vec3 d = normalize(vP);
        float h = fb(d * 5.0);
        vec3 col = mix(ocean, oceanLight, smoothstep(0.35, 0.52, h));
        float isLand = smoothstep(0.54, 0.57, h);
        col = mix(col, mix(land, land2, smoothstep(0.6, 0.75, fb(d * 11.0 + 3.0))), isLand);
        float cl = smoothstep(0.52, 0.72, fb(d * 7.0 + vec3(time * 0.004, 0.0, 0.0)));
        col = mix(col, cloud, cl * 0.85);
        float lit = clamp(dot(normalize(vN), sun) * 0.7 + 0.45, 0.0, 1.0);
        col = mix(night, col, lit);
        float fr = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 3.0);
        col += vec3(0.44, 0.84, 0.91) * fr * 0.8;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), mat);
  group.add(earth);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.045, 96, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { col: { value: c("#6FD6E8") }, col2: { value: c("#FFC9A0") } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }",
    fragmentShader: "uniform vec3 col, col2; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 + dot(normalize(vN), normalize(vV)) * 1.15, 0.0, 1.0), 3.0); vec3 c = mix(col2, col, smoothstep(0.1, 0.9, f)); gl_FragColor = vec4(c * f, f); \n#include <colorspace_fragment>\n }"
  }));
  group.add(atmo);
  return { group, update(dt, t) { mat.uniforms.time.value = t; earth.rotation.y = t * 0.004; } };
}
