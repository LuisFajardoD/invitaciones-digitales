// Carga, "TOCA PARA EMPEZAR", menú de salida, tutorial y semáforo.
import { demoData } from "../data.js";
import { h, sleep, inviteTitle, bib, fmtTime, prefersReduced } from "../util.js";
import { icon, runnerSVG } from "./content.js";

/** Pantalla de carga: pista con un corredor que avanza, ligada a la carga real. */
export function createLoading(ui) {
  const fill = h("div.load-fill"), me = h("div.load-runner", { html: runnerSVG(undefined, 40) });
  const pct = h("span.load-pct", { text: "0%" });
  const tips = demoData.loadingTips || [];
  const tip = h("p.load-tip", { text: tips[0] || "" });
  const flag = h("div.load-flag", { html: '<svg viewBox="0 0 26 40" width="26" height="40"><path d="M3 38V3" stroke="#1B1F3B" stroke-width="3"/><path d="M4 4h18v12H4z" fill="#fff" stroke="#1B1F3B" stroke-width="2"/><path d="M4 4h6v6H4zM16 4h6v6h-6zM10 10h6v6h-6z" fill="#1B1F3B"/></svg>' });
  const el = h("div.loading", { role: "status", "aria-live": "polite" },
    h("h1.loading-title", { text: inviteTitle() }),
    h("div.load-track", { role: "progressbar", "aria-label": "Cargando", "aria-valuemin": 0, "aria-valuemax": 100 }, h("div.load-lane", fill), me, flag),
    pct, tip);
  ui.append(el);
  let ti = 0;
  const tt = setInterval(() => { tip.style.opacity = "0"; setTimeout(() => { ti = (ti + 1) % Math.max(1, tips.length); tip.textContent = tips[ti] || ""; tip.style.opacity = "1"; }, 300); }, 1400);
  return {
    set(p) {
      const v = Math.round(Math.max(0, Math.min(1, p)) * 100);
      fill.style.width = `${v}%`; me.style.left = `${v}%`; pct.textContent = `${v}%`;
      el.querySelector(".load-track").setAttribute("aria-valuenow", v);
    },
    async done() { clearInterval(tt); el.classList.add("is-out"); await sleep(450); el.remove(); }
  };
}

/** "TOCA PARA EMPEZAR": desbloquea el audio en el toque; nunca avanza solo. */
export function showStart(ui, { audio, onTap }) {
  const btn = h("button.fl.fl-coral.fl-lg.start-btn", { type: "button" }, h("span", { text: "TOCA PARA EMPEZAR" }));
  const el = h("div.start", { role: "dialog", "aria-label": "Toca para empezar" },
    h("h1.start-title", h("span", { text: `¡Cumple ${demoData.child.age}!` }), inviteTitle()),
    h("div.start-bottom", btn, audio.supported() ? h("p.sound-hint", { html: `${icon("soundOn", { size: 20, stroke: "#fff" })}<span>Mejor con sonido</span>` }) : null));
  ui.append(el);
  btn.focus({ preventScroll: true });
  return new Promise((resolve) => {
    const tap = (e) => { e.preventDefault(); el.removeEventListener("click", tap); onTap?.(); el.remove(); resolve(); };
    el.addEventListener("click", tap);
  });
}

/** Menú de salida: título, dorsal, JUGAR / VER LA CARRERA / SOLO LA INFO y mejor tiempo. */
export function createMenu(ui, { onPlay, onWatch, onInfo, soundBtn }) {
  const best = h("p.best");
  const watchLabel = h("span");
  const el = h("div.menu",
    h("div.menu-top",
      h("h1.start-title", h("span", { text: `¡Cumple ${demoData.child.age}!` }), inviteTitle()),
      h("span.bib-badge", { html: `Dorsal <b>${bib()}</b>` }),
      best, soundBtn),
    h("div.menu-btns",
      h("button.fl.fl-coral.fl-lg", { type: "button", onclick: onPlay, html: `${icon("play", { fill: "#fff", stroke: "#1B1F3B", size: 26 })}<span>JUGAR</span>` }),
      h("button.fl.fl-blue", { type: "button", onclick: onWatch }, watchLabel),
      h("button.fl.fl-white", { type: "button", onclick: onInfo, html: `${icon("info")}<span>SOLO LA INFO</span>` })));
  return {
    el,
    show({ bestTime }) {
      best.hidden = bestTime == null;
      best.innerHTML = bestTime != null ? `Tu mejor tiempo: <b>${fmtTime(bestTime)}</b>` : "";
      watchLabel.textContent = prefersReduced() ? "RECORRIDO TRANQUILO" : "VER LA CARRERA";
      if (!el.isConnected) ui.append(el);
    },
    hide() { el.remove(); }
  };
}

/** Tutorial: "TOCA PARA SALTAR" (espera el toque); a los 3 s aparece una manita. */
export function tutorialPrompt(ui) {
  const hand = h("div.hand", { html: '<svg viewBox="0 0 64 64" width="64" height="64"><path d="M26 30V12a4 4 0 018 0v14l12 3c3 .8 5 3.6 4.6 6.6L48 50H28L18 38a3.5 3.5 0 015-5z" fill="#fff" stroke="#1B1F3B" stroke-width="3.5" stroke-linejoin="round"/><path d="M30 8a10 10 0 00-10 0M34 8a10 10 0 0110 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>', style: { left: "50%", top: "46%" } });
  const el = h("div.tut", { role: "status" }, h("p.tut-label", { text: "TOCA PARA SALTAR" }), h("p.tut-sub", { text: "Salta el charquito para calentar" }));
  ui.append(el, hand);
  const t = setTimeout(() => hand.classList.add("is-on"), 3000);
  return { hide() { clearTimeout(t); el.remove(); hand.remove(); } };
}

/** Semáforo 3 · 2 · 1 · ¡FUERA! con pitidos y silbatazo. */
export async function runCountdown(ui, audio) {
  const lights = [h("i"), h("i"), h("i")];
  const num = h("div.sem-num");
  const el = h("div.semaphore", { role: "status", "aria-live": "assertive" }, h("div.lights", ...lights), num);
  ui.append(el);
  const steps = [["3", "on-r", 0], ["2", "on-y", 1], ["1", "on-y", 2]];
  for (const [n, cls, k] of steps) {
    lights[k].className = cls; num.textContent = n; num.style.animation = "none"; void num.offsetWidth; num.style.animation = "";
    audio.beep(false);
    await sleep(700);
  }
  lights.forEach((l) => (l.className = "on-g"));
  num.textContent = "¡FUERA!"; num.style.animation = "none"; void num.offsetWidth; num.style.animation = "";
  audio.beep(true); audio.whistle();
  await sleep(550);
  el.remove();
}
/** Mini 3·2·1 rápido al continuar después de una tarjeta. */
export async function miniCount(ui, audio) {
  const num = h("div.sem-num");
  const el = h("div.semaphore", { role: "status" }, num);
  ui.append(el);
  for (const n of ["3", "2", "1"]) { num.textContent = n; num.style.animation = "none"; void num.offsetWidth; num.style.animation = ""; audio.beep(false); await sleep(prefersReduced() ? 200 : 300); }
  el.remove();
}
