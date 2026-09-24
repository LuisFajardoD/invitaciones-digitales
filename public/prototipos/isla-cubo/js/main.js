// Isla Cubo — arranque y orquestación: carga, "TOCA PARA EMPEZAR", construcción, recorrido por 7 paradas,
// gestos sobre la isla, info rápida, sonido, visitas repetidas y modo debug.
import { demoData } from "./data.js";
import { h, $, sleep, clamp, inviteTitle, islandName, prefersReduced, syncReducedClass } from "./util.js";
import { state, session } from "./state.js";
import { audio } from "./audio.js";
import { icon } from "./ui/icons.js";
import { createSheet } from "./ui/sheet.js";
import { buildStops, dateBlock, venueBlock, mapsRow } from "./ui/stops.js";
import { createRsvp, guestList, hasBlock, savedRsvp } from "./ui/rsvp.js";

syncReducedClass();
const params = new URLSearchParams(location.search);
const DEBUG = params.get("debug") === "1";
// Debug: probar otros nombres en el monumento (?debug=1&nombre=SOFÍA)
if (DEBUG && params.get("nombre")) demoData.island.monumentText = params.get("nombre");
const frame = $(".frame");
const app = $("#app");
const skyEl = $(".sky", app);
const starsEl = $(".stars", app);
const worldLayer = $(".world-layer", app);
document.documentElement.style.setProperty("--accent", demoData.island.favoriteColor);
document.title = `${inviteTitle()} · ¡Cumple ${demoData.child.age}!`;

/* ---------- Nubes del marco (desktop) ---------- */
[[4, 14, 1], [74, 20, 1.3], [10, 64, 0.8], [80, 70, 1.1]].forEach(([x, y, s], k) => {
  const c = h("div.frame-cloud", { style: { left: `${x}%`, top: `${y}%`, animationDelay: `${-k * 30}s`, transform: `scale(${s})` } });
  [[0, 20, 90, 34], [22, 0, 56, 50], [58, 12, 60, 40]].forEach(([l, t, w, hh]) => c.append(h("i", { style: { left: `${l}px`, top: `${t}px`, width: `${w}px`, height: `${hh}px` } })));
  frame.prepend(c);
});

/* ---------- Capas de interfaz ---------- */
const toastRoot = h("div.toast-root", { "aria-live": "polite" });
const labels = h("div.labels");
function toast(text, ms = 2600) {
  const t = h("div.toast.parch", h("span", { text }));
  toastRoot.replaceChildren(t);
  setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 400); }, ms);
}

/* ---------- Pantalla de carga: bloques apilándose ---------- */
const STACK_COLORS = ["#8BD46E", "#C98E5A", "#FFD23F", "#FF6B6B", "#4CC9F0", "#B388FF", "#FF9FCB", "#9BE564"];
const blocks = STACK_COLORS.map((c, i) => h("i", { style: { background: c, left: `${(i % 3) * 46 + (Math.floor(i / 3) % 2) * 23}px`, bottom: `${Math.floor(i / 3) * 32}px` } }));
const tip = h("p.tip", { text: demoData.loadingTips[0] || "" });
const pct = h("span.pct", { text: "0%" });
const intro = h("div.intro", { role: "status" }, h("p.intro-name", { text: inviteTitle() }), h("div.stackbar", { "aria-hidden": "true" }, ...blocks), pct, tip);
app.append(labels, toastRoot, intro);
let tipI = 0;
const tipTimer = setInterval(() => {
  tip.classList.add("is-fade");
  setTimeout(() => { tipI = (tipI + 1) % demoData.loadingTips.length; tip.textContent = demoData.loadingTips[tipI]; tip.classList.remove("is-fade"); }, 300);
}, 1500);
let realProgress = 0;
const t0 = performance.now();
function showProgress(p) {
  realProgress = Math.max(realProgress, p);
  const shown = Math.min(realProgress, (performance.now() - t0) / 1500);
  const n = Math.round(shown * blocks.length);
  blocks.forEach((b, i) => b.classList.toggle("on", i < n));
  pct.textContent = `${Math.round(shown * 100)}%`;
}
const progTimer = setInterval(() => showProgress(realProgress), 80);

