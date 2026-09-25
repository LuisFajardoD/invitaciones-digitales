// Piezas de interfaz compartidas: íconos, bloques de información (siempre texto HTML real), cuenta
// regresiva, calendario (.ics + Google), tarjeta inferior, visor de fotos, avisos y textos flotantes.
import { demoData } from "../data.js";
import { h, $, $$, clock, eventInfo, eventPhase, splitDuration, pad2, inviteTitle, prefersReduced, parseClock } from "../util.js";
import { DEMO } from "../state.js";

/* ---------- Íconos (SVG propios, trazo oscuro) ---------- */
const P = {
  flag: '<path d="M6 21V4"/><path d="M6 4h12l-3 4 3 4H6"/>',
  controller: '<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14" r="1"/>',
  cake: '<path d="M4 20h16v-7H4zM4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0"/><path d="M8 13V9M12 13V9M16 13V9"/><path d="M8 7c-.8-1 0-2 0-2s.8 1 0 2zM12 7c-.8-1 0-2 0-2s.8 1 0 2zM16 7c-.8-1 0-2 0-2s.8 1 0 2z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
  shirt: '<path d="M8 3l4 2 4-2 5 4-3 3-2-1v12H8V9L6 10 3 7z"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9C9 9 7 7.5 8 6s4 .5 4 3c0-2.5 3-4.5 4-3s-1 3-4 3"/>',
  box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.3C1.9 7.1 4.4 4 7.6 4c1.9 0 3.4 1.1 4.4 2.6C13 5.1 14.5 4 16.4 4c3.2 0 5.7 3.1 4.6 6.7C19.5 15.4 12 20 12 20z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  pause: '<path d="M9 6v12M15 6v12"/>',
  soundOn: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M18.5 6.5c3 3 3 8 0 11"/>',
  soundOff: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 10l4 4M21 10l-4 4"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chat: '<path d="M4 18l1.2-3.8A8 8 0 1112 20a8 8 0 01-3.8-1z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  replay: '<path d="M4 12a8 8 0 108-8H9"/><path d="M11 1L8 4l3 3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>'
};
export function icon(name, { size = 24, fill = "none", stroke = "#1B1F3B", sw = 2.4 } = {}) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`;
}
/** Mini corredor en SVG (HUD, barra de carga). */
export function runnerSVG(shirt = demoData.child.runner.shirt, size = 26) {
  return `<svg viewBox="0 0 26 30" width="${size}" height="${Math.round(size * 30 / 26)}" aria-hidden="true"><g stroke="#1B1F3B" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M9 18l-3 6M14 18l4 5" fill="none" stroke-width="3.2"/><path d="M9 18l-3 6M14 18l4 5" fill="none" stroke="${demoData.child.runner.skin}" stroke-width="1.6"/><rect x="7" y="12" width="9" height="8" rx="3" fill="${shirt}"/><circle cx="13" cy="8" r="6" fill="${demoData.child.runner.skin}"/><path d="M7 7c1-5 10-6 12-1-3-1-6 0-12 1z" fill="${demoData.child.runner.hair}"/><path d="M7.4 6.4l11-1.4" stroke="${demoData.child.runner.headband}" stroke-width="2"/><ellipse cx="6" cy="25" rx="2.6" ry="1.6" fill="${demoData.child.runner.shoes}"/><ellipse cx="19" cy="24" rx="2.6" ry="1.6" fill="${demoData.child.runner.shoes}"/></g></svg>`;
}

