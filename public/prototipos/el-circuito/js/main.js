// El Circuito — arranque y orquestación: carga, "TOCA PARA EMPEZAR", menú, tutorial, semáforo, carrera,
// puntos de control, meta, confirmación, hoja de info, pausa, sonido, visitas repetidas y debug.
import { demoData } from "./data.js";
import { h, $, sleep, bib, prefersReduced, syncReducedClass, vibrate } from "./util.js";
import { state, DEMO } from "./state.js";
import { audio } from "./audio.js";
import { createGame } from "./game/game.js";
import { icon, banner, popText, toast } from "./ui/content.js";
import { createLoading, showStart, createMenu, tutorialPrompt, runCountdown, miniCount } from "./ui/start.js";
import { createHud, pauseMenu, skipButton } from "./ui/hud.js";
import { openCheckpointCard } from "./ui/checkpoint-card.js";
import { openFinish } from "./ui/finish.js";
import { openInfo } from "./ui/info-sheet.js";
import { createRsvpForm, celebrate, farewell } from "./ui/rsvp.js";
import { guestLook } from "./ui/avatar.js";

syncReducedClass();
const params = new URLSearchParams(location.search);
const DEBUG = params.get("debug") === "1";
const app = $("#app"), ui = $("#ui");
const cover = (v) => app.classList.toggle("is-cover", v);

/* ---------- Carga (fuentes + sprite cache), mínimo 1.2 s ---------- */
const loading = createLoading(ui);
const t0 = performance.now();
let shown = 0;
const setP = (p) => { shown = Math.max(shown, p); loading.set(Math.min(shown, (performance.now() - t0) / 1200)); };
const progTimer = setInterval(() => setP(shown), 80);
try {
  if (document.fonts?.load) await Promise.race([Promise.all(['400 30px "Titan One"', '400 16px "Outfit"', '800 16px "Outfit"', '600 16px "Outfit"'].map((f) => document.fonts.load(f))), sleep(3500)]);
} catch { /* seguimos con las fuentes del sistema */ }
setP(0.3);

let soundOn = state.soundEnabled();
let currentAuto = false, racing = false, sessionTutorial = false;
let finishSheet = null, skipBtn = null, rsvpSheetClose = null;

const game = await createGame({
  worldCanvas: $("#world"), fgCanvas: $("#fg"), data: demoData, bibText: bib(), audio, reduced: prefersReduced,
  onProgress: (p) => setP(0.3 + p * 0.65),
  cb: {
    onTutorialDone: async () => {
      tut?.hide(); tut = null;
      popText(ui, "¡Así se hace!", "is-good");
      state.set({ tutorialSeen: true }); sessionTutorial = true;
      await sleep(1000);
      countdown(false, { fromTutorial: true });
    },
    onCheckpointBanner: (n) => { banner(ui, "¡PUNTO DE CONTROL!", `${n} de 4`, 1200); audio.duck(true); vibrate(40); },
    onCheckpoint: (n) => {
      game.setCardOpen(true);
      openCheckpointCard(ui, n, {
        audio, auto: game.auto,
        onContinue: async () => { game.setCardOpen(false); audio.duck(false); game.resumeFromCard(); await miniCount(ui, audio); }
      });
    },
    onSplash: () => { popText(ui, "¡SPLASH!", "is-water"); vibrate([20, 30, 20]); },
    onPhoto: (i, count) => {
      const p = h("div.polaroid-pop", { "aria-hidden": "true" }, h("img", { src: demoData.gallery[i].src, alt: "" }), h("b", { text: `¡Foto ${count}/${demoData.gallery.length}!` }));
      ui.append(p); setTimeout(() => p.remove(), 1950);
    },
    onSkipAvailable: (v) => {
      skipBtn?.remove(); skipBtn = null;
      if (v && !game.auto) skipBtn = skipButton(ui, () => { skipBtn = null; audio.tap(); game.skipObstacle(); });
    },
    onFinishLine: () => { racing = false; skipBtn?.remove(); skipBtn = null; },
    onFinish: ({ time, auto, photos }) => {
      hud.show(false);
      const newRecord = !auto && state.submitTime(time);
      state.addPhotos(photos);
      if (newRecord) audio.fanfare();
      game.setFinishLayout();
      finishSheet = openFinish(ui, {
        time, auto, newRecord, photos, audio,
        onRsvp: (r) => afterRsvp(r, { stayOnFinish: true }),
        onAgain: async () => { await finishSheet?.close(); finishSheet = null; game.guestLeave(); countdown(false); },
        onInfo: () => openInfoSheet({ from: "finish" })
      });
    },
    onGuestArrived: () => {}
  }
});
game.input.enabled = false;
clearInterval(progTimer);
while (performance.now() - t0 < 1200) { setP(1); await sleep(60); }
setP(1);
game.loadPhotoThumbs();

