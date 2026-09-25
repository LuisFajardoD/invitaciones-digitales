// Bloques de información de la fiesta (siempre texto HTML real). Los usan las tarjetas de capítulo, la Bitácora
// y la versión ilustrada. Las secciones opcionales devuelven null si están desactivadas o vacías.
import { demoData } from "../data.js";
import { h, eventInfo, eventPhase, splitDuration, pad2, clock, downloadICS, googleCalUrl, waUrl, tpl } from "../util.js";
import { icon } from "./icons.js";

const btnHtml = (ic, text) => `${icon(ic, { size: 20 })}<span>${text}</span>`;

/** Calendario visual + horario. */
export function dateBlock() {
  const i = eventInfo();
  return h("div.date",
    h("div.date-tile", { "aria-hidden": "true" }, h("span.date-m", { text: i.monthShort }), h("span.date-d", { text: String(i.dayNum) })),
    h("div", h("p.date-day", { text: i.dateLong }), h("p.date-time", { html: `${icon("clock", { size: 18 })} <span>${i.startTime} – ${i.endTime}</span>` })));
}

/** Cuenta regresiva en vivo. Devuelve { el, stop }. */
export function countdown({ compact = false } = {}) {
  const el = h(`div.cd-wrap${compact ? ".is-compact" : ""}`, { role: "timer", "aria-label": "Cuenta regresiva para la misión" });
  const units = [["d", "días"], ["h", "horas"], ["m", "min"], ["s", "seg"]].map(([k, l]) => { const n = h("span.cd-n"); return { k, n, el: h("div.cd-u", n, h("span.cd-l", { text: l })) }; });
  const grid = h("div.cd", ...units.map((u) => u.el));
  const big = h("p.cd-big");
  function tick() {
    const ev = eventInfo(), now = clock.now(), ph = eventPhase(now);
    if (ph === "countdown" || (ph === "today" && now < ev.start)) {
      const left = splitDuration(ev.start - now);
      units.forEach((u) => { u.n.textContent = pad2(left[u.k]); });
      if (ph === "today") { big.textContent = "¡La misión es HOY!"; el.replaceChildren(big, grid); } else el.replaceChildren(grid);
    } else { big.textContent = ph === "today" ? "¡La misión es HOY!" : "¡Gracias por venir a la misión!"; el.replaceChildren(big); }
  }
  tick();
  const t = setInterval(tick, 1000);
  return { el, stop: () => clearInterval(t), tick };
}

export function calendarButtons(audio) {
  return h("div.cal-add",
    h("p.muted", { text: "Agregar al calendario · te recordamos un día antes." }),
    h("div.btn-row",
      h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => { audio?.tap(); downloadICS(); }, html: btnHtml("calendar", "iPhone / .ics") }),
      h("a.btn.btn-cream.btn-sm", { href: googleCalUrl(), target: "_blank", rel: "noopener", onclick: () => audio?.tap(), html: btnHtml("calendar", "Google Calendar") })));
}

