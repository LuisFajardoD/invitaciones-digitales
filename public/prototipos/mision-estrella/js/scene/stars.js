// Estrellas: 3 capas de Points con tamaño por distancia y titileo en el shader. Cada capa acompaña a la cámara
// con un factor de parallax distinto (las lejanas casi fijas, la cercana se mueve más), así funcionan en
// cualquier parte del mundo. Estrella fugaz ocasional.
import * as THREE from "three";

const PALETTE = ["#FFD27A", "#FFF7EC", "#FFF7EC", "#DCD2FF", "#BFEFFF", "#FFC9A0"];

export function createStars({ density = 1 } = {}) {
  const group = new THREE.Group();
  const uniforms = { time: { value: 0 }, opacity: { value: 1 }, pixelRatio: { value: 1 } };
  const layers = [
    { n: 1400, r: 900, size: 2.2, parallax: 0.02 },
    { n: 700, r: 600, size: 3.0, parallax: 0.08 },
    { n: 220, r: 320, size: 4.2, parallax: 0.2 }
  ].map((L, li) => {
    const n = Math.round(L.n * density);
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n), sz = new Float32Array(n);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = L.r * (0.85 + Math.random() * 0.3), q = Math.sqrt(1 - u * u);
      pos.set([rr * q * Math.cos(th), rr * u, rr * q * Math.sin(th)], i * 3);
      c.set(PALETTE[(Math.random() * PALETTE.length) | 0]); col.set([c.r, c.g, c.b], i * 3);
      seed[i] = Math.random() * 100; sz[i] = L.size * (0.5 + Math.pow(Math.random(), 3) * 1.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("size", new THREE.BufferAttribute(sz, 1));
    const m = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float seed; attribute float size; attribute vec3 color;
        uniform float time; uniform float pixelRatio;
        varying vec3 vCol; varying float vTw;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vTw = 0.55 + 0.45 * sin(time * (0.8 + fract(seed) * 2.2) + seed * 6.28);
          vCol = color;
          gl_PointSize = size * pixelRatio * (0.75 + 0.35 * vTw) * (${L.r.toFixed(1)} / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float opacity; varying vec3 vCol; varying float vTw;
        void main() {
          vec2 p = gl_PointCoord - 0.5; float d = length(p);
          float core = smoothstep(0.5, 0.0, d); float cross = max(smoothstep(0.05, 0.0, abs(p.x)) , smoothstep(0.05, 0.0, abs(p.y))) * smoothstep(0.5, 0.1, d) * 0.5;
          float a = (core * core + cross * vTw) * opacity * (0.55 + 0.45 * vTw);
          gl_FragColor = vec4(vCol * a, a);
          #include <colorspace_fragment>
        }`
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false; pts.renderOrder = -8 + li;
    pts.userData.parallax = L.parallax;
    group.add(pts);
    return pts;
  });

  // estrella fugaz
  const trailMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { a: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float a; varying vec2 vUv; void main(){ float t = pow(vUv.x, 2.5) * smoothstep(0.5, 0.0, abs(vUv.y - 0.5)); vec3 c = mix(vec3(1.0,0.82,0.48), vec3(1.0), vUv.x); gl_FragColor = vec4(c * t * a, t * a); }"
  });
  const shoot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), trailMat);
  shoot.visible = false; shoot.frustumCulled = false;
  group.add(shoot);
  let next = 3 + Math.random() * 4, sh = null;
  const dir = new THREE.Vector3(), tmp = new THREE.Vector3();

  return {
    group, uniforms, layers,
    setPixelRatio(pr) { uniforms.pixelRatio.value = pr; },
    /** enabledShooting: sólo en la portada y capítulos tranquilos. */
    update(dt, t, camera, { shooting = true } = {}) {
      uniforms.time.value = t;
      for (const L of layers) L.position.copy(camera.position).multiplyScalar(1 - L.userData.parallax);
      next -= dt;
      if (shooting && next <= 0 && !sh && uniforms.opacity.value > 0.5) {
        camera.getWorldDirection(dir);
        const right = tmp.crossVectors(dir, camera.up).normalize();
        const start = camera.position.clone().addScaledVector(dir, 120).addScaledVector(camera.up, 25 + Math.random() * 25).addScaledVector(right, (Math.random() - 0.2) * 60);
        const vel = right.clone().multiplyScalar(-1).addScaledVector(camera.up, -0.45).normalize().multiplyScalar(90);
        sh = { p: start, v: vel, life: 0 };
        next = 7 + Math.random() * 9;
      }
      if (sh) {
        sh.life += dt; sh.p.addScaledVector(sh.v, dt);
        const k = sh.life / 1.1;
        shoot.visible = k < 1;
        if (k >= 1) { sh = null; return; }
        shoot.position.copy(sh.p);
        shoot.quaternion.copy(camera.quaternion);
        const vs = sh.v.clone().applyQuaternion(camera.quaternion.clone().invert());
        shoot.rotation.z = Math.atan2(vs.y, vs.x) + Math.PI; // la cola detrás
        shoot.quaternion.multiplyQuaternions(camera.quaternion, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(vs.y, vs.x) + Math.PI));
        shoot.scale.set(22, 0.5, 1);
        trailMat.uniforms.a.value = Math.sin(k * Math.PI) * 0.9;
      } else shoot.visible = false;
    }
  };
}
