// Set del despegue (acabado final): suelo al amanecer con colinas, plataforma de lanzamiento con franjas de
// seguridad pastel, foso y deflector de llama; torre de servicio de vigas (instanciadas) con plataformas, pararrayos,
// baliza roja y reflectores cálidos; dos brazos de servicio (el de arriba con cabina de acceso) que se retiran al
// encender motores. Humo de mayor calidad: dos capas de partículas con textura de volumen iluminado (núcleo cálido y
// denso junto a la tobera y en la base; nubes de humo grandes que se esparcen por el piso). Nubes del ascenso con
// volumen, bordes suaves y luz del amanecer. Llama estilizada. La secuencia por tiempo vive en timeline.js.
import * as THREE from "three";
import { vinyl, halo, pbr, canvasTex, litCloudTexture, rng } from "./materials.js";
import { createSprites } from "./particles.js";

export const PAD_Y = -260; // altura del suelo
export const CLOUD_Y = -195;

/** Cubierta de la plataforma: concreto crema con franjas de seguridad rosa/crema en el borde y juntas. */
function padTexture() {
  return canvasTex(512, 512, (c, w) => {
    const r = rng(4), cx = w / 2;
    c.fillStyle = "#EDE6F4"; c.fillRect(0, 0, w, w);
    for (let i = 0; i < 2600; i++) { const v = 215 + r() * 30; c.fillStyle = `rgba(${v},${v - 6},${v + 6},.5)`; c.fillRect(r() * w, r() * w, 2, 2); }
    // franjas de seguridad en anillo exterior
    const R0 = w * 0.42, R1 = w * 0.5;
    for (let k = 0; k < 36; k++) {
      const a0 = (k / 36) * Math.PI * 2, a1 = ((k + 0.5) / 36) * Math.PI * 2;
      c.fillStyle = "#FF8FA3"; c.beginPath(); c.arc(cx, cx, R1, a0, a1); c.arc(cx, cx, R0, a1, a0, true); c.closePath(); c.fill();
    }
    // juntas y marcas
    c.strokeStyle = "rgba(90,80,140,.25)"; c.lineWidth = 3;
    for (const rr of [w * 0.2, w * 0.33, R0]) { c.beginPath(); c.arc(cx, cx, rr, 0, Math.PI * 2); c.stroke(); }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * w * 0.2, cx + Math.sin(a) * w * 0.2); c.lineTo(cx + Math.cos(a) * R0, cx + Math.sin(a) * R0); c.stroke(); }
    // hollín suave alrededor del foso
    const g = c.createRadialGradient(cx, cx, w * 0.08, cx, cx, w * 0.3); g.addColorStop(0, "rgba(70,55,100,.45)"); g.addColorStop(1, "rgba(70,55,100,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  });
}

export function createLaunchSet({ particles = 1, low = false } = {}) {
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
  // --- plataforma: cubierta con franjas, foso de llama y deflector
  const steel = pbr("#B3ACD6", { rough: 0.38, metal: 0.6, env: 1, rim: 0.4 });
  const white = pbr("#FFF7EC", { rough: 0.45, metal: 0.05, env: 0.6 });
  const dark = pbr("#4A4278", { rough: 0.6, metal: 0.3 });
  const gold = pbr("#FFC96B", { rough: 0.3, metal: 0.7, emissive: "#6a4a10", ei: 0.12, env: 1, rim: 0.4 });
  const deck = pbr("#ffffff", { rough: 0.7, map: padTexture(), env: 0.35 });
  const padGeo = new THREE.CylinderGeometry(2.3, 2.6, 0.5, low ? 32 : 64);
  const pad = new THREE.Mesh(padGeo, [white, deck, dark]); pad.position.y = PAD_Y + 0.25; base.add(pad);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.07, 8, low ? 32 : 64), gold); lip.rotation.x = Math.PI / 2; lip.position.y = PAD_Y + 0.5; base.add(lip);
  const trench = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 32), dark); trench.position.y = PAD_Y + 0.51; base.add(trench);
  const deflector = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.35, 4), steel); deflector.position.y = PAD_Y + 0.62; deflector.rotation.y = Math.PI / 4; base.add(deflector);
  // --- torre de servicio: 4 patas + travesaños y diagonales instanciados, plataformas, pararrayos
  const tower = new THREE.Group(); tower.position.set(-2.9, PAD_Y, -0.6); base.add(tower);
  const TH = 6.4, hw = 0.42, strut = new THREE.BoxGeometry(0.07, 1, 0.07), bars = [];
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), mid = new THREE.Vector3();
  const bar = (a, b) => { d.subVectors(b, a); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); bars.push(M.compose(mid.addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1)).clone()); };
  const C = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]], V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  C.forEach(([x, z]) => bar(V3(x, 0, z), V3(x, TH, z)));
  const levels = low ? 5 : 9;
  for (let k = 0; k < levels; k++) {
    const y0 = (k / levels) * TH, y1 = ((k + 1) / levels) * TH;
    for (let s = 0; s < 4; s++) { const [x0, z0] = C[s], [x1, z1] = C[(s + 1) % 4]; bar(V3(x0, y1, z0), V3(x1, y1, z1)); bar(V3(x0, k % 2 ? y0 : y1, z0), V3(x1, k % 2 ? y1 : y0, z1)); }
  }
  const lattice = new THREE.InstancedMesh(strut, pbr("#FF9DAF", { rough: 0.45, metal: 0.35, env: 0.8, rim: 0.4 }), bars.length);
  bars.forEach((m, i) => lattice.setMatrixAt(i, m)); tower.add(lattice);
  const platGeo = new THREE.BoxGeometry(1.2, 0.07, 1.2);
  for (const y of [1.6, 3.0, 4.4, TH]) { const pl = new THREE.Mesh(platGeo, steel); pl.position.y = y; tower.add(pl); }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.3, 6), steel); rod.position.y = TH + 0.65; tower.add(rod);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: "#FF6F86", toneMapped: false })); beacon.position.y = TH + 1.32; tower.add(beacon);
  const beaconGlow = halo("#FF8FA3", 1.6, 0.8); beaconGlow.position.y = TH + 1.32; tower.add(beaconGlow);
  // reflectores cálidos apuntando al cohete
  const floods = [];
  for (const y of [1.7, 4.5]) {
    const lamp = new THREE.Group(); lamp.position.set(0.5, y + 0.12, 0.45); lamp.rotation.set(0.2, -0.5, 0.35); tower.add(lamp);
    lamp.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.14), dark));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), new THREE.MeshBasicMaterial({ color: "#FFE3B0", toneMapped: false })); face.position.z = 0.075; lamp.add(face);
    const fg = halo("#FFD9A0", 1.6, 0.55); fg.position.z = 0.1; lamp.add(fg); floods.push(fg);
  }
  // brazos de servicio (bisagra en la torre): se retiran al encender motores
  const arms = [];
  for (const [y, len, cab] of [[2.35, 1.35, false], [3.75, 1.3, true]]) {
    const hinge = new THREE.Group(); hinge.position.set(hw, y, 0.25); tower.add(hinge);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.34), white); beam.position.x = len / 2; hinge.add(beam);
    for (const z of [-0.16, 0.16]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.025, 0.025), steel); rail.position.set(len / 2, 0.24, z); hinge.add(rail); }
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(len * 0.98, 0.04, 0.35), pbr("#FF8FA3", { rough: 0.4, env: 0.6 })); stripe.position.set(len / 2, -0.07, 0); hinge.add(stripe);
    if (cab) { const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.42), white); cabin.position.set(len - 0.1, 0.25, 0); hinge.add(cabin); const w = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), new THREE.MeshBasicMaterial({ color: "#FFE3B0", toneMapped: false })); w.position.set(len - 0.1, 0.3, 0.215); hinge.add(w); }
    arms.push(hinge);
  }

  // --- nubes del ascenso: billboards instanciados con volumen iluminado por el amanecer
  const nClouds = Math.round(80 * Math.max(0.5, particles));
  const clouds = createSprites({ count: nClouds, texture: litCloudTexture(5), renderOrder: 2 });
  const r = rng(11);
  // (vistas desde arriba se superponen mucho: alfa moderado y tintes variados para que no se "quemen" en blanco)
  const cloudCols = ["#FBF4FF", "#FFEFF3", "#EFE6FF", "#FFF6EC"];
  for (let i = 0; i < nClouds; i++) {
    const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 115, top = r() < 0.35;
    clouds.set(i, Math.cos(a) * rr, CLOUD_Y + (r() - 0.5) * 14 + (top ? 6 : 0), Math.sin(a) * rr - 10, (top ? 34 : 24) + r() * 30, (r() - 0.5) * 0.35, cloudCols[i % 4], top ? 0.78 : 0.66);
  }
  clouds.commit();
  group.add(clouds.mesh);

  // --- humo: capa grande (se esparce, lavanda en sombra) + núcleo cálido y denso junto a la llama
  const nSmoke = Math.round(170 * particles), nCore = Math.round(70 * particles);
  const smoke = createSprites({ count: nSmoke, texture: litCloudTexture(6), renderOrder: 3 });
  const core = createSprites({ count: nCore, texture: litCloudTexture(7, { light: [255, 246, 236], warm: [255, 196, 150], shade: [230, 196, 214] }), renderOrder: 4 });
  smoke.hideAll(); core.hideAll(); group.add(smoke.mesh, core.mesh);
  const puffs = Array.from({ length: nSmoke }, () => ({ life: -1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, rot: 0, max: 1 }));
  const cores = Array.from({ length: nCore }, () => ({ life: -1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, rot: 0, max: 1 }));
  let cursor = 0, cc = 0;
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
  let armOpen = 0;
  const step = (list, spr, dt, lift) => {
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.life < 0) { spr.hide(i); continue; }
      p.life += dt;
      if (p.life > p.max) { p.life = -1; spr.hide(i); continue; }
      const k = p.life / p.max;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vx *= 1 - dt * 0.9; p.vz *= 1 - dt * 0.9; p.vy = p.vy * (1 - dt * 0.6) + lift * dt;
      if (p.y < PAD_Y + 0.4) { p.y = PAD_Y + 0.4; p.vy = Math.abs(p.vy) * 0.2; }
      const size = p.size * (1 + k * (lift > 0 ? 4.8 : 2.2));
      const warm = Math.max(0, 1 - k * 2.5);
      tc.setRGB(1, 1 - warm * 0.1, 1 - warm * 0.22);
      spr.set(i, p.x, p.y, p.z, size, p.rot + k * 0.15, tc, Math.sin(Math.min(1, k * 1.25) * Math.PI) * (lift > 0 ? 0.82 : 0.9));
    }
    spr.commit();
  };
  return {
    group, base, flame, ground, clouds,
    padTop: new THREE.Vector3(0, PAD_Y + 0.5, 0),
    /** Emite humo en `origin` (mundo) con intensidad 0–1; en el piso se esparce más denso. */
    emit(origin, rate, dt, { spread = 1, down = 1 } = {}) {
      const onGround = origin.y < PAD_Y + 3;
      const n = Math.min(12, Math.floor(rate * dt * 60 + Math.random()));
      for (let k = 0; k < n; k++) {
        const p = puffs[cursor]; cursor = (cursor + 1) % puffs.length;
        const a = Math.random() * Math.PI * 2, sp = (onGround ? 5 + Math.random() * 9 : 1 + Math.random() * 2) * spread;
        p.life = 0; p.max = 2.4 + Math.random() * 2;
        p.x = origin.x + (Math.random() - 0.5) * 0.6; p.y = origin.y; p.z = origin.z + (Math.random() - 0.5) * 0.6;
        p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = onGround ? 0.6 + Math.random() * 1.2 : -(2 + Math.random() * 4) * down;
        p.size = (onGround ? 1.8 : 1.4) + Math.random() * 1.8; p.rot = (Math.random() - 0.5) * 0.4;
      }
      // núcleo denso y cálido pegado a la llama / base
      const m = Math.min(6, Math.floor(rate * dt * 40 + Math.random()));
      for (let k = 0; k < m; k++) {
        const p = cores[cc]; cc = (cc + 1) % cores.length;
        const a = Math.random() * Math.PI * 2, sp = (onGround ? 2.5 + Math.random() * 3 : 0.6 + Math.random()) * spread;
        p.life = 0; p.max = 0.9 + Math.random() * 0.8;
        p.x = origin.x + (Math.random() - 0.5) * 0.4; p.y = origin.y; p.z = origin.z + (Math.random() - 0.5) * 0.4;
        p.vx = Math.cos(a) * sp; p.vz = Math.sin(a) * sp; p.vy = onGround ? 0.3 + Math.random() * 0.6 : -(3 + Math.random() * 3) * down;
        p.size = 0.9 + Math.random() * 0.9; p.rot = (Math.random() - 0.5) * 0.3;
      }
    },
    update(dt, t, rocketPos, power) {
      flameMat.uniforms.time.value = t; flameMat.uniforms.power.value = power;
      flame.visible = power > 0.01;
      flameGlow.material.opacity = power * 0.9;
      beaconGlow.material.opacity = ((t * 0.9) % 1) < 0.2 ? 0.95 : 0.15;
      floods.forEach((f, i) => { f.material.opacity = 0.45 + 0.08 * Math.sin(t * 3 + i); });
      // los brazos se retiran al encender motores (y vuelven al repetir)
      armOpen = THREE.MathUtils.damp(armOpen, power > 0.01 ? 1 : 0, 2.2, dt);
      arms.forEach((a, i) => { a.rotation.y = armOpen * (1.25 + i * 0.2); });
      step(puffs, smoke, dt, 0.35);
      step(cores, core, dt, 0);
    },
    clearSmoke() { puffs.forEach((p) => { p.life = -1; }); cores.forEach((p) => { p.life = -1; }); smoke.hideAll(); core.hideAll(); }
  };
}