export function venueBlock() {
  const ev = demoData.event;
  return h("div.info", h("span.info-ic", { html: icon("pin") }), h("div", h("p.info-k", { text: ev.venueName }), h("p.info-v", { text: ev.address })));
}
export function mapsButtons(audio) {
  const ev = demoData.event;
  return h("div.btn-row",
    ev.googleMapsUrl ? h("a.btn.btn-pink", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", onclick: () => audio?.tap(), html: btnHtml("map", "Google Maps") }) : null,
    ev.wazeUrl ? h("a.btn.btn-cream", { href: ev.wazeUrl, target: "_blank", rel: "noopener", onclick: () => audio?.tap(), html: btnHtml("nav", "Waze") }) : null);
}
const on = (s) => s && s.enabled !== false && String(s.text || "").trim();
export function transportBlock() {
  if (!on(demoData.transport)) return null;
  return h("div.info.info-sm", h("span.info-ic", { html: icon("route") }), h("div", h("p.info-k", { text: "Transporte" }), h("p.info-v", { text: demoData.transport.text })));
}
/** Plan de vuelo (itinerario). active = índice resaltado (-1 = ninguno). */
export function itineraryList(active = -1) {
  return h("ol.plan", ...demoData.itinerary.map((it, k) => h(`li${k === active ? ".is-on" : ""}`, h("span.plan-dot", { "aria-hidden": "true" }), h("div", h("p.plan-time", { text: it.time }), h("p.plan-title", { text: it.title })))));
}
export function giftsList(audio) {
  const gifts = [...demoData.gifts].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  return h("div.gifts", ...gifts.map((g) => h(`article.gift${g.highlight ? ".is-top" : ""}`,
    h("span.gift-ic", { html: icon(g.highlight ? "star" : "gift") }),
    h("div.grow", h("p.gift-name", { text: g.name }), g.note ? h("p.gift-note", { text: g.note }) : null),
    g.url ? h("a.btn.btn-cream.btn-xs", { href: g.url, target: "_blank", rel: "noopener", "aria-label": `Ver ${g.name}`, onclick: () => audio?.tap() }, "Ver") : null)));
}
export function dressBlock({ title = "Uniforme de la misión" } = {}) {
  if (!demoData.dressCode?.text) return null;
  return h("div.info", h("span.info-ic", { html: icon("shirt") }), h("div", h("p.info-k", { text: title }), h("p.info-v", { text: demoData.dressCode.text })));
}
export function checklistBlock() {
  const items = (demoData.checklist || []).filter((x) => String(x).trim());
  if (!items.length) return null;
  return h("ul.check", ...items.map((x) => h("li", h("span.check-ic", { html: icon("check", { size: 18 }) }), h("span", { text: x }))));
}
export function faqBlock(audio) {
  const items = (demoData.faq || []).filter((x) => x?.q && x?.a);
  if (!items.length) return null;
  return h("div.faq", ...items.map((f, i) => {
    const id = `faq-${i}`;
    const ans = h("div.faq-a", { id, hidden: true }, h("p", { text: f.a }));
    const btn = h("button.faq-q", { type: "button", "aria-expanded": "false", "aria-controls": id, onclick: () => { audio?.tap(); const open = btn.getAttribute("aria-expanded") !== "true"; btn.setAttribute("aria-expanded", String(open)); ans.hidden = !open; } },
      h("span", { text: f.q }), h("span.faq-chev", { html: icon("chevronDown", { size: 20 }) }));
    return h("div.faq-item", btn, ans);
  }));
}
export function liveBlock(audio) {
  const s = demoData.liveStream;
  if (!on(s)) return null;
  return h("div.stack", h("p.info-v", { text: s.text }), s.url ? h("a.btn.btn-cream.btn-sm", { href: s.url, target: "_blank", rel: "noopener", onclick: () => audio?.tap(), html: btnHtml("broadcast", "Ver la transmisión") }) : null);
}
export function lodgingBlock() {
  if (!on(demoData.lodging)) return null;
  return h("p.info-v", { text: demoData.lodging.text });
}
export function contactBlock(audio) {
  const c = demoData.contact;
  if (!c?.phone) return null;
  return h("div.stack",
    h("div.info", h("span.info-ic", { html: icon("chat") }), h("div", h("p.info-k", { text: c.name }), c.text ? h("p.info-v", { text: c.text }) : null)),
    h("a.btn.btn-pink.btn-sm", { href: waUrl(c.phone, tpl(`¡Hola ${c.name}! Tengo una duda sobre la {missionName}.`)), target: "_blank", rel: "noopener", onclick: () => audio?.tap(), html: btnHtml("whatsapp", "Escribir por WhatsApp") }));
}
/** Cuadrícula de fotos que abre el visor. */
export function galleryGrid(onOpen) {
  return h("div.album", ...demoData.gallery.map((p, i) => h("button", { type: "button", "aria-label": `Foto ${i + 1}: ${p.caption}`, onclick: () => onOpen(i) },
    h("img", { src: p.src, alt: p.caption, loading: "lazy", decoding: "async" }))));
}
