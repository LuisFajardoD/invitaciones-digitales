// Pantallas de juego (Misión, Pase, Tienda, Mejores momentos), barra de pestañas y
// navegación por hash (#lobby, #mision, #mapa, ...) compatible con el botón atrás.
import { demoData } from "./data.js";
import { h, $, $$, clock, eventInfo, inviteTitle, prefersReduced } from "./util.js";
import { icon } from "./icons.js";
import { createAvatar } from "./avatar.js";
import { audio } from "./audio.js";

export const TABS = [
  { id: "mision", label: "Misión", icon: "mission", title: "MISIÓN" },
  { id: "mapa", label: "Mapa", icon: "map", title: "LA ZONA" },
  { id: "pase", label: "Pase", icon: "pass", title: "PASE DE TEMPORADA" },
  { id: "tienda", label: "Tienda", icon: "shop", title: "TIENDA" },
  { id: "escuadron", label: "Escuadrón", icon: "squad", title: "ESCUADRÓN" }
];
const EXTRA = { repeticiones: { title: "MEJORES MOMENTOS" } };
const titleOf = (id) => (TABS.find((t) => t.id === id) || EXTRA[id] || { title: id }).title;

/* =================== Tarjeta de misión (compartida con el salto) =================== */
export function missionCard({ withHosts = false, actions = null, cls = "" } = {}) {
  const ev = demoData.event;
  const info = eventInfo();
  return h(`div.card.mission-card${cls ? "." + cls : ""}`,
    h("div.mission-ribbon.display", { text: "MISIÓN PRINCIPAL" }),
    h("div.mission-date",
      h("div.cal-tile", h("span.cal-month", { text: info.monthShort }), h("b.cal-day.display", { text: info.dayNum })),
      h("div",
        h("p.mission-day.display", { text: info.dateLong }),
        h("p.mission-time", { html: `${icon("clock", { size: 22 })}<span>${info.startTime} – ${info.endTime}</span>` }))),
    h("div.info-row",
      h("span.info-ic", { html: icon("pin", { size: 30 }) }),
      h("div", h("p.info-label", { text: ev.venueName }), h("p.info-value", { text: ev.address }))),
    withHosts ? h("div.info-row",
      h("span.info-ic", { html: icon("hosts", { size: 30 }) }),
      h("div", h("p.info-label", { text: "Anfitriones" }), h("p.info-value", { text: demoData.hosts }))) : null,
    actions ? h("div.btn-row", ...actions) : null
  );
}

