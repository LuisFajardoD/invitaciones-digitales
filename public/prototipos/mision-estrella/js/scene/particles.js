// Partículas instanciadas tipo billboard (una sola llamada de dibujo por sistema) con pool fijo:
// humo, nubes, destellos y cometas. Sin crear objetos por frame.
import * as THREE from "three";

/**
 * createSprites({ count, texture, additive, stretch }) → { mesh, set(i, x, y, z, size, rot, color, alpha, stretchX), hide(i), commit() }
 * stretch: estira el billboard en X (cometas con cola).
 */
export function createSprites({ count = 64, texture, additive = false, depthTest = true, renderOrder = 0 } = {}) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute("position", base.attributes.position); geo.setAttribute("uv", base.attributes.uv);
  const off = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const sz = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3); // size, rot, stretch
  const col = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  [off, sz, col].forEach((a) => a.setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("offset", off); geo.setAttribute("srs", sz); geo.setAttribute("tint", col);
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { map: { value: texture } },
    vertexShader: /* glsl */`
      attribute vec3 offset; attribute vec3 srs; attribute vec4 tint;
      varying vec2 vUv; varying vec4 vTint;
      void main() {
        vUv = uv; vTint = tint;
        vec4 mv = modelViewMatrix * vec4(offset, 1.0);
        float c = cos(srs.y), s = sin(srs.y);
        vec2 p = position.xy * vec2(srs.z, 1.0) * srs.x;
        mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        gl_Position = projectionMatrix * mv;
        if (tint.a <= 0.001) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; varying vec2 vUv; varying vec4 vTint;
      void main() {
        vec4 t = texture2D(map, vUv);
        gl_FragColor = vec4(vTint.rgb * t.rgb, t.a * vTint.a);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = renderOrder;
  const c = new THREE.Color();
  return {
    mesh, count,
    set(i, x, y, z, size, rot = 0, color = "#ffffff", alpha = 1, stretch = 1) {
      off.setXYZ(i, x, y, z); sz.setXYZ(i, size, rot, stretch);
      if (typeof color === "string" || typeof color === "number") c.set(color); else c.copy(color);
      col.setXYZW(i, c.r, c.g, c.b, alpha);
    },
    hide(i) { col.setW(i, 0); },
    hideAll() { for (let i = 0; i < count; i++) col.setW(i, 0); col.needsUpdate = true; },
    commit() { off.needsUpdate = true; sz.needsUpdate = true; col.needsUpdate = true; }
  };
}
