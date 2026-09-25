// Scroll nativo del documento: un contenedor alto con una sección invisible por capítulo (1–9). El progreso de
// cada capítulo (0–1) se suaviza (damping) para que se sienta como película. Scroll-snap en modo "proximity"
// en los puntos de descanso. Funciona con dedo, rueda y teclado. Se puede bloquear (portada y despegue).
import { h, clamp, damp, prefersReduced } from "../util.js";

// Alto de cada capítulo en "pantallas" y punto de descanso (p) donde se detiene el snap.
export const CHAPTERS = [
  { n: 1, vh: 1.0, rest: 0 },
  { n: 2, vh: 2.2, rest: 0.78 },
  { n: 3, vh: 2.6, rest: 0.8 },
  { n: 4, vh: 2.2, rest: 0.62 },
  { n: 5, vh: 2.0, rest: 0.62 },
  { n: 6, vh: 3.0, rest: 0.55 },
  { n: 7, vh: 3.2, rest: 0.42 },
  { n: 8, vh: 2.2, rest: 0.6 },
  { n: 9, vh: 1.8, rest: 0.75 }
];

export function createScroll(container, { labels = [] } = {}) {
  const secs = CHAPTERS.map((c, i) => {
    const snap = h("div.snap", { "aria-hidden": "true" });
    const el = h("section.chap", { id: `capitulo-${c.n}`, "aria-label": labels[i] || `Capítulo ${c.n}` }, snap);
    container.append(el);
    return { ...c, el, snap, top: 0, height: 0 };
  });
  const tail = h("div.chap-tail", { "aria-hidden": "true" }); container.append(tail);
  let vh = window.innerHeight, total = 0, smoothY = 0, locked = false;
  function layout() {
    vh = window.innerHeight;
    let y = 0;
    for (const s of secs) {
      s.top = y; s.height = Math.round(s.vh * vh);
      s.el.style.height = `${s.height}px`;
      s.snap.style.top = `${Math.round(s.rest * s.height)}px`;
      y += s.height;
    }
    total = y;
    tail.style.height = `${vh}px`; // así el último capítulo llega a p = 1 en el fondo
  }
  layout();
  let lastW = innerWidth;
  addEventListener("resize", () => {
    // la barra del navegador que aparece/desaparece cambia el alto un poco: no recalcular por eso
    if (innerWidth === lastW && Math.abs(innerHeight - vh) < 160) return;
    lastW = innerWidth;
    const y = locate(scrollY); layout();
    if (!locked) scrollTo(0, secs[y.chapter - 1].top + y.p * secs[y.chapter - 1].height);
  });

  function locate(y) {
    for (let i = secs.length - 1; i >= 0; i--) if (y >= secs[i].top - 0.5) return { chapter: secs[i].n, p: clamp((y - secs[i].top) / secs[i].height) };
    return { chapter: 1, p: 0 };
  }
  const yFor = (chapter, p) => { const s = secs[clamp(chapter, 1, 9) - 1]; return s.top + (p ?? s.rest) * s.height; };

  return {
    secs,
    get locked() { return locked; },
    /** Posición suavizada {chapter, p} (llamar cada frame). */
    update(dt) {
      const target = scrollY;
      smoothY = prefersReduced() ? target : damp(smoothY, target, 5.5, dt);
      if (Math.abs(smoothY - target) < 0.5) smoothY = target;
      return locate(smoothY);
    },
    raw: () => locate(scrollY),
    lock(on) {
      locked = !!on;
      document.documentElement.classList.toggle("is-locked", locked);
    },
    /** Salta sin animación (reposiciona también el valor suavizado). */
    jump(chapter, p) { const y = yFor(chapter, p); scrollTo({ top: y, behavior: "instant" }); smoothY = y; },
    /** Scroll suave a un capítulo (a su punto de descanso por defecto). */
    goTo(chapter, p) { scrollTo({ top: yFor(chapter, p), behavior: prefersReduced() ? "auto" : "smooth" }); },
    layout
  };
}
