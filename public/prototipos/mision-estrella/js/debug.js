// Panel de pruebas (sólo con ?debug=1; se carga dinámicamente): saltar a capítulos, FPS / draw calls / calidad,
// forzar calidad, simular días restantes, reiniciar localStorage, repetir el despegue, silenciar por bus,
// forzar reduced-motion o la versión sin WebGL y "Regenerar póster y OG" (ver posterTools y
// tools/regenerar-poster.mjs, que genera todas las variantes).
import { h, clock, eventInfo, prefersReduced, setForcedReduced, missionName } from "./util.js";
import { demoData } from "./data.js";
import { THEMES } from "./themes.js";

export function initDebug({ R, film, scroll, monitor, audio, state, getLevel, setLevel, replay, jump }) {
  const { exportPoster } = posterTools({ R, film });
  const perf = h("div.debug-perf"), aud = h("div.debug-perf");
  const btn = (text, fn, on) => { const b = h("button", { type: "button", onclick: () => fn(b) }, text); if (on) b.classList.add("is-on"); return b; };
  const toggle = (text, get, set) => btn(text, (b) => { set(!get()); b.classList.toggle("is-on", get()); }, get());
  const DAY = 86400000, ev = eventInfo();
  const qBtns = ["low", "medium", "high"].map((l) => btn({ low: "Baja", medium: "Media", high: "Alta" }[l], () => { setLevel(l); qBtns.forEach((b, i) => b.classList.toggle("is-on", ["low", "medium", "high"][i] === l)); }, getLevel() === l));
  // tema de color en vivo (escena 3D, reflejos, parche e interfaz): film.setTheme
  const themeBtns = (film.themes || []).map((k) => btn(THEMES[k].label, () => { film.setTheme(k); themeBtns.forEach((b, i) => b.classList.toggle("is-on", film.themes[i] === k)); }, film.themeKey === k));
  const reload = (k, v) => { const u = new URL(location.href); if (v) u.searchParams.set(k, "1"); else u.searchParams.delete(k); location.href = u.href; };
  const panel = h("div.debug", { role: "region", "aria-label": "Panel de pruebas" },
    h("div.debug-head", h("span", { text: "🛠 Debug" }), btn("–", () => panel.classList.toggle("is-min"))),
    perf,
    h("h4", { text: "Ir a capítulo" }),
    h("div.debug-row", ...Array.from({ length: 9 }, (_, i) => btn(String(i + 1), () => jump(i + 1)))),
    h("h4", { text: "Calidad" }), h("div.debug-row", ...qBtns),
    h("h4", { text: "Tema de color" }), h("div.debug-row", ...themeBtns),
    h("h4", { text: "Días restantes" }),
    h("div.debug-row", ...[30, 5].map((d) => btn(`${d}`, () => clock.setOffset(ev.start - d * DAY - Date.now()))),
      btn("0 (hoy)", () => clock.setOffset(ev.start - 2 * 3600000 - Date.now())), btn("-1", () => clock.setOffset(ev.end + DAY - Date.now())), btn("Real", () => clock.reset())),
    h("h4", { text: "Audio (silenciar bus)" }),
    h("div.debug-row", toggle("Música", () => audio.isMuted("music"), (v) => audio.setMuted("music", v)), toggle("Efectos", () => audio.isMuted("sfx"), (v) => audio.setMuted("sfx", v))),
    aud,
    h("h4", { text: "Modos" }),
    h("div.debug-row",
      toggle("Reduced motion", () => prefersReduced(), (v) => setForcedReduced(v)),
      btn("Sin WebGL", () => reload("nowebgl", true)),
      btn("Repetir despegue", () => replay()),
      btn("Reiniciar localStorage", () => { state.reset(); location.reload(); })),
    h("h4", { text: "Póster" }),
    h("div.debug-row", btn("Regenerar póster y OG", () => exportPoster())));
  document.body.append(panel);
  if (matchMedia("(max-width: 600px)").matches) panel.classList.add("is-min");
  setInterval(() => {
    perf.textContent = `FPS ${monitor.fps} · draw calls ${R.drawCalls()} · calidad ${getLevel()} · DPR ${R.dpr.toFixed(2)} · modo ${film.mode} · cap. ${film.chapter}`;
    const a = audio.sources();
    aud.textContent = `ctx ${a.ctx} · voces ${a.voices} · limitador ${Number(a.reduction || 0).toFixed(1)} dB · continuas: ${a.continuous.length ? a.continuous.join(" | ") : "ninguna"}`;
  }, 400);
}

/**
 * Herramientas del póster (también en ?showcase=1&debug=1, donde no hay panel). window.__exportPoster = { capture, og }.
 */
export function posterTools({ R, film }) {
  /**
   * Captura la portada con el MISMO encuadre que se ve (tamaño y franja del escenario actual, fase 0 de la deriva),
   * a `scale` píxeles por punto, sin textos. Devuelve { canvas, focus } (focus = centro del grupo en fracciones).
   */
  function capture(scale = 2) {
    const { renderer, camera } = R, { w, h: hh } = R.size;
    renderer.setPixelRatio(scale); renderer.setSize(w, hh, false);
    film.renderCover(performance.now() / 1000);
    renderer.render(R.scene, camera);
    const out = document.createElement("canvas"); out.width = Math.round(w * scale); out.height = Math.round(hh * scale);
    out.getContext("2d").drawImage(renderer.domElement, 0, 0, out.width, out.height);
    const focus = film.coverFocus();
    R.resize(true);
    return { canvas: out, focus };
  }
  /** Imagen OG (1200×630): la portada en horizontal con el título y la insignia. */
  function og() {
    const { canvas } = capture(1200 / R.size.w), c = canvas.getContext("2d");
    c.textAlign = "center"; c.fillStyle = "#FFF7EC"; c.shadowColor = "rgba(30,27,75,.6)"; c.shadowBlur = 24;
    c.font = "600 84px Fredoka, system-ui, sans-serif"; c.fillText(missionName(), canvas.width / 2, 110);
    c.font = "600 44px Fredoka, system-ui, sans-serif"; c.fillStyle = "#FFD27A"; c.fillText(`¡Cumple ${demoData.child.age}!`, canvas.width / 2, 172);
    return canvas;
  }
  function download(cv, name, type = "image/png") { cv.toBlob((b) => { const u = URL.createObjectURL(b); const a = h("a", { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); }, type, 0.82); }
  /** Botón: descarga el póster de la proporción actual (y la OG si la ventana está en horizontal).
   *  Para regenerar TODAS las variantes y escribirlas en assets/: `node tools/regenerar-poster.mjs` (ver README). */
  function exportPoster() {
    const { w, h: hh } = R.size, { canvas, focus } = capture(2);
    download(canvas, `poster-${w}x${hh}-foco-${Math.round(focus.x * 100)}-${Math.round(focus.y * 100)}.webp`, "image/webp");
    if (w > hh) setTimeout(() => download(og(), "og-image.png"), 400);
  }
  window.__exportPoster = { capture, og };
  return { capture, og, exportPoster };
}