/* ---------- Mundo: WebGL o versión ilustrada ---------- */
async function makeWorld() {
  const fontsP = document.fonts?.load ? Promise.all([document.fonts.load('400 20px "Bungee"'), document.fonts.load('700 16px "Nunito"'), document.fonts.load('900 16px "Nunito"')]).catch(() => {}) : Promise.resolve();
  const opts = { container: worldLayer, skyEl, starsEl, frameEl: frame, data: demoData, audio, onProgress: (p) => showProgress(0.15 + p * 0.8) };
  let w = null;
  const forceFallback = params.get("nowebgl") === "1";
  if (!forceFallback) {
    try {
      const mod = await import("./world/world.js");
      showProgress(0.2);
      if (mod.webglAvailable()) w = await mod.createWorld(opts);
    } catch (e) {
      console.warn("WebGL no disponible, usando la versión ilustrada.", e);
      worldLayer.replaceChildren();
    }
  }
  if (!w) { const fb = await import("./fallback.js"); w = await fb.createFallbackWorld(opts); }
  await fontsP;
  showProgress(1);
  return w;
}

const world = await makeWorld();
window.__app = { world };
while (performance.now() - t0 < 1500) await sleep(60);
showProgress(1);
clearInterval(tipTimer); clearInterval(progTimer);

/* ---------- HUD ---------- */
let soundOn = state.soundEnabled();
const soundBtn = h("button.bb.bb-cream.bb-round", { type: "button", onclick: () => toggleSound() });
const infoBtn = h("button.bb.bb-cream.bb-round", { type: "button", "aria-label": "Info rápida: fecha, lugar y confirmar", html: icon("info", { size: 26 }), onclick: () => openQuickInfo() });
const isleBtn = h("button.bb.bb-cream.bb-round", { type: "button", "aria-label": "Vista de la isla", html: icon("island", { size: 26 }), onclick: () => (mode === "overview" ? goTo(current) : overview()) });
// La placa del nombre es un botón: vuelve al inicio del recorrido
const plateBtn = h("button.plate.parch", { type: "button", "aria-label": "Volver al inicio del recorrido", onclick: () => goHome() },
  h("span.plate-ic", { html: icon("island", { size: 22 }) }), h("span.plate-name", { text: islandName() }));
const hud = h("header.hud.is-hidden",
  plateBtn,
  h("div.hud-btns", soundBtn, infoBtn, isleBtn));
app.append(hud);
function paintSound() {
  soundBtn.innerHTML = icon(soundOn ? "soundOn" : "soundOff", { size: 26 });
  soundBtn.setAttribute("aria-label", soundOn ? "Apagar sonido" : "Encender sonido");
  soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
}
paintSound();
soundBtn.hidden = !audio.supported();
audio.onUnavailable(() => { soundBtn.hidden = true; });
function toggleSound() {
  soundOn = !soundOn;
  if (soundOn) audio.unlock();
  if (!audio.setEnabled(soundOn) && soundOn) soundOn = false;
  state.set({ sound: soundOn });
  if (soundOn) { audio.music(true); audio.tap(); }
  paintSound();
}
function startAudio({ jingle = false } = {}) {
  if (!soundOn || !audio.unlock()) return;
  audio.setEnabled(true);
  if (jingle) audio.start();
  audio.music(true);
}

/* ---------- Dock ---------- */
const dockName = h("span.dock-name", { "aria-live": "polite" });
// Puntos tocables: cada uno lleva directo a su parada; tooltip con el nombre al mantener o pasar el mouse
const dockDots = h("span.dots", ...world.stops.map((s, i) => h("button.dot-btn", {
  type: "button", "data-tip": s.name, "aria-label": `Ir a la parada ${i + 1}: ${s.name}`,
  onclick: () => { audio.tap(); if (mode !== "stop" || current !== i) goTo(i); }
}, h("i"))));
const prevBtn = h("button.bb.bb-wood", { type: "button", "aria-label": "Parada anterior", html: icon("prev"), onclick: () => step(-1) });
const nextBtn = h("button.bb.bb-wood", { type: "button", "aria-label": "Parada siguiente", html: icon("next"), onclick: () => step(1) });
const dockMid = h("div.dock-mid.parch", dockName, dockDots);
const dock = h("nav.dock", { "aria-label": "Recorrido de la isla" }, prevBtn, dockMid, nextBtn);
const seen = new Set();
function paintDock() {
  dockName.textContent = mode === "overview" ? "Vista de la isla" : world.stops[current].name;
  [...dockDots.children].forEach((d, i) => {
    const on = mode !== "overview" && i === current;
    d.classList.toggle("is-on", on); d.classList.toggle("is-seen", seen.has(i));
    if (on) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
  });
  const atLast = mode !== "overview" && current === world.stops.length - 1;
  prevBtn.disabled = mode !== "overview" && current === 0;
  prevBtn.style.opacity = prevBtn.disabled ? ".45" : "";
  // En la última parada, la flecha derecha se vuelve "↺ Volver al inicio"
  nextBtn.disabled = false;
  nextBtn.style.opacity = "";
  nextBtn.innerHTML = icon(atLast ? "replay" : "next");
  nextBtn.setAttribute("aria-label", atLast ? "Volver al inicio" : "Parada siguiente");
}
/** Volver a la Parada 1 (placa del nombre, flecha ↺ o índice). */
function goHome() {
  audio.tap();
  if (mode === "stop" && current === 0) {
    plateBtn.classList.remove("pop"); void plateBtn.offsetWidth; plateBtn.classList.add("pop");
    return;
  }
  // Si ya confirmó y viene del muro, sigue de noche durante el viaje y amanece al aterrizar
  const keepNight = mode === "stop" && current === 6 && hasBlock();
  goTo(0, { keepNight });
}

