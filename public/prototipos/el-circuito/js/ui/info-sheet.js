// "Solo la info": hoja expandida con toda la información de la fiesta en HTML real.
// Encabezado fijo (con accesos rápidos por sección), una tarjeta por sección y barra fija de confirmar.
import { demoData } from "../data.js";
import { h, inviteTitle, prefersReduced } from "../util.js";
import { state } from "../state.js";
import { sheet, icon, dateBlock, countdown, venueBlock, mapsRow, calendarRow, itineraryList, dressBlock, giftsList, albumGrid, openViewer, sectionCard, SECTIONS } from "./content.js";
import { savedRsvp } from "./rsvp.js";

export function openInfo(ui, { audio, onPlay, onRsvp, onClose, playLabel = "¡Mejor quiero jugar! 🏁" }) {
  const cd = countdown();
  const r = savedRsvp();
  const close = async (fn) => { cd.stop(); ui.closest(".app")?.classList.remove("is-cover"); await c.close(); fn?.(); };
  const cards = {
    fecha: sectionCard("fecha", [dateBlock(), cd.el, calendarRow(audio)]),
    lugar: sectionCard("lugar", [venueBlock(), mapsRow(audio), dressBlock()]),
    programa: sectionCard("programa", itineraryList()),
    regalos: sectionCard("regalos", giftsList(audio)),
    fotos: sectionCard("fotos", albumGrid(state.get().photosEver, (i) => openViewer(ui, i, audio)))
  };
  const body = h("div.info-list",
    h("div.info-hero",
      h("h2", { text: inviteTitle() }),
      h("p", { text: `¡${demoData.child.name} cumple ${demoData.child.age} años!` }),
      h("p.info-hosts", { text: `Te esperan: ${demoData.hosts}` }),
      h("button.fl.fl-white.fl-sm.info-play", { type: "button", onclick: () => { audio.tap(); close(onPlay); } }, h("span", { text: playLabel }))),
    ...Object.values(cards));

  // Accesos rápidos: scroll suave a la sección y resaltado de la sección visible.
  const chips = Object.entries(SECTIONS).map(([k, s]) => h("button.chip", { type: "button", "aria-controls": `sec-${k}`, "data-sec": k, onclick: () => goTo(k) }, `${s.emoji} ${s.label}`));
  const chipRow = h("nav.info-chips", { "aria-label": "Ir a la sección" }, ...chips);
  let active = "", lockUntil = 0;
  function setActive(k) {
    if (k === active) return;
    active = k;
    chips.forEach((b) => { const on = b.dataset.sec === k; b.classList.toggle("is-on", on); b.setAttribute("aria-current", on ? "true" : "false"); });
    const b = chips.find((x) => x.dataset.sec === k);
    if (b) chipRow.scrollTo({ left: b.offsetLeft - (chipRow.clientWidth - b.offsetWidth) / 2, behavior: prefersReduced() ? "auto" : "smooth" });
  }
  function goTo(k) {
    audio.tap();
    setActive(k); lockUntil = performance.now() + 700;
    c.body.scrollTo({ top: Math.max(0, cards[k].offsetTop - 12), behavior: prefersReduced() ? "auto" : "smooth" });
  }
  function onScroll() {
    if (performance.now() < lockUntil) return;
    const b = c.body, y = b.scrollTop + 40;
    if (b.scrollTop + b.clientHeight >= b.scrollHeight - 4) { setActive("fotos"); return; }
    let k = "fecha";
    for (const [key, el] of Object.entries(cards)) if (el.offsetTop <= y) k = key;
    setActive(k);
  }

  const rsvpBtn = h("button.fl.fl-coral.fl-lg.fl-block.info-rsvp", { type: "button", onclick: () => { audio.tap(); close(onRsvp); } },
    h("span", { text: r ? (r.attending ? "Ver mi inscripción 🏁" : "Cambiar mi respuesta") : "¡Confirmar asistencia! 🏁" }));
  const closeBtn = h("button.fl.fl-white.fl-round.info-close", { type: "button", "aria-label": "Cerrar información", html: icon("close"), onclick: () => { audio.tap(); close(onClose); } });
  const c = sheet(ui, { kicker: "Solo la info", title: "Todo sobre la fiesta", headExtra: chipRow, body, foot: rsvpBtn, stripe: "var(--water)", cls: "is-tall.info-sheet", label: "Información de la fiesta" });
  c.el.append(closeBtn);
  c.body.addEventListener("scroll", onScroll, { passive: true });
  setActive("fecha");
  c.el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(onClose); });
  ui.closest(".app")?.classList.add("is-cover");
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 50);
  return { close: () => close(onClose) };
}