/* =================== Calendario (.ics + Google Calendar) =================== */
const icsEsc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function buildICS() {
  const ev = demoData.event;
  const info = eventInfo();
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Gloobi//Invitacion//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${demoData.invitationId}@gloobi`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(info.start)}`,
    `DTEND:${icsDate(info.end)}`,
    `SUMMARY:${icsEsc(inviteTitle())}`,
    `LOCATION:${icsEsc(`${ev.venueName}, ${ev.address}`)}`,
    `DESCRIPTION:${icsEsc(`Fiesta de ${demoData.child.name}. Anfitriones: ${demoData.hosts}. Mapa: ${ev.googleMapsUrl}`)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(inviteTitle())}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ];
  return lines.join("\r\n");
}

function googleCalUrl() {
  const ev = demoData.event;
  const info = eventInfo();
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: inviteTitle(),
    dates: `${icsDate(info.start)}/${icsDate(info.end)}`,
    location: `${ev.venueName}, ${ev.address}`,
    details: `Fiesta de ${demoData.child.name}. Anfitriones: ${demoData.hosts}.`
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function downloadICS() {
  const ics = buildICS();
  const name = `${demoData.invitationId}.ics`;
  try {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch {
    // Respaldo para webviews sin Blob/download
    location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }
}

function buildMision() {
  const ev = demoData.event;
  return h("div.stack",
    missionCard({
      withHosts: true,
      actions: [
        h("a.btn.btn-sky.btn-lg.btn-block", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", html: `${icon("route", { size: 26 })}<span>Cómo llegar</span>` })
      ]
    }),
    h("div.card.cal-card",
      h("div.cal-card-head", h("span", { html: icon("calendar", { size: 34 }) }),
        h("div", h("p.info-label", { text: "Agregar al calendario" }), h("p.info-value.muted", { text: "Te avisamos un día antes." }))),
      h("div.btn-row",
        h("button.btn.btn-yellow", { type: "button", onclick: () => { audio.blip(); downloadICS(); }, html: `<span>iPhone / .ics</span>` }),
        h("a.btn.btn-lime", { href: googleCalUrl(), target: "_blank", rel: "noopener", html: `<span>Google Calendar</span>` }))
    )
  );
}

/* =================== Pase de temporada =================== */
function buildPase() {
  const info = eventInfo();
  const items = demoData.itinerary;
  const now = clock.now();
  const starts = items.map((it) => info.atClock(it.time));
  const track = h("div.pass-track", { role: "list", "aria-label": "Niveles del pase de temporada" });
  let current = -1;
  items.forEach((it, i) => {
    const start = starts[i];
    const next = i < items.length - 1 ? starts[i + 1] : info.end;
    const done = now >= next;
    const live = !done && now >= start;
    if (live) current = i;
    const status = done ? "COMPLETADO" : live ? "EN CURSO" : "PRÓXIMO";
    track.append(h(`div.pass-card${done ? ".is-done" : ""}${live ? ".is-live" : ""}`, { role: "listitem" },
      h("div.pass-node.display", { html: done ? icon("check", { size: 26 }) : String(it.level) }),
      h("div.card.pass-body",
        h("div.pass-top", h("span.pass-lvl.display", { text: `NIVEL ${it.level}` }), h("span.pass-status.chip", { text: status })),
        h("div.pass-icon", { html: icon(it.icon, { size: 64 }) }),
        h("p.pass-time.display", { text: it.time }),
        h("p.pass-title", { text: it.title }),
        h("div.pass-reward",
          h("span.pass-reward-label", { html: `${icon("trophy", { size: 20 })}<span>RECOMPENSA</span>` }),
          h("span.pass-reward-text", { text: it.reward }))
      )
    ));
  });
  // Tarjeta final: skin recomendada
  const skinAv = createAvatar(demoData.child.avatarColors, { unit: 5.2, spin: !prefersReduced(), tilt: -8, angle: -25 });
  track.append(h("div.pass-card.pass-skin", { role: "listitem" },
    h("div.pass-node.display", { html: icon("shirt", { size: 26 }) }),
    h("div.card.pass-body",
      h("div.pass-top", h("span.pass-lvl.display", { text: "RECOMPENSA" }), h("span.pass-status.chip.chip-lilac", { text: "SKIN" })),
      h("div.skin-stage", skinAv.el),
      h("p.pass-title", { text: demoData.dressCode.title }),
      h("p.pass-note", { text: demoData.dressCode.text })
    )
  ));
  const head = h("div.pass-head",
    h("p.pass-sub", { text: current >= 0 ? `¡Nivel ${items[current].level} en curso!` : "Desliza para ver todos los niveles" }),
    h("span.pass-hint", { html: `${icon("pass", { size: 22 })}<span>${items.length} niveles</span>` }));
  return h("div.pass-wrap", head, track);
}

/* =================== Tienda =================== */
const RARITY = {
  legendary: { label: "LEGENDARIO", icon: "heart", order: 0 },
  epic: { label: "ÉPICO", icon: "gift", order: 1 },
  rare: { label: "RARO", icon: "box", order: 2 },
  common: { label: "COMÚN", icon: "envelope", order: 3 }
};
function buildTienda() {
  const gifts = [...demoData.gifts].sort((a, b) => (RARITY[a.rarity]?.order ?? 9) - (RARITY[b.rarity]?.order ?? 9));
  return h("div.stack",
    h("p.shop-intro", { text: "Objetos disponibles en la tienda de la temporada" }),
    ...gifts.map((g) => {
      const r = RARITY[g.rarity] || RARITY.common;
      const price = g.rarity === "legendary" && g.price == null ? "INVALUABLE" : g.price != null ? String(g.price) : null;
      return h(`article.card.shop-item.rarity-${g.rarity}`,
        g.rarity === "legendary" ? h("span.shop-shine") : null,
        h("div.shop-tile", { html: icon(r.icon, { size: 52 }) }),
        h("div.shop-info",
          h("span.shop-rarity", { text: r.label }),
          h("h3.shop-name.display", { text: g.name }),
          g.note ? h("p.shop-note", { text: g.note }) : null,
          price ? h("p.shop-price.display", { text: price }) : null),
        g.url ? h("a.btn.btn-sm.btn-yellow.shop-btn", { href: g.url, target: "_blank", rel: "noopener", "aria-label": `Ver ${g.name}`, text: "Ver" }) : null
      );
    })
  );
}

/* =================== Mejores momentos (galería) =================== */
function buildRepeticiones() {
  const photos = demoData.gallery;
  const dots = h("div.dots", { role: "tablist", "aria-label": "Fotos" });
  const car = h("div.replay-track");
  photos.forEach((p, i) => {
    const btn = h("button.replay-card", { type: "button", "aria-label": `Ver foto ${i + 1}: ${p.tag}`, onclick: () => openLightbox(i) },
      h("img", { src: p.src, alt: p.tag, loading: "lazy", decoding: "async" }),
      h("span.replay-tag.chip", { html: `${icon("star", { size: 18 })}<span>${p.tag}</span>` }),
      h("span.replay-rec", { text: `MOMENTO #${String(i + 1).padStart(2, "0")}` }));
    car.append(btn);
    dots.append(h("button.dot", { type: "button", "aria-label": `Ir a la foto ${i + 1}`, onclick: () => car.children[i].scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", inline: "center", block: "nearest" }) }));
  });
  const setActive = (i) => $$(".dot", dots).forEach((d, j) => d.classList.toggle("is-active", i === j));
  let rafId = 0;
  car.addEventListener("scroll", () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const w = car.children[0]?.getBoundingClientRect().width || 1;
      setActive(Math.round(car.scrollLeft / (w + 14)));
    });
  }, { passive: true });
  setActive(0);

  // Lightbox a pantalla completa con swipe
  const lbTrack = h("div.lb-track");
  photos.forEach((p) => lbTrack.append(h("figure.lb-item",
    h("img", { src: p.src, alt: p.tag, loading: "lazy", decoding: "async" }),
    h("figcaption.chip", { text: p.tag }))));
  const lb = h("div.lightbox", { role: "dialog", "aria-modal": "true", "aria-label": "Foto a pantalla completa", hidden: true },
    h("button.btn.btn-icon.lb-close", { type: "button", "aria-label": "Cerrar", html: icon("close", { size: 26 }), onclick: () => closeLightbox() }),
    lbTrack);
  function openLightbox(i) {
    audio.pop();
    // El visor vive a nivel de la app para cubrir encabezado y pestañas
    const app = document.querySelector(".app");
    if (app && lb.parentElement !== app) app.append(lb);
    lb.hidden = false;
    requestAnimationFrame(() => {
      lbTrack.scrollLeft = lbTrack.clientWidth * i;
      lb.classList.add("is-open");
      $(".lb-close", lb).focus();
    });
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    setTimeout(() => { lb.hidden = true; }, prefersReduced() ? 0 : 250);
  }
  // El botón atrás de Android o cambiar de pestaña también cierran el visor
  window.addEventListener("hashchange", () => { if (!lb.hidden) closeLightbox(); });
  lb.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  return h("div.replay-wrap", h("p.shop-intro", { text: `Los mejores momentos de ${demoData.child.name}` }), h("div.replay-stage", car, dots), lb);
}