/* ---------- Tarjeta ---------- */
const sheet = createSheet({ app, dock, onInset: (px) => world.setInset(px) });
const ctx = { app, world, audio, onStart: () => step(1) };
const stops = [...buildStops(ctx), createRsvp({ app, world, sheet, audio, onPlaced: () => world.setGuests(guestList()) })];
world.setGuests(guestList());
stops[2].tick?.(true); // días restantes en la fachada de la torre desde el inicio

/* ---------- Navegación ---------- */
let current = clamp(state.get().lastStop || 0, 0, stops.length - 1);
let mode = "stop"; // "stop" | "overview"
let navToken = 0;
/* ---------- Hash por parada: el botón atrás regresa a la parada anterior visitada ---------- */
const HASHES = ["monumento", "casa", "torre", "sendero", "mirador", "cofre", "muro"];
let fromHistory = false;
function pushHash(hsh) {
  if (fromHistory || location.hash === `#${hsh}`) return;
  try { if (location.hash) history.pushState(null, "", `#${hsh}`); else history.replaceState(null, "", `#${hsh}`); } catch { /* sin historial */ }
}
window.addEventListener("popstate", () => {
  if (building) return;
  const hsh = location.hash.slice(1);
  fromHistory = true;
  if (hsh === "vista") overview();
  else if (HASHES.includes(hsh)) goTo(HASHES.indexOf(hsh));
  fromHistory = false;
});

/* ---------- Hooks por parada ---------- */
// Una sola secuencia de navegación para todas las paradas (goToStop):
//   prepareEnter → estado inicial de la animación de entrada, en el mismo frame en que empieza el viaje
//   onArrive     → al aterrizar la cámara: animación especial de la parada (junto con la tarjeta)
//   onLeave      → al salir: cancela lo pendiente y deja sus objetos en un estado estable
// `nav.alive()` es falso en cuanto hay otra navegación (token): nada de una parada anterior se ejecuta tarde.
const FLAGS_KEY = "isla-cubo:banderines-vistos";
const flagsSeen = () => session.get(FLAGS_KEY) === "1";
const markFlagsSeen = () => session.set(FLAGS_KEY, "1");
const HOOKS = {
  3: { // Sendero: los banderines salen del suelo 1→4 (sólo la primera vez en la sesión)
    prepareEnter: () => (flagsSeen() ? world.flagsUp() : world.flagsHide()),
    onArrive: (nav) => {
      if (flagsSeen()) return;
      // Se da por vista en cuanto sale el cuarto banderín
      world.raiseFlags({ onFlag: (k) => { if (!nav.alive()) return; stops[3].highlight?.(k); if (k === 3) markFlagsSeen(); } });
    },
    onLeave: () => world.flagsUp()
  },
  4: { onArrive: () => world.loadPhotos() },
  5: { // Cofre: tapa cerrada al viajar; se abre al llegar
    prepareEnter: () => world.closeChest(),
    onArrive: () => { world.openChest(); audio.waterLevel(1); },
    onLeave: () => { world.closeChest(); audio.waterLevel(0); }
  }
};
/** 1. Salida: cancela lo pendiente de la parada que se abandona y la deja estable. */
function leaveCurrent() {
  if (mode !== "stop") return;
  world.cancelSpecials?.();
  HOOKS[current]?.onLeave?.();
  stops[current].onHide?.();
}

