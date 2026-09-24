// Tarjeta inferior: estados colapsada (sólo título), media (~45 %) y expandida (~85 %); se arrastra.
// El dock viaja anclado sobre ella. Informa cuántos px tapa (tarjeta + dock) para encuadrar el 3D.
import { h, clamp, prefersReduced } from "../util.js";

/** Alto máximo de la tarjeta "media" (fracción del alto de la pantalla). */
export const MID_MAX = 0.42;

export function createSheet({ app, dock, onInset = () => {}, onState = () => {} }) {
  const kicker = h("span.sheet-kicker");
  const title = h("h2.sheet-title#sheet-title");
  const grab = h("div.sheet-grab", { role: "button", tabindex: "0", "aria-label": "Mover la tarjeta (tocar para cambiar de tamaño)" }, h("i.grip"), kicker, title);
  const body = h("div.sheet-body", { tabindex: "0" });
  const fade = h("div.sheet-fade", { "aria-hidden": "true" });
  const sheet = h("section.sheet.parch", { "aria-labelledby": "sheet-title" }, grab, body, fade);
  const wrap = h("div.sheet-wrap", h("div.sheet-dock", dock), sheet);
  app.append(wrap);

  let state = "hidden";
  let y = 0; // posición del borde superior de la tarjeta (px desde arriba de la app)
  const H = () => app.clientHeight || 1;
  const dockH = () => dock.getBoundingClientRect().height || 62;
  const collapsedH = () => grab.getBoundingClientRect().height + 8 + (parseFloat(getComputedStyle(app).getPropertyValue("--sab")) || 0);
  const yFor = (s) => {
    const hh = H();
    if (s === "collapsed") return hh - collapsedH();
    if (s === "mid") {
      // Estado inicial de toda parada: se ajusta a su contenido, sin espacio vacío debajo del
      // último elemento (máx. 42 % del alto; si no cabe, se desplaza o se expande arrastrando)
      const cs = getComputedStyle(body);
      const inner = (body.firstElementChild?.getBoundingClientRect().height || 0) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const content = grab.getBoundingClientRect().height + inner + 8;
      return Math.round(hh - clamp(content, collapsedH() + 60, hh * MID_MAX));
    }
    if (s === "tall") return Math.round(hh * 0.36); // apertura de galería/RSVP: deja ver la construcción arriba
    if (s === "expanded") return Math.round(hh * 0.15 + dockH() * 0.3);
    return hh + dockH() + 20;
  };

  function place(ny, anim) {
    y = ny;
    app.style.setProperty("--app-h", `${H()}px`); // el carrusel del Mirador se dimensiona con el alto de pantalla
    wrap.classList.toggle("is-anim", !!anim && !prefersReduced());
    wrap.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    // La tarjeta mide lo visible (así el contenido inferior siempre es alcanzable con scroll)
    sheet.style.height = `${Math.max(collapsedH(), H() - y + 12)}px`;
    // Alto útil del contenido (el carrusel de fotos se dimensiona con él)
    requestAnimationFrame(() => body.style.setProperty("--body-h", `${body.clientHeight}px`));
    onInset(state === "hidden" ? 0 : Math.max(0, H() - y + dockH()));
    updateFade();
  }

  function setState(s, anim = true) {
    state = s;
    place(yFor(s), anim);
    wrap.setAttribute("aria-hidden", s === "hidden" ? "true" : "false");
    if ("inert" in wrap) wrap.inert = s === "hidden";
    onState(s);
  }

  function updateFade() {
    // Desaparece por completo al llegar al final
    requestAnimationFrame(() => fade.classList.toggle("is-on", body.scrollHeight - body.clientHeight - body.scrollTop > 2));
  }
  body.addEventListener("scroll", updateFade, { passive: true });

  /* ---------- Arrastre ---------- */
  let drag = null;
  grab.addEventListener("pointerdown", (e) => {
    drag = { y0: e.clientY, start: y, t: performance.now(), last: e.clientY, v: 0, moved: false };
    try { grab.setPointerCapture(e.pointerId); } catch { /* nada */ }
  });
  grab.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    if (Math.abs(dy) > 4) drag.moved = true;
    const now = performance.now();
    drag.v = (e.clientY - drag.last) / Math.max(1, now - drag.t);
    drag.last = e.clientY; drag.t = now;
    const ny = clamp(drag.start + dy, yFor("expanded") - 30, yFor("collapsed") + 20);
    y = ny;
    wrap.classList.remove("is-anim");
    wrap.style.transform = `translate3d(0, ${y}px, 0)`;
    sheet.style.height = `${H() - Math.min(y, yFor("mid")) + 12}px`;
    onInset(Math.max(0, H() - y + dockH()));
  });
  const endDrag = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { // tocar: alterna colapsada ↔ media
      setState(state === "collapsed" ? "mid" : state === "mid" ? (api.canExpand ? "expanded" : "collapsed") : "mid");
      return;
    }
    const order = ["expanded", "tall", "mid", "collapsed"];
    let target;
    if (Math.abs(d.v) > 0.6) {
      const i = order.indexOf(nearest());
      target = order[clamp(i + (d.v > 0 ? 1 : -1), 0, order.length - 1)];
    } else target = nearest();
    setState(target);
  };
  const nearest = () => ["expanded", "tall", "mid", "collapsed"].reduce((a, s) => (Math.abs(yFor(s) - y) < Math.abs(yFor(a) - y) ? s : a), "mid");
  grab.addEventListener("pointerup", endDrag);
  grab.addEventListener("pointercancel", endDrag);
  grab.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setState(state === "collapsed" ? "mid" : state === "mid" ? "expanded" : "collapsed"); }
  });

  window.addEventListener("resize", () => { app.style.setProperty("--app-h", `${H()}px`); if (state !== "hidden") place(yFor(state), false); });
  app.style.setProperty("--app-h", `${H()}px`);

  const api = {
    el: sheet, body, wrap,
    canExpand: true,
    get state() { return state; },
    /** px que tapará la tarjeta (con el dock) en un estado dado: para encuadrar antes de subirla. */
    insetFor: (s) => Math.max(0, H() - yFor(s) + dockH()),
    setState,
    setContent({ kicker: k = "", title: t = "", content }) {
      kicker.textContent = k;
      kicker.hidden = !k;
      title.textContent = t;
      body.replaceChildren(content);
      body.scrollTop = 0;
      place(yFor(state), false);
      updateFade();
      if (typeof ResizeObserver === "function") {
        api._ro?.disconnect();
        // Si el contenido cambia de alto (fuentes, estado del RSVP…), la tarjeta media se reajusta
        api._ro = new ResizeObserver(() => { updateFade(); if (state === "mid" && !drag) place(yFor("mid"), true); });
        api._ro.observe(content);
      }
    },
    /** Vuelve a calcular el área tapada (p. ej. tras cambiar de tamaño la ventana). */
    refresh() { place(yFor(state), false); }
  };
  setState("hidden", false);
  return api;
}
