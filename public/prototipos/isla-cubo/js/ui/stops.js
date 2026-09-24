// Contenido HTML de cada parada (toda la información de la fiesta es texto real, nunca sólo 3D).
import { demoData } from "../data.js";
import { h, $, $$, clock, eventInfo, eventPhase, splitDuration, pad2, inviteTitle, prefersReduced } from "../util.js";
import { icon } from "./icons.js";

/* ---------- Calendario (.ics + Google Calendar) ---------- */
const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
function buildICS() {
  const ev = demoData.event, info = eventInfo();
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gloobi//Isla Cubo//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${demoData.invitationId}@gloobi`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(info.start)}`, `DTEND:${icsDate(info.end)}`,
    `SUMMARY:${icsEsc(inviteTitle())}`, `LOCATION:${icsEsc(`${ev.venueName}, ${ev.address}`)}`,
    `DESCRIPTION:${icsEsc(`Fiesta de ${demoData.child.name}. Anfitriones: ${demoData.hosts}. ${demoData.dressCode.title}: ${demoData.dressCode.text}.`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(inviteTitle())}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function downloadICS() {
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

/* ---------- Piezas compartidas (también las usa Info rápida) ---------- */
export function dateBlock() {
  const info = eventInfo();
  return h("div.cal",
    h("div.cal-tile", h("span.cal-m", { text: info.monthShort }), h("span.cal-d", { text: info.dayNum })),
    h("div",
      h("p.cal-day", { text: info.dateLong }),
      h("p.cal-time", { text: `${info.startTime} – ${info.endTime}` })));
}
export function venueBlock() {
  const ev = demoData.event;
  return h("div.info", h("span.info-ic", { html: icon("pin", { size: 28 }) }),
    h("div", h("p.info-k", { text: ev.venueName }), h("p.info-v", { text: ev.address })));
}
export function mapsRow(audio) {
  const ev = demoData.event;
  return h("div.row",
    h("a.bb.bb-sky", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", onclick: () => audio.tap(), html: `${icon("map")}<span>Google Maps</span>` }),
    h("a.bb.bb-mint", { href: ev.wazeUrl, target: "_blank", rel: "noopener", onclick: () => audio.tap(), html: `${icon("nav")}<span>Waze</span>` }));
}

/* ---------- 1. Monumento ---------- */
function monumento({ onStart }) {
  return {
    kicker: "Parada 1 · Monumento",
    title: inviteTitle(),
    el: h("div.stack.compact",
      h("div.hero",
        h("div.age-badge.parch", { html: `<span>¡Cumple ${demoData.child.age}!</span>` }),
        h("p.lead", { text: "¡Estás invitado a mi isla! Recorre cada rincón para descubrir los detalles de mi fiesta." })),
      h("div.info", h("span.info-ic", { html: icon("heart", { size: 28 }) }),
        h("div", h("p.info-k", { text: "Anfitriones" }), h("p.info-v", { text: demoData.hosts }))),
      h("button.bb.bb-lg.bb-block", { type: "button", onclick: onStart }, h("span", { text: "Empezar recorrido →" })))
  };
}

/* ---------- 2. Casa de la Fiesta ---------- */
function casa({ audio }) {
  return {
    kicker: "Parada 2",
    title: "La Casa de la Fiesta",
    // Compacta: fecha, hora, salón y Maps/Waze caben en la tarjeta media (42 %) sin desplazar;
    // calendario y vestimenta quedan debajo, con scroll
    el: h("div.stack.casa",
      dateBlock(),
      venueBlock(),
      mapsRow(audio),
      h("div.box.stack",
        h("div.info", h("span.info-ic", { html: icon("calendar", { size: 28 }) }), h("div", h("p.info-k", { text: "Agregar al calendario" }), h("p.info-v.muted", { text: "Te recordamos un día antes." }))),
        h("div.row",
          h("button.bb.bb-cream", { type: "button", onclick: () => { audio.tap(); downloadICS(); }, text: "iPhone / .ics" }),
          h("a.bb.bb-cream", { href: googleCalUrl(), target: "_blank", rel: "noopener", text: "Google Calendar" }))),
      h("div.box.dress", h("span.dress-ic", { html: icon("shirt", { size: 40 }) }),
        h("div", h("p.info-k", { text: demoData.dressCode.title }), h("p.info-v", { text: demoData.dressCode.text }))))
  };
}

/* ---------- 3. Torre del Reloj ---------- */
function torre({ world }) {
  const units = [["d", "DÍAS"], ["h", "HORAS"], ["m", "MIN"], ["s", "SEG"]].map(([k, l]) => {
    const face = h("span.cd-face", { text: "00" });
    const cube = h("div.cd-cube", face);
    return { k, face, cube, el: h("div.cd-unit", cube, h("span.cd-lbl", { text: l })) };
  });
  const big = h("p.cd-big", { hidden: true });
  const sub = h("p.lead.muted", { style: { textAlign: "center" } });
  const grid = h("div.cd", { role: "timer", "aria-label": "Cuenta regresiva" }, ...units.map((u) => u.el));
  let timer = 0, lastPhase = null;
  function tick(first = false) {
    const info = eventInfo();
    const now = clock.now();
    const phase = eventPhase(now);
    const left = splitDuration(info.start - now);
    if (phase === "countdown" || (phase === "today" && now < info.start)) {
      grid.hidden = false;
      units.forEach((u) => {
        const v = pad2(left[u.k]);
        if (u.face.textContent !== v) {
          u.face.textContent = v;
          if (!first && !prefersReduced()) { u.cube.classList.remove("is-flip"); void u.cube.offsetWidth; u.cube.classList.add("is-flip"); }
        }
      });
    } else grid.hidden = true;
    if (phase === "countdown") {
      big.hidden = true;
      sub.textContent = `${info.dateLong} · ${info.startTime}`;
      world.setDays(String(left.d), { animateIn: !first });
    } else if (phase === "today") {
      big.hidden = false; big.textContent = "¡ES HOY!";
      sub.textContent = now < info.start ? `Empieza a las ${info.startTime} en ${demoData.event.venueName}` : `En curso hasta las ${info.endTime}`;
      world.setDays("HOY", { animateIn: !first });
      if (lastPhase !== "today") world.celebrateTower();
    } else {
      big.hidden = false; big.textContent = "¡Gracias por venir!";
      sub.textContent = `La fiesta fue el ${info.dateLong.toLowerCase()}`;
      world.setDays("!", { animateIn: !first });
    }
    lastPhase = phase;
  }
  return {
    kicker: "Parada 3",
    title: "Torre del Reloj",
    el: h("div.stack", h("p.lead", { style: { textAlign: "center", fontWeight: "900" }, text: "La fiesta empieza en" }), big, grid, sub),
    onShow() { tick(true); clearInterval(timer); timer = setInterval(() => tick(false), 1000); },
    onHide() { clearInterval(timer); },
    tick
  };
}

/* ---------- 4. El Sendero ---------- */
function sendero() {
  const list = h("ul.itin");
  function render() {
    const info = eventInfo(), now = clock.now();
    const items = demoData.itinerary;
    const starts = items.map((it) => info.atClock(it.time));
    list.replaceChildren(...items.map((it, i) => {
      const next = i < items.length - 1 ? starts[i + 1] : info.end;
      const done = now >= next, live = !done && now >= starts[i];
      return h(`li${done ? ".is-done" : live ? ".is-live" : ""}`,
        h("span.itin-ic", { html: icon(done ? "check" : it.icon, { size: 28 }) }),
        h("div", h("p.itin-time", { text: it.time }), h("p.itin-title", { text: it.title })),
        h("span.itin-st", { text: done ? "LISTO" : live ? "AHORA" : "" }));
    }));
  }
  render();
  /** Brillo breve de la fila i (cuando sale su banderín). */
  function highlight(i) {
    const li = list.children[i];
    if (!li) return;
    li.classList.remove("is-glow"); void li.offsetWidth; li.classList.add("is-glow");
  }
  list.addEventListener("animationend", (e) => e.target.classList?.remove("is-glow"));
  return { kicker: "Parada 4", title: "El Sendero", el: h("div.stack", h("p.lead", { text: "Un banderín por cada momento de la fiesta:" }), list), onShow: render, highlight };
}

/* ---------- 5. El Mirador (galería) ---------- */
function mirador({ app, audio, world }) {
  const photos = demoData.gallery;
  const n = photos.length;
  // Carrusel compacto (fotos 3:4, ~24–28 % del alto de pantalla): la foto actual completa y un
  // asomo de la siguiente. Cada cambio de foto gira los marcos del árbol hacia la cámara.
  const car = h("div.car", { "aria-label": "Fotos" });
  const dots = h("div.car-dots");
  let loaded = false, cur = 0;
  photos.forEach((p, i) => {
    car.append(h("button.car-item", { type: "button", "aria-label": `Ver foto ${i + 1} de ${n}: ${p.caption}`, onclick: () => { go(i); openViewer(i); } },
      h("img", { alt: p.caption, loading: "lazy", decoding: "async", "data-src": p.src }),
      h("span.car-cap", { text: p.caption })));
    dots.append(h("button", { type: "button", "aria-label": `Ir a la foto ${i + 1}`, onclick: () => go(i) }));
  });
  const itemStep = () => { const a = car.children[0], b = car.children[1]; return a && b ? b.offsetLeft - a.offsetLeft : 1; };
  function setCurrent(i, { focus = true } = {}) {
    i = Math.max(0, Math.min(n - 1, i));
    $$("button", dots).forEach((d, j) => { d.classList.toggle("is-on", i === j); d.setAttribute("aria-current", i === j ? "true" : "false"); });
    if (i === cur && !focus) return;
    const changed = i !== cur;
    cur = i;
    if (changed || focus) world.focusPhoto?.(i);
  }
  /** Desplaza el carrusel a la foto i (y gira su marco hacia la cámara). */
  let lockUntil = 0; // mientras dura un desplazamiento programado, la foto actual no se recalcula
  function go(i, { smooth = !prefersReduced() } = {}) {
    lockUntil = performance.now() + (smooth ? 700 : 150);
    car.scrollTo({ left: i * itemStep(), behavior: smooth ? "smooth" : "auto" });
    setCurrent(i, { focus: false });
  }
  let raf = 0;
  car.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { if (performance.now() >= lockUntil) setCurrent(Math.round(car.scrollLeft / itemStep()), { focus: false }); });
  }, { passive: true });

  /* ---------- Visor a pantalla completa ---------- */
  function openViewer(start) {
    audio.tap();
    world.pausePhotos?.(true);
    const opener = document.activeElement;
    const count = h("p.viewer-count", { "aria-live": "polite", text: `${start + 1} / ${n}` });
    const track = h("div.viewer-track", ...photos.map((p) => h("figure.viewer-item", h("img", { src: p.src, alt: p.caption, decoding: "async" }), h("figcaption", { text: p.caption }))));
    let shown = start;
    const close = () => {
      if (!v.isConnected || v.classList.contains("is-out")) return;
      v.classList.add("is-out");
      world.pausePhotos?.(false);
      // El carrusel queda en la última foto vista y su marco gira de frente con destello
      const same = shown === cur;
      go(shown, { smooth: false });
      if (same) setCurrent(shown, { focus: true });
      setTimeout(() => v.remove(), prefersReduced() ? 0 : 200);
      opener?.focus?.({ preventScroll: true });
    };
    const v = h("div.viewer", { role: "dialog", "aria-modal": "true", "aria-label": "Foto a pantalla completa", onkeydown: (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); track.scrollTo({ left: track.clientWidth * Math.max(0, Math.min(n - 1, shown + (e.key === "ArrowRight" ? 1 : -1))), behavior: "smooth" }); }
    } },
      h("button.bb.bb-cream.bb-round.viewer-close", { type: "button", "aria-label": "Cerrar", html: icon("close", { size: 30 }), onclick: close }),
      count, track);
    track.addEventListener("scroll", () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i !== shown) { shown = i; count.textContent = `${i + 1} / ${n}`; }
    }, { passive: true });
    // Cierre con gesto hacia abajo (el desplazamiento horizontal lo maneja el propio carrusel)
    let drag = null;
    track.addEventListener("pointerdown", (e) => { drag = { y0: e.clientY, x0: e.clientX, dy: 0, on: false }; });
    track.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
      if (!drag.on && dy > 10 && dy > Math.abs(dx) * 1.3) drag.on = true;
      if (!drag.on) return;
      drag.dy = Math.max(0, dy);
      track.style.transform = `translateY(${drag.dy}px)`;
      v.style.setProperty("--pull", String(Math.min(1, drag.dy / 300)));
    });
    const endDrag = () => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.on && d.dy > 110) { close(); return; }
      track.style.transform = ""; v.style.removeProperty("--pull");
    };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    app.append(v);
    requestAnimationFrame(() => { track.scrollLeft = track.clientWidth * start; $(".viewer-close", v).focus({ preventScroll: true }); });
  }

  return {
    kicker: "Parada 5", title: "El Mirador",
    el: h("div.car-wrap", car, dots, h("p.car-hint", { text: "Toca una foto para verla en grande" })),
    onShow() {
      if (!loaded) { loaded = true; $$("img[data-src]", car).forEach((img) => { img.src = img.dataset.src; }); }
      setCurrent(cur, { focus: true });
    },
    /** Desde la isla (tocar un marco): lleva el carrusel a esa foto y la abre en el visor. */
    showPhoto(i, { open = true } = {}) { go(i, { smooth: false }); setCurrent(i, { focus: true }); if (open) openViewer(i); }
  };
}

/* ---------- 6. El Cofre ---------- */
function cofre({ audio }) {
  const gifts = [...demoData.gifts].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  const ICONS = ["gift", "box", "envelope"];
  let k = 0;
  return {
    kicker: "Parada 6", title: "El Cofre",
    el: h("div.stack",
      h("p.lead", { text: "Los tesoros que puedes traer a la isla:" }),
      ...gifts.map((g) => g.highlight
        ? h("article.gift.is-top", h("span.gift-shine"), h("span.gift-ic.gift-star", { html: icon("heart", { size: 40 }) }),
          h("div.gift-star", h("p.gift-name", { text: g.name }), g.note ? h("p.gift-note", { text: g.note }) : null))
        : h("article.gift", h("span.gift-ic", { html: icon(ICONS[k++ % ICONS.length], { size: 30 }) }),
          h("div", h("p.gift-name", { text: g.name }), g.note ? h("p.gift-note", { text: g.note }) : null),
          g.url ? h("a.bb.bb-cream", { href: g.url, target: "_blank", rel: "noopener", "aria-label": `Ver ${g.name}`, onclick: () => audio.tap(), text: "Ver" }) : null)))
  };
}

export function buildStops(ctx) {
  return [monumento(ctx), casa(ctx), torre(ctx), sendero(ctx), mirador(ctx), cofre(ctx)];
}