/* ---------- Calendario (.ics + Google) ---------- */
const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function buildICS() {
  const ev = demoData.event, info = eventInfo();
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gloobi//El Circuito//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${demoData.invitationId}@gloobi`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(info.start)}`, `DTEND:${icsDate(info.end)}`,
    `SUMMARY:${icsEsc(inviteTitle())}`, `LOCATION:${icsEsc(`${ev.venueName}, ${ev.address}`)}`,
    `DESCRIPTION:${icsEsc(`Fiesta de ${demoData.child.name}. Anfitriones: ${demoData.hosts}. ${demoData.dressCode.title}: ${demoData.dressCode.text}.`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(inviteTitle())}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
export function downloadICS() {
  const ics = buildICS();
  try {
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = h("a", { href: url, download: `${demoData.invitationId}.ics` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch { location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`; }
}
export function googleCalUrl() {
  const ev = demoData.event, info = eventInfo();
  const q = new URLSearchParams({ action: "TEMPLATE", text: inviteTitle(), dates: `${icsDate(info.start)}/${icsDate(info.end)}`, location: `${ev.venueName}, ${ev.address}`, details: `Fiesta de ${demoData.child.name}. Anfitriones: ${demoData.hosts}.` });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/* ---------- Bloques de información ---------- */
export function dateBlock() {
  const i = eventInfo();
  return h("div.cal",
    h("div.cal-tile", { "aria-hidden": "true" }, h("span.cal-m", { text: i.monthShort }), h("span.cal-d", { text: i.dayNum })),
    h("div", h("p.cal-day", { text: i.dateLong }), h("p.cal-time", { text: `${i.startTime} – ${i.endTime}` })));
}
/** Cuenta regresiva en vivo (días, horas, minutos, segundos). Devuelve { el, stop }. */
export function countdown() {
  const el = h("div", { role: "timer", "aria-label": "Cuenta regresiva para la fiesta" });
  const units = [["d", "DÍAS"], ["h", "HORAS"], ["m", "MIN"], ["s", "SEG"]].map(([k, l]) => { const n = h("span.cd-n"); return { k, n, el: h("div.cd-u", n, h("span.cd-l", { text: l })) }; });
  const grid = h("div.cd", ...units.map((u) => u.el));
  const big = h("p.cd-big");
  function tick() {
    const i = eventInfo(), now = clock.now(), ph = eventPhase(now);
    if (ph === "countdown" || (ph === "today" && now < i.start)) {
      const left = splitDuration(i.start - now);
      units.forEach((u) => { u.n.textContent = pad2(left[u.k]); });
      el.replaceChildren(grid);
      if (ph === "today") { big.textContent = "¡ES HOY!"; el.prepend(big); }
    } else { big.textContent = ph === "today" ? "¡ES HOY! La carrera ya empezó" : "¡Gracias por correr con nosotros!"; el.replaceChildren(big); }
  }
  tick();
  const t = setInterval(tick, 1000);
  return { el, stop: () => clearInterval(t), tick };
}
/** "Agregar al calendario": una línea de texto y los dos botones (sin caja anidada). */
export function calendarRow(audio) {
  return h("div.cal-add",
    h("p.cal-add-t", h("b", { text: "Agregar al calendario" }), " · Te recordamos un día antes."),
    h("div.row",
      h("button.fl.fl-white.fl-sm", { type: "button", onclick: () => { audio.tap(); downloadICS(); } }, h("span", { text: "iPhone / .ics" })),
      h("a.fl.fl-white.fl-sm", { href: googleCalUrl(), target: "_blank", rel: "noopener", onclick: () => audio.tap() }, h("span", { text: "Google Calendar" }))));
}
export function venueBlock() {
  const ev = demoData.event;
  return h("div.info", h("span.info-ic", { html: icon("pin", { size: 26 }) }), h("div", h("p.info-k", { text: ev.venueName }), h("p.info-v", { text: ev.address })));
}
export function mapsRow(audio) {
  const ev = demoData.event;
  return h("div.row",
    h("a.fl.fl-blue", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", onclick: () => audio.tap(), html: `${icon("map", { stroke: "#fff" })}<span>Google Maps</span>` }),
    h("a.fl.fl-lime", { href: ev.wazeUrl, target: "_blank", rel: "noopener", onclick: () => audio.tap(), html: `${icon("nav")}<span>Waze</span>` }));
}
/** Uniforme de carrera: una línea con ícono (va dentro de la tarjeta de Lugar). */
export function dressBlock() {
  return h("p.dress-line", h("span.dress-ic", { html: icon("shirt", { size: 20 }) }), h("span", h("b", { text: `${demoData.dressCode.title}:` }), ` ${demoData.dressCode.text}`));
}
export function itineraryList() {
  const i = eventInfo(), now = clock.now(), items = demoData.itinerary;
  const starts = items.map((it) => i.dayStart + parseClock(it.time) * 60000);
  return h("ol.tl", ...items.map((it, k) => {
    const next = k < items.length - 1 ? starts[k + 1] : i.end;
    const cls = now >= next ? ".is-done" : now >= starts[k] ? ".is-live" : "";
    return h(`li${cls}`, h("span.tl-ic", { html: icon(it.icon, { size: 24 }) }), h("div", h("p.tl-time", { text: it.time }), h("p.tl-title", { text: it.title })));
  }));
}
const GIFT_ICONS = ["gift", "box", "envelope"];
export function giftsList(audio) {
  const gifts = [...demoData.gifts].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  let k = 0;
  return h("div.stack", ...gifts.map((g) => g.highlight
    ? h("article.gift.is-top", h("span.gift-ic", { html: icon("heart", { size: 26, fill: "#FF5A5F" }) }), h("div.grow", h("p.gift-name", { text: g.name }), g.note ? h("p.gift-note", { text: g.note }) : null))
    : h("article.gift", h("span.gift-ic", { html: icon(GIFT_ICONS[k++ % 3], { size: 24 }) }), h("div.grow", h("p.gift-name", { text: g.name }), g.note ? h("p.gift-note", { text: g.note }) : null),
      g.url ? h("a.fl.fl-white.fl-sm", { href: g.url, target: "_blank", rel: "noopener", "aria-label": `Ver ${g.name}`, onclick: () => audio.tap() }, h("span", { text: "Ver" })) : null)));
}
/** Cuadrícula del álbum (las recogidas llevan "¡Encontrada!"). */
export function albumGrid(found, onOpen) {
  return h("div.album", ...demoData.gallery.map((p, i) => {
    const ok = found.includes(i);
    return h(`button${ok ? "" : ".lost"}`, { type: "button", "aria-label": `Foto ${i + 1}: ${p.caption}${ok ? " (encontrada)" : ""}`, onclick: () => onOpen(i) },
      h("img", { src: p.src, alt: p.caption, loading: "lazy", decoding: "async" }),
      ok ? h("span.found", { text: "¡Encontrada!" }) : null);
  }));
}

/* ---------- Tarjetas de sección (hoja de info y puntos de control) ---------- */
export const SECTIONS = {
  fecha: { label: "Fecha", title: "Fecha y hora", emoji: "📅", icon: "calendar", color: "#3D5AFE", light: true },
  lugar: { label: "Lugar", title: "Lugar", emoji: "📍", icon: "pin", color: "#FF5A5F", light: true },
  programa: { label: "Programa", title: "Programa de la carrera", emoji: "🏁", icon: "flag", color: "#FFC93C" },
  regalos: { label: "Regalos", title: "Mesa de regalos", emoji: "🎁", icon: "gift", color: "#9BE564" },
  fotos: { label: "Fotos", title: "Álbum de fotos", emoji: "📷", icon: "camera", color: "#2EC4B6", light: true }
};
/** Tarjeta blanca con franja superior de color y título con ícono en círculo. */
export function sectionCard(key, children, { titled = true } = {}) {
  const s = SECTIONS[key];
  return h(`section.icard#sec-${key}`, { style: { "--c": s.color }, "aria-labelledby": titled ? `sec-${key}-t` : null, "data-sec": key },
    titled ? h("h3.icard-t", { id: `sec-${key}-t` }, h("span.icard-ic", { html: icon(s.icon, { size: 20, stroke: s.light ? "#fff" : "#1B1F3B" }) }), s.title) : null,
    h("div.icard-b", ...[children].flat()));
}

/* ---------- Tarjeta inferior ---------- */
/**
 * Tarjeta blanca con franja de color. opts: { kicker, title, headExtra, body, foot, stripe, cls, onClose }.
 * Se ajusta a su contenido (máx. 50 %, o más con cls "is-tall"/"is-finish").
 */
export function sheet(root, { kicker = "", title = "", headExtra = null, body, foot = null, stripe = "var(--blue)", cls = "", label } = {}) {
  const fade = h("div.sheet-fade");
  const bodyEl = h("div.sheet-body", body);
  const head = kicker || title ? h("header.sheet-head", kicker ? h("p.sheet-kicker", { text: kicker }) : null, title ? h("h2.sheet-title", { text: title }) : null, headExtra) : null;
  const el = h(`section.sheet${cls ? "." + cls : ""}`, { role: "dialog", "aria-label": label || title, style: { "--stripe": stripe } },
    head, bodyEl, fade, foot ? h("div.sheet-foot", foot) : null);
  const placeFade = () => {
    const more = bodyEl.scrollHeight - bodyEl.clientHeight - bodyEl.scrollTop > 4;
    fade.classList.toggle("is-on", more);
    fade.style.top = `${bodyEl.offsetTop + bodyEl.clientHeight - 26}px`;
    head?.classList.toggle("is-scrolled", bodyEl.scrollTop > 2); // sombra inferior del encabezado
  };
  bodyEl.addEventListener("scroll", placeFade, { passive: true });
  root.append(el);
  requestAnimationFrame(placeFade);
  if (typeof ResizeObserver === "function") new ResizeObserver(placeFade).observe(bodyEl);
  return {
    el, body: bodyEl,
    close() { return new Promise((res) => { el.classList.add("is-out"); setTimeout(() => { el.remove(); res(); }, prefersReduced() ? 0 : 280); }); }
  };
}

/* ---------- Visor de fotos ---------- */
export function openViewer(root, start, audio, onClose) {
  audio.tap();
  const photos = demoData.gallery, n = photos.length;
  const opener = document.activeElement;
  let shown = start;
  const count = h("p.viewer-count", { "aria-live": "polite", text: `${start + 1} / ${n}` });
  const track = h("div.viewer-track", ...photos.map((p) => h("figure.viewer-item", h("img", { src: p.src, alt: p.caption, decoding: "async" }), h("figcaption", { text: p.caption }))));
  const close = () => {
    if (v.classList.contains("is-out")) return;
    v.classList.add("is-out"); setTimeout(() => v.remove(), prefersReduced() ? 0 : 200);
    root.closest(".app")?.classList.remove("is-cover");
    opener?.focus?.({ preventScroll: true }); onClose?.(shown);
  };
  const v = h("div.viewer", { role: "dialog", "aria-modal": "true", "aria-label": "Foto a pantalla completa", onkeydown: (e) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); track.scrollTo({ left: track.clientWidth * Math.max(0, Math.min(n - 1, shown + (e.key === "ArrowRight" ? 1 : -1))), behavior: "smooth" }); }
  } }, h("button.fl.fl-white.fl-round.viewer-close", { type: "button", "aria-label": "Cerrar", html: icon("close", { size: 28 }), onclick: close }), count, track);
  track.addEventListener("scroll", () => { const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== shown) { shown = i; count.textContent = `${i + 1} / ${n}`; } }, { passive: true });
  let drag = null;
  track.addEventListener("pointerdown", (e) => { drag = { y0: e.clientY, x0: e.clientX, dy: 0, on: false }; });
  track.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
    if (!drag.on && dy > 10 && dy > Math.abs(dx) * 1.3) drag.on = true;
    if (!drag.on) return;
    drag.dy = Math.max(0, dy); track.style.transform = `translateY(${drag.dy}px)`; v.style.setProperty("--pull", String(Math.min(1, drag.dy / 300)));
  });
  const end = () => { if (!drag) return; const d = drag; drag = null; if (d.on && d.dy > 110) { close(); return; } track.style.transform = ""; v.style.removeProperty("--pull"); };
  track.addEventListener("pointerup", end); track.addEventListener("pointercancel", end);
  root.append(v);
  root.closest(".app")?.classList.add("is-cover");
  requestAnimationFrame(() => { track.scrollLeft = track.clientWidth * start; $(".viewer-close", v).focus({ preventScroll: true }); });
  return close;
}

