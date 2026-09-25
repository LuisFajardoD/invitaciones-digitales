// Director de la película: construye el mundo (por partes, conforme se acercan los capítulos), maneja los modos
// "cover" (portada), "launch" (despegue por tiempo) y "story" (capítulos 1–9 ligados al scroll), coloca cámara,
// cohete, astronauta y Gloobi, y responde a los toques (Gloobi, estrellas, polaroids).
import * as THREE from "three";
import { demoData, visorPhotos, VISOR_FALLBACK } from "../data.js";
import { clamp, smooth, easeInOut, easeIn, invLerp, lerp, prefersReduced, vibrate, missionName, loadPhoto } from "../util.js";
import { V, samplePath, blendShots, camSpace, shake, shot } from "./camera-path.js";
import { ENV, glowTexture, createStudioEnv, refreshStudioEnv, pbr, canvasTex, THEME3D, onTheme, setTheme3D } from "./materials.js";
import { THEMES, themeOf, applyThemeCss } from "../themes.js";
import { renderNebula } from "./nebula.js";
import { moonSurfaceAsync } from "./moon-surface.js";
import { createSky, createNebulaClouds } from "./sky.js";
import { createStars } from "./stars.js";
import { createEarth } from "./earth.js";
import { createLaunchSet, PAD_Y, CLOUD_Y } from "./launch.js";
import { createCrescent, createMoonSet, refreshMoonMaterials } from "./moon.js";
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
export const CHAPTER_COUNT = 9;
// Portada: media luna [giro Z, escala] y astronauta [rotX, rotY, rotZ (orden ZYX), x, y, z, giro del casco] respecto
// a COVER (el casco gira −0.4 rad hacia la cámara: la cara queda centrada en el visor; sin tocar la luna)
const CRES_DEFAULT = "1.0,1.0", COV_DEFAULT = "0,0.4,0.75,-0.228,-0.283,0.05,-0.4";
// Foto del visor según la luz de cada escena (gain multiplica, contrast alrededor del gris medio): portada nocturna
// un poco más cálida y suave; despegue al amanecer y espacio casi neutros. Nunca oscura ni lavada.
const LOOK_COVER = { gain: [1.3, 1.16, 1.02], contrast: 1.04 };
const LOOK_DAY = { gain: [1.12, 1.06, 1.0], contrast: 0.97 };
const LOOK_SPACE = { gain: [1.1, 1.07, 1.05], contrast: 1.0 };
const T = 0.22; // fracción de cada capítulo dedicada a viajar desde el anterior