/* ---------- Sonido ---------- */
const soundBtns = [];
function soundBtn() {
  const b = h("button.fl.fl-round", { type: "button", onclick: () => toggleSound() });
  soundBtns.push(b); paintSound();
  if (!audio.supported()) b.hidden = true;
  return b;
}
function paintSound() {
  soundBtns.forEach((b) => { b.innerHTML = icon(soundOn ? "soundOn" : "soundOff"); b.setAttribute("aria-label", soundOn ? "Apagar sonido" : "Encender sonido"); b.setAttribute("aria-pressed", soundOn ? "true" : "false"); });
}
function toggleSound() {
  soundOn = !soundOn;
  if (soundOn) audio.unlock();
  if (!audio.setEnabled(soundOn) && soundOn) soundOn = false;
  state.set({ sound: soundOn }); // se recuerda
  if (soundOn) { audio.music(true); audio.tap(); }
  paintSound();
}
function startAudio({ jingle = false } = {}) {
  if (!soundOn || !audio.unlock()) return;
  audio.setEnabled(true);
  if (jingle) audio.start();
  audio.music(true);
}
audio.onUnavailable(() => soundBtns.forEach((b) => { b.hidden = true; }));

/* ---------- HUD y menú ---------- */
const hud = createHud(ui, { sections: game.sections, soundBtn: soundBtn(), onInfo: () => openInfoSheet({ from: "race" }), onPause: () => pause() });
const menu = createMenu(ui, { onPlay: () => play(), onWatch: () => watch(), onInfo: () => openInfoSheet({ from: "menu" }), soundBtn: soundBtn() });
(function hudLoop() {
  if (racing) hud.update({ time: game.time, progress: game.progress, photosN: game.photos.length, cpDone: game.cpDone });
  requestAnimationFrame(hudLoop);
})();

function showMenu() {
  racing = false; hud.show(false); cover(false);
  skipBtn?.remove(); skipBtn = null;
  game.guestLeave(); game.toMenu();
  menu.show({ bestTime: state.get().bestTime });
  audio.duck(false);
}
let tut = null;
function play() {
  audio.tap(); menu.hide();
  if (!state.get().tutorialSeen && !sessionTutorial) { game.toTutorial(); tut = tutorialPrompt(ui); return; }
  countdown(false);
}
function watch() { audio.tap(); menu.hide(); countdown(true); }
async function countdown(auto, { fromTutorial = false } = {}) {
  currentAuto = auto;
  if (!fromTutorial) game.readyAtStart();
  game.toCountdown();
  hud.show(true);
  hud.update({ time: 0, progress: game.progress, photosN: 0, cpDone: new Set() });
  await runCountdown(ui, audio);
  game.startRace({ auto });
  racing = true;
}

