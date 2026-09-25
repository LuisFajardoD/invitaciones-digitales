// Astronauta PROVISIONAL hecho con código (se reemplaza por un GLB desde models.js).
// Proporciones chibi (casco ≈ 45 % de la altura), articulaciones para animar y las mismas piezas con nombre que
// busca model-adapter.js: "visor" (foto del niño), "helmet_glass" (vidrio fresnel), "suit", "patch".
// Altura total = 1 unidad; pivote en el centro del cuerpo.
import * as THREE from "three";
import { vinyl, glassMaterial, themed } from "../scene/materials.js";
import { shade } from "../ui/patch.js";

/** Poses (ángulos en radianes). Se mezclan suavemente entre sí. */
export const POSES = {
  fly: { body: [0.12, 0, 0], head: [0.05, 0, 0], shL: [0.3, 0, 0.45], shR: [-0.2, 0, -0.55], elL: -0.5, elR: -0.4, hipL: [-0.35, 0, 0.08], hipR: [0.3, 0, -0.08], knL: 0.5, knR: 0.35 },
  wave: { body: [0, 0, 0], head: [0, 0, 0.1], shL: [0.1, 0, 0.3], shR: [0, 0, -2.5], elL: -0.3, elR: -0.9, hipL: [0.05, 0, 0.06], hipR: [-0.05, 0, -0.06], knL: 0.15, knR: 0.1 },
  sleep: { body: [0.4, 0, -0.15], head: [0.3, 0, -0.35], shL: [-1.1, 0, 0.55], shR: [-1.2, 0, -0.5], elL: -1.6, elR: -1.5, hipL: [-1.1, 0, 0.15], hipR: [-0.9, 0, -0.1], knL: 1.6, knR: 1.3 },
  celebrate: { body: [-0.1, 0, 0], head: [-0.15, 0, 0], shL: [0, 0, 2.6], shR: [0, 0, -2.6], elL: -0.3, elR: -0.3, hipL: [0.2, 0, 0.2], hipR: [-0.2, 0, -0.2], knL: 0.3, knR: 0.3 },
  sit: { body: [0, 0, 0], head: [0.05, 0, 0], shL: [-0.4, 0, 0.25], shR: [-0.4, 0, -0.25], elL: -1, elR: -1, hipL: [-1.5, 0, 0.1], hipR: [-1.5, 0, -0.1], knL: 1.5, knR: 1.5 }
};
POSES.float = POSES.fly; // flotar: en el procedural es la misma pose que volar

/**
 * Textura de la foto del visor (512 px): fondo de visor oscuro y la foto centrada con viñeta circular.
 * Las UV del visor del GLB usan todo el ancho (u 0–1) y la franja v 0.107–0.893 del alto (≈ 402 px visibles): la
 * foto (cara con pelo ≈ 95 % de su alto, fondo oscuro) se dibuja a 430 px: el rostro (frente a barbilla) ocupa
 * ≈ 80 % del alto visible y el pelo y las orejas se funden con el borde del visor.
 * Se mezcla con "lighten": el fondo negro de la foto toma el color del visor (sin cuadro ni círculo visible).
 */
export function visorTexture(img) {
  const S = 512, cv = document.createElement("canvas"); cv.width = cv.height = S;
  const c = cv.getContext("2d");
  const g = c.createRadialGradient(S * 0.45, S * 0.4, S * 0.05, S / 2, S / 2, S / 2);
  g.addColorStop(0, "#221E52"); g.addColorStop(1, "#0E0B26");
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  if (img) {
    const D = 430, k = D / Math.max(img.width, img.height), w = img.width * k, h = img.height * k;
    // foto con los bordes desvanecidos (máscara radial) en un lienzo aparte
    const pc = document.createElement("canvas"); pc.width = pc.height = D;
    const p = pc.getContext("2d");
    p.drawImage(img, (D - w) / 2, (D - h) / 2, w, h);
    p.globalCompositeOperation = "destination-in";
    const m = p.createRadialGradient(D / 2, D / 2, D * 0.38, D / 2, D / 2, D * 0.5);
    m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(1, "rgba(0,0,0,0)");
    p.fillStyle = m; p.fillRect(0, 0, D, D);
    c.globalCompositeOperation = "lighten";
    c.drawImage(pc, (S - D) / 2, (S - D) / 2);
    c.globalCompositeOperation = "source-over";
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/**
 * Material del visor: dos fotos (dormido → despierto) con fundido cruzado (`mix` 0–1), un destello suave al cambiar
 * (`flash`) y ajuste de color por escena (`gain` multiplica, `contrast` alrededor del gris medio). Sin luces (la foto
 * se ve siempre clara); el vidrio del casco va encima.
 */
export function visorMaterial(map = visorTexture(null)) {
  const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false });
  // (astronaut.js reemplaza estos uniforms por unos compartidos entre sus modelos antes del primer dibujo)
  mat.userData.visor = visorUniforms(map);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mat.userData.visor);
    sh.fragmentShader = "uniform sampler2D map2; uniform float mixK; uniform float flash; uniform vec3 gain; uniform float contrast;\n" + sh.fragmentShader.replace("#include <map_fragment>", /* glsl */`
      #ifdef USE_MAP
        vec4 ph = mix(texture2D(map, vMapUv), texture2D(map2, vMapUv), mixK);
        ph.rgb = max((ph.rgb - 0.18) * contrast + 0.18, 0.0) * gain;
        float fl = flash * (1.0 - smoothstep(0.0, 0.62, distance(vMapUv, vec2(0.46, 0.44))));
        ph.rgb += vec3(1.0, 0.95, 0.85) * fl * 0.55;
        diffuseColor *= ph;
      #endif`);
  };
  mat.customProgramCacheKey = () => "visor-photo";
  return mat;
}
export function visorUniforms(map = null) {
  return { map2: { value: map }, mixK: { value: 0 }, flash: { value: 0 }, gain: { value: new THREE.Color(1, 1, 1) }, contrast: { value: 1 } };
}

