// Bitácora de la misión: acceso rápido a TODA la información (texto HTML real). Hoja casi completa con encabezado
// fijo, chips de acceso rápido, una tarjeta por sección (franja de color + ícono) y barra fija al fondo con
// "¡Unirme a la tripulación! 🚀". Las secciones opcionales se ocultan si están desactivadas o vacías.
import { h, prefersReduced, missionName } from "../util.js";
import { icon } from "./icons.js";
import { dateBlock, countdown, calendarButtons, venueBlock, mapsButtons, transportBlock, itineraryList, checklistBlock, dressBlock, giftsList, galleryGrid, faqBlock, liveBlock, lodgingBlock, contactBlock } from "./content.js";

const SECTIONS = [
  { k: "fecha", chip: "Fecha", title: "Fecha y hora", icon: "calendar", color: "#6FD6E8" },
  { k: "lugar", chip: "Lugar", title: "Lugar", icon: "pin", color: "#FF8FA3" },
  { k: "plan", chip: "Plan", title: "Plan de vuelo", icon: "route", color: "#FFD27A" },
  { k: "antes", chip: null, title: "Antes del despegue", icon: "checklist", color: "#9BE5B4" },
  { k: "regalos", chip: "Regalos", title: "Carga de la misión", icon: "gift", color: "#B9A2FF" },
  { k: "fotos", chip: "Fotos", title: "Recuerdos", icon: "photo", color: "#FFC9A0" },
  { k: "faq", chip: "Más info", title: "Preguntas frecuentes", icon: "question", color: "#6FD6E8" },
  { k: "live", chip: null, title: "Transmisión en vivo", icon: "broadcast", color: "#FF8FA3" },
  { k: "hospedaje", chip: null, title: "Hospedaje", icon: "bed", color: "#FFD27A" },
  { k: "contacto", chip: null, title: "Contacto directo", icon: "chat", color: "#9BE5B4" }
];

export function openBitacora(root, { audio, onJoin, onClose, onPhoto, rsvpLabel = "¡Unirme a la tripulación! 🚀" }) {
  const cd = countdown();
  const opener = document.activeElement;
  const content = {
    fecha: [dateBlock(), cd.el, calendarButtons(audio)],
    lugar: [venueBlock(), mapsButtons(audio), transportBlock()],
    plan: [itineraryList()],
    antes: [checklistBlock(), dressBlock({ title: "Código de vestimenta" })],
    regalos: [giftsList(audio)],
    fotos: [galleryGrid((i) => onPhoto?.(i))],
    faq: [faqBlock(audio)],
    live: [liveBlock(audio)],
    hospedaje: [lodgingBlock()],
    contacto: [contactBlock(audio)]
  };
  const cards = {};
  const list = h("div.log-list",
    h("div.log-hero", h("p.log-mission", { text: missionName() }), h("p.muted", { text: "Todo lo que necesitas saber para el despegue." })),
    ...SECTIONS.map((s) => {
      const parts = content[s.k].filter(Boolean);
      if (!parts.length) return null;
      cards[s.k] = h(`section.log-card#log-${s.k}`, { style: { "--c": s.color }, "aria-labelledby": `log-${s.k}-t` },
        h("h3.log-card-t", { id: `log-${s.k}-t` }, h("span.log-ic", { html: icon(s.icon, { size: 20 }) }), s.title),
        h("div.log-card-b", ...parts));
      return cards[s.k];
    }));
  const chipDefs = SECTIONS.filter((s) => s.chip && cards[s.k]);
  // "Más info" lleva a la primera sección extra disponible
  const chips = chipDefs.map((s) => h("button.chip", { type: "button", "data-k": s.k, onclick: () => goTo(s.k) }, s.chip));
  const chipRow = h("nav.log-chips", { "aria-label": "Ir a la sección" }, ...chips);
  const closeBtn = h("button.icon-btn.log-close", { type: "button", "aria-label": "Cerrar bitácora", html: icon("close", { size: 24 }), onclick: () => close() });
  const head = h("header.log-head", h("div.log-head-row", h("div", h("p.kicker", { text: "Acceso rápido" }), h("h2.log-title", { text: "Bitácora de la misión" })), closeBtn), chipRow);
  const body = h("div.log-body", list);
  const joinBtn = h("button.btn.btn-pink.btn-lg.btn-block", { type: "button", onclick: () => { audio?.tap(); close(onJoin); } }, rsvpLabel);
  const sheet = h("section.log", { role: "dialog", "aria-modal": "true", "aria-label": "Bitácora de la misión" }, head, body, h("div.log-foot", joinBtn));
  const scrim = h("div.log-scrim", { onclick: () => close() });
  root.append(scrim, sheet);

  let active = "", lock = 0;
  function setActive(k) {
    if (k === active) return; active = k;
    chips.forEach((c) => { const on = c.dataset.k === k; c.classList.toggle("is-on", on); c.setAttribute("aria-current", on ? "true" : "false"); });
    const c = chips.find((x) => x.dataset.k === k);
    if (c) chipRow.scrollTo({ left: c.offsetLeft - (chipRow.clientWidth - c.offsetWidth) / 2, behavior: prefersReduced() ? "auto" : "smooth" });
  }
  function goTo(k) { audio?.tap(); setActive(k); lock = performance.now() + 700; body.scrollTo({ top: Math.max(0, cards[k].offsetTop - 12), behavior: prefersReduced() ? "auto" : "smooth" }); }
  body.addEventListener("scroll", () => {
    head.classList.toggle("is-scrolled", body.scrollTop > 2);
    if (performance.now() < lock) return;
    const y = body.scrollTop + 60;
    let k = chipDefs[0]?.k;
    for (const s of SECTIONS) { const el = cards[s.k]; if (!el || el.offsetTop > y) continue; k = s.chip ? s.k : k; }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) k = chipDefs[chipDefs.length - 1]?.k;
    setActive(k);
  }, { passive: true });
  setActive(chipDefs[0]?.k);
  sheet.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  let closed = false;
  function close(then) {
    if (closed) return; closed = true;
    cd.stop(); sheet.classList.add("is-out"); scrim.classList.add("is-out");
    setTimeout(() => { sheet.remove(); scrim.remove(); }, prefersReduced() ? 0 : 320);
    onClose?.(); then?.();
    if (!then) opener?.focus?.({ preventScroll: true });
  }
  setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
  return { close };
}