/** Navegación central a una parada (todas usan la misma secuencia). */
async function goToStop(i, { instant = false, keepNight = false } = {}) {
  i = clamp(i, 0, stops.length - 1);
  pushHash(HASHES[i]);
  const token = ++navToken;
  const nav = { alive: () => token === navToken };
  // 1. Salida: baja la tarjeta y cierra lo pendiente de la parada anterior
  leaveCurrent();
  mode = "stop";
  current = i;
  seen.add(i);
  state.set({ lastStop: i });
  labels.replaceChildren();
  labels._btns = null;
  paintDock();
  const s = stops[i];
  if (!instant && sheet.state !== "hidden") { sheet.setState("hidden"); audio.whoosh(); }
  const time = i === 6 && hasBlock() ? "night" : world.stops[i].time;
  if (!keepNight) world.setTime(time, instant ? 0 : 1300);
  sheet.canExpand = true;
  const target = s.expand ? "expanded" : "mid";
  sheet.setContent({ kicker: s.kicker, title: s.title, content: s.el });
  world.setInset(sheet.insetFor(target)); // encuadre para la altura final de la tarjeta
  // 2. Preparación de la parada destino (mismo frame en que empieza el viaje)
  HOOKS[i]?.prepareEnter?.(nav);
  // 3. Viaje: una sola curva continua desde donde esté la cámara
  const res = await world.goTo(i, { instant });
  if (!nav.alive() || res?.interrupted) return;
  // 4. Llegada: sube la tarjeta y empieza la animación especial
  if (keepNight) world.setTime(time, 1800); // amanece suavemente al aterrizar
  sheet.setState(target);
  s.onShow?.();
  HOOKS[i]?.onArrive?.(nav);
}
const goTo = goToStop;
function step(d) {
  audio.tap();
  if (mode === "overview") return goTo(d > 0 ? 0 : stops.length - 1);
  if (d > 0 && current === stops.length - 1) return goHome();
  if (current + d < 0 || current + d >= stops.length) return;
  goTo(current + d);
}
const STOP_ICONS = ["star", "house", "clock", "flag", "tree", "chest", "wall"];
/** Índice de paradas para la tarjeta de la Vista de la isla. */
function overviewIndex() {
  return h("div.stack.compact",
    h("button.bb.bb-block", { type: "button", onclick: () => { audio.tap(); goTo(0); }, html: `${icon("replay", { size: 22 })}<span>Recorrer desde el inicio</span>` }),
    h("button.bb.bb-cream.bb-block", { type: "button", onclick: () => rebuildIsland() }, h("span", { text: "✨ Ver cómo se construye la isla" })),
    h("div.stop-grid", ...world.stops.map((s, i) => h("button.bb.bb-cream.stop-tile", {
      type: "button", "aria-label": `Parada ${i + 1}: ${s.name}${seen.has(i) ? " (visitada)" : ""}`,
      onclick: () => { audio.tap(); goTo(i); }
    },
      h("span.stop-num", { text: String(i + 1) }),
      h("span.stop-ic", { html: icon(STOP_ICONS[i], { size: 22 }) }),
      h("span.stop-name", { text: s.name }),
      seen.has(i) ? h("span.stop-check", { html: icon("check", { size: 16 }) }) : null))));
}
async function overview({ instant = false } = {}) {
  pushHash("vista");
  const token = ++navToken;
  leaveCurrent();
  mode = "overview";
  paintDock();
  audio.whoosh();
  sheet.setContent({ kicker: "Toca una parada para ir", title: "Vista de la isla", content: overviewIndex() });
  sheet.canExpand = false;
  world.setInset(sheet.insetFor("mid"));
  sheet.setState("mid");
  await world.overview({ instant });
  if (token !== navToken) return;
  renderLabels();
}
function renderLabels() {
  if (mode !== "overview") return;
  const ls = world.labels();
  if (labels.dataset.kind !== "stops" || !labels._btns) {
    labels.dataset.kind = "stops";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "label-lines");
    svg.setAttribute("aria-hidden", "true");
    labels._lines = ls.map(() => { const ln = document.createElementNS(svg.namespaceURI, "line"); svg.append(ln); return ln; });
    labels._btns = ls.map((l) => h("button.label3d.is-small", { type: "button", onclick: () => { audio.tap(); goTo(l.i); } }, world.stops[l.i].name));
    labels.replaceChildren(svg, ...labels._btns);
  }
  // Resolución de colisiones en 2D: prioridad = orden de la parada. Cada etiqueta prueba posiciones
  // candidatas (encima del punto, más arriba, a los lados) dentro de la franja libre entre HUD y dock.
  const ar = app.getBoundingClientRect();
  const top = hud.getBoundingClientRect().bottom - ar.top + 8;
  const bottom = dock.getBoundingClientRect().top - ar.top - 8;
  const W = app.clientWidth;
  const placed = [];
  const overlaps = (a) => placed.some((p) => a.x0 < p.x1 + 4 && a.x1 > p.x0 - 4 && a.y0 < p.y1 + 4 && a.y1 > p.y0 - 4);
  ls.forEach((l, k) => {
    const b = labels._btns[k], line = labels._lines[k];
    const w = b.offsetWidth || 100, hgt = b.offsetHeight || 34;
    // Rejilla de candidatas ordenadas por cercanía al punto de anclaje (preferencia: arriba, luego lados)
    const cands = [];
    for (let cy = -4; cy <= 7; cy++) for (const cx of [0, -0.5, 0.5, -1, 1, -1.5, 1.5]) cands.push([cx, cy, Math.hypot(cx * 1.2, cy > 0 ? cy * 1.3 : cy)]);
    cands.sort((a, c) => a[2] - c[2]);
    let box = null, bestOv = Infinity;
    for (const [cx, cy] of cands) {
      const x = clamp(l.x + cx * (w * 0.55 + 8), w / 2 + 6, W - w / 2 - 6);
      const y = clamp(l.y - 10 + cy * (hgt + 6), top + hgt, bottom);
      const cand = { x, y, x0: x - w / 2, x1: x + w / 2, y0: y - hgt, y1: y };
      if (!overlaps(cand)) { box = cand; break; }
      const ov = placed.filter((q) => cand.x0 < q.x1 + 4 && cand.x1 > q.x0 - 4 && cand.y0 < q.y1 + 4 && cand.y1 > q.y0 - 4).length;
      if (ov < bestOv) { bestOv = ov; box = cand; }
    }
    placed.push(box);
    b.style.left = `${box.x}px`; b.style.top = `${box.y}px`;
    // Si el anclaje queda bajo el HUD o el dock, la etiqueta se coloca en la franja libre con su línea guía
    const visible = l.visible && l.y > -120 && l.y < app.clientHeight;
    b.hidden = !visible;
    // Línea guía fina cuando la etiqueta quedó desplazada respecto a su construcción
    const moved = Math.hypot(box.x - l.x, box.y - (l.y - 10)) > 6;
    b.classList.toggle("is-moved", moved);
    line.setAttribute("x1", box.x); line.setAttribute("y1", box.y);
    line.setAttribute("x2", l.x); line.setAttribute("y2", l.y);
    line.style.display = visible && moved ? "" : "none";
  });
}
function showGuestLabel(i) {
  const g = guestList()[i];
  if (!g) return;
  labels.dataset.kind = "guest";
  labels._btns = null;
  const tag = h("div.label3d.is-guest", { role: "status" }, g.me ? `${g.name} (tú)` : g.name);
  labels.replaceChildren(tag);
  const place = () => { const p = world.guestScreen(i); tag.style.left = `${p.x}px`; tag.style.top = `${p.y}px`; };
  place();
  labels._guestPlace = place;
  clearTimeout(showGuestLabel._t);
  showGuestLabel._t = setTimeout(() => { if (labels.contains(tag)) { labels.replaceChildren(); labels._guestPlace = null; } }, 2600);
  audio.blockPop(1.5);
}
world.onFrame = () => {
  if (mode === "overview") renderLabels();
  else labels._guestPlace?.();
};

