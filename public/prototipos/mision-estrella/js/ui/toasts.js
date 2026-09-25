// Avisos breves, aviso de modo demo (en vez de abrir WhatsApp) y apertura segura de WhatsApp.
import { h, $, $$ } from "../util.js";
import { DEMO } from "../state.js";

export function toast(root, text, ms = 2800) {
  $$(".toast", root).forEach((t) => t.remove());
  const t = h("div.toast", { role: "status", text });
  root.append(t);
  setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 350); }, ms);
  return t;
}

/** Modo muestra: en vez de abrir WhatsApp, un aviso con el estilo de la invitación. */
export function demoNotice(root) {
  if ($(".demo-note", root)) return Promise.resolve();
  const opener = document.activeElement;
  return new Promise((resolve) => {
    const close = () => { m.remove(); opener?.focus?.({ preventScroll: true }); resolve(); };
    const ok = h("button.btn.btn-pink.btn-block", { type: "button", onclick: close }, "Entendido");
    const m = h("div.modal.demo-note", { role: "dialog", "aria-modal": "true", "aria-labelledby": "demo-note-t", onclick: (e) => { if (e.target === m) close(); }, onkeydown: (e) => { if (e.key === "Escape") close(); } },
      h("div.modal-card", h("p.demo-ic", { "aria-hidden": "true", text: "✨" }), h("p#demo-note-t", { text: "En la invitación real, aquí se abre WhatsApp para enviar la confirmación a los anfitriones." }), ok));
    root.append(m);
    ok.focus({ preventScroll: true });
  });
}

export function openWhatsApp(root, url) {
  if (DEMO) return demoNotice(root);
  let w = null;
  try { w = window.open(url, "_blank"); if (w) w.opener = null; } catch { w = null; }
  if (!w) { try { location.href = url; } catch { /* queda el botón */ } }
  return Promise.resolve();
}
