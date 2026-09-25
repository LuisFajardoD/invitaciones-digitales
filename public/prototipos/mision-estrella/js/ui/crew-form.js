// "ÚNETE A LA TRIPULACIÓN": hoja expandida con nombre, adultos (0–10, inicial 1), niños (0–10, inicial 0), total
// y validación (mínimo 1), diseñador del parche de misión (vista previa en vivo, 6 colores y 6 símbolos) y
// mensaje opcional (máx. 140, plegado). "No podré asistir" pide nombre y mensaje. Contrato común de RSVP.
import { h, $, prefersReduced, missionName } from "../util.js";
import { demoData } from "../data.js";
import { icon } from "./icons.js";
import { PATCH_COLORS, PATCH_SYMBOLS, SYMBOL_LABELS, drawPatch, symbolSVG } from "./patch.js";
import { createRsvp, RsvpError, MAX_PEOPLE, MAX_MESSAGE } from "../../../_shared/rsvp-contract.js";

export function openCrewForm(root, { audio, previous = null, decline = false, onSubmit, onClose }) {
  const opener = document.activeElement;
  let mode = decline ? "no" : "yes";
  const st = {
    name: previous?.guestName || "", adults: previous?.attending ? previous.adults : 1, children: previous?.attending ? previous.children : 0,
    color: previous?.avatar?.color && PATCH_COLORS.includes(previous.avatar.color.toUpperCase()) ? previous.avatar.color.toUpperCase() : PATCH_COLORS[0],
    symbol: previous?.avatar?.symbol || "star", message: previous?.message || ""
  };
  const nameIn = h("input.field#crew-name", { type: "text", maxlength: 60, autocomplete: "name", value: st.name, placeholder: "Tu nombre o el de tu familia", oninput: () => { st.name = nameIn.value; nameErr.hidden = true; paint(); } });
  const nameErr = h("p.field-err", { hidden: true, role: "alert", text: "Escribe tu nombre para la tripulación." });
  const stepper = (key, label, min) => {
    const out = h("output", { "aria-live": "polite", text: String(st[key]) });
    const set = (v) => { st[key] = Math.max(min, Math.min(MAX_PEOPLE, v)); out.textContent = String(st[key]); totalEl(); audio?.tap(); };
    return h("div.step-box", h("p", { text: label }), h("div.stepper",
      h("button.icon-btn.sm", { type: "button", "aria-label": `Menos ${label.toLowerCase()}`, onclick: () => set(st[key] - 1) }, "–"), out,
      h("button.icon-btn.sm", { type: "button", "aria-label": `Más ${label.toLowerCase()}`, onclick: () => set(st[key] + 1) }, "+")));
  };
  const total = h("p.total", { "aria-live": "polite" });
  const peopleErr = h("p.field-err", { hidden: true, role: "alert", text: "Debe venir al menos una persona." });
  const totalEl = () => { const n = st.adults + st.children; total.textContent = `Total: ${n} persona${n === 1 ? "" : "s"}`; peopleErr.hidden = n > 0; };
  // parche
  const prev = h("canvas.patch-preview", { width: 360, height: 360, role: "img", "aria-label": "Vista previa de tu parche de misión" });
  const paint = () => drawPatch(prev.getContext("2d"), 360, { color: st.color, symbol: st.symbol, top: st.name.trim() || "Tu nombre", bottom: missionName() });
  const colorBtns = PATCH_COLORS.map((c) => h("button.swatch", { type: "button", style: { "--c": c }, "aria-label": `Color ${c}`, "aria-pressed": String(c === st.color), onclick: () => { st.color = c; colorBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.style.getPropertyValue("--c") === c))); paint(); audio?.tap(); } }));
  const symBtns = PATCH_SYMBOLS.map((s) => h("button.sym", { type: "button", "aria-label": SYMBOL_LABELS[s], "aria-pressed": String(s === st.symbol), html: `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">${symbolSVG(s, "currentColor")}</svg>`, onclick: () => { st.symbol = s; symBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(PATCH_SYMBOLS[i] === s))); paint(); audio?.tap(); } }));
  // mensaje (plegado)
  const msg = h("textarea.field", { rows: 3, maxlength: MAX_MESSAGE, placeholder: `Un mensaje para ${demoData.child.name} (opcional)`, oninput: () => { st.message = msg.value; count.textContent = `${msg.value.length}/${MAX_MESSAGE}`; } });
  msg.value = st.message;
  const count = h("p.msg-count", { text: `${st.message.length}/${MAX_MESSAGE}` });
  const msgBox = h("div.stack", { hidden: !st.message }, msg, count);
  const msgToggle = h("button.link.msg-toggle", { type: "button", hidden: !!st.message, onclick: () => { msgBox.hidden = false; msgToggle.hidden = true; msg.focus(); } }, "+ Dejar un mensaje");

  const submit = h("button.btn.btn-pink.btn-lg.btn-block", { type: "submit" });
  const switchLink = h("button.link", { type: "button" });
  const yesPart = h("div.stack",
    h("div.people", stepper("adults", "Adultos", 0), stepper("children", "Niños", 0)), total, peopleErr,
    h("div.patch-design",
      h("p.label", { text: "Diseña tu parche de misión" }),
      prev,
      h("div.swatches", { role: "group", "aria-label": "Color del parche" }, ...colorBtns),
      h("div.syms", { role: "group", "aria-label": "Símbolo del parche" }, ...symBtns)));
  const form = h("form.stack", { novalidate: true },
    h("label.label", { for: "crew-name", text: "Nombre" }), nameIn, nameErr,
    yesPart, msgToggle, msgBox, submit, switchLink);
  const title = h("h2.sheet-title");
  const sub = h("p.deadline", { html: `${icon("clock", { size: 16 })}<span>${demoData.rsvp.deadlineText}</span>` });
  const closeBtn = h("button.icon-btn.sheet-close", { type: "button", "aria-label": "Cerrar", html: icon("close", { size: 24 }), onclick: () => close() });
  const sheet = h("section.sheet", { role: "dialog", "aria-modal": "true", "aria-labelledby": "crew-title" }, h("header.sheet-head", h("div", title, sub), closeBtn), h("div.sheet-body", form));
  title.id = "crew-title";
  root.append(sheet);
  function setMode(m) {
    mode = m;
    yesPart.hidden = m === "no";
    title.textContent = m === "yes" ? "ÚNETE A LA TRIPULACIÓN" : "No podré asistir";
    submit.innerHTML = m === "yes" ? `<span>¡ME UNO A LA MISIÓN!</span>${icon("rocket", { size: 22 })}` : "<span>Enviar respuesta</span>";
    switchLink.textContent = m === "yes" ? "No podré asistir" : "Mejor sí me uno a la tripulación";
    if (m === "no") { msgBox.hidden = false; msgToggle.hidden = true; }
  }
  switchLink.addEventListener("click", () => { audio?.tap(); setMode(mode === "yes" ? "no" : "yes"); });
  setMode(mode); totalEl(); paint();
  if (document.fonts?.load) document.fonts.load("600 20px Fredoka").then(paint).catch(() => {});

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!st.name.trim()) { nameErr.hidden = false; nameIn.focus(); shake(nameIn); return; }
    if (mode === "yes" && st.adults + st.children < 1) { peopleErr.hidden = false; shake(total); return; }
    try {
      const r = createRsvp({ invitationId: demoData.invitationId, guestName: st.name, attending: mode === "yes", adults: st.adults, children: st.children, message: st.message, avatar: { style: "mission-patch", color: st.color, symbol: st.symbol } }, { previous });
      audio?.tap();
      close(() => onSubmit(r));
    } catch (err) { if (err instanceof RsvpError) { peopleErr.textContent = err.message; peopleErr.hidden = false; } else throw err; }
  });
  function shake(el) { if (prefersReduced()) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  sheet.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  let closed = false;
  function close(then) {
    if (closed) return; closed = true;
    sheet.classList.add("is-out");
    setTimeout(() => sheet.remove(), prefersReduced() ? 0 : 350);
    onClose?.(); then?.();
    if (!then) opener?.focus?.({ preventScroll: true });
  }
  setTimeout(() => (st.name ? $(".btn-pink", sheet) : nameIn).focus({ preventScroll: true }), 80);
  return { close };
}
