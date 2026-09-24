// "Solo la info": hoja expandida con toda la información de la fiesta en HTML real.
import { demoData } from "../data.js";
import { h, inviteTitle } from "../util.js";
import { state } from "../state.js";
import { sheet, icon, dateBlock, countdown, venueBlock, mapsRow, calendarRow, itineraryList, dressBlock, giftsList, albumGrid, hostsBlock, openViewer } from "./content.js";
import { savedRsvp } from "./rsvp.js";

export function openInfo(ui, { audio, onPlay, onRsvp, onClose, playLabel = "¡Mejor quiero jugar! 🏁" }) {
  const cd = countdown();
  const r = savedRsvp();
  const close = async (fn) => { cd.stop(); ui.closest(".app")?.classList.remove("is-cover"); await c.close(); fn?.(); };
  const body = h("div.stack",
    h("button.fl.fl-coral.fl-block", { type: "button", onclick: () => { audio.tap(); close(onPlay); } }, h("span", { text: playLabel })),
    h("div.info-hero", h("h2", { text: inviteTitle() }), h("p", { text: `¡${demoData.child.name} cumple ${demoData.child.age} años!` })),
    h("h3.section-t", { text: "Fecha y hora" }), dateBlock(), cd.el,
    h("h3.section-t", { text: "Lugar" }), venueBlock(), mapsRow(audio),
    calendarRow(audio),
    h("h3.section-t", { text: "Programa de la carrera" }), itineraryList(),
    dressBlock(),
    h("h3.section-t", { text: "Mesa de regalos" }), giftsList(audio),
    h("h3.section-t", { text: "Álbum de fotos" }), albumGrid(state.get().photosEver, (i) => openViewer(ui, i, audio)),
    hostsBlock(),
    h("button.fl.fl-blue.fl-lg.fl-block", { type: "button", onclick: () => { audio.tap(); close(onRsvp); } }, h("span", { text: r ? (r.attending ? "Ver mi inscripción" : "Cambiar mi respuesta") : "Confirmar asistencia" })));
  const closeBtn = h("button.fl.fl-white.fl-round", { type: "button", "aria-label": "Cerrar información", html: icon("close"), style: { position: "absolute", top: "18px", right: "12px", zIndex: "2" }, onclick: () => { audio.tap(); close(onClose); } });
  const c = sheet(ui, { kicker: "Solo la info", title: "Todo sobre la fiesta", body, stripe: "var(--water)", cls: "is-tall.info-sheet", label: "Información de la fiesta" });
  c.el.append(closeBtn);
  c.el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(onClose); });
  ui.closest(".app")?.classList.add("is-cover");
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 50);
  return { close: () => close(onClose) };
}
