// La Zona: radio según días restantes, cuenta regresiva en vivo y pantalla Mapa.
import { demoData } from "./data.js";
import { h, clamp, lerp, easeInOut, clock, eventInfo, eventPhase, splitDuration, pad2, prefersReduced } from "./util.js";
import { icon } from "./icons.js";
import { mapSVG, zoneLayerSVG, pinSVG } from "./map.js";

export const R_MAX = 470;
export const R_MIN = 118;
const DAY = 86400000;

/** Estado de la zona para un instante dado. */
export function zoneState(now = clock.now()) {
  const ev = eventInfo();
  const phase = eventPhase(now);
  const daysLeft = (ev.start - now) / DAY;
  let radius;
  if (phase !== "countdown") radius = R_MIN;
  else {
    const progress = clamp(1 - daysLeft / Math.max(1, demoData.zone.startDaysBefore), 0, 1);
    radius = lerp(R_MAX, R_MIN, easeInOut(progress));
  }
  return { phase, daysLeft, radius, msLeft: Math.max(0, ev.start - now), started: now >= ev.start };
}

/** Texto corto para el chip del lobby: "Zona: 12d 04h" */
export function zoneChipLabel() {
  const z = zoneState();
  if (z.phase === "past") return "¡Gracias por jugar!";
  if (z.phase === "today") return z.started ? "¡En partida!" : "Zona: ¡HOY!";
  const d = splitDuration(z.msLeft);
  return d.d > 0 ? `Zona: ${d.d}d ${pad2(d.h)}h` : `Zona: ${pad2(d.h)}h ${pad2(d.m)}m`;
}

/** Pantalla Mapa — La Zona. */
export function createMapScreen() {
  const ev = demoData.event;
  const info = eventInfo();

  const zoneWrap = h("div.map-zone");
  const map = h("div.map-view",
    h("div.map-layer", { html: mapSVG(ev.mapPin) }),
    zoneWrap,
    h("div.map-layer.map-pin", { html: pinSVG(ev.mapPin) }),
    h("div.map-venue-tag.chip", { text: ev.venueName })
  );

  const cells = ["d", "h", "m", "s"].map((k) => {
    const v = h("b.cd-num", { text: "00" });
    return { k, v, el: h("div.cd-cell", v, h("span.cd-unit", { text: { d: "DÍAS", h: "HRS", m: "MIN", s: "SEG" }[k] })) };
  });
  const countdown = h("div.cd", { role: "timer", "aria-live": "off" }, ...cells.map((c) => c.el));
  const headline = h("p.zone-headline.hud-text", { text: "LA ZONA SE CIERRA EN" });
  const bigState = h("p.zone-big.hud-text", { hidden: true });
  const subline = h("p.zone-sub");

  const el = h("div.map-screen",
    h("div.zone-hud", headline, bigState, countdown, subline),
    map,
    h("div.card.map-card",
      h("div.info-row", h("span.info-ic", { html: icon("pin", { size: 30 }) }),
        h("div", h("p.info-label", { text: ev.venueName }), h("p.info-value", { text: ev.address }))),
      h("div.btn-row",
        h("a.btn.btn-sky.btn-lg", { href: ev.googleMapsUrl, target: "_blank", rel: "noopener", html: `${icon("map", { size: 26 })}<span>Google Maps</span>` }),
        h("a.btn.btn-lime.btn-lg", { href: ev.wazeUrl, target: "_blank", rel: "noopener", html: `${icon("nav", { size: 26 })}<span>Waze</span>` })
      )
    )
  );

  let lastRadius = null;
  let timer = 0;

  function drawZone(animate) {
    const z = zoneState();
    const r = Math.round(z.radius);
    if (r !== lastRadius) {
      zoneWrap.innerHTML = zoneLayerSVG(ev.mapPin, r);
      lastRadius = r;
    }
    const scaleEl = zoneWrap.querySelector(".zone-scale");
    if (animate && scaleEl && !prefersReduced()) {
      scaleEl.style.transition = "none";
      scaleEl.style.transform = `scale(${Math.min(1.45, (r + 120) / r)})`;
      void scaleEl.getBoundingClientRect();
      requestAnimationFrame(() => {
        scaleEl.style.transition = "transform 1.6s cubic-bezier(.2,.8,.2,1)";
        scaleEl.style.transform = "scale(1)";
      });
    }
  }

  function tick() {
    const z = zoneState();
    el.dataset.phase = z.phase;
    if (z.phase === "countdown") {
      headline.hidden = false; bigState.hidden = true; countdown.hidden = false;
      const d = splitDuration(z.msLeft);
      cells.forEach((c) => { c.v.textContent = pad2(d[c.k]); });
      subline.textContent = `${info.dateLong} · ${info.startTime}`;
    } else if (z.phase === "today") {
      headline.hidden = true; bigState.hidden = false;
      bigState.textContent = "¡LA PARTIDA ES HOY!";
      if (!z.started) {
        countdown.hidden = false;
        const d = splitDuration(z.msLeft);
        cells.forEach((c) => { c.v.textContent = pad2(d[c.k]); });
        subline.textContent = `Empieza a las ${info.startTime} en ${ev.venueName}`;
      } else {
        countdown.hidden = true;
        subline.textContent = `En curso hasta las ${info.endTime}`;
      }
    } else {
      headline.hidden = true; bigState.hidden = false; countdown.hidden = true;
      bigState.textContent = "¡Gracias por jugar!";
      subline.textContent = `La partida fue el ${info.dateLong.toLowerCase()}`;
    }
    const r = Math.round(z.radius);
    if (r !== lastRadius) drawZone(false);
  }

  return {
    el,
    onShow() {
      lastRadius = null;
      drawZone(true);
      tick();
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    },
    onHide() { clearInterval(timer); },
    refresh() { lastRadius = null; drawZone(true); tick(); }
  };
}