/* ---------- Avisos y textos ---------- */
export function toast(root, text, ms = 2600) {
  $$(".toast", root).forEach((t) => t.remove());
  const t = h("div.toast", { role: "status", text });
  root.append(t);
  setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 320); }, ms);
}
export function popText(root, text, cls = "") {
  const t = h(`div.pop-text${cls ? "." + cls : ""}`, { "aria-hidden": "true", text });
  root.append(t);
  setTimeout(() => t.remove(), 1250);
}
export function banner(root, text, sub = "", ms = 1500) {
  $$(".banner", root).forEach((b) => b.remove());
  const b = h("div.banner", { role: "status" }, text, sub ? h("small", { text: sub }) : null);
  root.append(b);
  setTimeout(() => { b.classList.add("is-out"); setTimeout(() => b.remove(), 320); }, ms);
  return b;
}
/** Modo muestra: en vez de abrir WhatsApp, un aviso con el estilo de la invitación. */
export function demoNotice(root) {
  if ($(".demo-note", root)) return;
  const opener = document.activeElement;
  const close = () => { m.remove(); opener?.focus?.({ preventScroll: true }); };
  const ok = h("button.fl.fl-coral.fl-block", { type: "button", onclick: close }, h("span", { text: "Entendido" }));
  const m = h("div.modal.demo-note", { role: "dialog", "aria-modal": "true", "aria-labelledby": "demo-note-t", onclick: (e) => { if (e.target === m) close(); }, onkeydown: (e) => { if (e.key === "Escape") close(); } },
    h("div.modal-card", h("p.demo-ic", { "aria-hidden": "true", text: "✨" }), h("p#demo-note-t", { text: "En la invitación real, aquí se abre WhatsApp para enviar la confirmación a los anfitriones." }), ok));
  root.append(m);
  ok.focus({ preventScroll: true });
}
export function openWhatsApp(root, url) {
  if (DEMO) { demoNotice(root); return; }
  let w = null;
  try { w = window.open(url, "_blank"); if (w) w.opener = null; } catch { w = null; }
  if (!w) { try { location.href = url; } catch { /* queda el botón */ } }
}
/** Props de un enlace a WhatsApp (en modo muestra el toque muestra el aviso en vez de salir). */
export const waLink = (root, url, onDemo) => ({ href: url, target: "_blank", rel: "noopener", onclick: (e) => { if (DEMO) { e.preventDefault(); onDemo?.(); demoNotice(root); } } });
