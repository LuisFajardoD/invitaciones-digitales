// Cielo: esfera de fondo que sigue a la cámara con la nebulosa pre-renderizada, más el degradado de amanecer
// (durazno y lavanda) que se funde a espacio índigo según la altitud (uniform `space`, 0 = amanecer, 1 = espacio).
// Nubes de nebulosa cercanas (sprites aditivos fijos en el mundo) para el parallax por capas.
import * as THREE from "three";
import { cloudTexture } from "./materials.js";

export function createSky(nebulaTex) {
  const c = (hex) => new THREE.Color(hex);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: {
      neb: { value: nebulaTex }, space: { value: 1 }, fade: { value: 1 },
      dawnLow: { value: c("#FFC9A0") }, dawnMid: { value: c("#F4B6C2") }, dawnHigh: { value: c("#B9A2FF") },
      dayLow: { value: c("#BFE7FF") }, dayHigh: { value: c("#6FA8F0") }, violet: { value: c("#5B3E9E") }
    },
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
    fragmentShader: /* glsl */`
      uniform sampler2D neb; uniform float space, fade;
      uniform vec3 dawnLow, dawnMid, dawnHigh, dayLow, dayHigh, violet;
      varying vec3 vDir;
      const float PI = 3.14159265;
      void main() {
        vec3 d = normalize(vDir);
        vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
        vec3 nebula = texture2D(neb, uv).rgb;
        float y = d.y;
        vec3 dawn = mix(dawnLow, dawnMid, smoothstep(-0.05, 0.18, y));
        dawn = mix(dawn, dawnHigh, smoothstep(0.15, 0.7, y));
        vec3 day = mix(dayLow, dayHigh, smoothstep(-0.05, 0.6, y));
        vec3 atm = mix(dawn, day, smoothstep(0.15, 0.45, space));
        atm = mix(atm, violet, smoothstep(0.45, 0.75, space));
        vec3 col = mix(atm, nebula, smoothstep(0.62, 0.95, space));
        gl_FragColor = vec4(col * fade, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), mat);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  return {
    mesh, uniforms: mat.uniforms,
    update(camera) { mesh.position.copy(camera.position); }
  };
}

/** Nubes de nebulosa cercanas, fijas en el mundo (parallax real al moverse la cámara). */
export function createNebulaClouds(count = 10) {
  const group = new THREE.Group();
  const tex = cloudTexture();
  const cols = ["#FF8FA3", "#6FD6E8", "#FFC9A0", "#B9A2FF"];
  let s = 42; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cols[i % cols.length], transparent: true, opacity: 0.16 + rnd() * 0.12, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const along = -80 - rnd() * 600;
    sp.position.set((rnd() - 0.5) * 420, (rnd() - 0.3) * 200, along - 120);
    sp.scale.setScalar(140 + rnd() * 180);
    sp.material.rotation = rnd() * Math.PI;
    sp.renderOrder = -5;
    group.add(sp);
  }
  return group;
}