/* =================== Router =================== */
export function createRouter({ root, lobby, builders, onEnter, onLeave }) {
  const screens = new Map();
  const handlers = new Map(); // id → { show, hide } para vistas especiales (#salto)
  let current = "lobby";
  let pushed = false;

  const tabbar = h("nav.tabbar", { "aria-label": "Secciones" },
    ...TABS.map((t) => h("button.tab", {
      type: "button", "data-tab": t.id, "aria-label": t.label,
      html: `${icon(t.icon, { size: 30 })}<span>${t.label}</span>`,
      onclick: () => { audio.blip(); navigate(current === t.id ? "lobby" : t.id); }
    })));

  function ensureScreen(id) {
    if (screens.has(id)) return screens.get(id);
    const custom = builders[id] ? builders[id]() : null;
    const content = custom?.el || (id === "mision" ? buildMision() : id === "pase" ? buildPase() : id === "tienda" ? buildTienda() : id === "repeticiones" ? buildRepeticiones() : h("div"));
    const back = h("button.btn.back-btn", { type: "button", "aria-label": "Volver al lobby", html: `${icon("back", { size: 24 })}<span>LOBBY</span>`, onclick: () => { audio.blip(); navigate("lobby"); } });
    const titleEl = h("h2.screen-title.hud-text", { id: `t-${id}`, text: titleOf(id) });
    // tabindex: el contenedor con scroll se puede enfocar y desplazar con teclado
    const body = h(`div.screen-body.body-${id}`, { tabindex: "0" }, content);
    const fade = h("div.screen-fade", { "aria-hidden": "true" });
    const el = h(`section.screen.screen-${id}`, { role: "region", "aria-labelledby": `t-${id}`, hidden: true },
      h("div.screen-bg"),
      h("header.screen-head", back, titleEl),
      body, fade);
    root.append(el);
    // Indicador de "hay más contenido": degradado inferior que desaparece al llegar al final
    let fadeRaf = 0;
    const updateFade = () => {
      cancelAnimationFrame(fadeRaf);
      fadeRaf = requestAnimationFrame(() => {
        const more = body.scrollHeight - body.clientHeight - body.scrollTop > 6;
        fade.classList.toggle("is-on", more);
      });
    };
    body.addEventListener("scroll", updateFade, { passive: true });
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(updateFade);
      ro.observe(body);
      if (content) ro.observe(content);
    } else window.addEventListener("resize", updateFade);
    const s = { id, el, body, api: custom, updateFade };
    screens.set(id, s);
    return s;
  }

  function showScreen(id) {
    const s = ensureScreen(id);
    if (id === "pase" && s._built) s.body.replaceChildren(buildPase()); // estados según la hora actual
    s._built = true;
    s.el.hidden = false;
    s.body.scrollTop = 0;
    void s.el.offsetWidth;
    s.el.classList.add("is-open");
    s.api?.onShow?.();
    s.updateFade();
    clearTimeout(s._hideT);
    lobby.setCovered(false);
    clearTimeout(showScreen._coverT);
    showScreen._coverT = setTimeout(() => { if (current !== "lobby" && !handlers.has(current)) lobby.setCovered(true); }, 380);
    requestAnimationFrame(() => $(".back-btn", s.el)?.focus({ preventScroll: true }));
  }
  function hideScreen(id) {
    const s = screens.get(id);
    if (!s) return;
    s.el.classList.remove("is-open");
    s.api?.onHide?.();
    s._hideT = setTimeout(() => { s.el.hidden = true; }, prefersReduced() ? 0 : 360);
  }

  function render(id) {
    if (!id || (!TABS.some((t) => t.id === id) && !EXTRA[id] && !handlers.has(id))) id = "lobby";
    if (id === current) return;
    const prev = current;
    current = id;
    if (handlers.has(prev)) handlers.get(prev).hide();
    else if (prev !== "lobby") hideScreen(prev);
    if (handlers.has(id)) handlers.get(id).show();
    else if (id !== "lobby") showScreen(id);
    else {
      clearTimeout(showScreen._coverT);
      lobby.setCovered(false);
      lobby.playBtn.focus?.({ preventScroll: true });
    }
    $$(".tab", tabbar).forEach((b) => {
      const on = b.dataset.tab === id;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    document.querySelector(".app")?.setAttribute("data-view", id);
    if (prev !== id) onLeave?.(prev);
    onEnter?.(id);
  }

  // history.back() es asíncrono: si se pide otra pantalla (p. ej. JUGAR otra vez) antes de que termine
  // el regreso al lobby, se encola y se atiende al llegar; así ningún toque se pierde.
  let backPending = false, queued = null, backT = 0;
  function backDone() {
    clearTimeout(backT);
    backPending = false;
    if (queued) { const q = queued; queued = null; navigate(q); }
  }
  function navigate(id) {
    if (backPending) { queued = id === "lobby" ? null : id; return; }
    if (id === current) return;
    if (id === "lobby") {
      if (pushed) {
        pushed = false; backPending = true; history.back();
        backT = setTimeout(() => { if (backPending) { render("lobby"); backDone(); } }, 600); // sin historial
      }
      else { try { history.replaceState(null, "", "#lobby"); } catch { /* nada */ } render("lobby"); }
      return;
    }
    if (current === "lobby") {
      pushed = true;
      location.hash = id;
    } else {
      try { history.replaceState(null, "", `#${id}`); } catch { /* nada */ }
      render(id);
    }
  }

  window.addEventListener("hashchange", () => {
    const id = location.hash.replace("#", "") || "lobby";
    if (id === "lobby") pushed = false;
    render(id);
    if (backPending) backDone();
  });

  return {
    tabbar,
    navigate,
    render,
    current: () => current,
    register(id, handler) { handlers.set(id, handler); },
    screen: (id) => screens.get(id),
    /** Deep link inicial (#mapa, etc.) */
    start() {
      const id = location.hash.replace("#", "");
      if (id && id !== "lobby") render(id);
      else render("lobby");
    }
  };
}
