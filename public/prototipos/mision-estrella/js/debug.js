// Panel de pruebas (sólo con ?debug=1; se carga dinámicamente): saltar a capítulos, FPS / draw calls / calidad,
// forzar calidad, simular días restantes, reiniciar localStorage, repetir el despegue, silenciar por bus,
// forzar reduced-motion o la versión sin WebGL y "Exportar póster" (1080×1920 y 1200×630).
import { h, clock, eventInfo, prefersReduced, setForcedReduced, missionName } from "./util.js";
import { demoData } from "./data.js";

export function initDebug({ R, film, scroll, monitor, audio, state, getLevel, setLevel, replay, jump }) {
  const perf = h("div.debug-perf"), aud = h("div.debug-perf");
  const btn = (text, fn, on) => { const b = h("button", { type: "button", onclick: () => fn(b) }, text); if (on) b.classList.add("is-on"); return b; };
  const toggle = (text, get, set) => btn(text, (b) => { set(!get()); b.classList.toggle("is-on", get()); }, get());
  const DAY = 86400000, ev = eventInfo();
  const qBtns = ["low", "medium", "high"].map((l) => btn({ low: "Baja", medium: "Media", high: "Alta" }[l], () => { setLevel(l); qBtns.forEach((b, i) => b.classList.toggle("is-on", ["low", "medium", "high"][i] === l)); }, getLevel() === l));
  const reload = (k, v) => { const u = new URL(location.href); if (v) u.searchParams.set(k, "1"); else u.searchParams.delete(k); location.href = u.href; };
  const panel = h("div.debug", { role: "region", "aria-label": "Panel de pruebas" },
    h("div.debug-head", h("span", { text: "🛠 Debug" }), btn("–", () => panel.classList.toggle("is-min"))),
    perf,
    h("h4", { text: "Ir a capítulo" }),
    h("div.debug-row", ...Array.from({ length: 9 }, (_, i) => btn(String(i + 1), () => jump(i + 1)))),
    h("h4", { text: "Calidad" }), h("div.debug-row", ...qBtns),
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
    h("div.debug-row", btn("Exportar póster", () => exportPoster())));
  document.body.append(panel);
  if (matchMedia("(max-width: 600px)").matches) panel.classList.add("is-min");
  setInterval(() => {
    perf.textContent = `FPS ${monitor.fps} · draw calls ${R.drawCalls()} · calidad ${getLevel()} · DPR ${R.dpr.toFixed(2)} · modo ${film.mode} · cap. ${film.chapter}`;
    const a = audio.sources();
    aud.textContent = `ctx ${a.ctx} · voces ${a.voices} · limitador ${Number(a.reduction || 0).toFixed(1)} dB · continuas: ${a.continuous.length ? a.continuous.join(" | ") : "ninguna"}`;
  }, 400);

  /** Renderiza la portada a un tamaño fijo y descarga el PNG. og = añade título e insignia (1200×630). */
  function renderAt(w, hh) {
    const { renderer, camera } = R;
    const prevOffset = camera.view ? { ...camera.view } : null;
    renderer.setPixelRatio(1); renderer.setSize(w, hh, false);
    camera.aspect = w / hh; camera.clearViewOffset(); camera.updateProjectionMatrix();
    film.renderCover(performance.now() / 1000);
    renderer.render(film.world && R.scene, camera);
    const out = document.createElement("canvas"); out.width = w; out.height = hh;
    out.getContext("2d").drawImage(renderer.domElement, 0, 0, w, hh);
    R.resize(true);
    if (prevOffset?.enabled) camera.setViewOffset(prevOffset.fullWidth, prevOffset.fullHeight, prevOffset.offsetX, prevOffset.offsetY, prevOffset.width, prevOffset.height);
    return out;
  }
  function download(cv, name) { cv.toBlob((b) => { const u = URL.createObjectURL(b); const a = h("a", { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 3000); }, "image/png"); }
  function exportPoster() {
    download(renderAt(1080, 1920), "poster-1080x1920.png");
    const og = renderAt(1200, 630), c = og.getContext("2d");
    c.textAlign = "center"; c.fillStyle = "#FFF7EC"; c.shadowColor = "rgba(30,27,75,.6)"; c.shadowBlur = 24;
    c.font = "600 84px Fredoka, system-ui, sans-serif"; c.fillText(missionName(), 600, 130);
    c.font = "600 44px Fredoka, system-ui, sans-serif"; c.fillStyle = "#FFD27A"; c.fillText(`¡Cumple ${demoData.child.age}!`, 600, 196);
    setTimeout(() => download(og, "og-image-1200x630.png"), 400);
  }
  window.__exportPoster = { renderAt };
}
