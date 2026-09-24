// El salto: buscando partida → globo → caída → planeador → aproximación al mapa → aterrizaje → misión.
// Todo el movimiento es transform/opacity (DOM) o Canvas 2D.
// "TOCA PARA SALTAR" espera al usuario (con ayuda progresiva); el planeador se abre solo a 120 m.
import { demoData } from "./data.js";
import { h, $, clamp, lerp, easeIn, easeOut, easeInOut, easeOutElastic, easeOutBack, prefersReduced, vibrate } from "./util.js";
import { icon } from "./icons.js";
import { balloonSVG, diverSVG, gliderSVG, venueFrontSVG } from "./art.js";
import { createAvatar } from "./avatar.js";
import { mapSVG, zoneLayerSVG, pinSVG, pinPoint, MAP_SIZE } from "./map.js";
import { zoneState } from "./zone.js";
import { fitCanvas, quality } from "./particles.js";
import { missionCard } from "./screens.js";
import { audio } from "./audio.js";

// tilt: últimos ~0.6 s antes de tocar el suelo (la cámara pasa de cenital a frontal)
const T = { search: 1000, found: 700, fall: 2200, glide: 1300, approach: 2200, tilt: 650, land: 700, landAuto: 1200, victory: 850, reward: 1700 };
const GROUND_W = 400, GROUND_H = 320; // caja de diseño de la vista frontal; pies en el borde inferior
// Ayuda progresiva en "TOCA PARA SALTAR" (no avanza sola) y en el planeador
const HELP = { balloonHand: 3000, balloonUrge: 8000, glideHand: 2000 };
// Ventana del planeador: desde que aparece el texto (400 m) hasta 120 m
const GLIDE_TOP = 400, GLIDE_AUTO = 120, GLIDE_WINDOW_MS = 4200;
const MAX_V = 2600; // px/s de las nubes cercanas en caída libre
const ZOOM = 1.75;
const LAND_Y = 0.36; // posición vertical del aterrizaje (fracción de alto), visible sobre la tarjeta final
const LAND_SCALE = 0.62;

/* ---------- Sprites de nubes pre-renderizados ---------- */
function cloudSprite(variant, top, under) {
  const w = 320, hgt = 150;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = hgt;
  const c = cv.getContext("2d");
  const sets = [
    [[80, 92, 44], [140, 66, 58], [206, 84, 46], [256, 104, 30]],
    [[64, 98, 34], [112, 74, 46], [176, 62, 54], [236, 90, 40]],
    [[90, 88, 48], [160, 76, 52], [226, 98, 34]]
  ][variant];
  const draw = (dy, fill) => {
    c.fillStyle = fill;
    c.beginPath();
    for (const [x, y, r] of sets) { c.moveTo(x + r, y + dy); c.arc(x, y + dy, r, 0, Math.PI * 2); }
    c.fill();
    c.beginPath();
    c.roundRect ? c.roundRect(50, 96 + dy, 220, 40, 20) : c.rect(50, 96 + dy, 220, 40);
    c.fill();
  };
  draw(8, under);
  draw(0, top);
  c.globalAlpha = 0.55;
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.arc(sets[1][0] - 12, sets[1][1] - 18, sets[1][2] * 0.45, 0, Math.PI * 2);
  c.fill();
  return cv;
}