/* ---------- Gestos sobre la isla: tocar, deslizar, orbitar ---------- */
let g = null;
worldLayer.addEventListener("pointerdown", (e) => {
  if (building) return;
  g = { x0: e.clientX, y0: e.clientY, t0: performance.now(), orbit: false };
  try { worldLayer.setPointerCapture(e.pointerId); } catch { /* nada */ }
});
worldLayer.addEventListener("pointermove", (e) => {
  if (!g) return;
  const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
  if (!g.orbit && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) { g.orbit = true; world.orbitStart(); }
  if (g.orbit) { world.orbitDrag(e.movementX || 0); }
});
const endGesture = (e) => {
  if (!g) return;
  const d = g; g = null;
  const dx = e.clientX - d.x0, dy = e.clientY - d.y0, dt = performance.now() - d.t0;
  if (d.orbit) world.orbitEnd();
  // Swipe horizontal rápido = parada anterior/siguiente
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 380) { step(dx < 0 ? 1 : -1); return; }
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) {
    const r = worldLayer.getBoundingClientRect();
    const hit = world.pick(e.clientX - r.left, e.clientY - r.top);
    if (!hit) return;
    if (hit.type === "dog") { world.dogJump(); audio.boing(); }
    else if (hit.type === "photo") {
      // Marco de foto del Mirador: el carrusel va a esa foto y se abre en el visor
      audio.tap();
      if (mode === "stop" && current === 4) stops[4].showPhoto?.(hit.index);
      else goTo(4).then(() => { if (mode === "stop" && current === 4) stops[4].showPhoto?.(hit.index); });
    }
    else if (hit.type === "guest") showGuestLabel(hit.index);
    else if (hit.type === "stop" && (mode === "overview" || hit.index !== current)) { audio.tap(); goTo(hit.index); }
  }
};
worldLayer.addEventListener("pointerup", endGesture);
worldLayer.addEventListener("pointercancel", () => { if (g?.orbit) world.orbitEnd(); g = null; });
document.addEventListener("keydown", (e) => {
  if (building || $(".modal, .viewer", app)) return;
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
});

