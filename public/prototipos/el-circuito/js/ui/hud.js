// HUD de la carrera: barra de progreso de la pista (4 puntos de control + meta y un mini corredor),
// cronómetro, fotos, sonido, info y pausa. También la pausa y "Pasar este obstáculo ⏭".
import { demoData } from "../data.js";
import { h, fmtTime } from "../util.js";
import { icon, runnerSVG } from "./content.js";

export function createHud(ui, { sections, soundBtn, onInfo, onPause }) {
  const total = sections[sections.length - 1];
  const fill = h("div.track-fill");
  const me = h("div.track-me", { html: runnerSVG(undefined, 26) });
  const pct = (x) => `calc(12px + (100% - 30px) * ${Math.max(0, x / total)})`;
  const ics = sections.slice(1).map((x, k) => h(`span.track-ic${k === sections.length - 2 ? ".is-goal" : ""}`, { style: { left: pct(x) }, text: k === sections.length - 2 ? "" : String(k + 1), html: k === sections.length - 2 ? icon("flag", { size: 16 }) : null }));
  const track = h("div.track", { role: "progressbar", "aria-label": "Avance en la pista", "aria-valuemin": 0, "aria-valuemax": 100 }, h("div.track-line"), fill, ...ics, me);
  const timer = h("span.pill.timer", { role: "timer", "aria-label": "Tiempo", text: "00:00.0" });
  const photos = h("span.pill", { "aria-label": "Fotos encontradas", html: `${icon("camera", { size: 20 })}<span class="n">0/${demoData.gallery.length}</span>` });
  const info = h("button.fl.fl-round", { type: "button", "aria-label": "Información de la fiesta", html: icon("info"), onclick: onInfo });
  const pause = h("button.fl.fl-round", { type: "button", "aria-label": "Pausa", html: icon("pause", { sw: 3.2 }), onclick: onPause });
  const el = h("div.hud.is-hidden", track, h("div.hud-row", timer, photos, h("span.grow"), soundBtn, info, pause));
  ui.append(el);
  let lastPct = -1;
  return {
    el,
    show(v) { el.classList.toggle("is-hidden", !v); },
    update({ time, progress, photosN, cpDone }) {
      timer.textContent = fmtTime(time);
      const p = Math.round(progress * 1000) / 1000;
      if (p !== lastPct) {
        lastPct = p;
        fill.style.width = `calc((100% - 30px) * ${p})`;
        me.style.left = `calc(12px + (100% - 30px) * ${p})`;
        track.setAttribute("aria-valuenow", Math.round(p * 100));
      }
      photos.querySelector(".n").textContent = `${photosN}/${demoData.gallery.length}`;
      ics.forEach((ic, k) => ic.classList.toggle("is-done", k < ics.length - 1 && cpDone.has(k + 1)));
    }
  };
}

/** Pausa: Continuar, Reiniciar carrera, Ver info y Salir al menú. */
export function pauseMenu(ui, { onResume, onRestart, onInfo, onMenu }) {
  const close = (fn) => () => { m.remove(); fn(); };
  const first = h("button.fl.fl-lime.fl-block", { type: "button", onclick: close(onResume), html: `${icon("play")}<span>Continuar</span>` });
  const m = h("div.modal", { role: "dialog", "aria-modal": "true", "aria-labelledby": "pause-t", onkeydown: (e) => { if (e.key === "Escape") close(onResume)(); } },
    h("div.modal-card",
      h("h2#pause-t", { text: "Pausa" }),
      h("div.stack",
        first,
        h("button.fl.fl-white.fl-block", { type: "button", onclick: close(onRestart), html: `${icon("replay")}<span>Reiniciar carrera</span>` }),
        h("button.fl.fl-white.fl-block", { type: "button", onclick: close(onInfo), html: `${icon("info")}<span>Ver info</span>` }),
        h("button.fl.fl-white.fl-block", { type: "button", onclick: close(onMenu), html: `${icon("menu")}<span>Salir al menú</span>` }))));
  ui.append(m);
  first.focus({ preventScroll: true });
  return m;
}

/** "Pasar este obstáculo ⏭" (después de 3 fallos en el mismo obstáculo). */
export function skipButton(ui, onSkip) {
  const b = h("button.fl.fl-yellow.skip-ob", { type: "button", onclick: () => { b.remove(); onSkip(); } }, h("span", { text: "Pasar este obstáculo ⏭" }));
  ui.append(b);
  return b;
}
