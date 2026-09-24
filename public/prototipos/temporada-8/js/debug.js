// Panel de pruebas (sólo con ?debug=1). Se carga dinámicamente: no existe sin el parámetro.
import { h, clock, eventInfo, prefersReduced, setForcedReduced } from "./util.js";
import { zoneState } from "./zone.js";

const DAY = 86400000;

export function initDebug({ app, router, state, runLoading, refreshAll, levelUp }) {
  const ev = eventInfo();
  const nowLabel = h("p.debug-now");
  let activeDays = null;

  function simulate(days) {
    activeDays = days;
    if (days === null) clock.reset();
    else {
      let target;
      if (days > 0) target = ev.start - days * DAY;
      else if (days === 0) target = ev.start - 3 * 3600000; // mismo día, antes de empezar
      else target = ev.end + DAY; // después del evento
      clock.setOffset(target - Date.now());
    }
    refreshAll();
    paint();
  }

  function paint() {
    const z = zoneState();
    nowLabel.textContent = `Ahora: ${new Date(clock.now()).toLocaleString("es-MX")} · fase ${z.phase} · radio ${Math.round(z.radius)}`;
    daysGrid.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", String(activeDays) === b.dataset.d));
    rmBtn.classList.toggle("is-on", prefersReduced());
  }

  const daysGrid = h("div.debug-grid",
    ...[30, 15, 5, 1, 0, -1].map((d) => h("button", { type: "button", "data-d": String(d), text: d === 0 ? "0 (hoy)" : d === -1 ? "-1 (pasó)" : `${d}d`, onclick: () => simulate(d) })),
    h("button", { type: "button", "data-d": "null", text: "Real", onclick: () => simulate(null) }));

  const rmBtn = h("button", { type: "button", text: "Reduced motion", onclick: () => { setForcedReduced(!rmBtn.classList.contains("is-on")); paint(); } });

  const views = ["lobby", "salto", "mision", "mapa", "pase", "tienda", "escuadron", "repeticiones"];
  const jump = h("select", { "aria-label": "Ir a pantalla", onchange: (e) => { const v = e.target.value; e.target.value = ""; if (!v) return; go(v); } },
    h("option", { value: "", text: "Ir a…" }),
    ...views.map((v) => h("option", { value: v, text: v === "repeticiones" ? "mejores momentos" : v })),
    h("option", { value: "carga", text: "carga" }),
    h("option", { value: "nivel", text: "subir de nivel" }));

  function go(v) {
    if (v === "carga") { runLoading(); return; }
    if (v === "nivel") { if (router.current() !== "lobby") router.navigate("lobby"); setTimeout(levelUp, 400); return; }
    if (router.current() === "salto" && v !== "salto") router.navigate("lobby");
    setTimeout(() => router.navigate(v), router.current() === "lobby" ? 0 : 450);
  }

  const panel = h("div.debug", { role: "region", "aria-label": "Panel de pruebas" },
    h("div.debug-head", h("span", { text: "🛠 Debug" }), h("button", { type: "button", text: "–", "aria-label": "Minimizar", onclick: () => panel.classList.toggle("is-min") })),
    h("h4", { text: "Días restantes (zona)" }), daysGrid, nowLabel,
    h("h4", { text: "Estado" }),
    h("div.debug-grid",
      h("button", { type: "button", text: "Reiniciar (1ª visita)", onclick: () => { state.reset(); location.replace(location.pathname + location.search); } }),
      rmBtn),
    h("h4", { text: "Pantallas" }), jump);
  document.body.append(panel);
  paint();
  setInterval(paint, 1000);
}
