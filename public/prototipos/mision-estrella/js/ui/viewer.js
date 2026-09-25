// Visor de fotos a pantalla completa: swipe, contador "2 / 6", pie de foto, cierre con botón, gesto hacia abajo
// o Escape. onClose(índice mostrado) permite que la polaroid regrese a su lugar.
import { h, $, prefersReduced } from "../util.js";
import { demoData } from "../data.js";
import { icon } from "./icons.js";

export function openViewer(root, start, { audio, onClose } = {}) {
  audio?.tap();
  const photos = demoData.gallery, n = photos.length;
  const opener = document.activeElement;
  let shown = start;
  const count = h("p.viewer-count", { "aria-live": "polite", text: `${start + 1} / ${n}` });
  const track = h("div.viewer-track", ...photos.map((p) => h("figure.viewer-item", h("img", { src: p.src, alt: p.caption, decoding: "async" }), h("figcaption", { text: p.caption }))));
  const close = () => {
    if (v.classList.contains("is-out")) return;
    v.classList.add("is-out"); setTimeout(() => v.remove(), prefersReduced() ? 0 : 220);
    opener?.focus?.({ preventScroll: true }); onClose?.(shown);
  };
  const go = (d) => track.scrollTo({ left: track.clientWidth * Math.max(0, Math.min(n - 1, shown + d)), behavior: prefersReduced() ? "auto" : "smooth" });
  const v = h("div.viewer", { role: "dialog", "aria-modal": "true", "aria-label": "Foto a pantalla completa", onkeydown: (e) => {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); }
  } },
    h("button.icon-btn.viewer-close", { type: "button", "aria-label": "Cerrar", html: icon("close", { size: 26 }), onclick: close }),
    count, track);
  track.addEventListener("scroll", () => { const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== shown) { shown = i; count.textContent = `${i + 1} / ${n}`; } }, { passive: true });
  // gesto hacia abajo para cerrar
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
  requestAnimationFrame(() => { track.scrollLeft = track.clientWidth * start; $(".viewer-close", v).focus({ preventScroll: true }); });
  return close;
}
