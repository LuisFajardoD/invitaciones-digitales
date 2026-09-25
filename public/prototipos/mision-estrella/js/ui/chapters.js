// Tarjetas HTML de cada capítulo (fondo índigo translúcido, texto claro), sincronizadas con el scroll: entran y
// salen según el progreso del capítulo. En móvil van abajo, sin tapar al protagonista 3D.
import { h, tpl, eventInfo, missionName } from "../util.js";
import { demoData } from "../data.js";
import { icon } from "./icons.js";
import { dateLine, countdownText, calendarButtons, venueBlock, mapsButtons, transportBlock, itineraryList, giftsList, dressBlock } from "./content.js";
import { peopleLabel } from "../../../_shared/rsvp-contract.js";

export const CHAPTER_LABELS = ["Despegue", "Caminata espacial", "La constelación", "La Luna", "Estación espacial", "Cinturón de recuerdos", "Plan de vuelo", "Tripulación", "Te esperamos a bordo"];

export function createChapters(root, { audio, onJoin, onDecline, onEdit, onResend, onLog, onReplay, onGiftFocus, getRsvp, crewCount }) {
  const wrap = h("div.cards"); root.append(wrap);
  const card = (n, kicker, ...body) => h(`section.card.card-${n}`, { "aria-label": CHAPTER_LABELS[n - 1], "aria-hidden": "true" }, kicker ? h("p.kicker", { text: kicker }) : null, ...body);
  const cd = countdownText();
  const planList = h("div"), setPlan = (i) => planList.replaceChildren(itineraryList(i));
  setPlan(-1);
  const crewBody = h("div.stack");
  const gifts = giftsList(audio, { onFocus: (i) => { audio.tap(); onGiftFocus?.(i); } });
  const cards = {
    2: card(2, "Caminata espacial", h("p.big", { text: tpl(demoData.tagline) })),
    3: card(3, "La constelación", h("p.big", { text: `¡${demoData.child.name} cumple ${demoData.child.age}!` }), h("p.hint", { html: `${icon("star", { size: 16 })} Toca una estrella` })),
    // (la cuenta regresiva está en los satélites 3D y la fecha grande en la Luna: aquí sólo fecha + horario y los
    // botones; la cuenta regresiva queda en texto para lectores de pantalla)
    4: card(4, "Fecha de lanzamiento", dateLine(), cd.el, calendarButtons(audio, { note: false })),
    5: card(5, "Punto de encuentro", venueBlock(), mapsButtons(audio), transportBlock()),
    6: card(6, "Cinturón de recuerdos", h("p.big.big-sm", { text: "Nuestros momentos favoritos" }), h("p.hint", { html: `${icon("photo", { size: 16 })} Toca una foto para verla` })),
    7: [
      card(7, "Plan de vuelo", planList),
      card(7, "Carga de la misión", gifts),
      card(7, null, dressBlock())
    ],
    8: card(8, `${missionName()}`, crewBody),
    9: card(9, null, h("p.big", { text: `Te esperamos a bordo, ${eventInfo().dateShort}` }), h("div.btn-row.final-row"))
  };
  const finalRow = cards[9].querySelector(".final-row");
  Object.values(cards).flat().forEach((c) => wrap.append(c));

  function renderCrew() {
    const r = getRsvp();
    const n = crewCount();
    const header = [h("h2.crew-t", { text: "ÚNETE A LA TRIPULACIÓN" }), h("p.deadline", { html: `${icon("clock", { size: 16 })}<span>${demoData.rsvp.deadlineText}</span>` }), h("p.crew-n", { html: `<b>${n}</b> tripulantes a bordo` })];
    if (r?.attending) {
      crewBody.replaceChildren(h("p.crew-t.crew-done", { html: `${icon("check", { size: 20 })}<span>Ya eres parte de la tripulación</span>` }), h("p.muted", { text: peopleLabel(r) }), h("p.crew-n", { html: `<b>${n}</b> tripulantes a bordo` }),
        h("div.btn-row", h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => onEdit(), html: `${icon("edit", { size: 18 })}<span>Editar</span>` }), h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => onResend(), html: `${icon("send", { size: 18 })}<span>Reenviar</span>` })));
    } else if (r && !r.attending) {
      crewBody.replaceChildren(...header.slice(0, 1), h("p.muted", { text: "Nos dijiste que no podrás venir. ¡Te extrañaremos, tripulante!" }), h("button.btn.btn-pink.btn-block", { type: "button", onclick: () => onJoin() }, "¡Sí podré ir!"));
    } else {
      crewBody.replaceChildren(...header, h("button.btn.btn-pink.btn-lg.btn-block", { type: "button", onclick: () => onJoin(), html: `<span>¡Quiero unirme!</span>${icon("rocket", { size: 22 })}` }), h("button.link", { type: "button", onclick: () => onDecline() }, "No podré asistir"));
    }
    finalRow.replaceChildren(
      h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => onLog(), html: `${icon("log", { size: 18 })}<span>Bitácora</span>` }),
      r?.attending ? null : h("button.btn.btn-pink.btn-sm", { type: "button", onclick: () => onJoin(), html: `${icon("rocket", { size: 18 })}<span>Confirmar</span>` }),
      h("button.btn.btn-ghost.btn-sm", { type: "button", onclick: () => onReplay() }, "↺ Ver la misión otra vez"));
  }
  renderCrew();

  // Ventanas de visibilidad [desde, hasta] del progreso del capítulo.
  const WIN = { 2: [0.56, 0.98], 3: [0.62, 0.99], 4: [0.36, 0.98], 5: [0.36, 0.98], 6: [0.3, 0.97], 8: [0.34, 1.01], 9: [0.45, 1.01] };
  const SUB7 = [[0.24, 0.56], [0.6, 0.82], [0.84, 1.01]];
  let visible = null, lastPlan = -2;
  function show(el) {
    if (visible === el) return;
    if (visible) { visible.classList.remove("is-on"); visible.setAttribute("aria-hidden", "true"); }
    visible = el;
    if (el) { el.classList.add("is-on"); el.setAttribute("aria-hidden", "false"); }
  }
  return {
    el: wrap,
    renderCrew,
    /** Regalo tocado en 3D → resalta su fila en la tarjeta de la bodega. */
    highlightGift(i) { gifts.highlight(i); },
    /** Llamar cada frame con el capítulo y el progreso suavizado. */
    /** ¿Hay una tarjeta en pantalla? */
    get visible() { return !!visible; },
    update(chapter, p, { flightActive = -1, hidden = false } = {}) {
      if (hidden) { show(null); return; }
      let el = null;
      if (chapter === 7) SUB7.forEach(([a, b], k) => { if (p >= a && p < b) el = cards[7][k]; });
      else if (WIN[chapter] && p >= WIN[chapter][0] && p < WIN[chapter][1]) el = cards[chapter];
      show(el);
      if (chapter === 7 && flightActive !== lastPlan) { lastPlan = flightActive; setPlan(flightActive); }
    }
  };
}