export function createFilm({ R, quality, audio, showcase = false }) {
  const { scene, camera } = R;
  const reduced = () => prefersReduced();
  const q = quality;
  // --- tema de color del niño (antes que cualquier material: cohete, torre, parche, luz de borde)
  setTheme3D(themeOf(demoData.child));
  let patchR = null; // último RSVP con el que se pintó el parche (para repintarlo al cambiar de tema)
  // --- cielo, nebulosa, estrellas
  const neb = renderNebula(R.renderer, { w: q.nebula, h: q.nebula / 2 });
  ENV.envMap.value = neb;
  try { createStudioEnv(R.renderer); } catch { /* sin reflejos de estudio */ }
  // superficie lunar sin bloquear (compila en paralelo y se dibuja por franjas): la escena no se muestra hasta tenerla
  const frameP = () => new Promise((r) => requestAnimationFrame(() => r()));
  const surfP = moonSurfaceAsync(R.renderer, q.name === "high" ? 2048 : 1024).then(() => refreshMoonMaterials(scene)).catch(() => { /* luna sencilla */ }).then(() => { load.surface = 1; });
  const sky = createSky(neb); scene.add(sky.mesh);
  const clouds = createNebulaClouds(showcase ? 6 : 10); scene.add(clouds);
  const stars = createStars({ density: q.stars }); scene.add(stars.group);
  // --- personajes
  const astro = createAstronaut(demoData.child); scene.add(astro.root);
  const gloobi = createGloobi({ size: 0.16 }); scene.add(gloobi.root);
  // fotos del visor (dormido / despierto): se decodifican y se preparan como texturas ANTES de mostrar el 3D
  const PH = visorPhotos(demoData.child);
  const photoP = Promise.all([loadPhoto(PH.sleeping, VISOR_FALLBACK), PH.awake === PH.sleeping ? null : loadPhoto(PH.awake, VISOR_FALLBACK)])
    .then(([s, a]) => { const ts = visorTexture(s), ta = a ? visorTexture(a) : ts; astro.setVisorPhotos(ts, ta); }).catch(() => {}).then(() => { load.photos = 1; });
  // Listo para mostrarse: astronauta (GLB o respaldo) con su pose, fotos del visor y shaders de lo visible compilados
  // (y texturas subidas a la GPU). La portada además espera a que el astronauta esté asentado y el encuadre estable
  // (coverReady): el 3D nunca se ve a medio cargar.
  const load = { photos: 0, compiled: 0, surface: 0, built: 0 };
  // --- portada: media luna como cuna (abertura hacia arriba a la derecha); [giro Z, escala] ajustable con ?cres=
  const params = new URLSearchParams(location.search);
  const CRES = (params.get("cres") || CRES_DEFAULT).split(",").map(Number);
  const crescent = createCrescent(); crescent.holder.position.copy(COVER); crescent.holder.rotation.set(0.12, -0.3, CRES[0]); crescent.holder.scale.setScalar(CRES[1]); scene.add(crescent.holder);

  // --- partes que se construyen al acercarse
  const W = { earth: null, launch: null, rocket: null, mural: null, constellation: null, moon: null, station: null, memories: null, flight: null, cargo: null, comets: null, trail: null };
  const builders = [
    () => { W.earth = createEarth({ radius: EARTH_R, low: q.name === "low" }); W.earth.group.position.set(0, EARTH_Y, 0); W.earth.group.visible = false; scene.add(W.earth.group); },
    () => { W.launch = createLaunchSet({ particles: q.particles, low: q.name === "low" }); W.launch.group.visible = false; scene.add(W.launch.group); },
    () => { W.rocket = createRocket(demoData.child); W.rocket.root.visible = false; scene.add(W.rocket.root); W.rocket.root.add(W.launch.flame); W.mural = createMural(W.rocket, demoData.rsvp); },
    () => { W.constellation = createConstellation({ age: demoData.child.age, name: demoData.child.name, width: 22, onChime: (k) => audio.chime(k) }); W.constellation.group.position.copy(CONST); W.constellation.group.visible = false; scene.add(W.constellation.group); },
    () => { W.moon = createMoonSet(); W.moon.group.position.copy(MOON); samplePath(CH[4].keys, 0.6, sA); W.moon.setAnchor(sA.pos, sA.tgt); W.moon.group.visible = false; scene.add(W.moon.group); },
    () => { W.station = createStation({ low: q.name === "low" }); W.station.group.position.copy(STATION); W.station.group.rotation.y = -0.3; W.station.screen.rotation.y = 0.12; /* la pantalla, de frente a la cámara */ W.station.group.visible = false; scene.add(W.station.group); },
    () => { W.memories = createMemories({ anchor: MEM0, dir: MEMDIR, low: q.name === "low", density: Math.max(0.6, q.particles) }); W.memories.group.visible = false; scene.add(W.memories.group); },
    () => { W.flight = createFlightPlan(); W.flight.group.position.copy(FLIGHT); W.flight.group.scale.setScalar(0.5); scene.add(W.flight.group); W.cargo = createCargo({ low: q.name === "low", particles: q.particles }); W.cargo.group.position.copy(CARGO); scene.add(W.cargo.group); W.flight.group.visible = W.cargo.group.visible = false; },
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
  const tUv = new Float32Array((TN + 1) * TS * 2);
  for (let k = 0; k <= TN; k++) for (let s = 0; s < TS; s++) { tUv[(k * TS + s) * 2] = (k / TN) * 14; tUv[(k * TS + s) * 2 + 1] = s / TS; }
  tGeo.setAttribute("uv", new THREE.BufferAttribute(tUv, 2));
  const tether = new THREE.Mesh(tGeo, tetherMaterial());
  tether.frustumCulled = false; tether.visible = false; scene.add(tether);
  /** Cordón acolchado: crema con franja en espiral del color del tema y filete dorado (se repite a lo largo). */
  function tetherMaterial() {
    const paint = (c, w, hh) => {
      c.fillStyle = "#FFF7EC"; c.fillRect(0, 0, w, hh);
      c.save(); c.transform(1, 0, -0.9, 1, 0, 0);
      c.fillStyle = THEME3D.hex.primary; for (let x = 0; x < w * 2; x += 64) c.fillRect(x, 0, 18, hh);
      c.fillStyle = THEME3D.hex.gold; for (let x = 0; x < w * 2; x += 64) c.fillRect(x + 20, 0, 4, hh);
      c.restore();
      const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, "rgba(60,40,110,.18)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(60,40,110,.18)");
      c.fillStyle = g; c.fillRect(0, 0, w, hh);
    };
    const map = canvasTex(128, 64, paint);
    onTheme(() => { paint(map.image.getContext("2d"), 128, 64); map.needsUpdate = true; });
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return pbr("#ffffff", { map, rough: 0.5, metal: 0.05, env: 0.5, rim: 0.6, emissive: "#3a2f6a", ei: 0.25 });
  }
  // conectores dorados en ambos extremos del cordón
  const plugGeo = new THREE.CylinderGeometry(0.03, 0.036, 0.09, 14), plugMat = pbr("#FFC96B", { rough: 0.3, metal: 0.7, env: 1, rim: 0.4 });
  const plugA = new THREE.Mesh(plugGeo, plugMat), plugB = new THREE.Mesh(plugGeo, plugMat);
  plugA.visible = plugB.visible = false; scene.add(plugA, plugB);
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
    // conectores alineados con el cordón en cada punta
    bez(0, tP); bez(0.03, tQ); plugA.position.copy(tP); plugA.quaternion.setFromUnitVectors(UPV, tT.subVectors(tQ, tP).normalize());
    bez(1, tP); bez(0.97, tQ); plugB.position.copy(tP); plugB.quaternion.setFromUnitVectors(UPV, tT.subVectors(tP, tQ).normalize());
  }
  let built = 0;
  const buildUpTo = (n) => { while (built < Math.min(n, builders.length)) builders[built++](); };
  // portada + despegue (Tierra, torre, cohete) listos antes de mostrar la escena, uno por cuadro (sin congelar la
  // pantalla de carga); el resto conforme se acerca
  const prepP = showcase ? Promise.resolve() : (async () => { for (let k = 1; k <= 3; k++) { await frameP(); buildUpTo(k); load.built = k / 3; } })();
  if (showcase) load.built = 1;
  const ready = Promise.all([astro.ready, photoP, surfP, prepP]).then(() => precompile(true)).then(() => { load.compiled = 1; });
  const buildIdle = () => { if (built < builders.length) { buildUpTo(built + 1); setTimeout(buildIdle, 150); } else precompile(); };
  /** Compila los shaders de todo el mundo en segundo plano (evita tirones la primera vez que aparece cada parte). */
  // (también se llama antes de mostrar el 3D con lo ya construido: portada, despegue, Tierra y cohete)
  let compiled = false;
  function precompile(force = false) {
    if (compiled && !force) return null;
    if (!force) compiled = true;
    const hidden = [];
    scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
    const done = () => hidden.forEach((o) => { o.visible = false; });
    // compileAsync recorre la escena en el momento de la llamada; la visibilidad se restaura de inmediato
    let p = null;
    try { if (R.renderer.compileAsync) p = R.renderer.compileAsync(scene, camera).catch(() => {}); else R.renderer.compile(scene, camera); } catch { /* seguir */ }
    done();
    uploadTextures();
    return p;
  }
  /** Sube a la GPU de una vez todas las texturas del mundo (si no, la primera vez que se dibujan dan un tirón). */
  const uploaded = new WeakSet();
  function uploadTextures() {
    const up = (t) => { if (t?.isTexture && !uploaded.has(t) && t.image) { uploaded.add(t); try { R.renderer.initTexture(t); } catch { /* seguir */ } } };
    scene.traverse((o) => {
      for (const m of [].concat(o.material || [])) {
        for (const k in m) if (m[k]?.isTexture) up(m[k]);
        if (m.uniforms) for (const k in m.uniforms) up(m.uniforms[k]?.value);
      }
    });
  }
  setPatch(null);

  /* ---------- Estado ---------- */
  const st = {
    mode: "cover", t: 0, hold: 0, launchT: 0, launchShort: false, launchDone: true, onLaunchEnd: null, fade: 0,
    chapter: 1, p: 0, lastChapter: 0, flightActive: -1, viewShift: 0, farewellT: -1, celebrateT: -1, coverT0: -1,
    giftFocus: -1, giftIdx: -1, giftW: 0, finalQ: new THREE.Quaternion()
  };
  // vectores y cuaterniones de trabajo (nada se crea por frame)
  const cam = shot(), a = shot(), b = shot(), sA = shot();
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), tmp3 = V(0, 0, 0), shk = V(0, 0, 0);
  const astroPos = V(0, 0, 0), prevPos = V(0, 0, 0), gTarget = V(0, 0, 0), rocketPos = V(0, 0, 0);
  const mtx = new THREE.Matrix4(), quat = new THREE.Quaternion(), noRot = new THREE.Quaternion();
  const rA = { pose: "fly", look: "camera", visible: true, scale: 1, inRocket: false }, rB = { ...rA };
  const finalC = new THREE.Quaternion(), finalD = new THREE.Quaternion(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4();
  const fL = V(0, 0, 0), uL = V(0, 0, 0), fT = V(0, 0, 0), bx = V(0, 0, 0), by = V(0, 0, 0);
  const gLook = V(0, 0, 0); let gLookCam = true; // a dónde mira el astronauta (Gloobi lo imita)
  // viaje entre capítulos con la pose fly (ver updateStory): on = volando; g = posición global anterior (capítulo + p);
  // still = s sin moverse; stalled = detenido a medio viaje (float); dir = sentido del scroll (con histéresis: acc
  // acumula lo recorrido en contra); offT = s desde el último cambio de estado
  const fl = { on: false, g: -1, still: 0, stalled: false, moved: 0, dir: 1, acc: 0, offT: 9, onT: 0, carry: false };
  const flyDir = V(0, 0, 0), flySide = V(0, 0, 0), flyPrev = V(0, 0, 0);
  const relA = V(0, 0, 0), relB = V(0, 0, 0), cF = V(0, 0, 0), cR = V(0, 0, 0), cU = V(0, 0, 0), cD = V(0, 0, 0);
  /** Inverso de camSpace: el punto P en espacio del encuadre s (x derecha, y arriba, z hacia adelante). */
  function camLocal(s, P, out) {
    cF.subVectors(s.tgt, s.pos).normalize(); cR.crossVectors(cF, UP).normalize(); cU.crossVectors(cR, cF).normalize();
    cD.subVectors(P, s.pos); return out.set(cD.dot(cR), cD.dot(cU), cD.dot(cF));
  }
  // abordaje del despegue: puntos de la pasarela, frente de la escotilla, dentro, orientación hacia adentro
  const bA = V(0, 0, 0), bB = V(0, 0, 0), bFront = V(0, 0, 0), bIn = V(0, 0, 0), bOff = V(0, 0, 0), bQ = new THREE.Quaternion();
  const Y180 = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI), Z_AXIS = V(0, 0, 1);

  /* ---------- Portada: encuadre automático ---------- */
  // El grupo (media luna + astronauta + Gloobi) queda centrado: ~85 % del ancho en vertical y dentro de la franja
  // libre entre el título y el botón (setCoverBand, medida en el DOM). Se recalcula al cambiar el tamaño, la franja
  // o el modelo del astronauta (con un fundido suave si ya había encuadre). La deriva gira alrededor del centro.
  const CDIR = V(0.06, 0.12, 1).normalize(), UP = V(0, 1, 0);
  const CF = { band: [0.3, 0.8], fill: 0.85, key: "", kind: "", kindT: 0, has: false,
    goal: { ctr: V(0, 0, 0), off: V(0, 0, 0), d: 6 }, cur: { ctr: V(0, 0, 0), off: V(0, 0, 0), d: 6 } };
  const cBox = new THREE.Box3(), cBox2 = new THREE.Box3(), cRight = V(0, 0, 0), cUp = V(0, 0, 0), cP = V(0, 0, 0), cDir = V(0, 0, 0), cSize = V(0, 0, 0);
  function frameCover() {
    if (astro.kind !== CF.kind) { CF.kind = astro.kind; CF.kindT = st.t; }
    if (CF.has && st.t - CF.kindT < 0.3) return; // el modelo recién cambió: esperar a que tome su pose
    const { w, h } = R.size, key = `${w}x${h}|${CF.band.join()}|${CF.kind}`;
    if (key === CF.key) return;
    CF.key = key;
    placeCover(0, 0);
    // puntos reales: vértices de la media luna (una caja rotada la agranda ~40 %), caja del astronauta en su pose y
    // Gloobi con su anillo
    const world = [];
    solidPoints(crescent.holder, world);
    astro.box(cBox2);
    for (let i = 0; i < 8; i++) world.push(V(i & 1 ? cBox2.max.x : cBox2.min.x, i & 2 ? cBox2.max.y : cBox2.min.y, i & 4 ? cBox2.max.z : cBox2.min.z));
    cBox2.setFromCenterAndSize(gloobi.root.position, cSize.setScalar(0.16 * 3.4 * gloobi.root.scale.x));
    for (let i = 0; i < 8; i++) world.push(V(i & 1 ? cBox2.max.x : cBox2.min.x, i & 2 ? cBox2.max.y : cBox2.min.y, i & 4 ? cBox2.max.z : cBox2.min.z));
    const g = CF.goal; cBox.setFromPoints(world).getCenter(g.ctr);
    cRight.crossVectors(UP, CDIR).normalize(); cUp.crossVectors(CDIR, cRight);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), tanH = tanV * (w / h);
    const bandH = Math.max(0.2, CF.band[1] - CF.band[0]) * 0.94;
    const pts = world.map((p) => { cP.subVectors(p, g.ctr); return [cP.dot(cRight), cP.dot(cUp), cP.dot(CDIR)]; });
    let d = 0.5;
    for (const [x, y, z] of pts) d = Math.max(d, z + Math.abs(x) / (CF.fill * tanH), z + Math.abs(y) / (bandH * tanV));
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y, z] of pts) { const k = 1 / (d - z); x0 = Math.min(x0, x * k); x1 = Math.max(x1, x * k); y0 = Math.min(y0, y * k); y1 = Math.max(y1, y * k); }
    const yWant = (1 - (CF.band[0] + CF.band[1])) * tanV; // centro de la franja, en unidades de tangente
    g.off.copy(cRight).multiplyScalar(((x0 + x1) / 2) * d).addScaledVector(cUp, ((y0 + y1) / 2 - yWant) * d);
    g.d = d;
    CF.info = { band: CF.band.map((v) => +v.toFixed(3)), box: cBox.getSize(V(0, 0, 0)).toArray().map((v) => +v.toFixed(2)), d: +d.toFixed(2), x: [x0, x1].map((v) => +(v / tanH).toFixed(2)), y: [y0, y1].map((v) => +(v / tanV).toFixed(2)) };
    if (!CF.has) { CF.cur.ctr.copy(g.ctr); CF.cur.off.copy(g.off); CF.cur.d = g.d; CF.has = true; }
  }
  /** Vértices (muestreados) de las mallas sólidas, sin halos aditivos ni vidrios: lo que de verdad se ve. */
  function solidPoints(obj, out, maxPer = 600) {
    obj.updateMatrixWorld(true);
    obj.traverse((o) => {
      if (!o.isMesh || o.isSprite || !o.visible) return;
      const m = [].concat(o.material)[0];
      if (m && (m.blending === THREE.AdditiveBlending || (m.transparent && !m.depthWrite))) return;
      const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / maxPer));
      for (let i = 0; i < pos.count; i += step) out.push(V(0, 0, 0).fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
    });
    return out;
  }
  function coverShot(t, out, dt = 0.016) {
    frameCover();
    // antes de mostrarse el 3D (póster encima) el encuadre salta directo a su valor final; después, con suavidad
    const c = CF.cur, g = CF.goal, k = st.coverT0 < 0 ? 1 : 1 - Math.exp(-3 * dt);
    c.ctr.lerp(g.ctr, k); c.off.lerp(g.off, k); c.d += (g.d - c.d) * k;
    const a = (t / 24) * Math.PI * 2; // loop perfecto de 24 s, oscilando alrededor del centro del grupo
    cDir.copy(CDIR).applyAxisAngle(UP, Math.sin(a) * 0.07).applyAxisAngle(cRight, Math.sin(a * 2) * 0.03);
    out.tgt.copy(c.ctr).add(c.off);
    // entrada: acercamiento leve (4 % → 0 en 1.2 s, curva que sólo desacelera: termina exacto en el encuadre, sin
    // rebote); con movimiento reducido, nada
    const intro = st.coverT0 >= 0 && !reduced() ? 0.04 * Math.pow(1 - clamp(t / 1.2), 3) : 0;
    out.pos.copy(c.ctr).addScaledVector(cDir, c.d * (1 + Math.sin(a) * 0.015) * (1 + intro)).add(c.off);
    return out;
  }
  // Astronauta dormido acurrucado en la curva interior de la media luna (pose "sleep": rodillas al pecho abrazando a
  // Gloobi). [inclinación X, giro Y, recostado Z (orden ZYX: primero se inclina, luego se gira de 3/4 y al final se
  // recuesta en la curva), x, y, z] (ajustable con ?cov= en pruebas). La posición deja el casco y la espalda
  // apoyados en la luna (holgura ≈ 0.007, sin atravesarla en todo el ciclo de respiración).
  const COV = (params.get("cov") || COV_DEFAULT).split(",").map(Number);
  const covE = new THREE.Euler(0, 0, 0, "ZYX");
  const G_COVER = 0.62; // Gloobi más chico en la portada: cabe en el abrazo (en los capítulos vuelve a 1)
  // (descansa sobre la luna: sin balanceo propio; la vida la dan la respiración, el cabeceo y la deriva de cámara)
  function placeCover(t, hold) {
    astro.root.visible = true; astro.root.scale.setScalar(1);
    astro.root.position.set(COVER.x + COV[3], COVER.y + COV[4], COVER.z + COV[5]);
    covE.set(COV[0], COV[1], COV[2]); astro.root.quaternion.setFromEuler(covE);
    astro.root.updateMatrixWorld(true);
    // giro del casco hacia la cámara (la cara queda centrada en el visor); inmediato: el póster se captura en un solo
    // cuadro y el 3D debe verse igual desde el primero
    astro.setHeadYaw(COV[6] ?? 0, { instant: true });
    gloobi.follow(null); gloobi.root.visible = true;
    const wake = smooth(clamp((hold - 0.1) / 0.25)); // al despertar vuelve a su tamaño y sale del abrazo
    gloobi.root.scale.setScalar(lerp(G_COVER, 1, wake));
    if (!astro.hugWorld(tmp)) tmp.set(0.1, -0.16, 0.27).applyQuaternion(astro.root.quaternion).add(astro.root.position);
    if (hold > 0.2) tmp.y += hold * 0.3;
    gloobi.root.position.lerp(tmp, hold > 0.15 ? 0.08 : 1);
  }

  /* ---------- Despegue ---------- */
  // (el despegue completo empieza con el abordaje: el astronauta camina por la pasarela de la torre, da un saltito
  // frente a la escotilla abierta y entra por ella; la escotilla se cierra y luego viene el conteo 3-2-1)
  const LAUNCH_LEN = () => (st.launchShort ? 2.6 : 9.0);
  const IGN = () => (st.launchShort ? 0.15 : 5.6); // momento del despegue
  // abordaje (s): pasarela, saltito, entra, se hace a un lado; Gloobi lo sigue (gDelay) y entra (gIn0 → gIn1); la
  // escotilla se cierra antes del conteo (IGN − 2.4) y los dos se asoman por el vidrio (seat0 → seat1)
  const BOARD = { walk0: 0.1, walk1: 1.3, hop1: 1.8, in1: 2.4, aside1: 2.75, gDelay: 0.35, gIn0: 2.15, gIn1: 2.75, close0: 2.8, close1: 3.15, seat0: 3.2, seat1: 4.1 };
  const bAside = V(0, 0, 0);
  /** Recorrido del astronauta al abordar (posición). */
  function boardPos(t, out) {
    if (t < BOARD.walk1) { const k = clamp((t - BOARD.walk0) / (BOARD.walk1 - BOARD.walk0)); out.lerpVectors(bA, bB, easeInOut(k)); out.y += Math.abs(Math.sin(k * Math.PI * 5)) * 0.07; return out; }
    if (t < BOARD.hop1) { const k = clamp((t - BOARD.walk1) / (BOARD.hop1 - BOARD.walk1)); out.lerpVectors(bB, bFront, easeInOut(k)); out.y += Math.sin(k * Math.PI) * 0.3; return out; }
    if (t < BOARD.in1) return out.lerpVectors(bFront, bIn, easeInOut((t - BOARD.hop1) / (BOARD.in1 - BOARD.hop1)));
    return out.lerpVectors(bIn, bAside, smooth((t - BOARD.in1) / (BOARD.aside1 - BOARD.in1)));
  }
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
    // (la salida por la escotilla queda centrada: el objetivo sigue el eje de salida hasta que llega a saludar)
    2: { keys: [[T, V(3.6, 3.0, 8.6), V(-0.05, 2.15, 1.3)], [0.44, V(2.9, 2.85, 6.8), V(-0.05, 2.3, 2.1)], [0.5, V(2.7, 2.8, 6.2), V(0.35, 2.4, 2.3)], [0.72, V(1.3, 2.85, 4.25), V(0.9, 2.78, 2.6)], [0.86, V(1.35, 2.85, 4.2), V(0.9, 2.78, 2.6)], [1, V(2.1, 3.3, 5.6), V(0.8, 2.7, 2.3)]] },
    3: { keys: [[T, V(1.8, 4, 9.5), V(0.6, 5.5, 0)], [0.5, V(0, 5, 22), V(0, 23, -40)], [1, V(0, 5.5, 24), V(0, 24, -40)]] },
    4: { keys: [[T, MOON.clone().add(V(14, 6, 60)), MOON], [0.6, MOON.clone().add(V(4, 3, 45)), MOON.clone().add(V(0, -2.5, 0))], [1, MOON.clone().add(V(2, 2.5, 43)), MOON.clone().add(V(0, -2.5, 0))]] },
    // estación: primero completa y grande (sin tarjeta), luego la pantalla del mapa junto a la tarjeta
    5: { keys: [[T, STATION.clone().add(V(-6, 4, 26)), STATION.clone().add(V(0, 1.6, 0))], [0.3, STATION.clone().add(V(-2.6, 2.0, 16.2)), STATION.clone().add(V(0.1, 1.3, 0))], [0.6, STATION.clone().add(V(-2, 2.6, 13.5)), STATION.clone().add(V(0.2, 1.9, 0))], [1, STATION.clone().add(V(-1, 2.4, 12.5)), STATION.clone().add(V(0.2, 1.9, 0))]] },
    6: { keys: [[T, MEM0.clone().addScaledVector(MEMDIR, -3).add(V(0, 0.4, 0)), MEM0.clone().addScaledVector(MEMDIR, 6)], [1, MEM0.clone().addScaledVector(MEMDIR, 27).add(V(0, 0.4, 0)), MEM0.clone().addScaledVector(MEMDIR, 36)]] },
    // bodega: la cámara se detiene primero en "Tu presencia" (regalo dorado, al frente) y luego abre a toda la carga
    7: { keys: [[T, FLIGHT.clone().add(V(0, 5, 22)), FLIGHT.clone().add(V(0, 0.4, 0))], [0.5, FLIGHT.clone().add(V(1, 3.5, 17)), FLIGHT.clone().add(V(0, 0.4, 0))], [0.64, CARGO.clone().add(V(0.8, 1.9, 9.8)), CARGO.clone().add(V(0, 0.45, 1.5))], [0.76, CARGO.clone().add(V(0.6, 1.8, 9.4)), CARGO.clone().add(V(0, 0.4, 1.5))], [1, CARGO.clone().add(V(-0.3, 2.3, 12.8)), CARGO.clone().add(V(0, 0.75, 0.2))]] },
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
  // Poses por capítulo: portada sleep · despegue y final fly · caminata y despedidas wave · tripulación celebrate ·
  // el resto float.
  // Salida por la escotilla (cap. 2), en fracciones del capítulo: aparece dentro de la cabina (show), sale en línea
  // recta perpendicular a la pared (go → out) con la pose fly y la orientación fija, sin tocar el marco (su silueta
  // cabe en el paso con holgura); ya afuera pasa a float (0.6 s), gira hacia la cámara (turn) y va a saludar (walk,
  // wave). Antes (show → go) deja la ventana y se coloca en el eje, dentro. Gloobi, que estaba asomado a su lado,
  // se aparta dentro de la cabina (gAside) mientras él sale, vuelve al eje (gIn → gGo), sale después por el mismo eje
  // (gGo → gOut) y luego se acomoda a su lado (gSide).
  const EXIT = { show: 0.22, go: 0.3, out: 0.46, turn: 0.5, wave: 0.56, walk: 0.58, gAside: 0.24, gIn: 0.4, gGo: 0.44, gOut: 0.54, gSide: 0.6 };
  const FLY_C = V(-0.05, -0.06, 0); // centro (local) del círculo mínimo que contiene la silueta fly vista de frente
  const exC = V(0, 0, 0), exN = V(0, 0, 0), exS = V(0, 0, 0), exE = V(0, 0, 0), exG0 = V(0, 0, 0), exG1 = V(0, 0, 0), exQ = new THREE.Quaternion(), exOff = V(0, 0, 0);
  /** Eje de la escotilla: centro, normal, orientación de salida (frente = normal, arriba = vertical) y extremos. */
  function exitFrame() {
    W.rocket.hatchWorld(exC, exN);
    bx.crossVectors(UP, exN).normalize(); by.crossVectors(exN, bx); mA.makeBasis(bx, by, exN); exQ.setFromRotationMatrix(mA);
    exOff.copy(FLY_C).applyQuaternion(exQ); // la silueta queda centrada en el eje
    exS.copy(exC).addScaledVector(exN, -0.88).sub(exOff); // dentro: el brazo al frente queda detrás del collarín
    exE.copy(exC).addScaledVector(exN, 1.4).sub(exOff); // afuera: la espalda a ~1 cuerpo de la pared
    exG0.copy(exC).addScaledVector(exN, -1.35); exG1.copy(exC).addScaledVector(exN, 0.75);
    exR.crossVectors(UP, exN).normalize(); // derecha, vista desde afuera
  }

  /* ---------- Asomados por la escotilla (dentro del cohete) ---------- */
  // El astronauta, con el visor justo detrás del vidrio y un poco a la izquierda, mirando a la cámara con el casco
  // derecho (la orientación se mide con los ejes reales del casco: sirve para cualquier pose); Gloobi a su derecha, un
  // poco más abajo, dentro del tubo de la escotilla. Se usa en el despegue, el cap. 1, el cap. 2 antes de salir y el
  // final (cap. 9). Todo dentro de la cabina: sólo se ve por la escotilla.
  const SEAT = { depth: 0.26, dx: -0.15, scale: 0.9, gDepth: 0.1, gDx: 0.3, gDy: 0.1 };
  const exR = V(0, 0, 0), seatP = V(0, 0, 0), seatQ = new THREE.Quaternion(), seatFrom = V(0, 0, 0), seatFromQ = new THREE.Quaternion();
  /** Calcula (sin aplicar) seatP / seatQ para el cuadro actual (exitFrame() ya llamado). */
  function seatSolve() {
    astro.root.quaternion.copy(st.finalQ); astro.root.updateMatrixWorld(true);
    astro.visorWorld(tmp3);
    finalC.copy(st.finalQ).invert();
    // ejes reales del casco (frente y arriba) en el espacio del astronauta
    astro.headAxes(fL, uL); fL.applyQuaternion(finalC); uL.applyQuaternion(finalC);
    bx.crossVectors(uL, fL).normalize(); uL.crossVectors(fL, bx); mA.makeBasis(bx, uL, fL);
    fT.subVectors(cam.pos, tmp3); fT.y *= 0.5; fT.normalize(); fT.addScaledVector(UP, -fT.dot(UP) * 0.6).normalize();
    fT.lerp(exN, 0.45).normalize(); // (a medio camino del eje de la escotilla: el cuerpo no gira tanto como para salirse del casco)
    bx.crossVectors(UP, fT).normalize(); by.crossVectors(fT, bx); mB.makeBasis(bx, by, fT);
    finalD.setFromRotationMatrix(mB.multiply(mA.transpose()));
    st.finalQ.slerp(finalD, 0.35);
    astro.root.quaternion.copy(st.finalQ); astro.root.updateMatrixWorld(true);
    tmp2.copy(exC).addScaledVector(exN, -SEAT.depth).addScaledVector(exR, SEAT.dx); astro.visorWorld(tmp3);
    seatP.copy(astro.root.position).add(tmp2.sub(tmp3)); seatQ.copy(st.finalQ);
  }
  /** Asomado (w = 1) o en camino desde seatFrom / seatFromQ (w < 1). */
  function applySeat(w) {
    seatSolve();
    if (w >= 1) { astro.root.position.copy(seatP); astro.root.quaternion.copy(seatQ); }
    else { astro.root.position.lerpVectors(seatFrom, seatP, w); astro.root.quaternion.copy(seatFromQ).slerp(seatQ, w); }
    astro.root.scale.setScalar(lerp(1, SEAT.scale, w));
    astro.root.updateMatrixWorld(true);
  }
  /** Lugar de Gloobi asomado junto al astronauta. */
  const gWin = (out) => out.copy(exC).addScaledVector(exN, -SEAT.gDepth).addScaledVector(exR, SEAT.gDx).addScaledVector(UP, SEAT.gDy);
  /** Gloobi por un recorrido exacto (no el seguimiento libre, que atajaría por la pared). */
  function gAt(pos) { st.gloobiPath = true; gloobi.follow(null); gloobi.root.position.copy(pos); }
  /** Igual, suavizado (sólo afuera: para empalmar con donde estaba). */
  function gToward(pos, dt) {
    st.gloobiPath = true; gloobi.follow(null);
    if (gloobi.root.position.distanceTo(pos) > 3) gloobi.teleport(pos); else gloobi.root.position.lerp(pos, 1 - Math.exp(-12 * dt));
  }
  function astroAt(i, p, out, r) {
    r.pose = "float"; r.look = "camera"; r.visible = true; r.scale = 1; r.inRocket = false; r.exact = false; r.fade = undefined; r.seat = -1;
    // 1: asomado con Gloobi por el vidrio de la escotilla cerrada (llegan así del despegue)
    if (i === 1) { exitFrame(); r.inRocket = true; r.seat = 1; r.look = "none"; out.copy(exC); return r; }
    if (i === 2) { // salida por la escotilla (ver EXIT)
      exitFrame();
      r.inRocket = p < EXIT.out;
      if (p < EXIT.go) { // deja la ventana: de asomado a su lugar en el eje, dentro, ya con la pose fly
        r.seat = 1 - smooth((p - EXIT.show) / (EXIT.go - EXIT.show)); seatFrom.copy(exS); seatFromQ.copy(exQ);
        r.pose = p > EXIT.show ? "fly" : "float"; r.look = "none"; out.copy(exS);
      } else if (p < EXIT.out) { // dentro → afuera en línea recta sobre el eje de la escotilla, pose fly, orientación fija
        out.lerpVectors(exS, exE, easeInOut(clamp((p - EXIT.go) / (EXIT.out - EXIT.go))));
        r.pose = "fly"; r.look = "exit"; r.exact = true;
      } else { // ya afuera (a ~1 cuerpo de la pared): float, gira hacia la cámara y va a saludar
        out.lerpVectors(exE, WALK, smooth((p - EXIT.turn) / (EXIT.walk - EXIT.turn)));
        r.pose = p > EXIT.wave ? "wave" : "float"; r.look = "camera"; r.fade = 0.6;
      }
      return r;
    }
    // constelación: mira las estrellas y, al completarse el nombre, se voltea hacia la cámara (visor de frente)
    if (i === 3) { samplePath(CH[3].keys, 0.8, sA); camSpace(sA.pos, sA.tgt, -0.5, -1.3, 5.5, out); r.look = p > 0.7 ? "camera" : CONST; return r; }
    if (i === 4) { samplePath(CH[4].keys, 0.6, sA); camSpace(sA.pos, sA.tgt, -0.55, -1.25, 6.5, out); r.look = MOON; return r; }
    if (i === 5) { // abajo a la izquierda, de espaldas, mirando la pantalla: no tapa la estación
      samplePath(CH[5].keys, clamp(p, 0.3, 1), sA); camSpace(sA.pos, sA.tgt, -0.55, -0.95, 5.2, out); r.look = HOLO; return r;
    }
    if (i === 6) { samplePath(CH[6].keys, Math.max(p, T), sA); camSpace(sA.pos, sA.tgt, 0.35, -0.25, 5.5, out); r.look = "memories"; return r; }
    if (i === 7) { // en la bodega queda a un lado, de 3/4 trasero, mirando los regalos (no los tapa)
      if (p < 0.6) { samplePath(CH[7].keys, 0.5, sA); camSpace(sA.pos, sA.tgt, -0.35, -0.3, 6, out); r.look = FLIGHT; }
      else { samplePath(CH[7].keys, clamp(p, 0.64, 1), sA); camSpace(sA.pos, sA.tgt, -0.6, -0.42, 4.6, out); r.look = CARGO; }
      return r;
    }
    if (i === 8) { samplePath(CH[8].keys, 0.6, sA); sA.pos.add(muralDelta); sA.tgt.add(muralDelta); camSpace(sA.pos, sA.tgt, 0.5, -0.62, 3.6, out); r.pose = "celebrate"; return r; }
    // 9: asomado por el vidrio de la escotilla cerrada, saludando, mientras el cohete se aleja (la llegada desde el
    // cap. 8 la hace final9)
    rocketAt(9, p, tmp3); W.rocket.root.position.copy(tmp3); W.rocket.root.updateMatrixWorld(true);
    exitFrame(); out.copy(exC);
    r.pose = "wave"; r.inRocket = true; r.look = "none"; r.seat = 1;
    return r;
  }

  // Final (cap. 9, en fracciones del capítulo): del mural vuela a la escotilla (abierta) con la pose fly y entra por
  // su eje; ya dentro se hace a un lado y entra Gloobi, que lo siguió; la escotilla se cierra y los dos se asoman por
  // el vidrio (él saluda) antes de que el cohete arranque (p = 0.3).
  const V9W = V(0, 2.05, 1); // escotilla respecto a la base del cohete (sin girar)
  const FIN = { fly: 0.1, in: 0.145, aside: 0.185, gDelay: 0.035, gIn0: 0.135, gIn1: 0.18, open0: 0.01, open1: 0.08, close0: 0.19, close1: 0.24, seat0: 0.21, seat1: 0.28 };
  const fP8 = V(0, 0, 0), fF = V(0, 0, 0), fIn = V(0, 0, 0), fAside = V(0, 0, 0), arcV = V(0, 0, 0), fQ = new THREE.Quaternion(), rF = { ...rA };
  /** Posición del astronauta en el recorrido de llegada (q en fracciones del cap. 9; hasta que se hace a un lado). */
  function final9Pos(q, out) {
    if (q <= 0) return out.copy(fP8);
    if (q < FIN.fly) { // arco suave hacia afuera del casco: no roza el cohete al rodearlo
      const k = easeInOut(q / FIN.fly);
      out.lerpVectors(fP8, fF, k); arcV.subVectors(out, B); arcV.y = 0; if (arcV.lengthSq() > 1e-6) out.addScaledVector(arcV.normalize(), Math.sin(k * Math.PI) * 0.6);
      return out;
    }
    if (q < FIN.in) return out.lerpVectors(fF, fIn, easeInOut((q - FIN.fly) / (FIN.in - FIN.fly)));
    return out.lerpVectors(fIn, fAside, smooth((q - FIN.in) / (FIN.aside - FIN.in)));
  }
  function final9(p, out, r) {
    astroAt(8, 1, fP8, rF); // (su lugar junto al mural)
    rocketAt(9, p, tmp3); W.rocket.root.position.copy(tmp3); W.rocket.root.updateMatrixWorld(true);
    exitFrame();
    if (p >= FIN.seat1) return astroAt(9, p, out, r);
    r.pose = "fly"; r.look = "quat"; r.visible = true; r.scale = 1; r.inRocket = p > FIN.in - 0.02; r.exact = true; r.fade = 0.5; r.seat = -1;
    bQ.copy(exQ).multiply(Y180); bOff.copy(FLY_C).applyQuaternion(bQ); // mirando hacia adentro, silueta en el eje
    fF.copy(exC).addScaledVector(exN, 1.3).sub(bOff); fIn.copy(exC).addScaledVector(exN, -0.95).sub(bOff);
    fAside.copy(exC).addScaledVector(exN, -1.0).addScaledVector(exR, -0.38);
    final9Pos(p, out);
    if (p < 0.004) r.pose = rF.pose; // (aún en su lugar del cap. 8)
    if (p < FIN.fly) { // de frente hacia donde vuela y, al acercarse, hacia adentro de la escotilla
      tmp.subVectors(fF, fP8); tmp.y *= 0.3; tmp.normalize();
      mtx.lookAt(tmp2.copy(out).add(tmp), out, UP); fQ.setFromRotationMatrix(mtx).slerp(bQ, smooth((p - FIN.fly * 0.45) / (FIN.fly * 0.55)));
    } else fQ.copy(bQ);
    if (p > FIN.aside) r.pose = "float";
    if (p > FIN.seat0) { r.seat = smooth((p - FIN.seat0) / (FIN.seat1 - FIN.seat0)); seatFrom.copy(fAside); seatFromQ.copy(bQ); r.pose = r.seat > 0.4 ? "wave" : "float"; }
    return r;
  }
  /** Gloobi en el final: sigue al astronauta con retraso, entra por el eje y se asoma a su lado. */
  function final9Gloobi(p, dt) {
    const q = p - FIN.gDelay;
    if (p >= FIN.seat0) { // dentro: de su lugar junto al eje a asomarse (exacto: el cohete puede estar moviéndose)
      tmp.copy(exC).addScaledVector(exN, -0.55); gWin(tmp2);
      gAt(tmp.lerp(tmp2, smooth((p - FIN.seat0) / (FIN.seat1 - FIN.seat0))));
      return;
    }
    if (p >= FIN.gIn0) { tmp.copy(exC).addScaledVector(exN, 1.1); tmp2.copy(exC).addScaledVector(exN, -0.55); gAt(tmp.lerp(tmp2, easeInOut(clamp((p - FIN.gIn0) / (FIN.gIn1 - FIN.gIn0))))); return; }
    // afuera: detrás de él, un poco arriba, y llega al eje de la escotilla antes de entrar
    final9Pos(Math.min(q, FIN.fly), tmp); tmp.addScaledVector(bOff, 1); // (su centro, no el de la silueta fly)
    const onAxis = smooth((q - FIN.fly * 0.5) / (FIN.fly * 0.5));
    tmp.addScaledVector(UP, 0.45 * (1 - onAxis));
    tmp2.copy(exC).addScaledVector(exN, 1.1); if (q >= FIN.fly) tmp.copy(tmp2); else tmp.lerp(tmp2, onAxis * onAxis);
    gToward(tmp, dt);
  }

  // parche del traje: el del invitado si ya confirmó (su color); si no, el del niño con el primario del tema
  function setPatch(r) {
    patchR = r;
    const opts = r?.attending ? { color: r.avatar.color, symbol: r.avatar.symbol, top: r.guestName, bottom: missionName() } : { color: THEME3D.hex.primary, symbol: "star", top: demoData.child.name, bottom: "Misión" };
    const tex = new THREE.CanvasTexture(patchCanvas(256, opts)); tex.colorSpace = THREE.SRGBColorSpace;
    astro.setPatchTexture(tex);
  }

  /* ---------- Frame ---------- */
  function update(dt, t, story) {
    st.t = t; st.gloobiPath = false;
    const R0 = reduced();
    let space = 1, shakeAmp = 0, earthY = EARTH_Y;
    if (st.mode === "cover") {
      // la deriva empieza en fase 0 al mostrarse el 3D (la misma fase con la que se genera el póster)
      const ct = st.coverT0 >= 0 ? t - st.coverT0 : 0;
      coverShot(ct, cam, dt);
      placeCover(ct, st.hold);
      astro.setPose(st.hold > 0.35 ? "fly" : "sleep", { safe: false }); astro.allowSwap();
      // despertar: Gloobi abre los ojos y, en el mismo instante, el visor pasa de la foto dormido a la despierto
      // (fundido de 0.35 s con destello); si se suelta antes y vuelve a dormir, regresa igual
      const awake = st.hold > 0.15;
      gloobi.setMode(awake ? "awake" : "sleep"); astro.setAwake(awake);
      astro.setVisorLook(LOOK_COVER.gain, LOOK_COVER.contrast);
      gloobi.lookAt(null); gloobi.point(0);
      shakeAmp = R0 ? 0 : st.hold * st.hold * 0.07;
      if (W.rocket) W.rocket.root.visible = false;
      if (W.launch) W.launch.group.visible = false;
      if (W.earth) W.earth.group.visible = false;
      hideStory();
    } else if (st.mode === "launch") {
      gloobi.root.scale.setScalar(1); astro.setHeadYaw(0);
      astro.setAwake(true); astro.setVisorLook(LOOK_DAY.gain, LOOK_DAY.contrast);
      earthY = updateLaunch(dt, t, R0);
      space = st.space; shakeAmp = st.shake;
      hideStory();
    } else {
      gloobi.root.scale.setScalar(1);
      astro.setAwake(true, { instant: true }); astro.setVisorLook(LOOK_SPACE.gain, LOOK_SPACE.contrast);
      updateStory(dt, t, story, R0);
    }
    if (W.comets) W.comets.update(dt, camera);
    // cámara final + temblor
    camera.position.copy(cam.pos);
    if (shakeAmp > 0) camera.position.add(shake(t, shakeAmp, shk));
    camera.lookAt(cam.tgt);
    // en capítulos, el protagonista queda en la mitad superior (las tarjetas van abajo)
    // con tarjeta abajo, el protagonista sube a la mitad superior; sin tarjeta, vuelve casi al centro (no deja la
    // mitad inferior vacía)
    // (cap. 4: su tarjeta es más baja —sólo fecha y botones—, así que sube menos)
    st.viewShift = THREE.MathUtils.damp(st.viewShift, st.mode === "story" ? (st.cardOn ? (st.chapter === 4 ? 0.1 : 0.16) : 0.05) : 0, 3, dt);
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
    camera.updateMatrixWorld();
    keepVisorClear();
  }

  // Nada tapa el visor: si Gloobi (con su anillo) queda delante del visor en pantalla, se aparta en el plano de la
  // cámara lo justo para que no se toquen (portada y todos los capítulos). Si está detrás del astronauta, no importa.
  const kv = V(0, 0, 0), kg = V(0, 0, 0), G_R = 0.16 * 1.65;
  function keepVisorClear() {
    if (!astro.root.visible || !gloobi.root.visible || st.gloobiPath) return; // (en la escotilla Gloobi va en su eje)
    astro.visorWorld(kv).applyMatrix4(camera.matrixWorldInverse);
    kg.copy(gloobi.root.position).applyMatrix4(camera.matrixWorldInverse);
    const zV = -kv.z, zG = -kg.z;
    if (zG <= 0.05 || zG >= zV) return;
    const need = (astro.visorRadius() * 1.12) / zV + (G_R * gloobi.root.scale.x) / zG;
    const dx = kg.x / zG - kv.x / zV, dy = kg.y / zG - kv.y / zV, dist = Math.hypot(dx, dy);
    if (dist >= need) return;
    const ux = dist > 1e-4 ? dx / dist : 0.7, uy = dist > 1e-4 ? dy / dist : 0.7;
    kg.x = (kv.x / zV + ux * need) * zG; kg.y = (kv.y / zV + uy * need) * zG;
    gloobi.root.position.copy(kg.applyMatrix4(camera.matrixWorld));
  }

  function hideStory() {
    tether.visible = plugA.visible = plugB.visible = false;
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
    // abordaje: camina por la pasarela (brazo bajo de la torre), saltito hasta quedar frente a la escotilla abierta,
    // mirando hacia adentro, y entra en línea recta por su eje con la pose fly (su silueta cabe en el paso, igual que
    // al salir en el cap. 2: nada atraviesa la pared); ya dentro se hace a un lado y entra Gloobi, que lo siguió
    // volando; la escotilla se cierra antes del conteo y los dos se asoman por el vidrio (así suben y llegan al
    // espacio). Despegue corto o movimiento reducido: ya van asomados desde el principio.
    const boarding = !st.launchShort && !R0;
    const hatchK = boarding ? 1 - smooth((lt - BOARD.close0) / (BOARD.close1 - BOARD.close0)) : 0;
    W.rocket.setHatch(hatchK); W.rocket.update?.(t);
    exitFrame(); // escotilla del cohete: exC, exN, exQ, exR
    bQ.copy(exQ).multiply(Y180); // de espaldas a la cámara: mirando hacia adentro del cohete
    bOff.copy(FLY_C).applyQuaternion(bQ);
    bFront.copy(exC).addScaledVector(exN, 0.75).sub(bOff); bIn.copy(exC).addScaledVector(exN, -0.95).sub(bOff);
    bAside.copy(exC).addScaledVector(exN, -1.0).addScaledVector(exR, -0.38);
    const wk = W.launch.walkway;
    bA.copy(wk.from).y += 0.52; bB.copy(wk.to).y += 0.52; // centro del cuerpo sobre la cubierta
    astro.root.visible = true; astro.setHeadYaw(0); // (desde el primer cuadro tras el corte de la portada)
    const seatW = boarding ? smooth((lt - BOARD.seat0) / (BOARD.seat1 - BOARD.seat0)) : 1;
    if (!boarding || lt >= BOARD.seat0) { // asomado por el vidrio (desde su lugar a un lado, dentro)
      astro.setPose("float", { safe: false });
      seatFrom.copy(bAside); seatFromQ.copy(bQ); applySeat(seatW);
    } else {
      astro.root.scale.setScalar(1);
      boardPos(lt, astro.root.position);
      if (lt < BOARD.walk1) { // caminata con pasitos (rebote) por la pasarela
        astro.setPose("float", { safe: false });
        astro.root.quaternion.setFromUnitVectors(Z_AXIS, tmp.subVectors(bB, bA).setY(0).normalize()); // mira hacia la punta
      } else if (lt < BOARD.hop1) { // saltito: de la punta de la pasarela a frente de la escotilla, girando hacia ella
        const k = clamp((lt - BOARD.walk1) / (BOARD.hop1 - BOARD.walk1));
        astro.setPose("fly", { safe: false, fade: 0.35 });
        quat.setFromUnitVectors(Z_AXIS, tmp.subVectors(bB, bA).setY(0).normalize());
        astro.root.quaternion.copy(quat).slerp(bQ, smooth(k / 0.8));
      } else { // entra: recto por el eje de la escotilla, orientación fija; ya dentro se hace a un lado
        astro.setPose(lt < BOARD.in1 ? "fly" : "float", { safe: false });
        astro.root.quaternion.copy(bQ);
      }
    }
    // Gloobi: aparece con él en la pasarela y lo sigue volando (un poco atrás y arriba), llega al eje de la escotilla,
    // entra detrás de él y se asoma a su lado
    gloobi.setMode("awake"); gloobi.point(0); gloobi.lookAt(null); gloobi.root.visible = astro.root.visible;
    const gIn = tmp3.copy(exC).addScaledVector(exN, -0.55);
    if (!boarding || lt >= BOARD.seat0) gAt(boarding ? gIn.lerp(gWin(tmp2), seatW) : gWin(tmp2));
    else if (lt >= BOARD.gIn0) gAt(tmp.copy(exC).addScaledVector(exN, 0.75).lerp(gIn, easeInOut(clamp((lt - BOARD.gIn0) / (BOARD.gIn1 - BOARD.gIn0)))));
    else {
      const tg = Math.max(BOARD.walk0, lt - BOARD.gDelay), onAxis = smooth((tg - BOARD.walk1) / (BOARD.hop1 - BOARD.walk1));
      boardPos(tg, tmp); tmp.addScaledVector(bOff, onAxis).addScaledVector(UP, 0.75 * (1 - onAxis));
      gAt(tmp);
    }
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
    // final: la mirada de la cámara acompaña a medias a la escotilla mientras el cohete se aleja (se ven los dos
    // asomados saludando)
    if (i === 9 && !traveling) { rocketAt(9, p, tmp).add(V9W); cam.tgt.lerp(tmp, 0.85 * smooth((p - T) / 0.1)); }
    // bodega: al tocar una fila de la tarjeta, la cámara gira suavemente hacia ese regalo (y vuelve al salir)
    const inCargo = i === 7 && p > 0.58 && !traveling && W.cargo;
    if (!inCargo) st.giftFocus = -1;
    st.giftW = THREE.MathUtils.damp(st.giftW, st.giftFocus >= 0 ? 1 : 0, 2.2, dt);
    if (st.giftW > 0.002 && st.giftIdx >= 0 && W.cargo) {
      W.cargo.worldPos(st.giftIdx, tmp3); W.cargo.worldPos(0, tmp2);
      cam.pos.addScaledVector(tmp2.subVectors(tmp3, tmp2), 0.6 * st.giftW);
      cam.tgt.lerp(tmp3, 0.9 * st.giftW);
    }
    // cohete
    rocketAt(i, p, rocketPos);
    W.rocket.root.visible = true; W.rocket.root.position.copy(rocketPos); W.rocket.root.updateMatrixWorld(true);
    // escotilla: se abre para la caminata (cap. 2) y para el regreso (cap. 9, se cierra antes de arrancar); con
    // movimiento reducido el regreso es un fundido y queda cerrada
    W.rocket.setHatch(i === 2 ? smooth((p - 0.2) / 0.12) * (1 - smooth((p - 0.9) / 0.1))
      : i === 9 && !R0 ? smooth((p - FIN.open0) / (FIN.open1 - FIN.open0)) * (1 - smooth((p - FIN.close0) / (FIN.close1 - FIN.close0))) : 0);
    W.rocket.update?.(t);
    W.launch.group.visible = i === 9 && p > 0.3; W.launch.base.visible = false; W.launch.clouds.mesh.visible = false;
    W.launch.flame.visible = i === 9 && p > 0.3;
    W.launch.update(dt, t, rocketPos, i === 9 ? smooth((p - 0.3) / 0.1) * 0.7 : 0);
    if (W.earth) { W.earth.group.visible = i <= 3; W.earth.group.scale.setScalar(1); }
    // astronauta (durante el viaje se mezcla con el lugar del capítulo anterior)
    let r;
    if (i === 9 && !R0) r = final9(p, astroPos, rB); // (incluye el regreso desde el cap. 8: ver FIN)
    else if (traveling) {
      const ra = astroAt(i - 1, 1, prevPos, rA);
      r = astroAt(i, T, astroPos, rB);
      const k = easeInOut(p / T);
      flyDir.subVectors(astroPos, prevPos); // (recta del viaje: de su lugar en el capítulo anterior al de éste)
      if (i === 2 || i === 9) { if (k < 0.5) { astroPos.copy(prevPos); r.pose = ra.pose; r.visible = ra.visible; r.inRocket = ra.inRocket; r.seat = ra.seat; r.look = ra.look; } }
      else if (R0) { astroPos.lerpVectors(prevPos, astroPos, k); if (k < 0.5) r.pose = ra.pose; }
      else { // vuela con la cámara: su lugar en el encuadre pasa del de un capítulo al del otro, y a mitad del viaje
        // ocupa un lugar de vuelo cerca del centro (a la vista aunque su lugar de llegada aún quede fuera de cuadro)
        camLocal(a, prevPos, relA); camLocal(b, astroPos, relB); relA.lerp(relB, k);
        tmp2.set(0.1, -0.55, Math.min(relA.z, 6.5));
        relA.lerp(tmp2, Math.pow(Math.sin(Math.PI * k), 0.6));
        camSpace(cam.pos, cam.tgt, relA.x, relA.y, relA.z, astroPos);
        if (k < 0.5) r.pose = ra.pose;
      }
      astro.allowSwap();
    } else r = astroAt(i, p, astroPos, rB);
    // Viaje con la pose fly (del cap. 2 al 3 y hasta el 8; no al llegar al 2 —sale por la escotilla— ni al 9 —se
    // sube a la ventana del cohete que despega—; con movimiento reducido sólo hay fundido). "En viaje" = entre los
    // puntos de descanso (p < T del capítulo), con histéresis: entra sólo ya adentrado en el tramo (20–80 %) y tras
    // ≥ 0.6 s en reposo; sale al llegar a un punto de descanso. Detenido a medio viaje > 1 s → float; vuelve a fly
    // al retomar el scroll.
    {
      const g = i + p, dg = fl.g < 0 ? 0 : g - fl.g; fl.g = g;
      const u = traveling ? p / T : -1, canFly = !R0 && traveling && i >= 3 && i <= 8;
      const was = fl.on;
      if (!canFly) fl.on = false;
      else if (!fl.on && u > 0.2 && u < 0.8 && fl.offT > 0.6) { fl.on = true; fl.stalled = false; fl.still = 0; fl.acc = 0; fl.dir = dg < 0 ? -1 : 1; }
      if (fl.on !== was) { fl.offT = 0; fl.onT = 0; } else if (fl.on) fl.onT += dt; else fl.offT += dt;
      if (fl.on) {
        // sentido del movimiento: se invierte sólo tras recorrer un tramo claro en contra (no con cada temblor)
        if (dg * fl.dir > 0) fl.acc = 0; else fl.acc += Math.abs(dg);
        if (fl.acc > 0.012) { fl.dir = -fl.dir; fl.acc = 0; }
        if (Math.abs(dg) < 0.0004) fl.still += dt; else fl.still = 0;
        if (!fl.stalled && fl.still > 1) { fl.stalled = true; fl.moved = 0; }
        else if (fl.stalled) { fl.moved += Math.abs(dg); if (fl.moved > 0.01) fl.stalled = false; }
        r.pose = fl.stalled ? "float" : "fly"; r.fade = fl.stalled ? 0.8 : 0.5;
      } else if (fl.offT < 0.3 && r.fade === undefined) r.fade = 0.6; // llegada: fundido a la pose del capítulo
    }
    if (i === 9) { rocketAt(9, p, rocketPos); W.rocket.root.position.copy(rocketPos); W.rocket.root.updateMatrixWorld(true); }
    astro.root.visible = r.visible;
    // (r.exact: mientras cruza la escotilla la posición y la orientación son exactas, sin suavizado que lo desvíe del
    // eje y lo haga rozar la pared)
    astro.root.position.lerp(astroPos, traveling || i === 9 || r.exact ? 1 : 1 - Math.exp(-6 * dt));
    astro.root.scale.setScalar(r.scale);
    if (st.farewellT >= 0) { st.farewellT += dt; r.pose = "wave"; if (st.farewellT > 3) st.farewellT = -1; }
    if (st.celebrateT >= 0) { st.celebrateT += dt; r.pose = "celebrate"; if (st.celebrateT > 3.5) st.celebrateT = -1; }
    astro.setPose(r.pose, { safe: traveling, fade: r.fade });
    // orientación (y hacia dónde mira: Gloobi lo imita, ver gLook)
    gLookCam = r.look === "camera" || r.look === "none"; // "none" = final en la ventana: el visor mira a la cámara
    if (fl.on) { // volando: el cuerpo hacia donde avanza (inclinación vertical atenuada)
      flyDir.normalize().multiplyScalar(fl.dir); flyDir.y *= 0.35; if (flyDir.lengthSq() < 1e-6) flyDir.set(0, 0, -1); flyDir.normalize();
      gLookCam = false; gLook.copy(astro.root.position).addScaledVector(flyDir, 20);
      tmp.copy(astro.root.position).add(flyDir); mtx.lookAt(tmp, astro.root.position, UP); quat.setFromRotationMatrix(mtx);
    } else if (r.look === "none") quat.copy(noRot);
    else if (r.look === "quat") { quat.copy(fQ); gLookCam = false; gLook.copy(astro.root.position).addScaledVector(tmp.set(0, 0, 1).applyQuaternion(fQ), 20); } // (regreso a la escotilla, ver final9)
    else if (r.look === "exit") { quat.copy(exQ); gLook.copy(exC).addScaledVector(exN, 20); }
    else {
      if (r.look === "camera") tmp.copy(cam.pos);
      else if (r.look === "out") tmp.set(0.9, 2.5, 8);
      else if (r.look === "memories") tmp.copy(W.memories?.nearest(camera) || cam.tgt);
      else tmp.copy(r.look);
      gLook.copy(tmp);
      tmp.y = lerp(astro.root.position.y, tmp.y, 0.3);
      mtx.lookAt(tmp, astro.root.position, camera.up); quat.setFromRotationMatrix(mtx);
    }
    // (viajes del 3 al 8: giro amortiguado, sin brusquedad al entrar, al invertir el scroll ni al llegar)
    astro.root.quaternion.slerp(quat, r.exact ? 1 : traveling && (R0 || i < 3 || i > 8) ? 0.25 : 1 - Math.exp(-(fl.on ? 3.5 : 4) * dt));
    // asomado por la escotilla (cap. 1, cap. 2 antes de salir, final): visor detrás del vidrio mirando a la cámara
    if (r.seat >= 0) { applySeat(r.seat); gLookCam = true; }
    // recorrido (estación, recuerdos, bodega, plan de vuelo): el cuerpo sigue de 3/4 trasero; cada ~7 s la cabeza
    // gira un poco hacia la cámara y el visor se asoma de perfil
    if (i >= 5 && i <= 7 && !traveling) {
      astro.root.updateMatrixWorld(); tmp.copy(cam.pos); astro.root.worldToLocal(tmp);
      const toCam = Math.atan2(tmp.x, tmp.z), glance = smooth(clamp((Math.sin(t * 0.9) - 0.55) / 0.3)) * (Math.sin(t * 0.14) > -0.2 ? 1 : 0);
      astro.setHeadYaw(clamp(toCam, -0.85, 0.85) * glance);
      // el casco se asoma de reojo hacia la cámara: Gloobi imita ese mismo giro (hacia donde apunta el casco; el cuerpo
      // sigue de espaldas, así que no mira de frente a la cámara)
      if (glance > 0.3) { astro.headAxes(fL, uL); astro.visorWorld(gLook).addScaledVector(fL, 20); gLookCam = false; }
    } else astro.setHeadYaw(0);
    W.rocket.setInterior(r.inRocket || (i === 2 && p < 0.6));
    tether.visible = plugA.visible = plugB.visible = i === 2 && p > 0.3 && !traveling;
    if (tether.visible) updateTether(t);
    // Gloobi
    gloobi.root.visible = true; gloobi.setMode("awake");
    if (i === 1) { gloobi.point(0); gloobi.lookAt(null); } // (asomado junto al astronauta: ver abajo)
    else {
      camSpace(cam.pos, astro.root.position, 0.42, 0.28, 0, gTarget).sub(cam.pos).add(astro.root.position);
      if (i === 8) camSpace(cam.pos, astro.root.position, -0.6, -0.15, 0, gTarget).sub(cam.pos).add(astro.root.position); // a la izquierda del astronauta, bajo el marco del mural: no tapa parches ni visor
      if (i === 6) camSpace(cam.pos, astro.root.position, -0.2, -0.6, 0, gTarget).sub(cam.pos).add(astro.root.position); // recuerdos: abajo a su izquierda, bajo el cinturón de fotos (no tapa ninguna)
      if (i === 7 && p < 0.6) camSpace(cam.pos, astro.root.position, 0.45, -0.25, 0, gTarget).sub(cam.pos).add(astro.root.position); // plan de vuelo: a su derecha, bajo la ruta y sus marcas
      // estación: junto a la esquina inferior derecha del mapa holográfico, a su misma profundidad, sobre el módulo
      // derecho (nunca delante del mapa, sus etiquetas, el rótulo del núcleo ni el visor), mirándolo
      if (i === 5 && W.station) { W.station.screen.updateWorldMatrix(true, false); W.station.screen.localToWorld(gTarget.set(1.75, -1.4, 0.3)); }
      if (i === 7 && p >= 0.6) camSpace(cam.pos, astro.root.position, 0.1, -0.15, -0.6, gTarget).sub(cam.pos).add(astro.root.position); // bodega: delante de su espalda (de 3/4 trasero: lejos del visor), no tapa los regalos
      if (i === 9) camSpace(cam.pos, astro.root.position, -0.6, -0.15, 0, gTarget).sub(cam.pos).add(astro.root.position); // (sólo con movimiento reducido, antes del fundido: como en el cap. 8; si no, final9Gloobi)
      if (fl.on) { // volando: un poco detrás del astronauta y a un lado (el de la derecha en pantalla), mirando adonde él
        flySide.crossVectors(flyDir, UP); if (flySide.lengthSq() < 1e-6) flySide.set(1, 0, 0); flySide.normalize();
        if (flySide.dot(tmp2.setFromMatrixColumn(camera.matrixWorld, 0)) < 0) flySide.negate();
        gTarget.copy(astro.root.position).addScaledVector(flyDir, -0.35).addScaledVector(flySide, 0.5).addScaledVector(UP, 0.3);
      }
      // en los viajes viaja con él (el retraso del seguimiento sólo afecta al acomodo: no se queda atrás en los
      // tramos largos)
      const carry = traveling && !R0 && i >= 3 && i <= 8;
      if (carry && fl.carry) gloobi.root.position.add(tmp2.subVectors(astro.root.position, flyPrev));
      fl.carry = carry; flyPrev.copy(astro.root.position);
      gloobi.follow(gTarget); gloobi.point(0);
      // mira a donde mira el astronauta (letrero, Luna, estación, fotos, regalos… o la cámara), con el retraso y el
      // rebote de su imitación (gloobi.js); al voltear los dos hacia la cámara, un parpadeo tierno
      gloobi.lookAt(gLookCam ? null : gLook);
      if (i === 5 && !fl.on && W.station) gloobi.lookAt(W.station.screen.getWorldPosition(tmp2)); // (mira el mapa)
      if (i === 6 && Math.random() < dt * 0.25) gloobi.wow(1400);
    }
    // (cap. 1: el astronauta aún no aparece y Gloobi señala hacia abajo para indicar el scroll: mira a la cámara)
    if (gLookCam && !st.gLookCam && astro.root.visible && i !== 1) st.gestureT = 0.35;
    st.gLookCam = gLookCam;
    if (st.gestureT >= 0) { st.gestureT -= dt; if (st.gestureT < 0) gloobi.blink(); }
    // cap. 2: Gloobi espera dentro (oculto hasta que el astronauta avanza), sale por el mismo eje de la escotilla
    // detrás de él y ya afuera se acomoda a su lado. La posición sigue el recorrido exacto (sin atajos que crucen la
    // pared); el estirado/aplastado orgánico sale de su propia velocidad.
    st.gloobiPath = false;
    // Dentro del cohete y al cruzar la escotilla Gloobi va por un recorrido exacto (nunca atraviesa la pared ni aparece
    // de golpe). Cap. 1 (y el viaje al 2): asomado junto al astronauta. Cap. 2: se aparta dentro mientras él sale,
    // vuelve al eje, sale detrás de él y se acomoda a su lado. Cap. 9: final9Gloobi (con movimiento reducido, el
    // cambio de lugar ocurre durante el fundido).
    const k2 = traveling ? easeInOut(p / T) : 1;
    if (i === 1 || (i === 2 && k2 < 0.5)) { gAt(gWin(tmp)); gloobi.lookAt(null); }
    else if (i === 2 && p < EXIT.gSide) {
      const gIn = tmp3.copy(exC).addScaledVector(exN, -0.6);
      tmp2.copy(exC).addScaledVector(exN, -0.85).addScaledVector(exR, 0.5).addScaledVector(UP, 0.42); // apartado, dentro de la cabina
      if (p < EXIT.gAside) { gAt(gWin(tmp)); gloobi.lookAt(null); }
      else if (p < EXIT.gIn) { // primero hacia adentro por el tubo de la escotilla y luego a un lado (no roza la pared)
        const k = clamp((p - EXIT.gAside) / (EXIT.go - EXIT.gAside));
        gWin(tmp); tmp.addScaledVector(exN, -0.5 * smooth(k / 0.5)); gAt(tmp.lerp(tmp2, smooth((k - 0.4) / 0.6)));
      }
      else if (p < EXIT.gGo) gAt(tmp.copy(tmp2).lerp(gIn, smooth((p - EXIT.gIn) / (EXIT.gGo - EXIT.gIn))));
      else if (p < EXIT.gOut) gAt(tmp.copy(gIn).lerp(exG1, easeInOut((p - EXIT.gGo) / (EXIT.gOut - EXIT.gGo))));
      else gAt(tmp.lerpVectors(exG1, gTarget, smooth((p - EXIT.gOut) / (EXIT.gSide - EXIT.gOut))));
    } else if (i === 9) {
      if (!R0) final9Gloobi(p, dt);
      else if (!(traveling && k2 < 0.5)) { gAt(gWin(tmp)); gloobi.lookAt(null); }
    }
    // partes por capítulo
    if (W.constellation) { W.constellation.group.visible = i >= 2 && i <= 4; const cp = i === 3 ? clamp((p - 0.2) / 0.45) : i > 3 ? 1 : 0; if (W.constellation.update(dt, t, cp, R.dpr) && i === 3) gloobi.wow(1500); } // (las campanitas las da la onda: onChime)
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
    if (W.cargo?.group.visible && st.chapter === 7) {
      const hit = ray.intersectObjects(W.cargo.hitMeshes, false)[0];
      if (hit) { W.cargo.focus(hit.object.userData.index); audio.chime(); return { kind: "gift", index: hit.object.userData.index }; }
    }
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
    astro, gloobi, crescent, world: W, sky, stars, ready,
    update,
    buildRest() { buildIdle(); },
    setHold(h) { st.hold = h; },
    toCover() { st.mode = "cover"; st.hold = 0; st.launchDone = true; st.lastChapter = 0; st.fade = 0; astro.snapPose("sleep"); astro.setAwake(false, { instant: true }); gloobi.setMode("sleep"); W.launch?.clearSmoke(); },
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
    /** Cambia el tema de color en vivo (modo debug): escena 3D, reflejos, parche e interfaz. */
    setTheme(key) {
      const t = themeOf({ colorTheme: key });
      setTheme3D(t); applyThemeCss(t);
      try { refreshStudioEnv(R.renderer, scene); } catch { /* sin reflejos de estudio */ }
      setPatch(patchR);
    },
    get themeKey() { return THEME3D.key; },
    themes: Object.keys(THEMES),
    farewell() { st.farewellT = 0; audio.bye(); },
    crewCount() { buildUpTo(3); return W.mural.count(); },
    tap,
    /** ¿Hay tarjeta de capítulo visible? (encuadre: con tarjeta el protagonista va en la mitad superior). */
    setCardOn(v) { st.cardOn = !!v; },
    /** Tarjeta de la bodega → la cámara gira hacia el regalo i, con un destello. */
    focusGift(i) { if (st.mode !== "story" || st.chapter !== 7 || !W.cargo) return; st.giftFocus = st.giftIdx = i; W.cargo.focus(i); audio.sparkle(); },
    flyPhoto(i) { audio.whoosh(); return W.memories?.flyTo(i); },
    photoBack(i) { W.memories?.flyBack(i); audio.whoosh(); },
    /** Póster: renderiza la portada en la fase 0 de la deriva (la misma con la que aparece el 3D). */
    renderCover(t) { const m = st.mode, c0 = st.coverT0; st.mode = "cover"; st.coverT0 = -1; update(0.016, t, { chapter: 1, p: 0 }); st.mode = m; st.coverT0 = c0; },
    /** Arranca la deriva lenta de la portada (al quitar el póster). */
    startCoverDrift() { if (st.coverT0 < 0) st.coverT0 = st.t; },
    /** Carga real (0–1): descarga del astronauta, fotos del visor, shaders compilados y astronauta asentado. */
    /** ¿Ya se puede dibujar? (shaders compilados en paralelo: el primer dibujo no congela la pantalla de carga) */
    get renderReady() { return !!load.compiled; },
    loadProgress() { return Math.min(1, 0.4 * astro.loadProgress + 0.1 * load.photos + 0.2 * load.surface + 0.1 * load.built + 0.12 * load.compiled + 0.08 * Math.min(1, astro.settledFrames / 4)); },
    /** ¿La portada se puede mostrar? Todo cargado y compilado (superficie lunar incluida), astronauta en su animación
     *  de dormir desde hace ≥ 4 cuadros (nunca en reposo ni en una pose fija) y el encuadre ya calculado con el
     *  modelo definitivo. */
    coverReady() { return st.mode === "cover" && load.compiled && load.photos && load.surface && astro.settledFrames >= 4 && CF.has && st.t - CF.kindT >= 0.35; },
    /** Franja libre de la portada (fracciones del alto, de arriba hacia abajo) entre el título y el botón. */
    setCoverBand(top, bottom) { if (Math.abs(top - CF.band[0]) + Math.abs(bottom - CF.band[1]) > 0.004) CF.band = [top, bottom]; },
    /** Punto focal de la portada en pantalla (fracciones), para alinear el póster (object-position). */
    get coverInfo() { return CF.info; },
    coverFocus() { tmp.copy(CF.cur.ctr).project(camera); return { x: (tmp.x + 1) / 2, y: (1 - tmp.y) / 2 }; }
  };
}