/* ---------- Info rápida ---------- */
function openQuickInfo() {
  audio.tap();
  const close = () => { m.remove(); infoBtn.focus(); };
  const m = h("div.modal", { role: "dialog", "aria-modal": "true", "aria-labelledby": "qi-title", onclick: (e) => { if (e.target === m) close(); }, onkeydown: (e) => { if (e.key === "Escape") close(); } },
    h("div.modal-panel.parch",
      h("div.modal-head", h("h2#qi-title", { text: "Info rápida" }), h("button.bb.bb-cream.bb-round", { type: "button", "aria-label": "Cerrar", html: icon("close"), onclick: close })),
      h("div.modal-body.stack",
        dateBlock(), venueBlock(), mapsRow(audio),
        h("button.bb.bb-berry.bb-lg.bb-block", { type: "button", onclick: () => { close(); goTo(6); } }, h("span", { text: hasBlock() ? "Ver mi bloque en el muro" : savedRsvp() ? "Ver o cambiar mi respuesta" : "Confirmar asistencia" })))));
  app.append(m);
  $(".bb-round", m).focus();
}

/* ---------- Segundo plano ---------- */
const bg = () => { world.stop(); audio.suspend(); };
const fg = () => { if (document.visibilityState === "hidden") return; world.start(); if (soundOn) { audio.resume(); audio.music(true); } };
document.addEventListener("visibilitychange", () => (document.visibilityState === "hidden" ? bg() : fg()));
window.addEventListener("pagehide", bg);
window.addEventListener("pageshow", fg);

/* ---------- Intro ---------- */
let building = false;
function showUI() {
  hud.classList.remove("is-hidden");
  paintDock();
}
function helpHand(container, afterMs = 3000) {
  const hand = h("div.hand", { html: icon("hand"), "aria-hidden": "true" });
  container.append(hand);
  const t = setTimeout(() => hand.classList.add("is-on"), afterMs);
  return () => { clearTimeout(t); hand.remove(); };
}
/** "TOCA PARA EMPEZAR": espera el toque (nunca avanza solo); a los 3 s aparece una manita. */
function tapToStart() {
  intro.classList.add("is-start");
  intro.setAttribute("aria-label", "Toca para empezar");
  const btn = h("button.bb.bb-lg.start-btn", { type: "button" }, h("span", { text: "TOCA PARA EMPEZAR" }));
  const hint = h("p.sound-hint", { hidden: !audio.supported() }, h("span.waves", { html: icon("soundOn", { size: 22 }) }), h("span", { text: "Mejor con sonido" }));
  intro.replaceChildren(h("div.intro-sun"), h("p.intro-name", { text: inviteTitle() }), btn, hint);
  const stopHand = helpHand(intro);
  btn.focus({ preventScroll: true });
  return new Promise((resolve) => {
    const onTap = (e) => {
      e.preventDefault();
      intro.removeEventListener("click", onTap);
      stopHand();
      startAudioFromTap();
      resolve();
    };
    intro.addEventListener("click", onTap);
  });
}
function startAudioFromTap() { startAudio({ jingle: true }); }

