// Portada: título "Misión {name}", insignia "¡Cumple {age}!" y el botón circular "Mantén presionado para encender
// motores" con anillo de progreso (~1.5 s). Nunca avanza solo: a los 4 s aparece una manita. Si se suelta antes,
// todo baja suavemente. El gesto desbloquea el audio (en pointerdown y en pointerup, por iOS). Teclado: barra
// espaciadora. Debajo, "Ver solo la información" (abre la Bitácora); en visitas repetidas, el botón "Ver la bitácora".
import { h, missionName, prefersReduced } from "../util.js";
import { demoData } from "../data.js";
import { icon } from "./icons.js";

const HOLD = 1.5;

/**
 * intro: "play" = la entrada escalonada empieza ya (la escena está a la vista); "pending" = todo oculto hasta que
 * la escena esté 100 % lista (main.js llama playIntro()).
 */
export function showCover(root, { audio, returning = false, onHold, onIgnite, onInfo, intro = "play" }) {
  const R = 46, C = 2 * Math.PI * R;
  const ring = h("span.hold-ring", { "aria-hidden": "true", html: `<svg viewBox="0 0 110 110"><circle class="hold-track" cx="55" cy="55" r="${R}"/><circle class="hold-fill" cx="55" cy="55" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg>` });
  const fill = ring.querySelector(".hold-fill");
  const btn = h("button.hold", { type: "button", "aria-label": "Mantén presionado para encender motores (o mantén la barra espaciadora)" },
    ring, h("span.hold-core", { html: icon("rocket", { size: 34 }) }));
  const label = h("p.hold-label", { text: "Mantén presionado para encender motores" });
  const hand = h("div.hand", { "aria-hidden": "true", html: '<svg viewBox="0 0 64 64" width="56" height="56"><path d="M26 30V12a4 4 0 018 0v14l12 3c3 .8 5 3.6 4.6 6.6L48 50H28L18 38a3.5 3.5 0 015-5z" fill="#FFF7EC" stroke="#1E1B4B" stroke-width="3" stroke-linejoin="round"/></svg>' });
  // orden de la entrada (--i × 120 ms): (bienvenida) título → insignia → botón (con su texto) → enlace
  let n = 0; const ci = (node) => { node.classList.add("ci"); node.style.setProperty("--i", n++); return node; };
  const top = h("div.cover-top",
    returning ? ci(h("p.welcome", { text: "¡Bienvenido de vuelta, tripulante!" })) : null,
    ci(h("h1.cover-title", { text: missionName() })),
    ci(h("p.badge", { html: `${icon("star", { size: 18 })}<span>¡Cumple ${demoData.child.age}!</span>` })));
  const holdWrap = ci(h("div.hold-wrap", btn, hand)); label.classList.add("ci"); label.style.setProperty("--i", n - 1);
  const el = h(`section.cover.${intro === "pending" ? "is-pending" : "is-intro"}`, { "aria-label": "Portada" },
    top,
    h("div.cover-bottom",
      holdWrap, label,
      // visita repetida: un solo botón secundario; primera visita: sólo el enlace discreto (hacen lo mismo)
      ci(returning
        ? h("button.btn.btn-ghost.btn-sm", { type: "button", onclick: () => { audio.unlock(); onInfo?.(); }, html: `${icon("log", { size: 20 })}<span>Ver la bitácora</span>` })
        : h("button.link", { type: "button", onclick: () => { audio.unlock(); onInfo?.(); } }, "Ver solo la información"))));
  root.append(el);

  let holding = false, prog = 0, done = false, raf = 0, last = performance.now(), idle = 0;
  const unlock = () => { audio.unlock(); };
  const start = (e) => { if (done) return; e?.preventDefault?.(); unlock(); holding = true; btn.classList.add("is-down"); idle = -999; hand.classList.remove("is-on"); };
  const stop = () => { unlock(); holding = false; btn.classList.remove("is-down"); };
  btn.addEventListener("pointerdown", (e) => { btn.setPointerCapture?.(e.pointerId); start(e); });
  btn.addEventListener("pointerup", stop); btn.addEventListener("pointercancel", stop); btn.addEventListener("lostpointercapture", stop);
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
  const onKey = (e) => {
    if (e.code !== "Space" && e.key !== " ") return;
    if (e.target.closest?.("input, textarea, .link, .btn")) return;
    e.preventDefault();
    if (e.type === "keydown" && !e.repeat) start(); else if (e.type === "keyup") stop();
  };
  addEventListener("keydown", onKey); addEventListener("keyup", onKey);
  // Enter/click corto en el botón: no enciende (hay que mantener); sólo anima para enseñar el gesto.
  btn.addEventListener("click", () => { if (prog < 0.05) { btn.classList.remove("nudge"); void btn.offsetWidth; btn.classList.add("nudge"); } });

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now; // tiempo real: ~1.5 s aunque el teléfono vaya lento
    if (!done) {
      prog = holding ? Math.min(1, prog + dt / HOLD) : Math.max(0, prog - dt / 0.7);
      fill.setAttribute("stroke-dashoffset", (C * (1 - prog)).toFixed(1));
      btn.style.setProperty("--p", prog.toFixed(3));
      el.style.setProperty("--shake", prefersReduced() ? "0" : String(prog * prog));
      onHold?.(prog);
      if (!el.classList.contains("is-pending")) idle += dt; // (la manita cuenta desde que la portada se ve)
      if (idle > 4 && !holding) hand.classList.add("is-on");
      if (prog >= 1) { done = true; holding = false; onIgnite?.(); }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  if (intro !== "pending") setTimeout(() => btn.focus({ preventScroll: true }), 60);
  return {
    el,
    /** Entrada escalonada (cuando la escena ya está a la vista). */
    playIntro() { if (!el.classList.contains("is-pending")) return; el.classList.replace("is-pending", "is-intro"); setTimeout(() => btn.focus({ preventScroll: true }), 400); },
    hide() { cancelAnimationFrame(raf); removeEventListener("keydown", onKey); removeEventListener("keyup", onKey); el.classList.add("is-out"); setTimeout(() => el.remove(), 500); onHold?.(0); }
  };
}