const HAND_SVG = `<svg viewBox="0 0 64 72" aria-hidden="true">
  <path d="M24 30V9a5 5 0 0110 0v17l3-1a5 5 0 016 3.5l.3 1.2 2.2-.7a5 5 0 016.2 3.6l.3 1 1.6-.4a4.6 4.6 0 015.6 4.3L60 50c0 11-8 19-19 19h-5c-7 0-12-3-16-9L9.5 44a5 5 0 017.6-6.4L24 44z" fill="#FFF8EC" stroke="#1B2A6B" stroke-width="3.6" stroke-linejoin="round"/>
  <path d="M34 26v10M45.5 29.5V38M55.5 34.5V40" stroke="#1B2A6B" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export function createDrop({ app, fx, onFinish, onClose, canEarnBonus = () => true }) {
  const child = demoData.child;
  const colors = child.avatarColors;
  const ev = demoData.event;

  /* ---------- DOM ---------- */
  const sky = h("div.drop-sky");
  const skyDay = h("div.drop-sky-day");
  const sun = h("div.drop-sun");
  const mapEl = h("div.drop-map",
    h("div.map-layer", { html: mapSVG(ev.mapPin) }),
    h("div.map-layer", { html: zoneLayerSVG(ev.mapPin, Math.round(zoneState().radius), { animated: false }) }),
    h("div.map-layer.map-pin", { html: pinSVG(ev.mapPin) }));
  const mapPinEl = $(".map-pin", mapEl);
  const canvas = h("canvas.drop-clouds");
  const balloon = h("div.drop-balloon", h("div.drop-balloon-bob", { html: balloonSVG(colors) }));
  const glider = h("div.drop-glider", { html: gliderSVG(colors) });
  const diverImg = h("div.drop-diver-img", { html: diverSVG(colors) });
  const sparkles = h("div.drop-sparkles", ...Array.from({ length: 10 }, (_, i) => {
    const s = h("i");
    s.style.setProperty("--a", `${i * 36 + (i % 2) * 12}deg`);
    s.style.setProperty("--d", `${(i % 3) * 40}ms`);
    return s;
  }));
  const diver = h("div.drop-diver", glider, diverImg, sparkles);

  // Vista frontal a nivel de suelo: salón de frente y el personaje de pie (avatar de bloques del lobby)
  const groundAv = createAvatar(colors, { unit: 4.4, tilt: -4, angle: -14, label: `${child.name} aterrizó frente al salón` });
  const avWrap = h("div.ground-avatar", groundAv.el);
  const groundSet = h("div.ground-set",
    h("div.ground-art", { html: venueFrontSVG(ev.venueName) }),
    h("div.ground-glow", h("i")),
    avWrap);
  const groundFloor = h("div.ground-floor");
  const ground = h("div.drop-ground", h("div.ground-sky"), groundFloor, groundSet);

  const cam = h("div.drop-cam", sky, sun, skyDay, mapEl, canvas, ground, balloon, diver);

  const altNum = h("b.alti-num.display", { text: "1000" });
  const altFill = h("i.alti-fill");
  const alti = h("div.alti", { "aria-hidden": "true" },
    h("span.alti-label", { text: "ALTITUD" }),
    h("div.alti-row", altNum, h("span.alti-unit.display", { text: "m" })),
    h("div.alti-bar", altFill));
  const skipBtn = h("button.drop-skip", { type: "button", "aria-label": "Omitir la secuencia", html: `<span>Omitir</span>${icon("skip", { size: 18 })}`, onclick: () => skip() });
  const prompt = h("p.drop-prompt.hud-text", { "aria-live": "assertive" });
  const hand = h("div.drop-hand", { html: HAND_SVG, "aria-hidden": "true" });
  const alert = h("p.drop-alert", { role: "status", html: `<span class="drop-alert-ic" aria-hidden="true">!</span><span>PLANEADOR AUTOMÁTICO</span>` });
  const rewardXp = h("span.chip.reward-xp.display");
  const reward = h("div.drop-reward", { role: "status", hidden: true },
    h("p.reward-title.hud-text", { html: "¡ATERRIZAJE<br>PERFECTO!" }), rewardXp);
  const landedText = h("p.landed.hud-text", { text: "¡ATERRIZAJE PERFECTO!" });
  const searchText = h("p.search-text.display", { text: "Buscando partida…" });
  const search = h("div.drop-search",
    h("div.search-spinner", h("i"), h("i"), h("i"), h("i")),
    searchText,
    h("p.search-sub", { text: `${child.gamertag} · Escuadrón de 1` }));
  const tap = h("button.drop-tap", { type: "button", "aria-label": "Tocar para continuar", onpointerdown: (e) => { e.preventDefault(); onTap(); }, onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } } });

  const cardWrap = h("div.drop-card", { hidden: true },
    landedText,
    missionCard({
      cls: "drop-mission",
      actions: [
        h("a.btn.btn-sky", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", html: `${icon("route", { size: 24 })}<span>Cómo llegar</span>` }),
        h("button.btn.btn-yellow", { type: "button", html: `<span>Volver al lobby</span>`, onclick: () => { audio.blip(); onClose(); } })
      ]
    }));

  const el = h("div.drop", { role: "dialog", "aria-modal": "true", "aria-label": "Secuencia de salto", hidden: true },
    cam, tap, h("div.drop-hud", skipBtn, alti, alert, hand, prompt), reward, search, cardWrap);
  app.append(el);

  /* ---------- Estado de la escena ---------- */
  let W = 0, H = 0, S = 0, pinOff = { x: 0, y: 0 };
  let cv = null, sprites = null, clouds = [], lines = [];
  let raf = 0, running = false, prevT = 0;
  let phase = "idle", pt = 0, scene = 0; // pt: ms en la fase actual
  let v = 0, vGlideStart = 0, alt = 1000, altFrom = 1000, rm = false;
  let shake = 0;
  let feetY = 0, gs = 1; // línea de los pies en la vista frontal (px) y escala del escenario
  let perfect = false; // tocó el planeador dentro de la ventana
  let autoGlide = false; // el planeador se abrió solo (aterrizaje más brusco)

  function layout() {
    const r = el.getBoundingClientRect();
    W = r.width; H = r.height;
    S = Math.max(W, H) * 1.05;
    Object.assign(mapEl.style, { width: `${S}px`, height: `${S}px`, left: `${(W - S) / 2}px`, top: `${(H - S) / 2}px` });
    const p = pinPoint(ev.mapPin);
    pinOff = { x: (p.x / MAP_SIZE - 0.5) * S, y: (p.y / MAP_SIZE - 0.5) * S };
    cv = fitCanvas(canvas);
    groundLayout();
  }

  /**
   * Composición de la vista frontal: el personaje y el salón quedan por encima de la tarjeta
   * final y de su texto. Se mide la tarjeta real para calcular dónde van los pies.
   */
  function groundLayout() {
    const wasHidden = cardWrap.hidden;
    cardWrap.hidden = false;
    cardWrap.style.visibility = "hidden";
    const cardH = cardWrap.getBoundingClientRect().height;
    cardWrap.hidden = wasHidden;
    cardWrap.style.visibility = "";
    const textTop = H - cardH + 60; // .drop-card tiene 60px de degradado antes del texto
    const hudBottom = (parseFloat(getComputedStyle(el).getPropertyValue("--sat")) || 0) + 70;
    feetY = clamp(textTop - 12, H * 0.3, H * 0.62);
    gs = clamp(Math.min((feetY - hudBottom) / (GROUND_H - 20), (W - 12) / GROUND_W), 0.5, 1.3);
    groundSet.style.top = `${feetY}px`;
    groundSet.style.transform = `translate(-50%, -100%) scale(${gs.toFixed(3)})`;
    groundFloor.style.top = `${(feetY - 28 * gs).toFixed(1)}px`; // horizonte = base del edificio
    ground.style.transformOrigin = `50% ${feetY}px`;
    reward.style.top = `${Math.round(feetY + 18)}px`;
  }

  function seedClouds() {
    if (!sprites) {
      sprites = [0, 1, 2].map((i) => cloudSprite(i, "#FFF4EA", "#E9C3E6"));
      sprites.push(...[0, 1, 2].map((i) => cloudSprite(i, "#FFFFFF", "#D7DDF7")));
    }
    clouds = [];
    const n = Math.round((rm ? 14 : 30) * quality.value);
    for (let i = 0; i < n; i++) {
      const depth = 0.35 + Math.random() * 1.3;
      // Mar de nubes: la mayoría en la franja inferior al inicio
      const sea = i < n * 0.7;
      clouds.push(makeCloud(depth, sea ? H * (0.62 + Math.random() * 0.5) : H * (0.05 + Math.random() * 0.5), true));
    }
    clouds.sort((a, b) => a.depth - b.depth);
    lines = Array.from({ length: Math.round(22 * quality.value) }, () => ({ x: Math.random() * W, y: Math.random() * H, len: 60 + Math.random() * 140, k: 0.8 + Math.random() * 0.8 }));
  }
  function makeCloud(depth, screenY, sunset) {
    const size = 160 + depth * 190 + Math.random() * 60;
    return {
      depth, x: Math.random() * (W + size) - size / 2, y: screenY, size,
      sprite: sprites[(sunset ? 0 : 3) + ((Math.random() * 3) | 0)],
      alpha: depth > 1.2 ? 0.8 : 0.95, vx: (Math.random() - 0.5) * 8, open: 0
    };
  }

  function drawClouds(dt) {
    const { ctx } = cv;
    ctx.clearRect(0, 0, W, H);
    const s = dt / 1000;
    const respawn = phase === "fall" || phase === "glideWait" || phase === "glide";
    const opening = phase === "approach" || phase === "land" || phase === "reward" || phase === "card";
    for (const c of clouds) {
      c.y -= v * c.depth * 0.55 * s;
      c.x += c.vx * s;
      if (opening) {
        const dir = c.x + c.size / 2 < W / 2 ? -1 : 1;
        c.open = Math.min(1, c.open + s * 0.9);
        c.x += dir * (200 + 900 * c.open) * s * (0.6 + c.depth * 0.4);
      }
      const hgt = c.size * 0.47;
      if (c.y < -hgt - 20 && respawn) {
        c.y = H + Math.random() * H * 0.5;
        c.x = Math.random() * (W + c.size) - c.size / 2;
        c.sprite = sprites[(phase === "fall" && pt < 1100 ? 0 : 3) + ((Math.random() * 3) | 0)];
      }
      if (c.y > H + 40 || c.y < -hgt - 40) continue;
      const a = c.alpha * (opening ? 1 - c.open * 0.85 : 1);
      if (a <= 0.02) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(c.sprite, c.x, c.y, c.size, hgt);
    }
    // Líneas de velocidad
    const speedK = clamp((v - 900) / (MAX_V - 900), 0, 1);
    if (speedK > 0 && !rm) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineCap = "round";
      ctx.lineWidth = 2.2;
      for (const l of lines) {
        l.y -= v * 1.6 * l.k * s;
        if (l.y + l.len < 0) { l.y = H + Math.random() * 200; l.x = Math.random() * W; }
        ctx.globalAlpha = 0.45 * speedK * l.k;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + l.len * (0.6 + speedK));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Fases ---------- */
  function setPrompt(text) {
    prompt.textContent = text || "";
    prompt.classList.toggle("is-on", !!text);
  }

  function setHelp({ hand: showHand = false, peek = false, urge = false } = {}) {
    hand.classList.toggle("is-on", showHand);
    balloon.classList.toggle("is-peek", peek && !rm);
    prompt.classList.toggle("is-urge", urge && !rm);
  }

  function showAlert() {
    alert.classList.remove("is-on");
    void alert.offsetWidth;
    alert.classList.add("is-on");
    clearTimeout(showAlert._t);
    showAlert._t = setTimeout(() => alert.classList.remove("is-on"), 2200);
  }

  function go(next, opts = {}) {
    phase = next;
    pt = 0;
    el.dataset.phase = next;
    setHelp();
    if (next === "search") {
      searchText.textContent = "Buscando partida…";
      search.classList.remove("is-found");
      search.hidden = false;
      setPrompt("");
    } else if (next === "balloon") {
      search.classList.add("is-out");
      setTimeout(() => { search.hidden = true; search.classList.remove("is-out"); }, 400);
      setPrompt("TOCA PARA SALTAR");
      tap.focus({ preventScroll: true });
    } else if (next === "fall") {
      setPrompt("");
      audio.whoosh();
      audio.windStart();
      diver.style.opacity = "1";
      balloon.classList.add("is-empty");
    } else if (next === "glideWait") {
      setPrompt("TOCA PARA ABRIR EL PLANEADOR");
    } else if (next === "glide") {
      setPrompt("");
      vGlideStart = v;
      altFrom = alt;
      autoGlide = !!opts.auto;
      perfect = !opts.auto;
      audio.fwoosh();
      audio.windLevel(0.45);
      vibrate(25);
      glider.style.opacity = "1";
      if (autoGlide) showAlert();
      else {
        // Destellos alrededor del personaje como recompensa por tocar a tiempo
        sparkles.classList.remove("is-on");
        void sparkles.offsetWidth;
        sparkles.classList.add("is-on");
        audio.xp();
      }
    } else if (next === "approach") {
      altFrom = alt;
      mapEl.style.opacity = "1";
      mapEl.style.willChange = "transform";
    } else if (next === "tilt") {
      // La cámara baja al nivel del suelo; el planeador se pliega con un "pop"
      altFrom = alt;
      ground.style.visibility = "visible";
      avWrap.style.opacity = "0";
      audio.pop(0.7);
    } else if (next === "land") {
      audio.windStop();
      audio.thud();
      if (autoGlide) setTimeout(() => audio.thud(), 260); // segundo golpe del tambaleo
      vibrate(autoGlide ? [60, 30, 40] : 45);
      shake = rm ? 0 : autoGlide ? 1.4 : 0.8;
      diver.style.opacity = "0";
      ground.style.transform = "";
      ground.style.opacity = "1";
      mapEl.style.opacity = "0";
      avWrap.style.opacity = "1";
      // Anillo de polvo de bloques alrededor de los pies
      fx.dust({ x: W / 2, y: feetY - 2, ring: true, count: autoGlide ? 110 : 54, spread: autoGlide ? 1.35 : 1 });
      // Rodillas flexionadas al tocar el suelo
      avWrap.classList.add("is-crouch");
      setTimeout(() => avWrap.classList.remove("is-crouch"), 200);
      alt = 0;
      altNum.textContent = "0";
    } else if (next === "reward") {
      rewardXp.innerHTML = canEarnBonus() ? `${icon("star", { size: 22 })}<span>+100 XP</span>` : `${icon("star", { size: 22 })}<span>¡Otra vez!</span>`;
      reward.hidden = false;
      void reward.offsetWidth;
      reward.classList.add("is-in");
      audio.fanfareShort();
      vibrate([20, 40, 20]);
    } else if (next === "card") {
      finalFrame();
      setPrompt("");
      reward.classList.remove("is-in");
      reward.hidden = true;
      landedText.textContent = perfect ? "¡ATERRIZAJE PERFECTO!" : "¡ATERRIZASTE!";
      cardWrap.hidden = false;
      requestAnimationFrame(() => cardWrap.classList.add("is-in"));
      audio.pop(0.8);
      onFinish?.({ perfect });
      setTimeout(() => $(".drop-mission .btn-yellow", cardWrap)?.focus({ preventScroll: true }), 400);
    }
  }

  /** Pose de victoria (~0.8 s) y luego idle respirando. */
  function victory() {
    groundAv.el.classList.remove("is-victory");
    void groundAv.el.offsetWidth;
    groundAv.el.classList.add("is-victory");
    clearTimeout(victory._t);
    victory._t = setTimeout(() => groundAv.el.classList.remove("is-victory"), T.victory);
  }

  /** Vista frontal en reposo (personaje de pie, sin transiciones). */
  function groundRest() {
    ground.style.visibility = "visible";
    ground.style.opacity = "1";
    ground.style.transform = "";
    avWrap.style.opacity = "1";
    avWrap.style.transform = "";
    mapEl.style.opacity = "0";
    diver.style.opacity = "0";
  }

  function onTap() {
    audio.unlock();
    if (phase === "balloon" && pt > 120) go(rm ? "rmFade" : "fall");
    else if (phase === "glideWait") go("glide", { auto: false });
    else if (phase === "search" && pt > 600) go("balloon");
  }

  function skip() {
    audio.blip();
    audio.windStop();
    if (phase === "card") return;
    perfect = false; // omitir no da bonus
    go("card");
  }

  /** Estado visual final (usado al saltar o terminar). */
  function finalFrame() {
    v = 0;
    shake = 0;
    search.hidden = true;
    balloon.style.opacity = "0";
    sky.style.opacity = "0";
    sun.style.opacity = "0";
    skyDay.style.opacity = "1";
    mapPinEl.style.opacity = "0";
    setMap(1);
    glider.style.opacity = "0";
    groundRest();
    for (const c of clouds) c.open = 1;
    cam.style.transform = "";
    alt = 0;
    altNum.textContent = "0";
    altFill.style.transform = "scaleY(0)";
    if (cv) cv.ctx.clearRect(0, 0, W, H);
  }

  /** p: 0 (mapa bajo la pantalla) → 1 (zoom sobre el salón). pre: transform extra (inclinación). */
  function setMap(p, pre = "") {
    const p1 = easeOut(clamp(p / 0.42, 0, 1));
    const p2 = easeInOut(clamp((p - 0.22) / 0.78, 0, 1));
    const sRise = lerp(0.72, 1, p1);
    const s = lerp(sRise, ZOOM, p2);
    const tx = lerp(0, -pinOff.x * ZOOM, p2);
    const ty = lerp(H * 1.05, 0, p1) + lerp(0, H * (LAND_Y - 0.5) - pinOff.y * ZOOM, p2);
    mapEl.style.transform = `${pre}translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
  }

  function frame(t) {
    // Tope de 100 ms: en equipos lentos la escena no se alarga demasiado ni da saltos bruscos
    const dt = Math.min(100, prevT ? t - prevT : 16);
    prevT = t;
    pt += dt;
    scene += dt;
    const s = scene / 1000;
    let diverY = 0, diverX = 0, diverRot = 0, diverScale = 1, balloonY = 0;

    switch (phase) {
      case "search":
        if (pt > T.search && !search.classList.contains("is-found")) {
          search.classList.add("is-found");
          searchText.textContent = "¡Partida encontrada!";
          audio.pop(1.3);
        }
        if (pt > T.search + T.found) go("balloon");
        v = 0;
        break;
      case "balloon":
        // Sin avance automático: espera el toque (o "Omitir") con ayuda progresiva
        v = 0;
        setHelp({ hand: pt > HELP.balloonHand, peek: pt > HELP.balloonHand, urge: pt > HELP.balloonUrge });
        break;
      case "rmFade": {
        // Movimiento reducido: fundido directo a la vista frontal con el personaje de pie
        const p = clamp(pt / 900, 0, 1);
        if (pt === dt) { groundRest(); ground.style.opacity = "0"; }
        balloon.style.opacity = String(1 - p);
        sky.style.opacity = String(1 - p);
        ground.style.opacity = String(p);
        if (p >= 1) go("card");
        break;
      }
      case "fall": {
        const p = clamp(pt / T.fall, 0, 1);
        v = lerp(0, MAX_V, easeIn(clamp(pt / 800, 0, 1)));
        balloonY = -easeIn(clamp(pt / 900, 0, 1)) * H * 1.1;
        const pIn = easeOutBack(clamp(pt / 750, 0, 1));
        diverY = lerp(-H * 0.05, 0, pIn);
        diverScale = lerp(0.55, 1, pIn);
        diverRot = lerp(-40, 0, pIn) + Math.sin(s * 9) * 4;
        diverX = Math.sin(s * 3) * 6;
        alt = lerp(1000, 400, easeInOut(p));
        shake = 0.35 * (v / MAX_V);
        sky.style.opacity = String(1 - clamp((pt - 900) / 1300, 0, 0.7));
        skyDay.style.opacity = String(clamp((pt - 1000) / 1200, 0, 1));
        audio.windLevel(v / MAX_V);
        if (p >= 1) go("glideWait");
        break;
      }
      case "glideWait":
        v = MAX_V * 0.92;
        alt = lerp(GLIDE_TOP, GLIDE_AUTO, clamp(pt / GLIDE_WINDOW_MS, 0, 1));
        diverRot = Math.sin(s * 9) * 4;
        diverX = Math.sin(s * 3) * 6;
        shake = 0.32;
        balloonY = -H * 1.2;
        setHelp({ hand: pt > HELP.glideHand });
        if (alt <= GLIDE_AUTO) go("glide", { auto: true });
        break;
      case "glide": {
        const p = clamp(pt / T.glide, 0, 1);
        // Apertura automática: frenado más seco (menos elástico)
        const e = autoGlide ? easeOut(clamp(pt / 700, 0, 1)) : easeOutElastic(clamp(pt / 1000, 0, 1));
        v = lerp(vGlideStart, 380, e);
        const g = easeOutElastic(clamp(pt / 800, 0, 1));
        glider.style.transform = `translate3d(-50%, 0, 0) scale(${Math.max(0, g).toFixed(3)})`;
        diverY = -50 * Math.exp(-4 * p) * Math.sin(p * 10);
        diverRot = Math.sin(s * 2.2) * 6;
        diverX = Math.sin(s * 1.4) * 10;
        alt = lerp(altFrom, altFrom * 0.55, easeOut(p));
        shake = 0.3 * (1 - p);
        balloonY = -H * 1.2;
        if (p >= 1) go("approach");
        break;
      }
      case "approach": {
        const p = clamp(pt / T.approach, 0, 1);
        v = lerp(380, 60, p);
        setMap(p);
        const pd = easeInOut(p);
        diverY = lerp(0, H * (LAND_Y - 0.42), pd);
        diverScale = lerp(1, LAND_SCALE, pd);
        diverRot = Math.sin(s * 2.2) * 6 * (1 - p);
        diverX = Math.sin(s * 1.4) * 10 * (1 - p);
        skyDay.style.opacity = "1";
        sky.style.opacity = "0";
        // Al final el jugador se convierte en el marcador del salón
        mapPinEl.style.opacity = String(1 - clamp((p - 0.6) / 0.3, 0, 1));
        alt = lerp(altFrom, 12, easeIn(p) * 0.4 + p * 0.6);
        shake = 0;
        balloonY = -H * 1.2;
        if (p >= 1) go("tilt");
        break;
      }
      case "tilt": {
        // Cenital → frontal: el mapa se inclina y se desvanece, la escena frontal "se levanta"
        const p = clamp(pt / T.tilt, 0, 1);
        const e = easeInOut(p);
        setMap(1, `perspective(800px) rotateX(${(58 * e).toFixed(2)}deg) `);
        mapEl.style.opacity = String(1 - clamp((p - 0.25) / 0.6, 0, 1));
        ground.style.opacity = String(clamp(p / 0.55, 0, 1));
        ground.style.transform = `perspective(900px) rotateX(${lerp(-62, 0, e).toFixed(2)}deg) translate3d(0, ${lerp(H * 0.18, 0, e).toFixed(1)}px, 0)`;
        // Diver cenital se desvanece; el planeador se pliega con un "pop"
        diverY = H * (LAND_Y - 0.42);
        diverScale = LAND_SCALE * (1 - 0.3 * e);
        diver.style.opacity = String(1 - clamp(p / 0.4, 0, 1));
        const gp = clamp(p / 0.35, 0, 1);
        const gScale = gp < 0.35 ? 1 + 0.25 * (gp / 0.35) : Math.max(0, 1.25 * (1 - (gp - 0.35) / 0.65));
        glider.style.transform = `translate3d(-50%, 0, 0) scale(${gScale.toFixed(3)})`;
        // Personaje de pie cae desde arriba y toca el suelo justo al terminar
        const fp = clamp((p - 0.15) / 0.85, 0, 1);
        avWrap.style.opacity = fp > 0 ? "1" : "0";
        avWrap.style.transform = `translate3d(0, ${(-(feetY * 0.55) / gs * (1 - easeIn(fp))).toFixed(1)}px, 0) scale(.94, 1.08)`;
        alt = lerp(altFrom, 0, p);
        v = 0;
        balloonY = -H * 1.2;
        if (p >= 1) go("land");
        break;
      }
      case "land": {
        // De pie: squash & stretch; en el automático, además un tambaleo cómico
        const dur = autoGlide ? T.landAuto : T.land;
        const t = pt / 1000;
        const amp = autoGlide ? 0.3 : 0.22;
        const sy = 1 - amp * Math.exp(-7 * t) * Math.cos(16 * t);
        const sx = 1 + (1 - sy) * 0.6;
        const rot = autoGlide ? 15 * Math.exp(-3 * t) * Math.sin(11 * t) : 0;
        avWrap.style.transform = `rotate(${rot.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        v = 0;
        balloonY = -H * 1.2;
        shake = Math.max(0, shake - dt / 380);
        if (pt >= dur) {
          avWrap.style.transform = "";
          victory();
          go(perfect ? "reward" : "card");
        }
        break;
      }
      case "reward":
        v = 0;
        shake = 0;
        balloonY = -H * 1.2;
        if (pt > T.reward) go("card");
        break;
      default:
        break;
    }

    if (phase !== "card" && phase !== "idle") {
      if (phase !== "rmFade") {
        diver.style.transform = `translate3d(${diverX.toFixed(1)}px, ${diverY.toFixed(1)}px, 0) rotate(${diverRot.toFixed(2)}deg) scale(${diverScale.toFixed(3)})`;
        balloon.style.transform = `translate3d(0, ${balloonY.toFixed(1)}px, 0)`;
      }
      const shown = Math.max(0, Math.round(alt));
      if (altNum.textContent !== String(shown)) altNum.textContent = String(shown);
      altFill.style.transform = `scaleY(${(alt / 1000).toFixed(3)})`;
      const mag = rm ? 0 : shake * (phase === "land" ? 10 : 5);
      cam.style.transform = mag > 0.05
        ? `translate3d(${((Math.random() - 0.5) * mag).toFixed(1)}px, ${((Math.random() - 0.5) * mag).toFixed(1)}px, 0)`
        : "";
    }
    if (cv && phase !== "card") drawClouds(dt);

    if (running) raf = requestAnimationFrame(frame);
  }

  function resetVisuals() {
    for (const n of [sky, sun, balloon]) n.style.opacity = "1";
    skyDay.style.opacity = "0";
    mapEl.style.opacity = "0";
    mapEl.style.willChange = "";
    mapPinEl.style.opacity = "1";
    balloon.classList.remove("is-empty");
    ground.style.visibility = "hidden";
    ground.style.opacity = "0";
    ground.style.transform = "";
    avWrap.style.opacity = "0";
    avWrap.style.transform = "";
    avWrap.classList.remove("is-crouch");
    groundAv.el.classList.remove("is-victory");
    setMap(0);
    diver.style.opacity = "0";
    diver.style.transform = "";
    diverImg.style.transform = "";
    glider.style.opacity = "0";
    glider.style.transform = "translate3d(-50%, 0, 0) scale(0)";
    balloon.style.transform = "";
    cam.style.transform = "";
    cardWrap.hidden = true;
    cardWrap.classList.remove("is-in");
    alt = 1000; altNum.textContent = "1000"; altFill.style.transform = "scaleY(1)";
    v = 0; shake = 0; perfect = false; autoGlide = false;
    sparkles.classList.remove("is-on");
    alert.classList.remove("is-on");
    reward.classList.remove("is-in");
    reward.hidden = true;
    setHelp();
  }

  function onVis() {
    if (document.visibilityState === "hidden") { running = false; cancelAnimationFrame(raf); }
    else if (!el.hidden && !running) { running = true; prevT = 0; raf = requestAnimationFrame(frame); }
  }

  let closeT = 0;
  return {
    el,
    open() {
      // Si se vuelve a jugar justo después de cerrar, el cierre pendiente no debe ocultar la escena
      clearTimeout(closeT);
      rm = prefersReduced();
      el.hidden = false;
      el.classList.toggle("is-rm", rm);
      layout();
      resetVisuals();
      seedClouds();
      scene = 0;
      void el.offsetWidth;
      el.classList.add("is-open");
      go("search");
      running = true;
      prevT = 0;
      raf = requestAnimationFrame(frame);
      window.addEventListener("resize", layout);
      document.addEventListener("visibilitychange", onVis);
    },
    close() {
      running = false;
      cancelAnimationFrame(raf);
      audio.windStop();
      el.classList.remove("is-open");
      window.removeEventListener("resize", layout);
      document.removeEventListener("visibilitychange", onVis);
      mapEl.style.willChange = "";
      clearTimeout(closeT);
      closeT = setTimeout(() => { el.hidden = true; phase = "idle"; }, rm ? 0 : 350);
    },
    /** Para depuración: saltar directo a la tarjeta final */
    toCard() { skip(); }
  };
}
