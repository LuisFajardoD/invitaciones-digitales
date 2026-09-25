// Panel de pruebas (sólo con ?debug=1; se carga dinámicamente). Compatible con ?demo=1.
import { h, clock, eventInfo, prefersReduced, setForcedReduced } from "./util.js";
import { audio } from "./audio.js";

export function initDebug({ game, state, showMenu, countdown }) {
  const perf = h("div.debug-perf");
  const btn = (text, fn, on) => { const b = h("button", { type: "button", onclick: () => { fn(b); } }, text); if (on) b.classList.add("is-on"); return b; };
  const toggle = (text, get, set) => btn(text, (b) => { set(!get()); b.classList.toggle("is-on", get()); }, get());
  let inv = false, hb = false, ambOn = false;
  const audioInfo = h("div.debug-perf");
  const ev = eventInfo(), DAY = 86400000;
  const panel = h("div.debug", { role: "region", "aria-label": "Panel de pruebas" },
    h("div.debug-head", h("span", { text: "🛠 Debug" }), btn("–", () => panel.classList.toggle("is-min"))),
    perf,
    h("h4", { text: "Ir a" }),
    h("div.debug-row", ...[1, 2, 3, 4].map((n) => btn(`Control ${n}`, () => { ensureRace(); game.jumpTo(n); })), btn("Meta", () => { ensureRace(); game.jumpTo(5); })),
    h("h4", { text: "Juego" }),
    h("div.debug-row",
      toggle("Invencible", () => inv, (v) => { inv = v; game.setInvincible(v); }),
      toggle("Hitboxes", () => hb, (v) => { hb = v; game.setHitboxes(v); }),
      toggle("Automático", () => game.auto, (v) => game.setAuto(v)),
      toggle("Reduced motion", () => prefersReduced(), (v) => setForcedReduced(v))),
    h("h4", { text: "Días restantes" }),
    h("div.debug-row", ...[30, 15, 5, 1].map((d) => btn(`${d}d`, () => clock.setOffset(ev.start - d * DAY - Date.now()))),
      btn("Hoy", () => clock.setOffset(ev.start - 2 * 3600000 - Date.now())), btn("Pasó", () => clock.setOffset(ev.end + DAY - Date.now())), btn("Real", () => clock.reset())),
    h("h4", { text: "Audio (silenciar)" }),
    h("div.debug-row",
      toggle("Música", () => audio.isMuted("music"), (v) => audio.setMuted("music", v)),
      toggle("Ambiente", () => audio.isMuted("amb"), (v) => audio.setMuted("amb", v)),
      toggle("Efectos", () => audio.isMuted("sfx"), (v) => audio.setMuted("sfx", v)),
      toggle("Agua (opcional)", () => ambOn, (v) => { ambOn = v; audio.ambient(v); })),
    audioInfo,
    h("h4", { text: "Estado" }),
    h("div.debug-row", btn("Reiniciar localStorage", () => { state.reset(); location.reload(); }), btn("Menú", () => showMenu())));
  function ensureRace() { if (!["race", "splash", "card", "cp", "resume"].includes(game.mode)) { document.querySelectorAll(".menu, .sheet, .modal").forEach((e) => e.remove()); game.startRace({ auto: game.auto }); window.dispatchEvent(new CustomEvent("circuito:race")); } }
  document.body.append(panel);
  setInterval(() => { perf.textContent = `FPS ${game.fps} · calidad ${game.quality === 2 ? "alta" : "baja"} · modo ${game.mode} · t ${game.time.toFixed(1)}s`;
    const a = audio.sources();
    audioInfo.textContent = `ctx ${a.ctx} · ${a.enabled ? "on" : "off"} · voces ${a.voices} · limitador ${Number(a.reduction || 0).toFixed(1)} dB\nContinuas: ${a.continuous.length ? a.continuous.join(" | ") : "ninguna"}`;
  }, 400);
}
