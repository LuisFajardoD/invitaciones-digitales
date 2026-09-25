// Misión Estrella — arranque y orquestación: modos (?demo, ?showcase, ?debug, ?nowebgl), póster → escena 3D,
// portada "mantén presionado", despegue, capítulos con el scroll, HUD (Bitácora + sonido), confirmación con
// parche, visitas repetidas y versión ilustrada si no hay WebGL.
import { demoData } from "./data.js";
import { h, $, flag, params, tpl, missionName, prefersReduced, vibrate, eventInfo, waUrl } from "./util.js";
import { state, DEMO } from "./state.js";
import { audio } from "./audio.js";
import { icon } from "./ui/icons.js";
import { toast, openWhatsApp } from "./ui/toasts.js";
import { openViewer } from "./ui/viewer.js";
import { whatsappText } from "../../_shared/rsvp-contract.js";

const SHOWCASE = flag("showcase"), DEBUG = flag("debug");
const stage = $("#stage"), ui = $("#ui"), poster = $("#poster"), fadeEl = $("#fade");
document.documentElement.classList.toggle("is-showcase", SHOWCASE);

function hasWebGL() {
  if (flag("nowebgl")) return false;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
async function fallback(reason) {
  console.info("[misión] versión ilustrada:", reason);
  document.documentElement.classList.add("is-fallback");
  const { startFallback } = await import("./fallback/fallback.js");
  startFallback({ audio, debug: DEBUG });
}

async function boot() {
  if (!hasWebGL()) return fallback("sin WebGL");
  // título sobre el póster desde el primer instante (mientras carga el 3D)
  const pre = SHOWCASE ? null : h("div.precover", { "aria-hidden": "true" }, h("p.cover-title", { text: missionName() }), h("p.badge", { html: `${icon("star", { size: 18 })}<span>¡Cumple ${demoData.child.age}!</span>` }));
  if (pre) ui.append(pre);
  window.__removePre = () => pre?.remove();
  let mods;
  try {
    mods = await Promise.all([import("./scene/renderer.js"), import("./scene/timeline.js"), import("./scene/scroll.js"), import("./quality.js")]);
  } catch (e) { return fallback(`no cargó el 3D: ${e.message}`); }
  const [{ createRenderer }, { createFilm }, { createScroll }, { initialLevel, createMonitor, LEVELS }] = mods;
  // fuentes (los textos en canvas las usan) con tope, mientras se ve el póster
  try { if (document.fonts?.load) await Promise.race([Promise.all(["600 40px Fredoka", "500 20px Fredoka", "400 16px Figtree", "800 16px Figtree"].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1500))]); } catch { /* fuentes del sistema */ }

  const canvas = $("#gl");
  let R;
  try { R = createRenderer(canvas, { stage, level: "medium", maxDpr: SHOWCASE ? 1.25 : 2 }); } catch (e) { return fallback(`WebGL falló: ${e.message}`); }
  const forced = params.get("q");
  let level = initialLevel(R.renderer.getContext(), { forced, showcase: SHOWCASE });
  const markLevel = (l) => document.documentElement.classList.toggle("q-low", l === "low");
  R.setLevel(level); markLevel(level);
  const film = createFilm({ R, quality: LEVELS[level], audio, showcase: SHOWCASE });
  const monitor = createMonitor(level, (l) => { if (!forced) { level = l; R.setLevel(l); markLevel(l); } });
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fallback("se perdió el contexto WebGL"); stage.remove(); });

  /* ---------- Bucle ---------- */
  let last = performance.now(), t = 0, frames = 0, running = true, story = { chapter: 1, p: 0 };
  let scroll = null, ctl = null;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (film.mode === "story" && scroll) story = scroll.update(dt);
    film.update(dt, t, story);
    R.render();
    monitor.tick(dt);
    fadeEl.style.opacity = String(film.fade || 0);
    ctl?.frame(dt, story);
    if (++frames === 3) { poster.classList.add("is-out"); window.__ready = true; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") { running = false; audio.suspend(); }
    else { running = true; last = performance.now(); requestAnimationFrame(loop); if (state.soundEnabled() && !SHOWCASE) audio.resume(); }
  });
  addEventListener("pagehide", () => audio.suspend());

  if (SHOWCASE) { // vitrina: sólo la portada en loop, sin texto, botones ni sonido
    if (flag("title")) ui.append(h("h1.showcase-title", { text: missionName() }));
    window.__film = film;
    return;
  }
  scroll = createScroll($("#scroller"), {});
  ctl = await startExperience({ R, film, scroll, monitor, getLevel: () => level, setLevel: (l) => { level = l; R.setLevel(l); monitor.set(l); markLevel(l); } });
}