/* ---------- Pausa ---------- */
let pauseModal = null;
function pause() {
  if (!racing || pauseModal || game.mode !== "race" && game.mode !== "splash") return;
  audio.tap(); game.pause(true); audio.duck(true); cover(true);
  pauseModal = pauseMenu(ui, {
    onResume: () => { pauseModal = null; cover(false); game.pause(false); audio.duck(false); },
    onRestart: () => { pauseModal = null; cover(false); game.pause(false); audio.duck(false); countdown(currentAuto); },
    onInfo: () => { pauseModal = null; openInfoSheet({ from: "race", alreadyPaused: true }); },
    onMenu: () => { pauseModal = null; game.pause(false); showMenu(); }
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { if (racing && game.mode === "race") pause(); audio.suspend(); }
  else if (soundOn) audio.resume();
});
window.addEventListener("pagehide", () => audio.suspend());
window.addEventListener("pageshow", () => { if (soundOn) audio.resume(); });

/* ---------- Hoja de info ---------- */
function openInfoSheet({ from, alreadyPaused = false }) {
  audio.tap();
  const inRace = from === "race" && racing;
  if (inRace && !alreadyPaused) { game.pause(true); audio.duck(true); }
  if (from === "menu") menu.hide();
  openInfo(ui, {
    audio,
    playLabel: inRace ? "¡Seguir corriendo! 🏁" : "¡Mejor quiero jugar! 🏁",
    onPlay: () => { if (inRace) { game.pause(false); audio.duck(false); } else if (from === "menu") play(); else if (from === "finish") { finishSheet?.close(); finishSheet = null; game.guestLeave(); countdown(false); } },
    onClose: () => { if (inRace) { game.pause(false); audio.duck(false); } else if (from === "menu") menu.show({ bestTime: state.get().bestTime }); },
    onRsvp: () => openRsvpSheet()
  });
}

/* ---------- Confirmación (desde la hoja de info) ---------- */
function openRsvpSheet() {
  racing = false; hud.show(false); menu.hide(); skipBtn?.remove(); skipBtn = null;
  finishSheet?.close(); finishSheet = null;
  game.pause(false); game.showPodium(); game.guestLeave();
  const form = createRsvpForm({ ui, audio, onSubmit: (r) => { close(); afterRsvp(r, { stayOnFinish: false }); } });
  const back = h("button.fl.fl-white.fl-block", { type: "button", onclick: () => { close(); showMenu(); } }, h("span", { text: "Volver al menú" }));
  const wrap = h("section.sheet.is-finish", { role: "dialog", "aria-label": "Inscríbete a la carrera", style: { "--stripe": "var(--coral)" } },
    h("header.sheet-head", h("p.sheet-kicker", { text: "Confirmación" }), h("h2.sheet-title", { text: "INSCRÍBETE A LA CARRERA" })),
    h("div.sheet-body", form.el), h("div.sheet-foot", back));
  ui.append(wrap);
  const close = () => { wrap.remove(); rsvpSheetClose = null; };
  rsvpSheetClose = close;
}
/** Después de confirmar: el corredor del invitado sube al podio (o el niño se despide). */
function afterRsvp(r, { stayOnFinish }) {
  const done = () => { if (!stayOnFinish) showMenu(); };
  if (r.attending) {
    game.guestJoin(guestLook(r.avatar.color, r.avatar.hair, r.guestName));
    setTimeout(() => { game.particles.burst(game.course.finish.x + 270, 220, prefersReduced() ? 18 : 70); }, 900);
    celebrate(ui, r, { audio, onClose: done });
  } else {
    game.guestLeave(); game.childWave();
    farewell(ui, r, { audio, onClose: done });
  }
}

window.addEventListener("circuito:race", () => { menu.hide(); racing = true; hud.show(true); cover(false); });

/* ---------- Arranque ---------- */
game.start();
game.toMenu();
await loading.done();
if (DEBUG) {
  const { initDebug } = await import("./debug.js");
  initDebug({ game, state, showMenu, countdown });
}
if (!state.isReturning() || DEMO) {
  await showStart(ui, { audio, onTap: () => startAudio({ jingle: true }) });
  showMenu();
} else {
  showMenu();
  toast(ui, "¡Bienvenido de vuelta, corredor!");
  const evs = ["pointerdown", "keydown"];
  const once = () => { evs.forEach((e) => window.removeEventListener(e, once, true)); startAudio(); };
  if (soundOn) evs.forEach((e) => window.addEventListener(e, once, true));
}
state.set({ visits: (state.get().visits || 0) + 1 });
window.__circuito = { game, state };