/** Casquete esférico al frente (+Z) con UV planas (la foto circular no se deforma). */
export function frontCap(radius, angle, seg = 40) {
  const geo = new THREE.SphereGeometry(radius, seg, seg, Math.PI / 2 - angle, angle * 2, Math.PI / 2 - angle, angle * 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv, span = radius * Math.sin(angle);
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * span) + 0.5, pos.getY(i) / (2 * span) + 0.5);
  return geo;
}

export function createProceduralAstronaut({ suitColor = "#F4F1FA" } = {}) {
  const root = new THREE.Group(); root.name = "astronaut";
  const suit = vinyl(suitColor), dark = vinyl(new THREE.Color(shade(suitColor, 0.72))), accent = themed(vinyl("#3D6BE0"), "primary"); // detalles: primario del tema
  suit.name = "suit"; dark.name = "suit_dark"; accent.name = "accent";
  const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; return m; };
  const pelvis = new THREE.Group(); pelvis.position.y = -0.02; root.add(pelvis);
  // cuerpo
  const torso = new THREE.Group(); pelvis.add(torso);
  const body = mesh(new THREE.SphereGeometry(0.2, 32, 24), suit, "suit"); body.scale.set(1, 1.12, 0.9); body.position.y = -0.03; torso.add(body);
  const belt = mesh(new THREE.TorusGeometry(0.178, 0.022, 10, 40), accent, "belt"); belt.rotation.x = Math.PI / 2; belt.position.y = -0.1; belt.scale.set(1, 0.9, 1); torso.add(belt);
  const pack = mesh(new THREE.CapsuleGeometry(0.1, 0.12, 6, 16), dark, "backpack"); pack.scale.set(1.35, 1, 0.75); pack.position.set(0, 0.02, -0.17); torso.add(pack);
  const patch = mesh(new THREE.CircleGeometry(0.058, 32), new THREE.MeshLambertMaterial({ color: 0xffffff }), "patch");
  patch.position.set(0.07, 0.03, 0.172); patch.rotation.y = 0.35; torso.add(patch);
  // cabeza / casco
  const head = new THREE.Group(); head.position.y = 0.15; torso.add(head);
  const collar = mesh(new THREE.TorusGeometry(0.12, 0.032, 10, 32), dark, "collar"); collar.rotation.x = Math.PI / 2; head.add(collar);
  const helmet = mesh(new THREE.SphereGeometry(0.235, 40, 32), suit, "helmet"); helmet.position.y = 0.2; head.add(helmet);
  const visorTex = visorTexture(null);
  const visor = mesh(frontCap(0.238, 0.72), visorMaterial(visorTex), "visor");
  visor.position.copy(helmet.position); head.add(visor);
  const rim = mesh(new THREE.TorusGeometry(0.238 * Math.sin(0.72), 0.018, 10, 48), accent, "visor_rim");
  rim.position.set(0, 0.2, 0.238 * Math.cos(0.72)); head.add(rim);
  const glass = mesh(frontCap(0.25, 0.8), glassMaterial(), "helmet_glass");
  glass.position.copy(helmet.position); glass.renderOrder = 3; head.add(glass);
  const antenna = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), dark, "antenna"); antenna.position.set(-0.13, 0.43, -0.02); antenna.rotation.z = 0.35; head.add(antenna);
  const ball = mesh(new THREE.SphereGeometry(0.022, 12, 10), accent, "antenna_tip"); ball.position.set(-0.145, 0.47, -0.02); head.add(ball);
  // brazos y piernas con articulaciones
  const limb = (len, r, mat) => { const g = new THREE.CapsuleGeometry(r, len, 6, 14); g.translate(0, -len / 2 - r * 0.3, 0); return mesh(g, mat, "suit"); };
  const makeArm = (s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.19, 0.06, 0); torso.add(sh);
    sh.add(limb(0.06, 0.055, suit));
    const el = new THREE.Group(); el.position.y = -0.1; sh.add(el);
    el.add(limb(0.04, 0.05, suit));
    const glove = mesh(new THREE.SphereGeometry(0.058, 16, 12), dark, "glove"); glove.position.y = -0.1; glove.scale.set(1, 0.95, 0.9); el.add(glove);
    return { sh, el };
  };
  const makeLeg = (s) => {
    const hip = new THREE.Group(); hip.position.set(s * 0.085, -0.17, 0); pelvis.add(hip);
    hip.add(limb(0.04, 0.066, suit));
    const kn = new THREE.Group(); kn.position.y = -0.1; hip.add(kn);
    kn.add(limb(0.02, 0.062, suit));
    const boot = mesh(new THREE.SphereGeometry(0.075, 16, 12), dark, "boot"); boot.scale.set(0.95, 0.72, 1.25); boot.position.set(0, -0.1, 0.02); kn.add(boot);
    return { hip, kn };
  };
  const armL = makeArm(1), armR = makeArm(-1), legL = makeLeg(1), legR = makeLeg(-1);
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = true; });
  // centrar: el casco queda arriba y las botas abajo (altura ≈ 1)
  pelvis.position.y = -0.05;

  // mezcla de poses
  const cur = JSON.parse(JSON.stringify(POSES.fly));
  let target = "fly", waveK = 0;
  const lerpArr = (a, b, k) => { for (let i = 0; i < 3; i++) a[i] += (b[i] - a[i]) * k; };
  const setRot = (o, a) => o.rotation.set(a[0], a[1], a[2]);

  return {
    root, kind: "procedural", visor, glass, patch, parts: { visor, glass, patch, suit, head },
    poses: Object.keys(POSES),
    get pose() { return target; },
    setPose(name) { if (POSES[name]) target = name; },
    /** Cambio inmediato (sin mezcla), p. ej. al teletransportar fuera de cuadro. */
    snapPose(name) { if (!POSES[name]) return; target = name; Object.assign(cur, JSON.parse(JSON.stringify(POSES[name]))); },
    setVisorTexture(tex) { visor.material.map = tex; visor.material.needsUpdate = true; },
    setPatchTexture(tex) { patch.material.map = tex; patch.material.needsUpdate = true; },
    update(dt, t) {
      const P = POSES[target], k = 1 - Math.exp(-6 * dt);
      for (const key of ["body", "head", "shL", "shR", "hipL", "hipR"]) lerpArr(cur[key], P[key], k);
      for (const key of ["elL", "elR", "knL", "knR"]) cur[key] += (P[key] - cur[key]) * k;
      waveK += ((target === "wave" ? 1 : 0) - waveK) * k;
      const sleeping = target === "sleep", celebrate = target === "celebrate";
      setRot(torso, [cur.body[0] + Math.sin(t * 1.1) * (sleeping ? 0.03 : 0.05), cur.body[1], cur.body[2] + Math.sin(t * 0.7) * 0.04]);
      setRot(head, [cur.head[0] + Math.sin(t * (sleeping ? 0.9 : 1.3)) * 0.04, cur.head[1] + Math.sin(t * 0.5) * (sleeping ? 0.02 : 0.1), cur.head[2]]);
      setRot(armL.sh, [cur.shL[0] + Math.sin(t * 1.4) * 0.08, cur.shL[1], cur.shL[2] + (celebrate ? Math.sin(t * 9) * 0.25 : 0)]);
      setRot(armR.sh, [cur.shR[0] + Math.sin(t * 1.4 + 1) * 0.08, cur.shR[1], cur.shR[2] + (celebrate ? Math.sin(t * 9 + 1) * 0.25 : 0)]);
      armL.el.rotation.x = cur.elL; armR.el.rotation.x = cur.elR;
      armR.el.rotation.z = Math.sin(t * 9) * 0.55 * waveK; // saludo
      setRot(legL.hip, [cur.hipL[0] + Math.sin(t * 1.2) * 0.06, cur.hipL[1], cur.hipL[2]]);
      setRot(legR.hip, [cur.hipR[0] + Math.sin(t * 1.2 + 2) * 0.06, cur.hipR[1], cur.hipR[2]]);
      legL.kn.rotation.x = cur.knL; legR.kn.rotation.x = cur.knR;
      pelvis.position.y = -0.05 + (celebrate ? Math.abs(Math.sin(t * 4.5)) * 0.06 : 0);
    }
  };
}
