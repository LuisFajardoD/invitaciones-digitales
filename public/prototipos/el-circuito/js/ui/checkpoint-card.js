// Tarjetas de los puntos de control (máx. ~50 % del alto, ajustadas a su contenido).
// No se cierran solas; en el modo automático, sí: a los 6 s, con barra de progreso en el botón.
import { h, prefersReduced } from "../util.js";
import { sheet, dateBlock, countdown, calendarRow, venueBlock, mapsRow, dressBlock, itineraryList, giftsList, sectionCard, SECTIONS } from "./content.js";

// Mismo color por sección que en la hoja de info.
const CARDS = {
  1: { title: "¿Cuándo?", sec: "fecha" },
  2: { title: "¿Dónde?", sec: "lugar" },
  3: { title: "Programa de la carrera", sec: "programa" },
  4: { title: "Mesa de regalos", sec: "regalos" }
};

export function openCheckpointCard(ui, n, { audio, auto = false, onContinue }) {
  let cd = null;
  const content = (() => {
    if (n === 1) { cd = countdown(); return [dateBlock(), cd.el, calendarRow(audio)]; }
    if (n === 2) return [venueBlock(), mapsRow(audio), dressBlock()];
    if (n === 3) return itineraryList();
    return giftsList(audio);
  })();
  const body = sectionCard(CARDS[n].sec, content, { titled: false });
  const bar = h("span.bar");
  const btn = h("button.fl.fl-coral.fl-lg.fl-block.continue", { type: "button" }, h("span", { text: "¡Seguir corriendo! ▶" }), bar);
  const c = sheet(ui, { kicker: `Punto de control ${n} de 4`, title: CARDS[n].title, body, foot: btn, stripe: SECTIONS[CARDS[n].sec].color, cls: "cp-sheet" });
  let done = false, raf = 0;
  const go = async () => {
    if (done) return; done = true;
    cancelAnimationFrame(raf); cd?.stop(); audio.tap();
    await c.close();
    onContinue();
  };
  btn.addEventListener("click", go);
  if (auto) { // modo automático: se cierra sola a los 6 s
    const t0 = performance.now(), T = 6000;
    const tick = (now) => { const p = Math.min(1, (now - t0) / T); bar.style.width = `${p * 100}%`; if (p >= 1) go(); else raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }
  setTimeout(() => btn.focus({ preventScroll: true }), prefersReduced() ? 0 : 350);
  return c;
}
