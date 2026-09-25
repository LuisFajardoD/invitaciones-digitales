// Set del despegue: suelo al amanecer, plataforma y torre de juguete, capa de nubes, humo abundante (partículas
// instanciadas con textura de nube generada) y llama estilizada. La secuencia por tiempo vive en timeline.js.
import * as THREE from "three";
import { vinyl, cloudTexture, halo } from "./materials.js";
import { createSprites } from "./particles.js";

export const PAD_Y = -260; // altura del suelo
export const CLOUD_Y = -195;

export function createLaunchSet({ particles = 1 } = {}) {
  const group = new THREE.Group(); group.name = "launch";
  const base = new THREE.Group(); base.name = "launch-base"; group.add(base); // todo lo que está a nivel del suelo
  // suelo: disco con degradado pradera → horizonte durazno
  const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 64), new THREE.ShaderMaterial({
    uniforms: { a: { value: new THREE.Color("#9FD9B0") }, b: { value: new THREE.Color("#F4C2B0") }, c: { value: new THREE.Color("#B9A2FF") } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 a,b,c; varying vec2 vP; void main(){ float d = length(vP) / 420.0; vec3 col = mix(a, b, smoothstep(0.05, 0.55, d)); col = mix(col, c, smoothstep(0.55, 1.0, d)); float stripes = 0.03 * sin(vP.x * 0.4) * sin(vP.y * 0.4); gl_FragColor = vec4(col + stripes, 1.0);\n#include <colorspace_fragment>\n}"
  }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = PAD_Y;
  base.add(ground);
  // colinas suaves al fondo
  const hillMat = vinyl("#B7A6E6", { rim: 0.4 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = 150 + (i % 3) * 40;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(40 + (i % 4) * 12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.y = 0.45; hill.position.set(Math.cos(a) * r, PAD_Y, Math.sin(a) * r - 40);
    base.add(hill);
  }
  // plataforma y torre (de juguete)
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.5, 40), vinyl("#C9C2E8")); pad.position.y = PAD_Y + 0.25; base.add(pad);
  const ringPad = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.12, 8, 40), vinyl("#FF8FA3")); ringPad.rotation.x = Math.PI / 2; ringPad.position.y = PAD_Y + 0.52; base.add(ringPad);
  const tower = new THREE.Group(); tower.position.set(-2.6, PAD_Y, -0.6); base.add(tower);
  const towerMat = vinyl("#FFD27A");
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.2, 12), towerMat); post.position.y = 2.6; tower.add(post);
  for (let k = 0; k < 4; k++) { const rung = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 20), vinyl("#FF8FA3")); rung.rotation.x = Math.PI / 2; rung.position.y = 0.9 + k * 1.1; tower.add(rung); }
  const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.4, 4, 10), towerMat); arm.rotation.z = Math.PI / 2; arm.position.set(0.9, 3.6, 0.3); tower.add(arm);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: "#FF8FA3" })); beacon.position.y = 5.35; tower.add(beacon);
  const beaconGlow = halo("#FF8FA3", 1.4, 0.8); beaconGlow.position.y = 5.35; tower.add(beaconGlow);

  // capa de nubes (billboards instanciados)
  const nClouds = Math.round(70 * Math.max(0.5, particles));
  const clouds = createSprites({ count: nClouds, texture: cloudTexture(), renderOrder: 2 });
  let s = 11; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cloudCols = ["#FFF1E6", "#FFE0EA", "#F1E8FF"];
  for (let i = 0; i < nClouds; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 110;
    clouds.set(i, Math.cos(a) * r, CLOUD_Y + (rnd() - 0.5) * 16, Math.sin(a) * r - 10, 26 + rnd() * 30, rnd() * 6, cloudCols[i % 3], 0.85);
  }
  clouds.commit();
  group.add(clouds.mesh);

  // humo
  const nSmoke = Math.round(160 * particles);
  const smoke = createSprites({ count: nSmoke, texture: cloudTexture(), renderOrder: 3 });
  smoke.hideAll(); group.add(smoke.mesh);
  const puffs = Array.from({ length: nSmoke }, () => ({ life: -1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, rot: 0, max: 1 }));
  let cursor = 0;
  // llama (cono aditivo con parpadeo en el shader)
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { time: { value: 0 }, power: { value: 0 } },
    vertexShader: "varying vec2 vUv; uniform float time; uniform float power; void main(){ vUv = uv; vec3 p = position; p.xz *= 1.0 + 0.12 * sin(time * 40.0 + p.y * 8.0); p.y *= 0.6 + power * 0.6 + 0.1 * sin(time * 31.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }",
    fragmentShader: "varying vec2 vUv; uniform float power; void main(){ float t = vUv.y; vec3 c = mix(vec3(1.0, 0.95, 0.7), vec3(1.0, 0.55, 0.5), t); float a = (1.0 - smoothstep(0.25, 1.0, t)) * power; gl_FragColor = vec4(c * a, a);\n#include <colorspace_fragment>\n}"
  });
  const flameGeo = new THREE.ConeGeometry(0.42, 2.2, 20, 1, true); flameGeo.rotateX(Math.PI); flameGeo.translate(0, -1.1, 0); // base en la tobera, punta hacia abajo
  const flame = new THREE.Mesh(flameGeo, flameMat); flame.visible = false; flame.position.y = -0.4; // en la tobera
  const flameGlow = halo("#FFC9A0", 5, 0); flame.add(flameGlow); flameGlow.position.y = -0.6;

  const tc = new THREE.Color();
  return {
    group, base, flame, ground, clouds,
    padTop: new THREE.Vector3(0, PAD_Y + 0.5, 0),
    /** Emite humo en `origin` (mundo) con intensidad 0–1; `ground` = humo que se esparce en el piso. */
    emit(origin, rate, dt, { spread = 1, down = 1 } = {}) {
      const n = Math.min(12, Math.floor(rate * dt * 60 + Math.random()));
      for (let k = 0; k < n; k++) {
        const p = puffs[cursor]; cursor = (cursor + 1) % puffs.length;
        const onGround = origin.y < PAD_Y + 3;
        const a = Math.random() * Math.PI * 2, sp = (onGround ? 5 + Math.random() * 9 : 1 + Math.random() * 2) * spread;
        p.life = 0; p.max = 2.2 + Math.random() * 1.8;
        p.x = origin.x + (Math.random() - 0.5) * 0.6; p.y = origin.y; p.z = origin.z + (Math.random() - 0.5) * 0.6;
        p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = onGround ? 0.6 + Math.random() * 1.2 : -(2 + Math.random() * 4) * down;
        p.size = 1.4 + Math.random() * 1.6; p.rot = Math.random() * 6;
      }
    },
    update(dt, t, rocketPos, power) {
      flameMat.uniforms.time.value = t; flameMat.uniforms.power.value = power;
      flame.visible = power > 0.01;
      flameGlow.material.opacity = power * 0.9;
      beaconGlow.material.opacity = 0.5 + 0.4 * Math.sin(t * 6);
      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i];
        if (p.life < 0) { smoke.hide(i); continue; }
        p.life += dt;
        if (p.life > p.max) { p.life = -1; smoke.hide(i); continue; }
        const k = p.life / p.max;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vx *= 1 - dt * 0.9; p.vz *= 1 - dt * 0.9; p.vy *= 1 - dt * 0.6;
        if (p.y < PAD_Y + 0.4) { p.y = PAD_Y + 0.4; p.vy = Math.abs(p.vy) * 0.2; }
        const size = p.size * (1 + k * 4.5);
        const warm = Math.max(0, 1 - k * 3);
        tc.setRGB(1, 0.96 - warm * 0.12, 0.94 - warm * 0.3);
        smoke.set(i, p.x, p.y, p.z, size, p.rot + k * 0.8, tc, Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.75);
      }
      smoke.commit();
    },
    clearSmoke() { puffs.forEach((p) => { p.life = -1; }); smoke.hideAll(); }
  };
}
