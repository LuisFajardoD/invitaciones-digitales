// Director de la película: construye el mundo (por partes, conforme se acercan los capítulos), maneja los modos
// "cover" (portada), "launch" (despegue por tiempo) y "story" (capítulos 1–9 ligados al scroll), coloca cámara,
// cohete, astronauta y Gloobi, y responde a los toques (Gloobi, estrellas, polaroids).
import * as THREE from "three";
import { demoData } from "../data.js";
import { clamp, smooth, easeInOut, easeIn, invLerp, lerp, prefersReduced, vibrate, missionName, loadImage } from "../util.js";
import { V, samplePath, blendShots, camSpace, shake, shot } from "./camera-path.js";
import { ENV, glowTexture, createStudioEnv } from "./materials.js";
import { renderNebula } from "./nebula.js";
import { createSky, createNebulaClouds } from "./sky.js";
import { createStars } from "./stars.js";
import { createEarth } from "./earth.js";
import { createLaunchSet, PAD_Y, CLOUD_Y } from "./launch.js";
import { createCrescent, createMoonSet } from "./moon.js";
import { createStation } from "./station.js";
import { createConstellation } from "./constellation.js";
import { createMemories } from "./memories.js";
import { createFlightPlan } from "./flightplan.js";
import { createCargo } from "./cargo.js";
import { createMural } from "./rocket-mural.js";
import { createComets } from "./comets.js";
import { createSprites } from "./particles.js";
import { createAstronaut } from "../characters/astronaut.js";
import { visorTexture } from "../characters/astronaut-procedural.js";
import { createRocket } from "../characters/rocket.js";
import { createGloobi } from "../characters/gloobi.js";
import { patchCanvas } from "../ui/patch.js";

/* ---------- Lugares del mundo ---------- */
export const COVER = V(3000, 800, 0);
const A = V(0, 0, 0); // cohete en órbita (capítulos 1–4)
const B = V(0, 0, -540); // cohete del mural (capítulos 5–9)
const CONST = V(0, 24, -40);
const MOON = V(-70, 20, -170);
const STATION = V(55, 5, -260);
const HOLO = STATION.clone().add(V(0, 2.2, 1.6));
const MEM0 = V(40, 0, -290), MEMDIR = V(-40, 0, -80).normalize();
const FLIGHT = V(-40, 0, -440), CARGO = V(-40, -1, -462);
const EARTH_R = 100, EARTH_Y = -114; // la curvatura se ve desde la órbita
const WALK = V(0.9, 2.48, 2.6); // dónde saluda el astronauta en la caminata
const JUMP_FROM = V(2.4, PAD_Y + 0.9, 1.6);
export const CHAPTER_COUNT = 9;
const T = 0.22; // fracción de cada capítulo dedicada a viajar desde el anterior

