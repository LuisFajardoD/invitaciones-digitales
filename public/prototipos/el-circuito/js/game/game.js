// Motor de "El Circuito": loop de paso fijo (60 Hz) con interpolación de render, estados de la carrera,
// cámara, parallax, agua, obstáculos, fotos, reaparición amable y podio. Canvas 2D en dos capas:
// `world` (fondo, pista, partículas) y `fg` (el corredor, siempre por encima de la interfaz).
import { buildCourse, PLAT_Y, RUN_SPEED, slideY } from "./course.js";
import { step, makeRunnerState, surfaceTop, sweepAngle, DT, HIT, JUMP_V } from "./physics.js";
import { autopilot } from "./autopilot.js";
import { createInput } from "./input.js";
import { createParticles } from "./particles.js";
import { makePose, poseFor, drawRunner, makeLook } from "./runner-art.js";
import * as A from "./art.js";

const VIEW_W = 390; // unidades del mundo visibles a lo ancho
const PODIUM_DX = 270; // el podio está después de la meta

export async function createGame({ worldCanvas, fgCanvas, data, bibText, audio, onProgress = () => {}, cb = {}, reduced = () => false }) {
  const wctx = worldCanvas.getContext("2d", { alpha: false });
  const fctx = fgCanvas.getContext("2d");
  const C = buildCourse();
  const W = { course: C, wt: 0, balls: [], easy: new Set(), easySkipTower: false, autoHold: 0, autoDouble: -1 };
  const balls = C.balls.map((b) => ({ id: b.id, ref: b, x: b.x, y: PLAT_Y, r: b.r, v: b.speed, alive: true, active: false, rot: 0, sink: 0 }));
  W.balls = balls;
  const particles = createParticles();
  const input = createInput(worldCanvas);

  /* ---------- Sprite cache (pre-render al cargar) ---------- */
  const SP = { plat: new Map() };
  const jobs = [
    () => { for (const g of C.ground) if (g.kind !== "tower") platSprite(g.x1 - g.x0, g.color); platSprite(80, A.PAL.lime); },
    () => { SP.tramp = A.trampSprite(90); SP.roller = A.rollerSprite(27); SP.gloss27 = A.glossSprite(27); },
    () => { SP.ball = A.ballSprite(32); SP.gloss32 = A.glossSprite(32); SP.post = A.postSprite(); SP.buoy = A.buoySprite(); },
    () => { SP.arch = [0, 1, 2, 3, 4].map((n) => (n ? A.archSprite(n) : null)); SP.finish = A.archSprite(0, { finish: true }); },
    () => { const t = C.towers[0]; SP.tower = A.towerSprite(t.x1 - t.x0, t.y + 10); const s = C.slides[0]; SP.slide = A.slideSprite(s, (x) => slideY(s, x)); },
    () => { SP.podium = A.podiumSprite(); SP.bubble = A.bubbleSprite(null); SP.bubbles = []; },
    () => { SP.sun = A.sunSprite(); SP.clouds = [A.cloudSprite(1), A.cloudSprite(2)]; SP.far = A.farIslandSprite(); SP.mid = A.midLayerSprite(); }
  ];
  function platSprite(w, color) { const k = `${Math.round(w)}|${color}`; if (!SP.plat.has(k)) SP.plat.set(k, A.platformSprite(Math.round(w), color)); return SP.plat.get(k); }
  for (let i = 0; i < jobs.length; i++) { jobs[i](); onProgress((i + 1) / jobs.length); await new Promise((r) => setTimeout(r, 0)); }
  /** Miniaturas de las fotos dentro de las burbujas (carga diferida). */
  function loadPhotoThumbs() {
    data.gallery.forEach((ph, i) => {
      const img = new Image(); img.decoding = "async";
      img.onload = () => { SP.bubbles[i] = A.bubbleSprite(img); };
      img.src = ph.src;
    });
  }

  /* ---------- Corredores ---------- */
  const look = makeLook(data.child.runner, bibText);
  const pose = makePose();
  const s = makeRunnerState();
  const R = { anim: "idle", t: 0, px: 0, py: PLAT_Y, splash: 0, alpha: 1, podium: null, hop: null };
  let guest = null; // { look, x, y, anim, t, state, hop }

  /* ---------- Estado de la carrera ---------- */
  const G = {
    mode: "boot", auto: false, paused: false, time: 0, finalTime: null, timeScale: 1, slowmo: 0,
    cpDone: new Set(), photos: new Set(), marker: C.markers[0], fails: new Map(), skipKey: null,
    invincible: false, hitboxes: false, cardOpen: false, modeT: 0, lastEvent: "", slideSound: false
  };
  const podiumX = C.finish.x + PODIUM_DX;

  /* ---------- Cámara ---------- */
  const cam = { x: -VIEW_W * 0.3, y: 0, px: 0, py: 0, base: 0.62, baseTarget: 0.62, shake: 0 };
  let cssW = 1, cssH = 1, dpr = 1, S = 1, quality = 2, skyG = null, waterG = null;
  function resize() {
    const r = worldCanvas.getBoundingClientRect();
    cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
    dpr = Math.min(quality >= 2 ? 2 : 1.5, window.devicePixelRatio || 1);
    for (const c of [worldCanvas, fgCanvas]) { c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr); }
    S = cssW / VIEW_W;
    skyG = A.skyGradient(cssH); waterG = A.waterGradient(cssH);
  }
  resize();
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  ro ? ro.observe(worldCanvas) : window.addEventListener("resize", resize);

  /* ---------- Utilidades ---------- */
  const groundAt = (x) => { for (let k = 0; k < C.ground.length; k++) { const g = C.ground[k]; if (x >= g.x0 && x <= g.x1) return k; } return -1; };
  function placeOnGround(x) {
    s.x = x; s.vy = 0; s.grounded = true; s.coyote = 0; s.buffer = 0; s.dbl = true; s.flip = -1; s.onSlide = false;
    const k = groundAt(x);
    s.gi = k; s.y = k >= 0 ? surfaceTop(C.ground[k], W.wt, W) : PLAT_Y;
    R.px = s.x; R.py = s.y;
  }
  function resetBallsAfter(x) { for (const b of balls) if (b.ref.x > x) { b.x = b.ref.x; b.y = PLAT_Y; b.alive = true; b.active = false; b.sink = 0; } }
  const squash = new Map(); // id → t (aplastado al pisar)
  function failKey(ev) {
    if (ev.startsWith("hit:")) return ev.slice(4);
    const g = C.ground[s.lastGround];
    const gap = g ? C.gaps.find((q) => q.x0 >= g.x1 - 2) : null;
    return gap ? gap.id : "gap?";
  }
  /** Ayuda automática: 2 fallos → más fácil; 3 → botón "Pasar este obstáculo". */
  function registerFail(key) {
    const n = (G.fails.get(key) || 0) + 1;
    G.fails.set(key, n);
    if (n === 2) {
      W.easy.add(key);
      const gap = C.gaps.find((q) => q.id === key);
      if (gap && !gap.raft) { // balsa extra a la mitad del hueco
        const mid = (gap.x0 + gap.x1) / 2;
        gap.raft = { id: `${gap.id}-raft`, x0: mid - 40, x1: mid + 40, y: PLAT_Y - 2, kind: "plat", color: A.PAL.lime, raft: true };
        C.ground.push(gap.raft); C.ground.sort((a, b) => a.x0 - b.x0);
      }
    }
    if (n >= 3) { G.skipKey = key; cb.onSkipAvailable?.(true); }
    return n;
  }
  function skipTarget(key) {
    const gap = C.gaps.find((q) => q.id === key);
    if (gap) return gap.after;
    const hz = C.hazards.find((q) => q.id === key);
    return hz ? hz.after : s.x + 200;
  }

  /* ---------- Modos ---------- */
  function setMode(m) { G.mode = m; G.modeT = 0; }
  const api = {
    get mode() { return G.mode; },
    get time() { return G.time; },
    get finalTime() { return G.finalTime; },
    get photos() { return [...G.photos].sort(); },
    get progress() { return Math.max(0, Math.min(1, s.x / C.finish.x)); },
    get auto() { return G.auto; },
    get cpDone() { return G.cpDone; },
    get runner() { return s; },
    course: C, input, particles, look,
    get fps() { return fps; }, get quality() { return quality; },
    sections: C.sections,
    loadPhotoThumbs,
    /** Menú: corredor calentando en la línea de salida. */
    toMenu() {
      G.paused = false; setMode("menu"); placeOnGround(40); R.anim = "idle"; guest = null; R.podium = null;
      cam.baseTarget = 0.6; G.cardOpen = false; input.enabled = false;
    },
    /** Tutorial: parado ante el charquito; espera el toque. */
    toTutorial() {
      setMode("tutorial"); placeOnGround(108); R.anim = "stand"; input.reset(); input.enabled = true; cam.baseTarget = 0.62;
    },
    toCountdown() { setMode("countdown"); R.anim = "stand"; input.enabled = false; cam.baseTarget = 0.7; },
    /** Empieza la carrera (auto = el corredor salta solo). */
    startRace({ auto = false } = {}) {
      G.auto = auto; G.time = 0; G.finalTime = null; G.cpDone.clear(); G.photos.clear(); G.fails.clear(); G.skipKey = null;
      W.easy.clear(); for (const g of C.gaps) if (g.raft) { C.ground.splice(C.ground.indexOf(g.raft), 1); g.raft = null; }
      resetBallsAfter(-1e9); s.sprint = false; s.invuln = 0; G.marker = C.markers[0];
      if (G.mode !== "countdown" || s.x < 60) placeOnGround(Math.max(s.x, 60));
      setMode("race"); R.anim = "run"; input.reset(); input.enabled = !auto; cam.baseTarget = 0.7;
      cb.onSkipAvailable?.(false);
    },
    /** Prepara la salida (sin tutorial): corredor listo en la línea. */
    readyAtStart() { placeOnGround(60); R.anim = "stand"; },
    pause(v = true) { G.paused = v; if (v) input.reset(); input.enabled = !v && G.mode === "race" && !G.auto; },
    get paused() { return G.paused; },
    /** Después de la tarjeta del punto de control: mini 3·2·1 y sigue. */
    resumeFromCard() { setMode("resume"); cam.baseTarget = 0.7; G.cardOpen = false; R.anim = "stand"; },
    setCardOpen(v) { G.cardOpen = v; cam.baseTarget = v ? 0.3 : G.mode === "podium" ? 0.36 : 0.7; },
    setFinishLayout() { cam.baseTarget = 0.36; },
    skipObstacle() {
      if (!G.skipKey) return;
      const x = skipTarget(G.skipKey);
      G.skipKey = null; cb.onSkipAvailable?.(false);
      placeOnGround(x); s.invuln = 1; setMode("race"); R.anim = "run";
    },
    /** Invitado que se inscribe: su corredor entra corriendo y sube al podio junto al niño. */
    guestJoin(guestLook) {
      guest = { look: guestLook, x: podiumX - VIEW_W * 0.55, y: PLAT_Y, anim: "run", t: 0, state: "run", hop: null };
    },
    guestLeave() { guest = null; },
    get hasGuest() { return !!guest; },
    /** Escena del podio (para confirmar desde la hoja de info): el niño en el primer lugar. */
    showPodium() {
      G.paused = false; setMode("podium"); input.enabled = false;
      s.x = podiumX + SP.podium.xs[1]; s.y = PLAT_Y + SP.podium.tops[1] - 4; s.grounded = true; R.px = s.x; R.py = s.y;
      R.anim = "celebrate"; R.t = 0;
      cam.x = podiumX - VIEW_W * 0.5; cam.px = cam.x; cam.baseTarget = 0.36;
    },
    childWave(ms = 3200) { R.anim = "wave"; R.t = 0; setTimeout(() => { if (G.mode === "podium") R.anim = "celebrate"; }, ms); },
    /* ---- Debug ---- */
    jumpTo(n) {
      const x = n >= 5 ? C.finish.x - 260 : C.cps[n - 1].x - 220;
      G.cpDone.clear(); for (const c of C.cps) if (c.n < n) G.cpDone.add(c.n);
      s.sprint = n >= 5; resetBallsAfter(x - 400);
      G.marker = C.markers.filter((m) => m.x <= x).pop() || C.markers[0];
      placeOnGround(x); setMode("race"); R.anim = "run"; input.enabled = !G.auto; G.paused = false; cam.baseTarget = 0.7; G.cardOpen = false;
      cam.x = s.x - VIEW_W * 0.3;
    },
    get fails() { return Object.fromEntries(G.fails); },
    /** Debug: coloca al corredor en x (sobre el suelo) en plena carrera. */
    teleport(x) { for (const c of C.cps) if (c.x < x) G.cpDone.add(c.n); s.sprint = G.cpDone.has(4); resetBallsAfter(x - 400); G.marker = C.markers.filter((m) => m.x <= x).pop() || C.markers[0]; placeOnGround(x); setMode("race"); R.anim = "run"; cam.x = s.x - VIEW_W * 0.3; },
    setInvincible(v) { G.invincible = v; }, setHitboxes(v) { G.hitboxes = v; }, setAuto(v) { G.auto = v; input.enabled = !v && G.mode === "race"; },
    start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    resize
  };

  /* ---------- Actualización (paso fijo) ---------- */
  const autoIn = { pressed: false, held: false };
  const playIn = { pressed: false, held: false };
  function fixed(dt) {
    R.px = s.x; R.py = s.y; cam.px = cam.x; cam.py = cam.y;
    G.modeT += dt; R.t += dt;
    if (G.mode !== "card") W.wt += dt;
    for (const [k, v] of squash) { const n = v - dt; if (n <= 0) squash.delete(k); else squash.set(k, n); }
    switch (G.mode) {
      case "menu": case "countdown": case "resume": break;
      case "tutorial": {
        if (input.take()) { setMode("tutjump"); s.vy = JUMP_V; s.grounded = false; s.dbl = false; R.anim = "jump"; audio.jump(); }
        break;
      }
      case "tutjump": {
        const ev = step(s, { pressed: false, held: true }, W);
        if (ev === "land" || (s.grounded && G.modeT > 0.2)) { setMode("tutdone"); R.anim = "celebrate"; audio.land(); particles.puff(s.x, s.y); cb.onTutorialDone?.(); }
        break;
      }
      case "tutdone": break;
      case "race": raceStep(dt); break;
      case "splash": {
        G.time += dt;
        if (G.modeT >= 1.0) respawn();
        break;
      }
      case "cp": {
        if (G.modeT > 1.1) { setMode("card"); cb.onCheckpoint?.(G.lastCp); }
        break;
      }
      case "finish": finishStep(dt); break;
      case "podium": break;
    }
    if (G.mode === "resume" && G.modeT >= 0.95) { setMode("race"); R.anim = "run"; input.reset(); input.enabled = !G.auto; }
    if (G.mode === "countdown") { /* la UI llama a startRace al terminar el semáforo */ }
    updateBalls(dt);
    updateGuest(dt);
    particles.update(dt);
    updateCamera(dt);
  }

  function raceStep(dt) {
    G.time += dt;
    let inp;
    if (G.auto) { input.take(); inp = autopilot(s, W, autoIn); }
    else { playIn.pressed = input.take(); playIn.held = input.held; inp = playIn; }
    if (G.invincible) s.invuln = Math.max(s.invuln, 0.1);
    const ev = step(s, inp, W);
    if (ev) handleEvent(ev);
    if (G.mode !== "race") return;
    // animación
    if (s.onSlide) R.anim = "slide";
    else if (s.grounded) R.anim = "run";
    else if (s.flip >= 0) R.anim = "flip";
    else R.anim = s.vy > 0 ? "jump" : "fall";
    if (s.onSlide) { particles.trail(s.x - 10, s.y + 4, 1); if (!G.slideSound) { G.slideSound = true; audio.slide(); } } else G.slideSound = false;
    // reaparición: la marca más lejana alcanzada en el suelo
    if (s.grounded && !s.onSlide) for (const m of C.markers) if (m.x <= s.x && m.x > G.marker.x) G.marker = m;
    // fotos
    for (const ph of C.photos) {
      if (G.photos.has(ph.i)) continue;
      const py = ph.y + Math.sin(W.wt * 2.2 + ph.i) * 6;
      const nx = Math.max(s.x - HIT.hw - 6, Math.min(ph.x, s.x + HIT.hw + 6)), ny = Math.max(s.y, Math.min(py, s.y + 70));
      if ((ph.x - nx) ** 2 + (py - ny) ** 2 < 36 * 36) {
        G.photos.add(ph.i); particles.sparkle(ph.x, py, 22); particles.splash(ph.x, py, 0.25);
        audio.photo(); cb.onPhoto?.(ph.i, G.photos.size);
      }
    }
    // sprint final
    if (G.cpDone.has(4)) s.sprint = true;
    // puntos de control
    for (const cp of C.cps) {
      if (G.cpDone.has(cp.n) || s.x < cp.x || !s.grounded || s.onSlide) continue;
      G.cpDone.add(cp.n); G.lastCp = cp.n; G.marker = C.markers.find((m) => m.cp === cp.n) || G.marker;
      setMode("cp"); R.anim = "celebrate"; R.t = 0; input.enabled = false;
      particles.confetti(s.x + 60, s.y + 260, reduced() ? 20 : 70, 380);
      audio.checkpoint(); cb.onCheckpointBanner?.(cp.n);
      cb.onSkipAvailable?.(false); G.skipKey = null;
      return;
    }
    // meta
    if (s.x >= C.finish.x) {
      G.finalTime = G.time; setMode("finish"); input.enabled = false;
      G.slowmo = reduced() ? 0 : 0.5;
      particles.confetti(C.finish.x, PLAT_Y + 300, reduced() ? 24 : 90, 420);
      audio.whistle(); audio.applause();
      cb.onFinishLine?.(G.finalTime);
    }
  }

  function handleEvent(ev) {
    if (ev === "jump") { audio.jump(); particles.puff(s.x, s.y); }
    else if (ev === "double") audio.flip();
    else if (ev === "land") { audio.land(); particles.puff(s.x, s.y); const g = C.ground[s.gi]; if (g) squash.set(g.id, 0.22); }
    else if (ev === "boing") { audio.boing(); particles.trail(s.x, s.y, 10); squash.set(s.tramp, 0.3); }
    else if (ev === "fall" || ev.startsWith("hit:")) fail(ev);
  }

  function fail(ev) {
    const key = failKey(ev);
    const n = registerFail(key);
    setMode("splash"); input.enabled = false;
    R.anim = "splash"; R.t = 0;
    const sx = s.x, sy = Math.max(0, ev === "fall" ? 0 : s.y);
    particles.splash(sx, ev === "fall" ? 0 : sy, 1.2);
    if (ev !== "fall") { s.vy = 420; } // golpe: sale disparado hacia atrás y cae al agua
    s.grounded = false;
    audio.splash();
    if (!reduced()) cam.shake = 0.25;
    cb.onSplash?.(n, key);
  }
  function respawn() {
    const m = G.marker;
    resetBallsAfter(m.x - 50);
    placeOnGround(m.x);
    s.invuln = 1; R.anim = "run";
    particles.splash(s.x, s.y, 0.35);
    setMode("race"); input.reset(); input.enabled = !G.auto;
    cam.x = Math.max(cam.x - 0, s.x - VIEW_W * 0.3 - 40);
  }

  function finishStep(dt) {
    // cámara lenta 0.5 s, luego corre al podio y sube de un salto
    if (G.slowmo > 0) { G.slowmo -= dt / 0.35; G.timeScale = 0.35; } else G.timeScale = 1;
    if (!R.hop) {
      s.x += RUN_SPEED * dt; R.anim = "run";
      const gi = groundAt(s.x); if (gi >= 0) s.y = surfaceTop(C.ground[gi], W.wt, W);
      if (s.x >= podiumX - 95) R.hop = { t: 0, x0: s.x, y0: s.y, x1: podiumX + SP.podium.xs[1], y1: PLAT_Y + SP.podium.tops[1] - 4 };
    } else {
      const h = R.hop; h.t += dt / 0.55;
      const q = Math.min(1, h.t);
      s.x = h.x0 + (h.x1 - h.x0) * q; s.y = h.y0 + (h.y1 - h.y0) * q + Math.sin(q * Math.PI) * 90;
      R.anim = q < 0.5 ? "jump" : "fall";
      if (q >= 1) {
        R.hop = null; setMode("podium"); G.timeScale = 1; R.anim = "celebrate"; R.t = 0;
        particles.burst(s.x, s.y + 80, reduced() ? 20 : 60); audio.land();
        cam.baseTarget = 0.36;
        cb.onFinish?.({ time: G.finalTime, auto: G.auto, photos: [...G.photos] });
      }
    }
  }

  function updateBalls(dt) {
    if (G.mode !== "race" && G.mode !== "splash") return;
    for (const b of balls) {
      if (!b.alive) continue;
      if (!b.active && b.ref.x > s.x && (b.ref.trigger != null ? s.x >= b.ref.trigger : b.ref.x - s.x < 640)) b.active = true;
      if (!b.active) continue;
      const v = b.v * (W.easy.has(b.id) ? 0.75 : 1);
      b.x -= v * dt; b.rot -= (v * dt) / b.r;
      // ¿sigue sobre una plataforma?
      const gi = groundAt(b.x);
      if (gi < 0 || b.sink > 0) { b.sink += dt; b.y -= 260 * dt * b.sink * 3; if (b.sink > 0.05 && b.sink < 0.07) particles.splash(b.x, 0, 0.6); if (b.y < -b.r * 2) b.alive = false; }
    }
  }

  function updateGuest(dt) {
    if (!guest) return;
    guest.t += dt;
    const target = podiumX + SP.podium.xs[2];
    if (guest.state === "run") {
      guest.x += RUN_SPEED * 1.1 * dt; guest.anim = "run";
      if (guest.x >= target - 90) guest.hop = { t: 0, x0: guest.x, x1: target, y0: PLAT_Y, y1: PLAT_Y + SP.podium.tops[2] - 4 }, guest.state = "hop";
    } else if (guest.state === "hop") {
      const h = guest.hop; h.t += dt / 0.5;
      const q = Math.min(1, h.t);
      guest.x = h.x0 + (h.x1 - h.x0) * q; guest.y = h.y0 + (h.y1 - h.y0) * q + Math.sin(q * Math.PI) * 70;
      guest.anim = q < 0.5 ? "jump" : "fall";
      if (q >= 1) { guest.state = "podium"; guest.anim = "celebrate"; guest.t = 0; R.anim = "celebrate"; audio.land(); particles.burst(guest.x, guest.y + 70, reduced() ? 16 : 40); cb.onGuestArrived?.(); }
    }
  }

  function updateCamera(dt) {
    const k = 1 - Math.exp(-dt * 7);
    let tx = s.x - VIEW_W * 0.3 + (G.mode === "race" ? 36 : 0);
    if (G.mode === "podium" || (G.mode === "finish" && R.hop)) tx = podiumX - VIEW_W * 0.5;
    cam.x += (tx - cam.x) * k;
    const ty = Math.max(0, s.y - 170) * 0.85;
    cam.y += (ty - cam.y) * (1 - Math.exp(-dt * 4));
    cam.base += (cam.baseTarget - cam.base) * (1 - Math.exp(-dt * 5));
    cam.shake = Math.max(0, cam.shake - dt);
  }

  /* ---------- Render ---------- */
  const ride = { x: 0, y: 0 };
  function render(alpha, realDt) {
    const cx = cam.px + (cam.x - cam.px) * alpha;
    const cy = cam.py + (cam.y - cam.py) * alpha;
    ride.x = R.px + (s.x - R.px) * alpha; ride.y = R.py + (s.y - R.py) * alpha;
    const shakeX = cam.shake > 0 ? (Math.random() - 0.5) * cam.shake * 18 : 0;
    const baseY = cssH * cam.base; // pantalla: nivel del agua
    const ctx = wctx;
    const t = W.wt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Cielo, sol, nubes
    ctx.drawImage(skyG, 0, 0, cssW, cssH);
    const hz = baseY - Math.min(130, cssH * 0.17) + cy * S * 0.12; // horizonte
    const sunS = S * 0.9;
    ctx.drawImage(SP.sun.c, cssW * 0.72 - 110 * sunS, hz - cssH * 0.26 - 110 * sunS, 220 * sunS, 220 * sunS);
    if (quality >= 2) {
      const drift = t * 6;
      for (let k = 0; k < 4; k++) {
        const cl = SP.clouds[k % 2], sc = S * (0.55 + (k % 3) * 0.18);
        const px = ((k * 520 - cx * 0.06 * S - drift * S * (1 + k * 0.3)) % (cssW + 320) + cssW + 320) % (cssW + 320) - 200;
        ctx.globalAlpha = 0.9; ctx.drawImage(cl.c, px, hz - cssH * (0.12 + 0.07 * (k % 3)) - 40 * sc, cl.w * sc, cl.h * sc);
      }
      ctx.globalAlpha = 1;
    }
    // Agua (desde el horizonte)
    ctx.drawImage(waterG, 0, hz, cssW, cssH - hz + 2);
    // Isla lejana
    const farS = S * 0.8, period = 1700 * farS;
    for (let off = -((cx * 0.12 * S) % period + period) % period - period * 0.2; off < cssW; off += period) ctx.drawImage(SP.far.c, off, hz - SP.far.h * farS + 3, SP.far.w * farS, SP.far.h * farS);
    // Capa media
    const midY = hz + (baseY - hz) * 0.5;
    if (quality >= 2) {
      const mS = S * 0.8, mp = SP.mid.w * mS;
      for (let off = -((cx * 0.45 * S) % mp + mp) % mp; off < cssW; off += mp) ctx.drawImage(SP.mid.c, off, midY - SP.mid.h * mS, mp, SP.mid.h * mS);
    }
    // Olas lejanas y brillos
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.6;
    for (let row = 0; row < 3; row++) {
      const yy = hz + 10 + row * ((baseY - hz) / 3.2);
      ctx.beginPath();
      for (let px = -10; px <= cssW + 10; px += 14) { const wy = yy + Math.sin(px * 0.045 + t * (1.4 + row * 0.3) - cx * S * 0.02 * (row + 1)) * (1.5 + row); px === -10 ? ctx.moveTo(px, wy) : ctx.lineTo(px, wy); }
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let k = 0; k < 14; k++) {
      const px = ((k * 97 - cx * S * 0.6 + Math.sin(k) * 50) % cssW + cssW) % cssW, py = baseY + 18 + ((k * 53) % Math.max(20, cssH - baseY - 30));
      const tw = Math.sin(t * 3 + k * 1.7);
      if (tw > 0.2) ctx.fillRect(px, py, 10 * tw, 2);
    }

    // Mundo (pista)
    const k = S * dpr;
    ctx.setTransform(k, 0, 0, k, (-cx + shakeX) * k, (baseY + cy * S) * dpr);
    const L = cx - 160, Rr = cx + VIEW_W + 160;
    // boyas (en el agua, detrás)
    for (const m of C.markers) if (!m.cp && m.x > L && m.x < Rr) A.drawSprite(ctx, SP.buoy, m.x + 26, 6 + Math.sin(t * 2 + m.x) * 2);
    // torre y tobogán
    const tw = C.towers[0], sl = C.slides[0];
    if (sl.x1 > L && tw.x0 < Rr) { A.drawSprite(ctx, SP.slide, sl.x0, 0); A.drawSprite(ctx, SP.tower, tw.x0, tw.y); }
    // arcos (detrás del corredor)
    for (const cp of C.cps) if (cp.x > L - 100 && cp.x < Rr + 100) A.drawSprite(ctx, SP.arch[cp.n], cp.x, PLAT_Y - 6);
    if (C.finish.x > L - 150 && C.finish.x < Rr + 150) A.drawSprite(ctx, SP.finish, C.finish.x, PLAT_Y - 8);
    // plataformas y flotantes
    for (const g of C.ground) {
      if (g.x1 < L || g.x0 > Rr || g.kind === "tower") continue;
      const top = surfaceTop(g, t, W);
      const sq = squash.get(g.id) || 0;
      A.drawSprite(ctx, platSprite(g.x1 - g.x0, g.color), g.x0, top, 1, 1 - Math.sin((sq / 0.22) * Math.PI) * 0.06);
    }
    // podio
    if (podiumX > L - 200 && podiumX < Rr + 200) A.drawSprite(ctx, SP.podium, podiumX, PLAT_Y - 4);
    // trampolines
    for (const tr of C.tramps) if (tr.x > L && tr.x < Rr) { const sq = squash.get(tr.id) || 0; A.drawSprite(ctx, SP.tramp, tr.x, PLAT_Y + 26, 1, 1 - Math.sin((sq / 0.3) * Math.PI) * 0.35); }
    // rodillos
    for (const o of C.rollers) if (o.x > L && o.x < Rr) { const sc = W.easy.has(o.id) ? 0.82 : 1; A.drawSprite(ctx, SP.roller, o.x, PLAT_Y + o.r * sc, sc, sc, -t * 5); A.drawSprite(ctx, SP.gloss27, o.x, PLAT_Y + o.r * sc, sc, sc); }
    // barras barredoras
    for (const o of C.sweeps) if (o.x > L - o.len && o.x < Rr + o.len) drawSweep(ctx, o, t);
    // pelotas
    for (const b of balls) if (b.alive && b.x > L && b.x < Rr) { A.drawSprite(ctx, SP.ball, b.x, b.y + b.r, 1, 1, b.rot); A.drawSprite(ctx, SP.gloss32, b.x, b.y + b.r); }
    // fotos en burbujas
    for (const ph of C.photos) {
      if (G.photos.has(ph.i) || G.mode === "menu" || ph.x < L || ph.x > Rr) continue;
      const bob = Math.sin(t * 2.2 + ph.i) * 6, sp = SP.bubbles[ph.i] || SP.bubble;
      const glow = 0.3 + 0.2 * Math.sin(t * 4 + ph.i);
      ctx.fillStyle = `rgba(255,236,150,${glow})`; ctx.beginPath(); ctx.arc(ph.x, -(ph.y + bob), 40, 0, Math.PI * 2); ctx.fill();
      A.drawSprite(ctx, sp, ph.x, ph.y + bob);
    }
    // sombra del corredor
    if (G.mode !== "splash" && G.mode !== "podium") {
      const gi = groundAt(ride.x);
      if (gi >= 0) { const top = surfaceTop(C.ground[gi], t, W); const hgt = Math.max(0, ride.y - top); ctx.fillStyle = `rgba(27,31,59,${0.22 * Math.max(0.2, 1 - hgt / 220)})`; ctx.beginPath(); ctx.ellipse(ride.x, -top - 2, 18 * Math.max(0.4, 1 - hgt / 300), 5, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    particles.draw(ctx);
    // agua al frente (cubre la parte sumergida de los inflables)
    ctx.fillStyle = "rgba(46,196,182,.62)";
    ctx.beginPath(); ctx.moveTo(L, 60);
    for (let x = L; x <= Rr; x += 24) ctx.lineTo(x, -2 - Math.sin(x * 0.02 + t * 2.2) * 3);
    ctx.lineTo(Rr, 60); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2.2;
    ctx.beginPath(); for (let x = L; x <= Rr; x += 24) { const yy = -2 - Math.sin(x * 0.02 + t * 2.2) * 3; x === L ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();

    // ---- Capa del corredor (siempre por encima de la interfaz) ----
    const f = fctx;
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.clearRect(0, 0, cssW, cssH);
    f.setTransform(k, 0, 0, k, (-cx + shakeX) * k, (baseY + cy * S) * dpr);
    let a = 1, yOff = 0, anim = R.anim, extra = 0;
    if (G.mode === "splash") { yOff = -Math.min(60, G.modeT * 90); a = Math.max(0, 1 - G.modeT * 1.1); }
    if (s.invuln > 0 && G.mode === "race" && !G.invincible) a = 0.35 + 0.65 * (Math.floor(G.modeT * 12) % 2);
    if (anim === "flip") extra = Math.max(0, s.flip);
    poseFor(anim, R.t, pose, extra);
    drawRunner(f, ride.x, -(ride.y + yOff), 1, look, pose, a);
    if (guest) { poseFor(guest.anim, guest.t, pose); drawRunner(f, guest.x, -guest.y, 1, guest.look, pose, 1); }
    if (G.hitboxes) drawHitboxes(f, t);
  }

  function drawSweep(ctx, o, t) {
    const th = sweepAngle(o, t, W.easy.has(o.id));
    const e = Math.cos(th) * o.len, depth = Math.sin(th); // depth > 0: el extremo +e viene hacia la cámara
    const y = -(PLAT_Y + 16);
    const arm = (sx, near) => {
      const r = near ? 9 : 6.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = A.PAL.outline; ctx.lineWidth = r * 2 + 4; ctx.beginPath(); ctx.moveTo(o.x, y); ctx.lineTo(o.x + sx, y + (near ? 3 : -3)); ctx.stroke();
      ctx.strokeStyle = A.PAL.coral; ctx.lineWidth = r * 2; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, y - r * 0.45); ctx.lineTo(o.x + sx * 0.92, y - r * 0.45 + (near ? 3 : -3)); ctx.stroke();
      ctx.fillStyle = A.PAL.blue; ctx.beginPath(); ctx.arc(o.x + sx, y + (near ? 3 : -3), r + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = A.PAL.outline; ctx.stroke();
    };
    // extremo lejano, poste, extremo cercano
    arm(depth > 0 ? -e : e, false);
    A.drawSprite(ctx, SP.post, o.x, PLAT_Y + 2);
    arm(depth > 0 ? e : -e, true);
  }

  function drawHitboxes(f, t) {
    f.lineWidth = 1.5; f.strokeStyle = "#FF00AA";
    f.strokeRect(s.x - HIT.hw, -(s.y + HIT.y1), HIT.hw * 2, HIT.y1 - HIT.y0);
    f.strokeStyle = "#00B3FF";
    for (const o of C.rollers) { f.beginPath(); f.arc(o.x, -(PLAT_Y + o.r), o.r * (W.easy.has(o.id) ? 0.7 : 0.85), 0, Math.PI * 2); f.stroke(); }
    for (const b of balls) if (b.alive) { f.beginPath(); f.arc(b.x, -(b.y + b.r), b.r * 0.82, 0, Math.PI * 2); f.stroke(); }
    for (const o of C.sweeps) { const e = Math.abs(Math.cos(sweepAngle(o, t, W.easy.has(o.id)))) * o.len * 0.88; f.strokeRect(o.x - e, -(PLAT_Y + 26), e * 2, 22); }
    for (const ph of C.photos) { f.beginPath(); f.arc(ph.x, -ph.y, 36, 0, Math.PI * 2); f.stroke(); }
    f.strokeStyle = "#FFD400";
    for (const g of C.ground) { const top = surfaceTop(g, t, W); f.beginPath(); f.moveTo(g.x0, -top); f.lineTo(g.x1, -top); f.stroke(); }
  }

  /* ---------- Loop ---------- */
  let running = false, raf = 0, last = 0, acc = 0, fps = 60, fpsAcc = 0, fpsN = 0, slowFor = 0;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
    last = now;
    fpsAcc += dt; fpsN++;
    if (fpsAcc >= 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    // Calidad adaptativa: < 45 fps durante 2 s → menos partículas, parallax simple, DPR 1.5
    if (fps < 45 && quality > 1 && document.visibilityState === "visible") { slowFor += dt; if (slowFor > 2) { quality = 1; particles.setBudget(0.5); resize(); slowFor = 0; } } else slowFor = 0;
    if (!G.paused) {
      acc += dt * G.timeScale;
      let n = 0;
      while (acc >= DT && n < 6) { fixed(DT); acc -= DT; n++; }
      if (n >= 6) acc = 0;
    }
    render(Math.min(1, acc / DT), dt);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") api.stop(); else api.start(); });
  window.addEventListener("pagehide", () => api.stop());
  window.addEventListener("pageshow", () => api.start());
  particles.setBudget(reduced() ? 0.45 : 1);
  return api;
}