/* ================= Experiencia completa ================= */
async function startExperience({ R, film, scroll, monitor, getLevel, setLevel }) {
  const [{ showCover }, { createChapters, CHAPTER_LABELS }, { createProgress }, { openBitacora }, { openCrewForm }] = await Promise.all([
    import("./ui/cover.js"), import("./ui/chapters.js"), import("./ui/progress.js"), import("./ui/bitacora.js"), import("./ui/crew-form.js")]);
  const returning = state.isReturning();
  state.set({ visits: (state.get().visits || 0) + 1 });
  let soundOn = state.soundEnabled();
  const rsvp = () => state.get().rsvp;
  if (rsvp()) film.setMine(rsvp());

  /* ---------- HUD ---------- */
  const soundBtn = h("button.icon-btn.hud-btn", { type: "button", onclick: () => toggleSound() });
  const paintSound = () => { soundBtn.innerHTML = icon(soundOn ? "soundOn" : "soundOff", { size: 24 }); soundBtn.setAttribute("aria-label", soundOn ? "Apagar sonido" : "Encender sonido"); soundBtn.setAttribute("aria-pressed", String(soundOn)); };
  paintSound();
  audio.onUnavailable(() => { soundBtn.hidden = true; });
  const logBtn = h("button.icon-btn.hud-btn", { type: "button", "aria-label": "Abrir la bitácora de la misión", html: icon("log", { size: 24 }), onclick: () => openLog() });
  const hud = h("div.hud", logBtn, soundBtn);
  ui.append(hud);
  const setHud = (v) => hud.classList.toggle("is-on", v);
  function toggleSound() {
    soundOn = !soundOn;
    if (soundOn) audio.unlock();
    if (!audio.setEnabled(soundOn) && soundOn) soundOn = false;
    state.set({ sound: soundOn });
    if (soundOn) { audio.music(true); audio.tap(); }
    paintSound();
  }
  function startAudio() { if (!soundOn || !audio.unlock()) return; audio.setEnabled(true); audio.music(true); }

  /* ---------- Capítulos, progreso, pistas ---------- */
  const progress = createProgress(ui, { labels: CHAPTER_LABELS, onGo: (n) => { audio.tap(); scroll.goTo(n); } });
  const chapters = createChapters(ui, {
    audio, getRsvp: rsvp, crewCount: () => film.crewCount(),
    onJoin: () => openForm(), onDecline: () => openForm({ decline: true }), onEdit: () => openForm({ previous: rsvp() }),
    onResend: () => sendWhatsApp(rsvp()), onLog: () => openLog(), onReplay: () => replay()
  });
  const swipe = h("div.swipe-hint", { "aria-hidden": "true" }, h("span", { text: "Desliza para continuar" }), h("span.swipe-arrow", { html: icon("chevronDown", { size: 22 }) }));
  const skipBtn = h("button.btn.btn-ghost.btn-sm.skip", { type: "button", onclick: () => skipLaunch() }, "Omitir");
  const countEl = h("div.launch-count", { "aria-live": "assertive" });
  ui.append(swipe, countEl);

  let cover = null, overlay = 0; // overlay > 0: hay una hoja abierta (Bitácora, formulario, visor)
  const setOverlay = (d) => { overlay = Math.max(0, overlay + d); };

  /* ---------- Portada ---------- */
  function showCoverScreen() {
    scroll.lock(true); scroll.jump(1, 0);
    setHud(false); progress.show(false);
    film.toCover();
    window.__removePre?.();
    cover = showCover(ui, {
      audio, returning,
      onHold: (p) => {
        film.setHold(p);
        if (soundOn && p > 0 && !audio.isEnabled()) { audio.unlock(); audio.setEnabled(true); } // el gesto desbloquea el audio
        if (soundOn) audio.rumble(p);
        if (p > 0.05 && Math.random() < p * 0.12) vibrate(10 + p * 25);
      },
      onIgnite: () => ignite(),
      onInfo: () => openLog({ fromCover: true }),
      onGoLog: () => openLog({ fromCover: true })
    });
  }
  function ignite() {
    audio.unlock(); audio.rumble(0);
    if (soundOn) { audio.setEnabled(true); audio.music(true); audio.duck(true); }
    cover?.hide(); cover = null;
    const short = returning && state.get().seenLaunch;
    ui.append(skipBtn);
    lastCount = "";
    film.launch({ short, onEnd: afterLaunch });
  }
  function afterLaunch() {
    skipBtn.remove(); countEl.textContent = ""; countEl.className = "launch-count";
    audio.duck(false);
    state.set({ seenLaunch: true });
    scroll.lock(false);
    if (!jumpAfterLaunch) scroll.jump(1, 0);
    jumpAfterLaunch = null;
    setHud(true); progress.show(true);
  }
  let jumpAfterLaunch = null;
  function skipLaunch() { audio.tap(); jumpAfterLaunch = 2; film.skipLaunch(); scroll.jump(2, 0); }
  /** Salir de la portada directo a los capítulos (Bitácora → Unirme). */
  function leaveCover(toChapter) {
    cover?.hide(); cover = null;
    film.toStory(); state.set({ seenLaunch: true });
    scroll.lock(false); scroll.jump(toChapter);
    setHud(true); progress.show(true);
    startAudio();
  }
  function replay() { audio.tap(); showCoverScreen(); }

  /* ---------- Bitácora ---------- */
  function openLog({ fromCover = false } = {}) {
    audio.tap(); setOverlay(1);
    const wasLocked = scroll.locked; scroll.lock(true); // la página de atrás no se mueve
    openBitacora(ui, {
      audio,
      rsvpLabel: rsvp()?.attending ? "Ver mi lugar en la tripulación 🚀" : "¡Unirme a la tripulación! 🚀",
      onClose: () => { setOverlay(-1); scroll.lock(wasLocked); },
      onPhoto: (i) => { setOverlay(1); openViewer(ui, i, { audio, onClose: () => setOverlay(-1) }); },
      onJoin: () => goToCrew({ fromCover: fromCover || film.mode !== "story" })
    });
  }
  function goToCrew({ fromCover = false, openIt = false } = {}) {
    if (fromCover || film.mode !== "story") leaveCover(8);
    else scroll.jump(8);
    if (openIt) setTimeout(() => openForm(), 300);
  }

  /* ---------- Confirmación ---------- */
  function openForm({ decline = false, previous = null } = {}) {
    if (film.mode !== "story") return goToCrew({ openIt: true });
    const s = scroll.raw();
    if (s.chapter !== 8) { scroll.jump(8); }
    audio.tap(); setOverlay(1);
    scroll.lock(true);
    let sent = false;
    openCrewForm(ui, {
      audio, decline, previous: previous || rsvp(),
      onClose: () => { setOverlay(-1); setTimeout(() => { if (!sent) scroll.lock(false); }, 0); },
      onSubmit: (r) => { sent = true; submitted(r); }
    });
  }
  const waTpl = () => ({ ...demoData.rsvp, messageYes: tpl(demoData.rsvp.messageYes), messageNo: tpl(demoData.rsvp.messageNo) });
  const sendWhatsApp = (r) => openWhatsApp(ui, waUrl(demoData.rsvp.whatsapp, whatsappText(r, waTpl(), demoData.child.name)));
  async function submitted(r) {
    state.set({ rsvp: r });
    scroll.lock(true);
    if (r.attending) {
      await film.joinCrew(r);
      chapters.renderCrew();
      toast(ui, "¡Ya eres parte de la tripulación!", 3200);
      await new Promise((res) => setTimeout(res, 1500));
      scroll.lock(false);
      await sendWhatsApp(r);
    } else {
      film.setMine(null);
      film.farewell();
      chapters.renderCrew();
      toast(ui, "¡Te extrañaremos, tripulante!", 3200);
      await new Promise((res) => setTimeout(res, 1500));
      scroll.lock(false);
      await sendWhatsApp(r);
    }
  }

  /* ---------- Toques en la escena ---------- */
  $("#gl").addEventListener("click", (e) => {
    if (overlay) return;
    const rect = stage.getBoundingClientRect();
    const hit = film.tap(e.clientX - rect.left, e.clientY - rect.top);
    if (hit?.kind === "photo") {
      setOverlay(1); scroll.lock(true);
      Promise.resolve(film.flyPhoto(hit.index)).then(() => openViewer(ui, hit.index, { audio, onClose: () => { film.photoBack(hit.index); setOverlay(-1); scroll.lock(false); } }));
    }
  });

  /* ---------- Por frame (UI sincronizada) ---------- */
  let lastCount = "", lastChapter = 0;
  function frame(dt, story) {
    if (film.mode === "launch") {
      const L = film.launchInfo;
      let txt = "";
      if (!L.short) { if (L.t > 1.4 && L.t < 2.2) txt = "3"; else if (L.t >= 2.2 && L.t < 3.0) txt = "2"; else if (L.t >= 3.0 && L.t < 3.8) txt = "1"; else if (L.t >= 3.8 && L.t < 5.0) txt = "¡DESPEGUE!"; }
      else if (L.t < 1.3) txt = "¡DESPEGUE!";
      if (txt !== lastCount) {
        lastCount = txt; countEl.textContent = txt; countEl.className = `launch-count${txt ? " is-on" : ""}${txt.length > 2 ? " is-go" : ""}`;
        if (txt) audio.beep(txt.length > 2);
        if (txt.length > 2) audio.liftoff();
      }
    }
    const inStory = film.mode === "story";
    chapters.update(story.chapter, story.p, { flightActive: film.flightActive, hidden: !inStory || overlay > 0 });
    if (inStory) progress.set(story.chapter);
    swipe.classList.toggle("is-on", inStory && story.chapter === 1 && story.p < 0.3 && !overlay);
    if (inStory && story.chapter !== lastChapter) { lastChapter = story.chapter; state.set({ lastChapter }); }
  }

  /* ---------- Arranque ---------- */
  const firstTouch = () => { ["pointerdown", "keydown"].forEach((ev) => removeEventListener(ev, firstTouch, true)); if (soundOn) { audio.unlock(); audio.setEnabled(true); audio.music(true); } };
  if (returning && soundOn) ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, firstTouch, true));
  showCoverScreen();
  film.buildRest();
  if (DEBUG) {
    const { initDebug } = await import("./debug.js");
    initDebug({ R, film, scroll, monitor, audio, state, getLevel, setLevel, replay: () => { showCoverScreen(); }, jump: (n) => { if (film.mode !== "story") leaveCover(n); else scroll.jump(n); } });
  }
  window.__film = film;
  if (DEBUG) window.__R = R;
  return { frame };
}

boot().catch((e) => { console.error(e); fallback(`error: ${e.message}`); });
