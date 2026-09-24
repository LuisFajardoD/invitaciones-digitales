// "Inscríbete a la carrera": adultos y niños por separado, color de playera, peinado, vista previa en
// vivo de su corredor, mensaje opcional plegado y "No podré asistir". Guarda con el contrato común.
import { demoData } from "../data.js";
import { h, $$, prefersReduced, vibrate } from "../util.js";
import { state } from "../state.js";
import { createRsvp, whatsappText, MAX_MESSAGE, peopleLabel } from "../../../_shared/rsvp-contract.js";
import { icon, openWhatsApp, waLink } from "./content.js";
import { guestLook, runnerCanvas, paintRunner } from "./avatar.js";

export const SHIRTS = [
  { color: "#FF5A5F", name: "Rojo" }, { color: "#9BE564", name: "Lima" }, { color: "#B388FF", name: "Lila" },
  { color: "#FFC93C", name: "Amarillo" }, { color: "#3D5AFE", name: "Azul" }, { color: "#FF9FCB", name: "Rosa pastel" }
];
const HAIRS = [{ id: "short", name: "Corto" }, { id: "long", name: "Largo" }, { id: "pigtails", name: "Coletas" }];
const childName = demoData.child.name;
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;

export const savedRsvp = () => state.get().rsvp || null;
export function whatsappUrl(r) {
  // api.whatsapp.com directo: la redirección de wa.me convierte los emojis en "�"
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(demoData.rsvp.whatsapp)}&text=${encodeURIComponent(whatsappText(r, demoData.rsvp, childName))}`;
}

/**
 * Formulario de confirmación. ctx: { ui, audio, game, onCelebrate(r), onFarewell(r) }.
 * Devuelve { el, refresh }.
 */
export function createRsvpForm({ ui, audio, onSubmit }) {
  const saved = savedRsvp();
  let color = saved?.avatar?.color || SHIRTS[0].color;
  let hair = saved?.avatar?.hair || "short";
  let adults = saved?.attending ? saved.adults : 1;
  let children = saved?.attending ? saved.children : 0;
  let mode = "yes";

  const name = h("input.field#rsvp-name", { type: "text", autocomplete: "name", maxLength: 60, placeholder: "Tu nombre o el de tu familia", value: saved?.guestName || "" });
  const err = h("p.field-err#rsvp-err", { role: "alert", hidden: true, text: "Escribe tu nombre para inscribirte." });
  name.setAttribute("aria-describedby", "rsvp-err");
  // Vista previa en vivo con su dorsal (inicial del nombre)
  const prev = runnerCanvas(guestLook(color, hair, name.value), { w: 90, h: 110, anim: "stand" });
  const preview = h("div.preview", { "aria-hidden": "true" }, prev);
  function repaint(hop = true) {
    paintRunner(prev, guestLook(color, hair, name.value), { w: 90, h: 110, anim: hop ? "celebrate" : "stand", t: 0.1 });
    if (hop && !prefersReduced()) { prev.classList.remove("hop"); void prev.offsetWidth; prev.classList.add("hop"); setTimeout(() => paintRunner(prev, guestLook(color, hair, name.value), { w: 90, h: 110, anim: "stand" }), 450); }
  }
  name.addEventListener("input", () => repaint(false));

  // Adultos y niños corredores
  function stepper(label, get, set) {
    const out = h("output", { "aria-live": "polite" });
    const minus = h("button.fl.fl-white.fl-round", { type: "button", "aria-label": `Menos ${label.toLowerCase()}`, html: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 12h12" stroke="#1B1F3B" stroke-width="3.2" stroke-linecap="round"/></svg>', onclick: () => { audio.tap(); set(get() - 1); } });
    const plus = h("button.fl.fl-lime.fl-round", { type: "button", "aria-label": `Más ${label.toLowerCase()}`, html: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 12h12M12 6v12" stroke="#1B1F3B" stroke-width="3.2" stroke-linecap="round"/></svg>', onclick: () => { audio.tap(); set(get() + 1); } });
    const paint = () => { out.textContent = String(get()); minus.disabled = get() <= 0; plus.disabled = get() >= 10; };
    return { el: h("div.people-box", h("p", { text: label }), h("div.stepper", { role: "group", "aria-label": label }, minus, out, plus)), paint };
  }
  const aS = stepper("Adultos", () => adults, (v) => { adults = Math.max(0, Math.min(10, v)); paintPeople(); });
  const kS = stepper("Niños corredores", () => children, (v) => { children = Math.max(0, Math.min(10, v)); paintPeople(); });
  const total = h("p.total", { "aria-live": "polite" });
  const warn = h("p.field-err", { role: "status", hidden: true, text: "Agrega al menos una persona para inscribirte." });

  // Color de playera y peinado
  const colors = h("div.picks", { role: "radiogroup", "aria-label": "Color de playera de tu corredor" },
    ...SHIRTS.map((c) => h("button.pick", { type: "button", role: "radio", "aria-label": c.name, "data-v": c.color, style: { "--c": c.color }, onclick: () => { color = c.color; mark(); repaint(); audio.tap(); } })));
  const hairs = h("div.picks", { role: "radiogroup", "aria-label": "Peinado" },
    ...HAIRS.map((o) => h("button.pick.hair-pick", { type: "button", role: "radio", "data-v": o.id, onclick: () => { hair = o.id; mark(); repaint(); audio.tap(); } }, o.name)));
  function mark() {
    $$(".pick", colors).forEach((b) => { const on = b.dataset.v === color; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
    $$(".pick", hairs).forEach((b) => { const on = b.dataset.v === hair; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
  }

  // Mensaje opcional plegado
  const msg = h("textarea.field#rsvp-msg", { maxLength: MAX_MESSAGE, rows: 3, placeholder: `¡Feliz cumple, ${childName}!`, value: saved?.message || "" });
  const count = h("span.msg-count", { "aria-live": "polite" });
  const paintCount = () => { count.textContent = `${msg.value.length}/${MAX_MESSAGE}`; };
  msg.addEventListener("input", paintCount);
  const msgBox = h("div.stack", { hidden: !saved?.message }, h("label.lbl", { for: "rsvp-msg", text: `Mensaje para ${childName} (opcional)` }), msg, count);
  const msgToggle = h("button.fl.fl-white.fl-sm.msg-toggle", { type: "button", hidden: !!saved?.message, onclick: () => { audio.tap(); msgBox.hidden = false; msgToggle.hidden = true; msg.focus({ preventScroll: true }); } }, h("span", { text: "+ Dejar un mensaje" }));

  const submit = h("button.fl.fl-coral.fl-lg.fl-block", { type: "submit" }, h("span", { text: "¡INSCRIBIRME!" }));
  const decline = h("button.link", { type: "button", text: "No podré asistir", onclick: () => setMode("no") });
  const back = h("button.link", { type: "button", hidden: true, text: "← Sí voy a ir", onclick: () => setMode("yes") });
  const noNote = h("p.info-v", { hidden: true, text: `Qué pena que no puedas venir. Déjale un mensaje a ${childName} si quieres.` });
  const yesOnly = h("div.stack",
    h("div.people", aS.el, kS.el), total, warn,
    h("p.lbl", { text: "Color de playera de tu corredor" }), colors,
    h("p.lbl", { text: "Peinado" }), hairs, preview);
  const form = h("form.stack", { novalidate: true, onsubmit: (e) => { e.preventDefault(); send(); } },
    h("span.deadline", { html: `${icon("calendar", { size: 18 })}<span>${demoData.rsvp.deadlineText}</span>` }),
    noNote, h("label.lbl", { for: "rsvp-name", text: "Nombre" }), name, err, yesOnly, msgToggle, msgBox, submit, decline, back);

  function paintPeople() {
    aS.paint(); kS.paint();
    total.textContent = `Total: ${plural(adults + children, "persona", "personas")}`;
    const bad = mode === "yes" && adults + children < 1;
    warn.hidden = !bad; submit.disabled = bad;
  }
  function setMode(m) {
    audio.tap(); mode = m;
    const no = m === "no";
    yesOnly.hidden = no; decline.hidden = no; back.hidden = !no; noNote.hidden = !no;
    submit.replaceChildren(h("span", { text: no ? "Enviar respuesta" : "¡INSCRIBIRME!" }));
    submit.classList.toggle("fl-coral", !no); submit.classList.toggle("fl-blue", no);
    paintPeople();
    name.focus({ preventScroll: true });
  }

  // Estado ya confirmado
  const done = h("div.done-card", { hidden: true });
  function renderDone() {
    const r = savedRsvp();
    done.hidden = !r; form.hidden = !!r;
    if (!r) return;
    done.classList.toggle("is-no", !r.attending);
    const av = r.attending ? runnerCanvas(guestLook(r.avatar.color, r.avatar.hair, r.guestName), { w: 52, h: 64, anim: "celebrate", t: 0.1 }) : null;
    if (av) av.classList.add("av");
    done.replaceChildren(
      av || h("span.info-ic", { html: icon("heart", { fill: "#FF9FCB" }) }),
      h("div", { style: { flex: "1", minWidth: "0" } }, r.attending
        ? [h("p.info-k", { text: "Ya estás inscrito ✔" }), h("p.info-v", { text: `${r.guestName} · ${peopleLabel(r)}` })]
        : [h("p.info-k", { text: "Respondiste que no podrás asistir" }), h("p.info-v", { text: r.guestName })],
        h("div.row", { style: { marginTop: "8px" } },
          h("button.fl.fl-white.fl-sm", { type: "button", onclick: () => { audio.tap(); done.hidden = true; form.hidden = false; setMode("yes"); }, html: `${icon("edit", { size: 18 })}<span>${r.attending ? "Editar" : "Cambiar respuesta"}</span>` }),
          h("a.fl.fl-lime.fl-sm", { ...waLink(ui, whatsappUrl(r)), html: `${icon("chat", { size: 18 })}<span>Reenviar</span>` }))));
  }

  function send() {
    if (!name.value.trim()) {
      err.hidden = false; name.classList.remove("shake"); void name.offsetWidth; name.classList.add("shake"); name.focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    let r;
    try {
      r = createRsvp({ invitationId: demoData.invitationId, guestName: name.value, attending: mode === "yes", adults, children, message: msgBox.hidden ? "" : msg.value, avatar: { style: "circuito-runner", color, hair } }, { previous: savedRsvp() || undefined });
    } catch { paintPeople(); return; }
    state.set({ rsvp: r });
    audio.tap(); vibrate([30, 40, 60]);
    renderDone();
    onSubmit?.(r);
  }

  paintPeople(); paintCount(); mark(); renderDone();
  return { el: h("div.stack", done, form), refresh: renderDone };
}

/** Celebración tras inscribirse (el corredor del invitado ya subió al podio). */
export function celebrate(ui, r, { audio, onClose }) {
  const url = whatsappUrl(r);
  const box = h("div.party", { role: "status" },
    h("h2", { text: "¡Ya estás en la carrera!" }),
    h("p", { text: "Abriendo WhatsApp para avisar a los anfitriones…" }),
    h("div.row",
      h("a.fl.fl-lime", { ...waLink(ui, url, () => clearTimeout(t)), html: `${icon("chat")}<span>Abrir WhatsApp</span>` }),
      h("button.fl.fl-white", { type: "button", onclick: () => close() }, h("span", { text: "¡Listo!" }))));
  ui.append(box);
  audio.fanfare();
  const t = setTimeout(() => openWhatsApp(ui, url), 1500);
  function close() { clearTimeout(t); box.remove(); onClose?.(); }
  return close;
}
/** "No podré asistir": el corredor del niño se despide y aparece "¡Te extrañaremos!". */
export function farewell(ui, r, { audio, onClose }) {
  const url = whatsappUrl(r);
  const box = h("div.party", { role: "status" },
    h("h2", { text: "¡Te extrañaremos!" }),
    h("p", { text: `Le diremos a ${childName} que le mandas saludos. Abriendo WhatsApp…` }),
    h("div.row",
      h("a.fl.fl-lime", { ...waLink(ui, url, () => clearTimeout(t)), html: `${icon("chat")}<span>Abrir WhatsApp</span>` }),
      h("button.fl.fl-white", { type: "button", onclick: () => close() }, h("span", { text: "Cerrar" }))));
  ui.append(box);
  audio.tap();
  const t = setTimeout(() => openWhatsApp(ui, url), 1500);
  function close() { clearTimeout(t); box.remove(); onClose?.(); }
  return close;
}