export function createFilm({ R, quality, audio, showcase = false }) {
  const { scene, camera } = R;
  const reduced = () => prefersReduced();
  const q = quality;
  // --- cielo, nebulosa, estrellas
  const neb = renderNebula(R.renderer, { w: q.nebula, h: q.nebula / 2 });
  ENV.envMap.value = neb;
  try { createStudioEnv(R.renderer); } catch { /* sin reflejos de estudio */ }
  const sky = createSky(neb); scene.add(sky.mesh);
  const clouds = createNebulaClouds(showcase ? 6 : 10); scene.add(clouds);
  const stars = createStars({ density: q.stars }); scene.add(stars.group);
  // --- personajes
  const astro = createAstronaut(demoData.child); scene.add(astro.root);
  const gloobi = createGloobi({ size: 0.16 }); scene.add(gloobi.root);
  loadImage(demoData.child.visorPhoto).then((img) => astro.setVisorTexture(visorTexture(img))).catch(() => {});
  // --- portada
  const crescent = createCrescent(); crescent.holder.position.copy(COVER); crescent.holder.rotation.set(0.12, -0.3, 0.5); crescent.holder.scale.setScalar(0.8); scene.add(crescent.holder);

  // --- partes que se construyen al acercarse
  const W = { earth: null, launch: null, rocket: null, mural: null, constellation: null, moon: null, station: null, memories: null, flight: null, cargo: null, comets: null, trail: null };
  const builders = [
    () => { W.earth = createEarth({ radius: EARTH_R }); W.earth.group.position.set(0, EARTH_Y, 0); W.earth.group.visible = false; scene.add(W.earth.group); },
    () => { W.launch = createLaunchSet({ particles: q.particles }); W.launch.group.visible = false; scene.add(W.launch.group); },
    () => { W.rocket = createRocket(demoData.child); W.rocket.root.visible = false; scene.add(W.rocket.root); W.rocket.root.add(W.launch.flame); W.mural = createMural(W.rocket, demoData.rsvp); },
    () => { W.constellation = createConstellation({ age: demoData.child.age, name: demoData.child.name, width: 22 }); W.constellation.group.position.copy(CONST); W.constellation.group.visible = false; scene.add(W.constellation.group); },
    () => { W.moon = createMoonSet(); W.moon.group.position.copy(MOON); W.moon.group.visible = false; scene.add(W.moon.group); },
    () => { W.station = createStation(); W.station.group.position.copy(STATION); W.station.group.rotation.y = -0.25; W.station.group.visible = false; scene.add(W.station.group); },
    () => { W.memories = createMemories({ anchor: MEM0, dir: MEMDIR }); W.memories.group.visible = false; scene.add(W.memories.group); },
    () => { W.flight = createFlightPlan(); W.flight.group.position.copy(FLIGHT); W.flight.group.scale.setScalar(0.5); scene.add(W.flight.group); W.cargo = createCargo(); W.cargo.group.position.copy(CARGO); scene.add(W.cargo.group); W.flight.group.visible = W.cargo.group.visible = false; },
    () => { W.comets = createComets({ count: Math.round(28 * Math.max(0.5, q.particles)) }); scene.add(W.comets.mesh); W.trail = createTrail(); scene.add(W.trail.sprites.mesh); }
  ];
  // cordón de la caminata espacial (ventana → mochila), curva con caída suave; se actualiza sin crear objetos
  // (tubo delgado de 24 tramos × 6 lados; los vértices se recalculan cada frame sobre la misma geometría)
  const TN = 24, TS = 6, TR = 0.014;
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((TN + 1) * TS * 3), 3));
  tGeo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array((TN + 1) * TS * 3), 3));
  const tIdx = [];
  for (let k = 0; k < TN; k++) for (let s = 0; s < TS; s++) { const a0 = k * TS + s, a1 = k * TS + (s + 1) % TS, b0 = a0 + TS, b1 = a1 + TS; tIdx.push(a0, b0, a1, a1, b0, b1); }
  tGeo.setIndex(tIdx);
  const tether = new THREE.Mesh(tGeo, vinylTether());
  tether.frustumCulled = false; tether.visible = false; scene.add(tether);
  function vinylTether() { const m = new THREE.MeshLambertMaterial({ color: "#FFF7EC", emissive: new THREE.Color("#3a2f6a"), emissiveIntensity: 0.4 }); return m; }
  const tA = V(0, 0, 0), tB = V(0, 0, 0), tC = V(0, 0, 0), tP = V(0, 0, 0), tQ = V(0, 0, 0), tT = V(0, 0, 0), tN = V(0, 0, 0), tBn = V(0, 0, 0), UPV = V(0, 1, 0);
  const bez = (u, out) => { const a = (1 - u) * (1 - u), b2 = 2 * (1 - u) * u, c2 = u * u; return out.set(tA.x * a + tC.x * b2 + tB.x * c2, tA.y * a + tC.y * b2 + tB.y * c2, tA.z * a + tC.z * b2 + tB.z * c2); };
  function updateTether(t) {
    W.rocket.windowWorld(tA);
    tB.set(0, 0.02, -0.17).applyQuaternion(astro.root.quaternion).add(astro.root.position); // mochila
    tC.addVectors(tA, tB).multiplyScalar(0.5); tC.y -= 0.35 + Math.sin(t * 1.3) * 0.05;
    const pos = tGeo.attributes.position, nor = tGeo.attributes.normal;
    for (let k = 0; k <= TN; k++) {
      const u = k / TN;
      bez(u, tP); bez(Math.min(1, u + 0.01), tQ); tT.subVectors(tQ, tP); if (u >= 0.99) { bez(u - 0.01, tQ); tT.subVectors(tP, tQ); }
      tT.normalize(); tN.crossVectors(tT, UPV).normalize(); tBn.crossVectors(tT, tN);
      for (let s = 0; s < TS; s++) {
        const th = (s / TS) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), i = k * TS + s;
        const nx = tN.x * c + tBn.x * sn, ny = tN.y * c + tBn.y * sn, nz = tN.z * c + tBn.z * sn;
        pos.setXYZ(i, tP.x + nx * TR, tP.y + ny * TR, tP.z + nz * TR); nor.setXYZ(i, nx, ny, nz);
      }
    }
    pos.needsUpdate = true; nor.needsUpdate = true;
  }
  let built = 0;
  const buildUpTo = (n) => { while (built < Math.min(n, builders.length)) builders[built++](); };
  if (!showcase) buildUpTo(3); // portada + despegue listos; el resto conforme se acerca
  const buildIdle = () => { if (built < builders.length) { buildUpTo(built + 1); setTimeout(buildIdle, 150); } else precompile(); };
  /** Compila los shaders de todo el mundo en segundo plano (evita tirones la primera vez que aparece cada parte). */
  let compiled = false;
  function precompile() {
    if (compiled) return; compiled = true;
    const hidden = [];
    scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
    const done = () => hidden.forEach((o) => { o.visible = false; });
    // compileAsync recorre la escena en el momento de la llamada; la visibilidad se restaura de inmediato
    try { if (R.renderer.compileAsync) R.renderer.compileAsync(scene, camera).catch(() => {}); else R.renderer.compile(scene, camera); } catch { /* seguir */ }
    done();
  }
  setPatch(null);

  /* ---------- Estado ---------- */
  const st = {
    mode: "cover", t: 0, hold: 0, launchT: 0, launchShort: false, launchDone: true, onLaunchEnd: null, fade: 0,
    chapter: 1, p: 0, lastChapter: 0, flightActive: -1, viewShift: 0, farewellT: -1, celebrateT: -1
  };
  // vectores y cuaterniones de trabajo (nada se crea por frame)
  const cam = shot(), a = shot(), b = shot(), sA = shot();
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), tmp3 = V(0, 0, 0), shk = V(0, 0, 0);
  const astroPos = V(0, 0, 0), prevPos = V(0, 0, 0), gTarget = V(0, 0, 0), rocketPos = V(0, 0, 0);
  const mtx = new THREE.Matrix4(), quat = new THREE.Quaternion(), noRot = new THREE.Quaternion();
  const rA = { pose: "fly", look: "camera", visible: true, scale: 1, inRocket: false }, rB = { ...rA };

  /* ---------- Portada ---------- */
  function coverShot(t, out) {
    const wide = camera.aspect > 1.1 ? 0.95 : 1; // en horizontal (vitrina del home) el encuadre vertical es el mismo
    const k = (t / 24) * Math.PI * 2; // loop perfecto de 24 s
    out.pos.set(COVER.x + 0.35 + Math.sin(k) * 0.35 * wide, COVER.y + 0.55 + Math.sin(k * 2) * 0.12, COVER.z + 5.4 * wide + Math.cos(k) * 0.25);
    out.tgt.set(COVER.x + 0.15 + Math.sin(k) * 0.08, COVER.y + 0.1, COVER.z);
    return out;
  }
  // Pose del astronauta dormido sobre la media luna: [rotX, rotY, rotZ, x, y, z] (ajustable con ?cov= en pruebas)
  const COV = (new URLSearchParams(location.search).get("cov") || "-0.6,0.1,1.2,0.05,0.1,0.5").split(",").map(Number);
  function placeCover(t, hold) {
    const k = (t / 24) * Math.PI * 2;
    astro.root.visible = true; astro.root.scale.setScalar(1);
    astro.root.position.set(COVER.x + COV[3], COVER.y + COV[4] + Math.sin(k * 3) * 0.03, COVER.z + COV[5]);
    astro.root.rotation.set(COV[0], COV[1], COV[2] + Math.sin(k * 2) * 0.03);
    gloobi.follow(null); gloobi.root.visible = true;
    tmp.set(0.1, -0.16, 0.27).applyEuler(astro.root.rotation).add(astro.root.position);
    if (hold > 0.2) tmp.y += hold * 0.3;
    gloobi.root.position.lerp(tmp, hold > 0.15 ? 0.08 : 1);
  }

  /* ---------- Despegue ---------- */
  const LAUNCH_LEN = () => (st.launchShort ? 2.6 : 7.2);
  const IGN = () => (st.launchShort ? 0.15 : 3.8); // momento del despegue
  function rocketLaunchY(lt) {
    const start = PAD_Y + 0.9;
    if (lt < IGN()) return start;
    const u = clamp((lt - IGN()) / (LAUNCH_LEN() - IGN()));
    return lerp(start, 0, Math.pow(u, 2.1));
  }
  const O1 = V(6.2, 1.7, 12), O2 = V(5.5, -3.5, 10.5), O3 = V(2.5, 7, 7.5), O4 = V(5.5, 6.5, 12);
  function launchCamera(lt, out) {
    const ry = rocketLaunchY(lt);
    if (lt < IGN()) { // plano al amanecer: el astronauta sube a la cápsula; conteo
      const k = smooth(lt / IGN());
      out.pos.set(lerp(8, 6.2, k), PAD_Y + lerp(3.2, 2.6, k), lerp(15, 12, k));
      out.tgt.set(0, PAD_Y + 2.4, 0);
      return out;
    }
    const u = clamp((lt - IGN()) / (LAUNCH_LEN() - IGN()));
    if (u < 0.35) tmp.lerpVectors(O1, O2, smooth(u / 0.35)); else if (u < 0.7) tmp.lerpVectors(O2, O3, smooth((u - 0.35) / 0.35)); else tmp.lerpVectors(O3, O4, smooth((u - 0.7) / 0.3));
    out.pos.set(0, ry, 0).add(tmp);
    out.tgt.set(0, ry + (u < 0.7 ? 1.8 : lerp(1.8, 1.2, (u - 0.7) / 0.3)), 0);
    return out;
  }

  /* ---------- Capítulos (story) ---------- */
  // Encuadres: [p, posición, objetivo]. El primero empieza en T (llegada desde el capítulo anterior).
  const CH = {
    1: { keys: [[0, V(5.5, 6.5, 12), V(0, 1.2, 0)], [1, V(4.4, 5.5, 10.8), V(0, 1.6, 0)]] },
    2: { keys: [[T, V(3.6, 3.0, 8.6), V(0.2, 2.2, 1)], [0.5, V(2.7, 2.8, 6.2), V(0.7, 2.45, 2.2)], [0.72, V(1.3, 2.85, 4.25), V(0.9, 2.78, 2.6)], [0.86, V(1.35, 2.85, 4.2), V(0.9, 2.78, 2.6)], [1, V(2.1, 3.3, 5.6), V(0.8, 2.7, 2.3)]] },
    3: { keys: [[T, V(1.8, 4, 9.5), V(0.6, 5.5, 0)], [0.5, V(0, 5, 22), V(0, 23, -40)], [1, V(0, 5.5, 24), V(0, 24, -40)]] },
    4: { keys: [[T, MOON.clone().add(V(14, 6, 60)), MOON], [0.6, MOON.clone().add(V(4, 3, 45)), MOON.clone().add(V(0, -2.5, 0))], [1, MOON.clone().add(V(2, 2.5, 43)), MOON.clone().add(V(0, -2.5, 0))]] },
    5: { keys: [[T, STATION.clone().add(V(-6, 4, 24)), STATION.clone().add(V(0, 1.5, 0))], [0.6, STATION.clone().add(V(-2, 2.6, 13.5)), STATION.clone().add(V(0.2, 1.9, 0))], [1, STATION.clone().add(V(-1, 2.4, 12.5)), STATION.clone().add(V(0.2, 1.9, 0))]] },
    6: { keys: [[T, MEM0.clone().addScaledVector(MEMDIR, -3).add(V(0, 0.4, 0)), MEM0.clone().addScaledVector(MEMDIR, 6)], [1, MEM0.clone().addScaledVector(MEMDIR, 27).add(V(0, 0.4, 0)), MEM0.clone().addScaledVector(MEMDIR, 36)]] },
    7: { keys: [[T, FLIGHT.clone().add(V(0, 5, 22)), FLIGHT.clone().add(V(0, 0.4, 0))], [0.5, FLIGHT.clone().add(V(1, 3.5, 17)), FLIGHT.clone().add(V(0, 0.4, 0))], [0.66, CARGO.clone().add(V(0.5, 2, 10)), CARGO.clone().add(V(0, 0.2, 0))], [1, CARGO.clone().add(V(-0.5, 1.6, 9)), CARGO.clone().add(V(0, 0.2, 0))]] },
    8: { keys: [[T, B.clone().add(V(10, 3.2, 7)), B.clone().add(V(0, 1.8, 0))], [0.5, B.clone().add(V(6.2, 1.9, 0.6)), B.clone().add(V(0.9, 1.4, 0.12))], [1, B.clone().add(V(6.0, 2.0, 0.7)), B.clone().add(V(0.9, 1.4, 0.12))]] },
    9: { keys: [[T, B.clone().add(V(2.6, 2.6, 6.5)), B.clone().add(V(0, 2.2, 0))], [1, B.clone().add(V(4, 3.2, 12)), B.clone().add(V(0, 12, -60))]] }
  };
  // El mural puede estar en otro lugar si el cohete es un GLB: la cámara del cap. 8 sigue su centro real.
  const MURAL_DEFAULT = B.clone().add(V(1.05, 1.47, 0)), muralDelta = V(0, 0, 0);
  function updateMuralDelta() {
    const slots = W.rocket?.slots; if (!slots?.length) return muralDelta.set(0, 0, 0);
    tmp3.set(0, 0, 0); slots.forEach((s) => tmp3.add(s.pos)); tmp3.divideScalar(slots.length);
    tmp3.add(B); // el cohete está en B durante el capítulo 8 (sin rotación ni escala)
    return muralDelta.subVectors(tmp3, MURAL_DEFAULT);
  }
  function rocketAt(i, p, out) {
    if (i <= 4) return out.copy(A);
    out.copy(B);
    if (i === 9) { const k = easeIn(clamp((p - 0.3) / 0.7)); out.y += k * 22; out.z -= k * 110; }
    return out;
  }
  /** Dónde está el astronauta en cada capítulo. Escribe la posición en out y devuelve r (pose, mirada...). */
  function astroAt(i, p, out, r) {
    r.pose = "fly"; r.look = "camera"; r.visible = true; r.scale = 1; r.inRocket = false;
    if (i === 1) { r.visible = false; r.inRocket = true; out.copy(A).set(0, 2.2, 0.4); return r; }
    if (i === 2) {
      W.rocket.windowWorld(tmp3); tmp3.y -= 0.1; tmp3.z -= 0.45;
      out.lerpVectors(tmp3, WALK, smooth((p - 0.3) / 0.25));
      r.visible = p > 0.26; r.inRocket = p < 0.5; r.pose = p > 0.5 ? "wave" : "fly";
      r.look = p > 0.45 ? "camera" : "out";
      return r;
    }
    if (i === 3) { samplePath(CH[3].keys, 0.8, sA); camSpace(sA.pos, sA.tgt, -0.5, -1.3, 5.5, out); r.look = CONST; return r; }
    if (i === 4) { samplePath(CH[4].keys, 0.6, sA); camSpace(sA.pos, sA.tgt, -0.55, -1.25, 6.5, out); r.look = MOON; return r; }
    if (i === 5) { samplePath(CH[5].keys, 0.6, sA); camSpace(sA.pos, sA.tgt, -0.5, -1.0, 5, out); r.look = HOLO; return r; }
    if (i === 6) { samplePath(CH[6].keys, Math.max(p, T), sA); camSpace(sA.pos, sA.tgt, 0.35, -0.25, 5.5, out); r.look = "memories"; return r; }
    if (i === 7) { samplePath(CH[7].keys, p < 0.6 ? 0.5 : 1, sA); camSpace(sA.pos, sA.tgt, -0.35, -0.3, 6, out); r.look = p < 0.6 ? FLIGHT : CARGO; return r; }
    if (i === 8) { samplePath(CH[8].keys, 0.6, sA); sA.pos.add(muralDelta); sA.tgt.add(muralDelta); camSpace(sA.pos, sA.tgt, 0.5, -0.62, 3.6, out); r.pose = "wave"; return r; }
    // 9: sentado en la ventana del cohete, que se aleja
    rocketAt(9, p, tmp3); W.rocket.root.position.copy(tmp3); W.rocket.root.updateMatrixWorld(true);
    W.rocket.windowWorld(out); out.y -= 0.34; out.z -= 0.42;
    r.pose = "sit"; r.scale = 0.95; r.inRocket = true; r.look = "none";
    return r;
  }

  function setPatch(r) {
    const opts = r?.attending ? { color: r.avatar.color, symbol: r.avatar.symbol, top: r.guestName, bottom: missionName() } : { color: demoData.child.accentColor, symbol: "star", top: demoData.child.name, bottom: "Misión" };
    const tex = new THREE.CanvasTexture(patchCanvas(256, opts)); tex.colorSpace = THREE.SRGBColorSpace;
    astro.setPatchTexture(tex);
  }

  /* ---------- Frame ---------- */
  function update(dt, t, story) {
    st.t = t;
    const R0 = reduced();
    let space = 1, shakeAmp = 0, earthY = EARTH_Y;
    if (st.mode === "cover") {
      coverShot(t, cam);
      placeCover(t, st.hold);
      astro.setPose(st.hold > 0.35 ? "fly" : "sleep", { safe: false }); astro.allowSwap();
      gloobi.setMode(st.hold > 0.15 ? "awake" : "sleep");
      gloobi.lookAt(null); gloobi.point(0);
      shakeAmp = R0 ? 0 : st.hold * st.hold * 0.07;
      if (W.rocket) W.rocket.root.visible = false;
      if (W.launch) W.launch.group.visible = false;
      if (W.earth) W.earth.group.visible = false;
      hideStory();
    } else if (st.mode === "launch") {
      earthY = updateLaunch(dt, t, R0);
      space = st.space; shakeAmp = st.shake;
      hideStory();
    } else {
      updateStory(dt, t, story, R0);
    }
    if (W.comets) W.comets.update(dt, camera);
    // cámara final + temblor
    camera.position.copy(cam.pos);
    if (shakeAmp > 0) camera.position.add(shake(t, shakeAmp, shk));
    camera.lookAt(cam.tgt);
    // en capítulos, el protagonista queda en la mitad superior (las tarjetas van abajo)
    st.viewShift = THREE.MathUtils.damp(st.viewShift, st.mode === "story" ? 0.16 : 0, 4, dt);
    const { w, h } = R.size;
    if (st.viewShift > 0.001) camera.setViewOffset(w, h, 0, h * st.viewShift, w, h); else if (camera.view?.enabled) camera.clearViewOffset();
    // cielo, estrellas, tierra
    sky.uniforms.space.value = space;
    sky.update(camera);
    stars.uniforms.opacity.value = smooth(invLerp(0.45, 0.95, space));
    stars.setPixelRatio(R.dpr);
    stars.update(dt, t, camera, { shooting: st.mode === "cover" || (st.mode === "story" && [2, 4, 9].includes(st.chapter)) });
    clouds.visible = space > 0.6;
    if (W.earth) { W.earth.group.position.y = earthY; if (W.earth.group.visible) W.earth.update(dt, t); }
    astro.update(dt, t);
    gloobi.update(dt, t, camera);
  }

  function hideStory() {
    tether.visible = false;
    for (const k of ["constellation", "moon", "station", "memories", "flight", "cargo"]) if (W[k]) W[k].group.visible = false;
  }

  function updateLaunch(dt, t, R0) {
    st.launchT += dt;
    const lt = st.launchT, L = LAUNCH_LEN(), ign = IGN();
    let earthY = EARTH_Y;
    if (R0) { // movimiento reducido: fundido suave del amanecer al espacio, sin temblor
      const k = clamp(lt / L);
      rocketPos.set(0, k < 0.5 ? PAD_Y + 0.9 : 0, 0);
      if (k < 0.5) { cam.pos.set(6.2, PAD_Y + 2.6, 12); cam.tgt.set(0, PAD_Y + 2.4, 0); } else samplePath(CH[1].keys, 0, cam);
      st.fade = Math.sin(clamp((k - 0.3) / 0.4) * Math.PI);
    } else {
      rocketPos.set(0, rocketLaunchY(lt), 0);
      launchCamera(lt, cam);
      st.fade = 0;
    }
    W.rocket.root.visible = true;
    W.rocket.root.position.copy(rocketPos);
    W.rocket.root.updateMatrixWorld(true);
    W.rocket.setHatch(0); W.rocket.setInterior(false);
    // el astronauta salta a la cápsula
    const jumpK = st.launchShort || R0 ? 1 : clamp((lt - 0.2) / 1.1);
    if (jumpK < 1) {
      W.rocket.windowWorld(tmp2);
      astro.root.visible = true; astro.setPose("fly", { safe: false }); astro.allowSwap();
      astro.root.position.lerpVectors(JUMP_FROM, tmp2, easeInOut(jumpK)); astro.root.position.y += Math.sin(jumpK * Math.PI) * 2.2;
      astro.root.scale.setScalar(1 - smooth((jumpK - 0.75) / 0.25) * 0.9);
      astro.root.rotation.set(0, -0.8 + jumpK * 0.8, Math.sin(jumpK * Math.PI) * 0.5);
    } else astro.root.visible = false;
    // Gloobi sale por la ventana al final, señalando hacia abajo
    gloobi.setMode("awake");
    gloobi.root.visible = lt > L - 0.9 || (R0 && lt > L * 0.5);
    if (gloobi.root.visible) { W.rocket.windowWorld(gTarget); gTarget.x += 1.1; gTarget.y += 0.5; gTarget.z += 1.4; gloobi.follow(gTarget); gloobi.point(-1); }
    else { W.rocket.windowWorld(tmp); gloobi.teleport(tmp); gloobi.follow(null); }
    // humo, llama, temblor
    const power = lt >= ign ? clamp((lt - ign) / 0.3) : 0;
    st.shake = 0;
    if (!R0) {
      if (lt > ign - 1.4 && lt < ign) W.launch.emit(W.launch.padTop, 0.45, dt, { spread: 0.6 });
      if (lt >= ign) W.rocket.boosters.forEach((bo) => { tmp.copy(bo).add(rocketPos); W.launch.emit(tmp, lt < ign + 1.2 ? 7 : 2.2, dt, { spread: 1 }); });
      st.shake = lt >= ign ? 0.22 * (1 - clamp((lt - ign) / (L - ign))) + (lt < ign + 0.6 ? 0.18 : 0) : lt > ign - 0.8 ? 0.04 : 0;
      if (lt >= ign && lt - dt < ign) vibrate([60, 40, 120, 40, 200]);
    }
    W.launch.flame.visible = power > 0.01;
    W.launch.update(dt, t, rocketPos, R0 ? 0 : power);
    const camY = cam.pos.y;
    st.space = R0 ? (rocketPos.y > -100 ? 1 : 0) : smooth(invLerp(-235, -30, camY));
    const above = camY > CLOUD_Y + 10 || (R0 && rocketPos.y > -100);
    W.launch.group.visible = true;
    W.launch.base.visible = !above;
    W.launch.clouds.mesh.visible = !R0 || !above;
    W.earth.group.visible = above;
    // arriba de las nubes la Tierra empieza enorme (casi plana) y se encoge hasta verse su curvatura
    const ek = R0 ? 1 : smooth(invLerp(CLOUD_Y + 10, 0, camY)), es = lerp(7, 1, ek);
    W.earth.group.scale.setScalar(es);
    if (above) earthY = R0 ? EARTH_Y : camY - lerp(28, 14, ek) - EARTH_R * es;
    if (lt >= L) endLaunch();
    return earthY;
  }

  function updateStory(dt, t, story, R0) {
    const i = story.chapter, p = story.p;
    st.chapter = i; st.p = p;
    buildUpTo(i + 3);
    if (i !== st.lastChapter) { if (i > st.lastChapter && st.lastChapter) audio.radio(); st.lastChapter = i; if (i >= 5) W.memories?.load(); }
    // cámara (viaje con arco entre capítulos; con movimiento reducido, fundido cruzado)
    const traveling = p < T && i > 1;
    updateMuralDelta();
    const shift = (n, s) => { if (n === 8) { s.pos.add(muralDelta); s.tgt.add(muralDelta); } return s; };
    if (traveling) {
      shift(i - 1, samplePath(CH[i - 1].keys, 1, a)); shift(i, samplePath(CH[i].keys, T, b));
      const k = easeInOut(p / T);
      if (R0) { const s = k < 0.5 ? a : b; cam.pos.copy(s.pos); cam.tgt.copy(s.tgt); st.fade = Math.sin(k * Math.PI); }
      else { blendShots(a, b, k, cam, i === 3 || i === 9 ? 0.02 : 0.1); st.fade = 0; }
    } else { shift(i, samplePath(CH[i].keys, p, cam)); st.fade = 0; }
    // cohete
    rocketAt(i, p, rocketPos);
    W.rocket.root.visible = true; W.rocket.root.position.copy(rocketPos); W.rocket.root.updateMatrixWorld(true);
    W.rocket.setHatch(i === 2 ? smooth((p - 0.2) / 0.12) * (1 - smooth((p - 0.9) / 0.1)) : 0);
    W.launch.group.visible = i === 9 && p > 0.3; W.launch.base.visible = false; W.launch.clouds.mesh.visible = false;
    W.launch.flame.visible = i === 9 && p > 0.3;
    W.launch.update(dt, t, rocketPos, i === 9 ? smooth((p - 0.3) / 0.1) * 0.7 : 0);
    if (W.earth) { W.earth.group.visible = i <= 3; W.earth.group.scale.setScalar(1); }
    // astronauta (durante el viaje se mezcla con el lugar del capítulo anterior)
    let r;
    if (traveling) {
      const ra = astroAt(i - 1, 1, prevPos, rA);
      r = astroAt(i, T, astroPos, rB);
      const k = easeInOut(p / T);
      if (i === 2 || i === 9) { if (k < 0.5) { astroPos.copy(prevPos); r.pose = ra.pose; r.visible = ra.visible; r.inRocket = ra.inRocket; } }
      else astroPos.lerpVectors(prevPos, astroPos, k);
      astro.allowSwap();
    } else r = astroAt(i, p, astroPos, rB);
    if (i === 9) { rocketAt(9, p, rocketPos); W.rocket.root.position.copy(rocketPos); W.rocket.root.updateMatrixWorld(true); }
    astro.root.visible = r.visible;
    astro.root.position.lerp(astroPos, traveling || i === 9 ? 1 : 1 - Math.exp(-6 * dt));
    astro.root.scale.setScalar(r.scale);
    if (st.farewellT >= 0) { st.farewellT += dt; r.pose = "wave"; if (st.farewellT > 3) st.farewellT = -1; }
    if (st.celebrateT >= 0) { st.celebrateT += dt; r.pose = "celebrate"; if (st.celebrateT > 3.5) st.celebrateT = -1; }
    astro.setPose(r.pose, { safe: traveling });
    // orientación
    if (r.look === "none") quat.copy(noRot);
    else {
      if (r.look === "camera") tmp.copy(cam.pos);
      else if (r.look === "out") tmp.set(0.9, 2.5, 8);
      else if (r.look === "memories") tmp.copy(W.memories?.nearest(camera) || cam.tgt);
      else tmp.copy(r.look);
      tmp.y = lerp(astro.root.position.y, tmp.y, 0.3);
      mtx.lookAt(tmp, astro.root.position, camera.up); quat.setFromRotationMatrix(mtx);
    }
    astro.root.quaternion.slerp(quat, traveling ? 0.25 : 1 - Math.exp(-4 * dt));
    W.rocket.setInterior(r.inRocket || (i === 2 && p < 0.6));
    tether.visible = i === 2 && p > 0.3 && !traveling;
    if (tether.visible) updateTether(t);
    // Gloobi
    gloobi.root.visible = true; gloobi.setMode("awake");
    if (i === 1) { gTarget.set(1.1, 2.7, 1.5); gloobi.follow(gTarget); gloobi.point(p < 0.6 ? -1 : 0); gloobi.lookAt(null); }
    else {
      camSpace(cam.pos, astro.root.position, 0.42, 0.28, 0, gTarget).sub(cam.pos).add(astro.root.position);
      if (i === 8) camSpace(cam.pos, astro.root.position, -0.12, 0.72, 0, gTarget).sub(cam.pos).add(astro.root.position); // sobre el casco: no tapa el mural
      if (i === 9) { W.rocket.windowWorld(gTarget); gTarget.x += 0.62; gTarget.y += 0.2; gTarget.z += 0.25; }
      gloobi.follow(gTarget); gloobi.point(0);
      gloobi.lookAt(i === 3 ? CONST : i === 4 ? MOON : i === 5 ? HOLO : i === 6 ? W.memories?.nearest(camera) : i === 7 ? (p < 0.6 ? FLIGHT : CARGO) : null);
      if (i === 6 && Math.random() < dt * 0.25) gloobi.wow(1400);
    }
    // partes por capítulo
    if (W.constellation) { W.constellation.group.visible = i >= 2 && i <= 4; const cp = i === 3 ? clamp((p - 0.2) / 0.45) : i > 3 ? 1 : 0; if (W.constellation.update(dt, t, cp, R.dpr) && i === 3) { audio.sparkle(); gloobi.wow(1500); } }
    if (W.moon) { W.moon.group.visible = i >= 3 && i <= 5; if (W.moon.group.visible) W.moon.update(dt, t, camera, i === 4 ? smooth((p - 0.3) / 0.15) : 0); }
    if (W.station) { W.station.group.visible = i >= 4 && i <= 6; if (W.station.group.visible) W.station.update(dt, t, i === 5 ? smooth((p - 0.3) / 0.15) : 0); }
    if (W.memories) { W.memories.group.visible = i >= 5 && i <= 7; if (W.memories.group.visible) W.memories.update(dt, t, camera); }
    if (W.flight) {
      W.flight.group.visible = W.cargo.group.visible = i >= 6 && i <= 8;
      st.flightActive = W.flight.update(dt, t, i === 7 ? clamp((p - 0.22) / 0.3) : i > 7 ? 1 : 0);
      W.cargo.update(dt, t, i === 7 ? smooth((p - 0.55) / 0.1) : 0);
    }
    if (W.mural) { const ev = W.mural.update(dt, t); if (ev === "landed") audio.stitch(16); }
    if (W.trail) W.trail.update(dt, i === 9 && p > 0.3 ? rocketPos : null);
  }

  function endLaunch() {
    if (st.launchDone) return;
    st.launchDone = true;
    W.launch.clearSmoke();
    st.mode = "story"; st.lastChapter = 1;
    const cb = st.onLaunchEnd; st.onLaunchEnd = null; cb?.();
  }

  /* ---------- Rastro de estrellas del cohete (capítulo 9) ---------- */
  function createTrail() {
    const n = Math.round(90 * Math.max(0.5, q.particles));
    const sprites = createSprites({ count: n, texture: glowTexture(), additive: true, renderOrder: 5 });
    sprites.hideAll();
    const pool = Array.from({ length: n }, () => ({ life: -1, x: 0, y: 0, z: 0, c: "#FFD27A", s: 0.3 }));
    let cur = 0;
    const cols = ["#FFD27A", "#FF8FA3", "#6FD6E8", "#FFF7EC"];
    return {
      sprites,
      update(dt, from) {
        if (from) for (let k = 0; k < 3; k++) { const p = pool[cur]; cur = (cur + 1) % n; p.life = 0; p.x = from.x + (Math.random() - 0.5) * 0.6; p.y = from.y - 0.4 + (Math.random() - 0.5) * 0.4; p.z = from.z + (Math.random() - 0.5) * 0.6; p.c = cols[(Math.random() * 4) | 0]; p.s = 0.15 + Math.random() * 0.35; }
        pool.forEach((p, i) => { if (p.life < 0) { sprites.hide(i); return; } p.life += dt; if (p.life > 2.2) { p.life = -1; sprites.hide(i); return; } sprites.set(i, p.x, p.y, p.z, p.s * (1 - p.life / 2.4), 0, p.c, 1 - p.life / 2.2); });
        sprites.commit();
      }
    };
  }

  /* ---------- Interacción ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  /** Toque en (x, y) relativos al escenario. Devuelve lo que se tocó. */
  function tap(x, y) {
    const { w, h } = R.size;
    ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (gloobi.root.visible && gloobi.hit(ray)) { gloobi.laugh(); audio.laugh(); return { kind: "gloobi" }; }
    if (st.mode !== "story") return null;
    if (W.constellation?.group.visible && st.chapter >= 3 && st.chapter <= 4 && W.constellation.tap(ray)) { audio.chime(); return { kind: "star" }; }
    if (W.memories?.group.visible && st.chapter >= 6 && st.chapter <= 7) {
      const hit = ray.intersectObjects(W.memories.meshes, false)[0];
      if (hit) return { kind: "photo", index: hit.object.userData.index };
    }
    return null;
  }

  return {
    get mode() { return st.mode; },
    get chapter() { return st.chapter; },
    get fade() { return st.fade; },
    get flightActive() { return st.flightActive; },
    get launchInfo() { return { t: st.launchT, ign: IGN(), len: LAUNCH_LEN(), short: st.launchShort }; },
    astro, gloobi, world: W, sky, stars,
    update,
    buildRest() { buildIdle(); },
    setHold(h) { st.hold = h; },
    toCover() { st.mode = "cover"; st.hold = 0; st.launchDone = true; st.lastChapter = 0; st.fade = 0; astro.snapPose("sleep"); gloobi.setMode("sleep"); W.launch?.clearSmoke(); },
    /** Despegue por tiempo. short = visitas repetidas (~2.5 s). */
    launch({ short = false, onEnd } = {}) {
      buildUpTo(3);
      st.mode = "launch"; st.launchT = 0; st.launchShort = short; st.launchDone = false; st.onLaunchEnd = onEnd;
      audio.ignite();
    },
    skipLaunch() { if (st.mode === "launch") endLaunch(); },
    /** Pasa directo a los capítulos (Bitácora desde la portada, "Ir a la bitácora"). */
    toStory() { buildUpTo(3); st.mode = "story"; st.launchDone = true; st.lastChapter = 1; W.launch?.clearSmoke(); },
    async joinCrew(r) {
      buildUpTo(builders.length);
      await W.mural.sewMine(r.avatar, r.guestName, camera, audio);
      W.comets.burst(26); audio.comets(); gloobi.spin(); audio.fanfare();
      st.celebrateT = 0;
      setPatch(r);
    },
    setMine(r) { buildUpTo(3); W.mural.setMine(r?.attending ? r.avatar : null, r?.guestName); setPatch(r); },
    farewell() { st.farewellT = 0; audio.bye(); },
    crewCount() { buildUpTo(3); return W.mural.count(); },
    tap,
    flyPhoto(i) { audio.whoosh(); return W.memories?.flyTo(i); },
    photoBack(i) { W.memories?.flyBack(i); audio.whoosh(); },
    /** Póster: renderiza la portada al tamaño pedido (para Exportar póster en debug). */
    renderCover(t) { const m = st.mode; st.mode = "cover"; update(0.016, t, { chapter: 1, p: 0 }); st.mode = m; }
  };
}
