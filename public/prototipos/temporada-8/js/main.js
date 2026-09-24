// Punto de entrada: carga, lobby, navegación, salto, XP, sonido y visitas repetidas.
import { demoData } from "./data.js";
import { h, $, sleep, syncReducedClass, prefersReduced, inviteTitle, eventInfo } from "./util.js";
import { state, QUESTS, XP_PER_QUEST } from "./state.js";
import { audio } from "./audio.js";
import { createFx } from "./particles.js";
import { createLobby } from "./lobby.js";
import { createRouter } from "./screens.js";
import { createMapScreen, zoneChipLabel } from "./zone.js";
import { createSquadScreen } from "./rsvp.js";
import { createDrop } from "./drop.js";
import { blockSVG, icon } from "./icons.js";
import { cloudSVG } from "./art.js";

syncReducedClass();

const app = $("#app");
const child = demoData.child;

/* ---------- Metadatos derivados de demoData ---------- */
document.title = `${inviteTitle()} · ¡Estás invitado!`;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) metaDesc.setAttribute("content", `${child.name} cumple ${child.age}. ${eventInfo().dateLong}, ${eventInfo().startTime} en ${demoData.event.venueName}. ¡Únete al escuadrón!`);

/* ---------- Mundo decorativo alrededor del marco (sólo visible en desktop) ---------- */
const world = $(".world");
if (world && window.innerWidth >= 560) {
  world.append(h("div.world-sun"));
  [[4, 12, 320, 0], [70, 62, 380, 1], [8, 70, 260, 2], [78, 18, 240, 0]].forEach(([x, y, w, v], i) => {
    world.append(h("div.world-cloud", { style: { left: `${x}%`, top: `${y}%`, width: `${w}px`, animationDelay: `${-i * 20}s` }, html: cloudSVG(v) }));
  });
  [[14, 40, 90, ["#C8F59E", "#9BE564", "#6FBF3E"]], [84, 44, 70, ["#FFE68A", "#FFD23F", "#E0A800"]], [22, 82, 56, ["#FFB3B3", "#FF6B6B", "#D94848"]], [74, 84, 80, ["#D9C7FF", "#B388FF", "#8A5CE0"]]].forEach(([x, y, s, c], i) => {
    world.append(h("div.world-block", { style: { left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 1.7}s` }, html: blockSVG(...c, { size: s }) }));
  });
}

/* ---------- Capas base ---------- */
const fxCanvas = h("canvas.fx-canvas", { "aria-hidden": "true" });
const toastRoot = h("div.toast-root", { "aria-live": "polite" });
const screensRoot = h("div.screens");
const fx = createFx(fxCanvas);

function toast(text, ms = 2600) {
  const t = h("div.toast", { text });
  toastRoot.replaceChildren(t);
  setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 400); }, ms);
}

/* ---------- Sonido ---------- */
// Preferencia: la guardada por el usuario o, si nunca la cambió, demoData.sound.enabledByDefault.
let soundOn = state.soundEnabled();

/** Cambio desde el botón del HUD (siempre es un gesto): fade de 0.3 s y se recuerda la preferencia. */
function applySound(on) {
  soundOn = on;
  if (on) audio.unlock();
  const ok = audio.setEnabled(on);
  if (on && !ok) soundOn = false;
  state.set({ sound: soundOn });
  lobby.setSound(soundOn);
  audio.music(soundOn && router.current() !== "salto");
}

/** Arranca el audio dentro del handler de un gesto (resume() del AudioContext). */
function startAudioFromGesture({ jingle = false } = {}) {
  if (!soundOn) return;
  if (!audio.unlock()) return;
  audio.setEnabled(true);
  if (jingle) audio.start();
  audio.music(router.current() !== "salto");
}

/**
 * Visitas repetidas: desbloqueo con el primer gesto en cualquier parte (listener global de una vez).
 * Se sigue escuchando touchend/click por si el navegador sólo desbloquea con esos eventos.
 */
function armUnlockOnFirstGesture() {
  const events = ["pointerdown", "touchend", "click", "keydown"];
  const cleanup = () => events.forEach((e) => window.removeEventListener(e, handler, true));
  function handler() {
    if (!soundOn || !audio.supported()) { cleanup(); return; }
    startAudioFromGesture();
    setTimeout(() => { if (audio.isUnlocked() || !audio.supported()) cleanup(); }, 120);
  }
  events.forEach((e) => window.addEventListener(e, handler, true));
}

/* ---------- Lobby ---------- */
const lobby = createLobby({
  onPlay: () => {
    lobby.playBtn.classList.remove("bounce");
    void lobby.playBtn.offsetWidth;
    lobby.playBtn.classList.add("bounce");
    setTimeout(() => router.navigate("salto"), prefersReduced() ? 0 : 200);
  },
  onOpen: (id) => { audio.blip(); router.navigate(id); },
  onToggleSound: () => { applySound(!soundOn); if (soundOn) audio.blip(); },
  onPhoto: () => photoMode(true),
  onEasterEgg: () => partyTime("¡Paso de baile desbloqueado!"),
  zoneLabel: zoneChipLabel
});

function avatarCenter() {
  const a = lobby.avatar.el.getBoundingClientRect();
  const r = app.getBoundingClientRect();
  return { x: a.left - r.left + a.width / 2, y: a.top - r.top + a.height * 0.35 };
}

function partyTime(msg) {
  lobby.avatar.dance(2600);
  const c = avatarCenter();
  fx.burst({ x: c.x, y: c.y, count: 70, power: 10 });
  audio.fanfare();
  if (msg) toast(msg);
}

/* ---------- Modo foto ---------- */
function photoMode(on) {
  app.classList.toggle("is-photo", on);
  lobby.photoMode(on);
  const old = $(".photo-exit", app);
  if (old) old.remove();
  if (on) {
    audio.pop();
    const exit = h("button.photo-exit", { type: "button", "aria-label": "Salir del modo foto", onclick: () => photoMode(false) },
      h("span", { text: "Toca la pantalla para salir" }));
    app.append(exit);
    exit.focus({ preventScroll: true });
  }
}

/* ---------- XP y subir de nivel ---------- */
let pendingXP = 0;
function gainQuest(id) {
  if (!state.visit(id)) return;
  pendingXP += XP_PER_QUEST;
  audio.xp();
  const pop = h("div.xp-pop.hud-text", { html: `${icon("star", { size: 26 })}<span>+${XP_PER_QUEST} XP</span>` });
  app.append(pop);
  setTimeout(() => pop.remove(), 1600);
}

function checkLevelUp() {
  if (!state.allDone() || state.get().leveledUp) return;
  state.set({ leveledUp: true });
  const banner = h("div.levelup", { role: "status" },
    h("div.levelup-rays"),
    h("p.levelup-title.hud-text", { html: "¡SUBISTE<br>DE NIVEL!" }),
    h("p.chip", { text: "Escuadrón desbloqueado" }));
  app.append(banner);
  audio.fanfare();
  lobby.avatar.dance(3200);
  fx.rain({ count: 100 });
  refreshSquadGlow();
  setTimeout(() => { banner.classList.add("is-out"); setTimeout(() => banner.remove(), 500); }, 2600);
}

function refreshSquadGlow() {
  const tab = router.tabbar.querySelector('[data-tab="escuadron"]');
  if (!tab) return;
  // "No podré asistir" también cuenta como respuesta: ya no se insiste con el brillo
  const glow = state.get().leveledUp && !state.get().rsvp;
  tab.classList.toggle("is-glow", glow);
  let badge = tab.querySelector(".tab-badge");
  if (!state.get().rsvp && !badge) tab.append(h("span.tab-badge", { "aria-hidden": "true" }));
  if (state.get().rsvp && badge) badge.remove();
}

/* ---------- Pantallas y navegación ---------- */
let mapScreen = null;
let squadScreen = null;
const router = createRouter({
  root: screensRoot,
  lobby,
  builders: {
    mapa: () => (mapScreen = createMapScreen()),
    escuadron: () => (squadScreen = createSquadScreen({
      app, fx,
      onJoined: () => { refreshSquadGlow(); lobby.avatar.dance(3000); }
    }))
  },
  onEnter: (id) => {
    if (QUESTS.includes(id) && id !== "salto") gainQuest(id);
    if (id === "lobby") {
      if (pendingXP) { lobby.renderXP(pendingXP); pendingXP = 0; } else lobby.renderXP();
      lobby.setZoneLabel(zoneChipLabel());
      lobby.showTooltip(!state.get().seenDrop);
      setTimeout(checkLevelUp, 700);
    }
    if (id !== "lobby") lobby.showTooltip(false);
    audio.music(soundOn && id !== "salto");
  }
});

const drop = createDrop({
  app, fx,
  onFinish: ({ perfect } = {}) => {
    state.set({ seenDrop: true });
    gainQuest("salto");
    // Bonus del planeador: el aviso "+100 XP" ya lo mostró la escena; aquí sólo se acumula
    if (perfect && state.visit("planeo")) pendingXP += XP_PER_QUEST;
  },
  onClose: () => router.navigate("lobby"),
  canEarnBonus: () => !state.hasBonus("planeo")
});
router.register("salto", {
  show: () => {
    app.classList.add("is-dropping");
    lobby.setCovered(true);
    drop.open();
  },
  hide: () => {
    app.classList.remove("is-dropping");
    drop.close();
  }
});

app.append(lobby.el, screensRoot, router.tabbar, fxCanvas, toastRoot);
lobby.setSound(soundOn);
// Sin Web Audio (o si falla) el botón de sonido se oculta y todo sigue funcionando
lobby.setSoundAvailable(audio.supported());
audio.onUnavailable(() => lobby.setSoundAvailable(false));
refreshSquadGlow();

/* ---------- Segundo plano: pestaña oculta, cambio de app, pantalla bloqueada ---------- */
function onBackground() {
  app.classList.add("paused");
  lobby.stop();
  audio.suspend(); // AudioContext.suspend(): música y efectos en pausa
}
function onForeground() {
  if (document.visibilityState === "hidden") return;
  app.classList.remove("paused");
  if (router.current() === "lobby") lobby.start();
  if (soundOn) {
    audio.resume(); // sólo reanuda si el sonido está activado y ya se desbloqueó
    audio.music(router.current() !== "salto");
  }
}
document.addEventListener("visibilitychange", () => (document.visibilityState === "hidden" ? onBackground() : onForeground()));
// Navegadores internos de apps (WhatsApp, Instagram, Facebook) a veces sólo emiten estos
window.addEventListener("pagehide", onBackground);
window.addEventListener("pageshow", onForeground);

/* ---------- Zona: refresco del chip ---------- */
setInterval(() => lobby.setZoneLabel(zoneChipLabel()), 30000);

const WAVES_SVG = `<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
  <path d="M5 12.5h5l7-6v19l-7-6H5z" fill="#FFF8EC" stroke="#1B2A6B" stroke-width="2.4" stroke-linejoin="round"/>
  <path class="wave w1" d="M21 12c1.5 1.4 1.5 6.6 0 8" fill="none" stroke="#FFF8EC" stroke-width="2.6" stroke-linecap="round"/>
  <path class="wave w2" d="M24.5 9c3 2.7 3 11.3 0 14" fill="none" stroke="#FFF8EC" stroke-width="2.6" stroke-linecap="round"/>
</svg>`;

/**
 * Pantalla "TOCA PARA EMPEZAR" (primera visita) sobre el mismo fondo de la carga.
 * El toque desbloquea el audio DENTRO del handler (resume del AudioContext), suena el "start"
 * y arranca la música del lobby con fade-in. Con el sonido apagado se muestra igual, sin audio.
 */
function runStart(screen) {
  const btn = h("button.btn.btn-yellow.start-btn", { type: "button" }, h("span", { text: "TOCA PARA EMPEZAR" }));
  const hint = h("p.start-hint", { hidden: !audio.supported() }, h("span.start-waves", { html: WAVES_SVG }), h("span", { text: "Mejor con sonido" }));
  screen.classList.add("is-start");
  screen.setAttribute("role", "dialog");
  screen.setAttribute("aria-label", "Toca para empezar");
  screen.replaceChildren(h("div.start-content",
    h("div.loading-cube", { html: blockSVG("#FFE68A", "#FFD23F", "#E0A800", { size: 70 }) }),
    h("h1.start-title.hud-text", { text: inviteTitle() }),
    btn, hint));
  btn.focus({ preventScroll: true });
  return new Promise((resolve) => {
    // Toda la pantalla es tocable; click cubre toque, ratón y Enter/Espacio sobre el botón
    const onTap = (e) => {
      e.preventDefault();
      screen.removeEventListener("click", onTap);
      startAudioFromGesture({ jingle: true });
      btn.classList.add("bounce");
      resolve();
    };
    screen.addEventListener("click", onTap);
  });
}

/* ---------- Pantalla de carga (sólo primera visita) ---------- */
async function runLoading({ withStart = false } = {}) {
  const bar = h("div.loading-bar", { role: "progressbar", "aria-label": "Cargando", "aria-valuemin": 0, "aria-valuemax": 100 }, ...Array.from({ length: 10 }, () => h("i")));
  const tip = h("p.loading-tip");
  const pct = h("span.loading-pct", { text: "0%" });
  const screen = h("div.loading", { role: "status" },
    h("div.loading-cube", { html: blockSVG("#FFE68A", "#FFD23F", "#E0A800", { size: 70 }) }),
    h("div.loading-logo",
      h("div.loading-name.hud-text", { text: child.name }),
      h("div.loading-badge", { text: `TEMPORADA ${child.age}` })),
    bar, pct, tip);
  app.append(screen);

  const tips = [...demoData.loadingTips].sort(() => Math.random() - 0.5);
  let ti = 0;
  tip.textContent = tips[0] || "";
  const tipTimer = setInterval(() => {
    tip.classList.add("is-fading");
    setTimeout(() => { ti = (ti + 1) % tips.length; tip.textContent = tips[ti]; tip.classList.remove("is-fading"); }, 300);
  }, 1500);

  // Precarga real: fuentes + foto del jugador
  const tasks = [];
  if (document.fonts && document.fonts.load) {
    tasks.push(document.fonts.load('400 40px "Lilita One"'), document.fonts.load('400 16px "Rubik"'), document.fonts.load('800 16px "Rubik"'), document.fonts.load('600 16px "Rubik"'));
  }
  tasks.push(new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = child.photo; }));
  let done = 0;
  const total = tasks.length;
  tasks.forEach((p) => Promise.resolve(p).catch(() => {}).finally(() => { done++; }));

  const MIN = 1800, MAX = 3500;
  const t0 = performance.now();
  const blocks = [...bar.children];
  await new Promise((resolve) => {
    const step = () => {
      const el = performance.now() - t0;
      const real = total ? done / total : 1;
      let shown = Math.min(real, el / MIN);
      if (el >= MAX) shown = 1;
      const n = Math.floor(shown * 10);
      blocks.forEach((b, i) => {
        if (i < n && !b.classList.contains("on")) { b.classList.add("on"); audio.pop(0.8 + i * 0.05); }
      });
      pct.textContent = `${Math.round(shown * 100)}%`;
      bar.setAttribute("aria-valuenow", Math.round(shown * 100));
      if ((real >= 1 && el >= MIN) || el >= MAX) {
        blocks.forEach((b) => b.classList.add("on"));
        pct.textContent = "100%";
        resolve();
      } else setTimeout(step, 60);
    };
    step();
  });
  clearInterval(tipTimer);
  await sleep(250);
  if (withStart) {
    await runStart(screen);
    await sleep(prefersReduced() ? 0 : 220);
  }
  screen.classList.add("is-done");
  await sleep(prefersReduced() ? 0 : 500);
  screen.remove();
}

/* ---------- Arranque ---------- */
async function boot() {
  const returning = state.isReturning();
  const params = new URLSearchParams(location.search);
  if (params.get("debug") === "1") {
    const { initDebug } = await import("./debug.js");
    initDebug({ app, router, lobby, drop, state, runLoading, refreshAll, levelUp: () => { state.set({ leveledUp: false }); checkLevelUp(); } });
  }

  if (!returning) {
    lobby.start();
    await runLoading({ withStart: true });
    lobby.showTooltip(!state.get().seenDrop);
  } else {
    lobby.start();
    lobby.showTooltip(!state.get().seenDrop);
    armUnlockOnFirstGesture();
    setTimeout(() => toast("¡Bienvenido de nuevo, jugador!"), 350);
  }
  // Guarda el registro para que la próxima visita sea "de regreso"
  state.set({});
  router.start();
}

function refreshAll() {
  lobby.setZoneLabel(zoneChipLabel());
  lobby.renderXP();
  mapScreen?.refresh();
  squadScreen?.refresh();
  refreshSquadGlow();
}

boot();