async function firstVisit() {
  await tapToStart();
  // La construcción: la isla aparece bloque a bloque
  building = true;
  world.setTime("dawn", 0);
  world.setInset(0, true);
  world.start();
  let skipped = false;
  const skip = h("button.skip", { type: "button", "aria-label": "Omitir la construcción" }, "Omitir");
  // "Omitir": directo al estado final en la vista del monumento con el nombre construido
  skip.addEventListener("click", () => { skipped = true; audio.tap(); (world.skipBuild || world.finishBuild).call(world); });
  intro.classList.add("is-out");
  setTimeout(() => intro.remove(), 600);
  audio.duck(true);
  if (prefersReduced()) {
    // Movimiento reducido: la isla completa aparece con un fundido, sin caídas ni cámara
    world.finishBuild();
    world.revealFade?.();
    await world.overview({ instant: true });
  } else {
    app.append(skip);
    await world.build();
    if (!skipped) await world.monument();
    skip.remove();
  }
  audio.duck(false);
  state.set({ builtSeen: true });
  building = false;
  // Título
  const card = h("div.title-card", { role: "status" }, h("h1", { text: inviteTitle() }), h("div.age-badge.parch", h("span", { text: `¡Cumple ${demoData.child.age}!` })));
  app.append(card);
  showUI();
  await goTo(0);
  setTimeout(() => { card.classList.add("is-out"); setTimeout(() => card.remove(), 500); }, 2200);
}

async function returningVisit() {
  world.finishBuild();
  world.setTime("golden", 0);
  intro.classList.add("is-out");
  setTimeout(() => intro.remove(), 600);
  world.start();
  showUI();
  const deep = HASHES.indexOf(location.hash.slice(1));
  if (deep >= 0) await goTo(deep, { instant: true });
  else await overview({ instant: true });
  toast("¡Bienvenido de vuelta a la isla!");
  // Audio: primer toque en cualquier parte (listener global de una sola vez)
  const evs = ["pointerdown", "keydown"];
  const once = () => { evs.forEach((e) => window.removeEventListener(e, once, true)); startAudio(); };
  if (soundOn) evs.forEach((e) => window.addEventListener(e, once, true));
}

/**
 * "Ver cómo se construye la isla": la cámara se aleja, la isla se desarma hacia el cielo y se repite
 * la construcción completa con el monumento; al terminar queda en la parada 1. "Omitir" funciona
 * igual que en la primera visita. Si ya confirmó, su bloque cae al final directo a su lugar en el
 * muro. No toca el estado guardado (sigue siendo una visita repetida).
 */
async function rebuildIsland() {
  if (building) return;
  audio.tap();
  ++navToken;
  leaveCurrent();
  building = true;
  mode = "stop"; // fuera de la Vista de la isla: sin etiquetas mientras se construye
  labels.replaceChildren(); labels._btns = null;
  sheet.setState("hidden");
  hud.classList.add("is-hidden");
  world.setInset(0);
  let skipped = false;
  const skip = h("button.skip", { type: "button", "aria-label": "Omitir la construcción" }, "Omitir");
  skip.addEventListener("click", () => { skipped = true; audio.tap(); (world.skipBuild || world.finishBuild).call(world); });
  app.append(skip);
  audio.duck(true);
  const me = guestList().find((g) => g.me);
  world.setGuests(guestList().filter((g) => !g.me)); // su bloque llega al final
  await world.disassemble();
  world.setTime("dawn", prefersReduced() ? 0 : 600);
  if (!skipped && !prefersReduced()) await world.build();
  else if (prefersReduced()) { world.finishBuild(); world.revealFade?.(); }
  if (me && !skipped && !prefersReduced()) await world.placeGuest(me, { fromSky: true });
  else world.setGuests(guestList());
  if (!skipped && !prefersReduced()) await world.monument();
  world.finishBuild(); // estado final estable (también si se omitió)
  skip.remove();
  audio.duck(false);
  building = false;
  showUI();
  await goTo(0);
}

if (DEBUG) {
  const { initDebug } = await import("./debug.js");
  initDebug({ app, world, goTo, overview, sheet, replayBuild: () => rebuildIsland(), refresh: () => stops[current].onShow?.() });
}

if (state.isReturning()) await returningVisit();
else await firstVisit();
