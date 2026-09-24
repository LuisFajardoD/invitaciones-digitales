// Parada 7: "Pon tu bloque en la isla" — adultos y niños por separado, mensaje opcional,
// "No podré asistir", vista previa del bloque, colocación en el muro, noche con fuegos y WhatsApp.
// Guarda con el contrato común de Gloobi (_shared/rsvp-contract.js).
import { demoData } from "../data.js";
import { h, $$, sleep, vibrate, prefersReduced } from "../util.js";
import { icon } from "./icons.js";
import { SYMBOLS, SYMBOL_KEYS, BLOCK_COLORS, symbolSVG } from "../symbols.js";
import { state, DEMO } from "../state.js";
import { createRsvp as makeRsvp, whatsappText, MAX_MESSAGE } from "../../../_shared/rsvp-contract.js";

const childName = demoData.child.name;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Confirmación guardada, migrando el formato anterior ({ name, count, color, symbol }) al contrato. */
export function savedRsvp() {
  const r = state.get().rsvp;
  if (!r) return null;
  if (r.guestName) return r;
  try {
    const m = makeRsvp({ invitationId: demoData.invitationId, guestName: r.name, attending: true, adults: r.count || 1, children: 0, avatar: { style: "isla-block", color: r.color, symbol: r.symbol }, createdAt: r.at ? new Date(r.at).toISOString() : undefined });
    state.set({ rsvp: m });
    return m;
  } catch { return null; }
}
/** ¿Ya puso su bloque? (confirmó que asiste) */
export const hasBlock = () => !!savedRsvp()?.attending;

export function whatsappUrl(r) {
  // api.whatsapp.com directo: la redirección de wa.me convierte los emojis en "�"
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(demoData.rsvp.whatsapp)}&text=${encodeURIComponent(whatsappText(r, demoData.rsvp, childName))}`;
}
/** Modo muestra: en vez de abrir WhatsApp, un aviso con el estilo de la invitación. */
function demoNotice() {
  if (document.querySelector(".demo-note")) return;
  const close = () => { m.remove(); opener?.focus?.({ preventScroll: true }); };
  const opener = document.activeElement;
  const ok = h("button.bb.bb-lg.bb-block", { type: "button", onclick: close }, h("span", { text: "Entendido" }));
  const m = h("div.modal.demo-note", { role: "dialog", "aria-modal": "true", "aria-labelledby": "demo-note-t", onclick: (e) => { if (e.target === m) close(); }, onkeydown: (e) => { if (e.key === "Escape") close(); } },
    h("div.modal-panel.parch",
      h("div.modal-body.stack",
        h("p.demo-note-ic", { "aria-hidden": "true", text: "✨" }),
        h("p.lead#demo-note-t", { text: "En la invitación real, aquí se abre WhatsApp para enviar la confirmación a los anfitriones." }),
        ok)));
  (document.querySelector("#app") || document.body).append(m);
  ok.focus({ preventScroll: true });
}
function openWhatsApp(url) {
  if (DEMO) { demoNotice(); return; }
  let w = null;
  try { w = window.open(url, "_blank"); if (w) w.opener = null; } catch { w = null; }
  if (!w) { try { location.href = url; } catch { /* queda el botón */ } }
}
/** Props de un enlace a WhatsApp (en modo muestra, el toque muestra el aviso en vez de salir). */
const waLink = (url) => ({ href: url, target: "_blank", rel: "noopener", onclick: (e) => { if (DEMO) { e.preventDefault(); demoNotice(); } } });

/** Bloques del muro: sólo quienes asisten. */
export function guestList() {
  const r = savedRsvp();
  return [
    ...demoData.rsvp.mockGuests.filter((g) => g.attending !== false).map((g) => ({ ...g })),
    ...(r && r.attending ? [{ name: r.guestName, color: r.avatar.color, symbol: r.avatar.symbol, adults: r.adults, children: r.children, me: true }] : [])
  ];
}

export function createRsvp({ app, world, sheet, audio, onPlaced }) {
  const saved = savedRsvp();
  let color = saved?.avatar?.color || BLOCK_COLORS[0].color;
  let symbol = saved?.avatar?.symbol || "star";
  let adults = saved?.attending ? saved.adults : 1;
  let children = saved?.attending ? saved.children : 0;
  let mode = "yes";

  /* ---------- Vista previa: cubo CSS 3D girando ---------- */
  const faces = [1, 2, 3, 4, 5, 6].map((n) => h(`span.cube-f.f${n}`));
  const cube = h("div.cube", ...faces);
  const preview = h("div.preview", { "aria-hidden": "true" }, cube);
  function paint(pop) {
    cube.style.setProperty("--c", color);
    faces.forEach((f, i) => { f.innerHTML = i < 4 ? symbolSVG(symbol, { size: 40 }) : ""; });
    if (pop) { cube.classList.remove("pop-cube"); void cube.offsetWidth; cube.classList.add("pop-cube"); }
  }

  /* ---------- Nombre ---------- */
  const name = h("input.field#rsvp-name", { type: "text", autocomplete: "name", maxLength: 60, placeholder: "Tu nombre o el de tu familia", value: saved?.guestName || "" });
  const err = h("p.field-err#rsvp-err", { role: "alert", hidden: true, text: "Escribe tu nombre para responder." });
  name.setAttribute("aria-describedby", "rsvp-err");

  /* ---------- Adultos y niños ---------- */
  function stepper(label, get, set) {
    const out = h("output.step-val", { "aria-live": "polite" });
    const minus = h("button.bb.bb-cream", { type: "button", "aria-label": `Menos ${label.toLowerCase()}`, html: icon("minus"), onclick: () => { audio.tap(); set(get() - 1); } });
    const plus = h("button.bb.bb-mint", { type: "button", "aria-label": `Más ${label.toLowerCase()}`, html: icon("plus"), onclick: () => { audio.tap(); set(get() + 1); } });
    const paintS = () => { out.textContent = String(get()); minus.disabled = get() <= 0; plus.disabled = get() >= 10; };
    return { el: h("div.people-box", h("p.lbl", { text: label }), h("div.stepper", { role: "group", "aria-label": label }, minus, out, plus)), paint: paintS };
  }
  const aStep = stepper("Adultos", () => adults, (n) => { adults = Math.max(0, Math.min(10, n)); paintPeople(); });
  const kStep = stepper("Niños exploradores", () => children, (n) => { children = Math.max(0, Math.min(10, n)); paintPeople(); });
  const total = h("p.people-total", { "aria-live": "polite" });
  const warn = h("p.field-err", { role: "status", hidden: true, text: "Agrega al menos una persona para poner tu bloque." });

  /* ---------- Mensaje opcional plegado ---------- */
  const msg = h("textarea.field.msg-field#rsvp-msg", { maxLength: MAX_MESSAGE, rows: 3, placeholder: `¡Feliz cumple, ${childName}!`, value: saved?.message || "" });
  const msgCount = h("span.msg-count", { "aria-live": "polite" });
  const paintCount = () => { msgCount.textContent = `${msg.value.length}/${MAX_MESSAGE}`; };
  msg.addEventListener("input", paintCount);
  const msgBox = h("div.msg-box", { hidden: !saved?.message }, h("label.lbl", { for: "rsvp-msg", text: `Mensaje para ${childName} (opcional)` }), msg, msgCount);
  const msgToggle = h("button.bb.bb-cream.msg-toggle", { type: "button", hidden: !!saved?.message, onclick: () => { audio.tap(); msgBox.hidden = false; msgToggle.hidden = true; msg.focus({ preventScroll: true }); } }, h("span", { text: "+ Dejar un mensaje" }));

  /* ---------- Color y símbolo ---------- */
  const colors = h("div.picks", { role: "radiogroup", "aria-label": "Color del bloque" },
    ...BLOCK_COLORS.map((c) => h("button.pick", { type: "button", role: "radio", "aria-label": c.name, "data-v": c.color, style: { "--c": c.color }, onclick: () => { color = c.color; mark(); paint(true); audio.blockPop(1.2); } })));
  const symbols = h("div.picks", { role: "radiogroup", "aria-label": "Símbolo del bloque" },
    ...SYMBOL_KEYS.map((k) => h("button.pick.sym-pick", { type: "button", role: "radio", "aria-label": SYMBOLS[k].name, "data-v": k, html: symbolSVG(k, { size: 26 }), onclick: () => { symbol = k; mark(); paint(true); audio.blockPop(1.4); } })));
  function mark() {
    $$(".pick", colors).forEach((b) => { const on = b.dataset.v === color; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
    $$(".pick", symbols).forEach((b) => { const on = b.dataset.v === symbol; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on); });
  }

  /* ---------- Acciones ---------- */
  const submit = h("button.bb.bb-berry.bb-lg.bb-block", { type: "submit" }, h("span", { text: "COLOCAR MI BLOQUE" }));
  const decline = h("button.decline-link", { type: "button", text: "No podré asistir", onclick: () => setMode("no") });
  const back = h("button.decline-link", { type: "button", hidden: true, text: "← Sí voy a ir", onclick: () => setMode("yes") });
  const noNote = h("p.lead", { hidden: true, text: `Qué pena que no puedas venir. Déjale un mensaje a ${childName} si quieres.` });
  const yesOnly = h("div.stack", preview,
    h("div.people-row", aStep.el, kStep.el), total, warn,
    h("p.lbl", { text: "Color del bloque" }), colors,
    h("p.lbl", { text: "Símbolo del bloque" }), symbols);
  const form = h("form.stack", { novalidate: true, onsubmit: (e) => { e.preventDefault(); send(); } },
    noNote, h("label.lbl", { for: "rsvp-name", text: "Nombre" }), name, err,
    yesOnly, msgToggle, msgBox, submit, decline, back);

  function paintPeople() {
    aStep.paint(); kStep.paint();
    total.textContent = `Total: ${plural(adults + children, "persona", "personas")}`;
    const bad = mode === "yes" && adults + children < 1;
    warn.hidden = !bad;
    submit.disabled = bad;
  }
  function setMode(m) {
    audio.tap();
    mode = m;
    const no = m === "no";
    yesOnly.hidden = no; decline.hidden = no; back.hidden = !no; noNote.hidden = !no;
    submit.replaceChildren(h("span", { text: no ? "Enviar respuesta" : "COLOCAR MI BLOQUE" }));
    submit.classList.toggle("bb-berry", !no);
    paintPeople();
    name.focus({ preventScroll: true });
  }

  /* ---------- Ya respondió ---------- */
  const done = h("div.done-card", { hidden: true });
  function renderDone() {
    const r = savedRsvp();
    done.hidden = !r; form.hidden = !!r;
    if (!r) return;
    done.classList.toggle("is-no", !r.attending);
    done.replaceChildren(
      r.attending ? h("span.mini-block", { style: { "--c": r.avatar.color }, html: symbolSVG(r.avatar.symbol, { size: 30 }) }) : h("span.mini-block.is-balloon", { html: icon("heart", { size: 26 }) }),
      h("div", r.attending
        ? [h("p.info-k", { html: "Ya pusiste tu bloque <span aria-hidden=\"true\">✔</span>" }), h("p.info-v", { text: `${r.guestName} · ${plural(r.adults, "adulto", "adultos")}, ${plural(r.children, "niño", "niños")}` })]
        : [h("p.info-k", { text: "Respondiste que no podrás asistir" }), h("p.info-v", { text: r.guestName })]),
      h("div.row",
        h("button.bb.bb-cream", { type: "button", onclick: () => { audio.tap(); done.hidden = true; form.hidden = false; setMode("yes"); } }, h("span", { text: r.attending ? "Editar" : "Cambiar respuesta" })),
        h("a.bb.bb-mint", { ...waLink(whatsappUrl(r)), html: `${icon("chat")}<span>Reenviar</span>` })));
  }

  const counter = h("span.chip.wall-count");
  const guests = h("div.guests");
  function renderGuests() {
    const list = guestList();
    counter.textContent = String(list.length);
    counter.setAttribute("aria-label", `${list.length} bloques en el muro`);
    guests.replaceChildren(...list.map((g) => h("span.guest", h("i", { style: { "--c": g.color }, html: symbolSVG(g.symbol, { size: 18 }) }), g.me ? `${g.name} (tú)` : g.name)));
  }

  const el = h("div.stack",
    h("div.rsvp-head", h("span.chip", { html: `${icon("clock", { size: 16 })}<span>${demoData.rsvp.deadlineText}</span>` })),
    done, form,
    h("div.box.stack", h("div.row", { style: { alignItems: "center", justifyContent: "space-between" } }, h("p.info-k", { text: "Bloques en el muro" }), counter), guests));

  /* ---------- Enviar ---------- */
  let busy = false;
  async function send() {
    if (busy) return;
    if (!name.value.trim()) {
      err.hidden = false;
      name.classList.remove("shake"); void name.offsetWidth; name.classList.add("shake");
      name.focus({ preventScroll: true });
      return;
    }
    err.hidden = true;
    let r;
    try {
      r = makeRsvp({ invitationId: demoData.invitationId, guestName: name.value, attending: mode === "yes", adults, children, message: msgBox.hidden ? "" : msg.value, avatar: { style: "isla-block", color, symbol } }, { previous: savedRsvp() || undefined });
    } catch { paintPeople(); return; }
    busy = true;
    const hadBlock = hasBlock();
    state.set({ rsvp: r });
    audio.tap();
    sheet.setState("hidden");
    await sleep(350);
    if (r.attending) await celebrate(r);
    else await farewell(r, hadBlock);
  }

  async function celebrate(r) {
    await world.placeGuest({ name: r.guestName, color: r.avatar.color, symbol: r.avatar.symbol });
    vibrate([30, 40, 60]);
    audio.duck(true);
    world.night(2000);
    await sleep(900);
    const fw = world.fireworks([r.avatar.color, "#FFD23F", "#FF9FCB", "#4CC9F0", "#9BE564"]);
    const url = whatsappUrl(r);
    const box = h("div.placed.parch", { role: "status" },
      h("h2", { text: "¡Tu bloque ya está en la isla!" }),
      h("p", { text: "Abriendo WhatsApp para avisar a los anfitriones…" }),
      h("div.row", { style: { width: "100%" } },
        h("a.bb.bb-mint", { ...waLink(url), onclick: (e) => { if (DEMO) { e.preventDefault(); clearTimeout(t); demoNotice(); } }, html: `${icon("chat")}<span>Abrir WhatsApp</span>` }),
        h("button.bb.bb-cream", { type: "button", onclick: () => finish(box, t, r) }, h("span", { text: "¡Listo!" }))));
    app.append(box);
    const t = setTimeout(() => openWhatsApp(url), 1500);
    await fw;
    audio.duck(false);
    setTimeout(() => { if (box.isConnected) finish(box, t, r); }, 6000);
  }

  /** No asistirá: un pequeño globo de bloques sube con "¡Te extrañaremos!". Sin bloque en el muro ni noche. */
  async function farewell(r, hadBlock) {
    if (hadBlock) { world.setGuests(guestList()); world.setTime(world.stops[6].time, 1200); }
    const url = whatsappUrl(r);
    const balloon = h("div.miss-balloon", { "aria-hidden": "true" },
      h("span.miss-envelope", h("i"), h("i"), h("i"), h("i"), h("i"), h("i"), h("i"), h("i"), h("i")),
      h("span.miss-string"), h("span.miss-tag", { text: "¡Te extrañaremos!" }));
    const box = h("div.placed.parch", { role: "status" },
      h("h2", { text: "¡Gracias por avisar!" }),
      h("p", { text: `Le diremos a ${childName} que le mandas saludos. Abriendo WhatsApp…` }),
      h("div.row", { style: { width: "100%" } },
        h("a.bb.bb-mint", { ...waLink(url), onclick: (e) => { if (DEMO) { e.preventDefault(); clearTimeout(t); demoNotice(); } }, html: `${icon("chat")}<span>Abrir WhatsApp</span>` }),
        h("button.bb.bb-cream", { type: "button", onclick: () => finish(box, t, r, balloon) }, h("span", { text: "Cerrar" }))));
    app.append(balloon, box);
    audio.blockPop(1.1);
    const t = setTimeout(() => openWhatsApp(url), 1500);
    setTimeout(() => { if (box.isConnected) finish(box, t, r, balloon); }, prefersReduced() ? 5000 : 6000);
  }

  function finish(box, t, r, extra) {
    clearTimeout(t);
    box.remove(); extra?.remove();
    audio.duck(false);
    renderDone(); renderGuests();
    sheet.body.scrollTop = 0;
    sheet.setState("mid");
    busy = false;
    onPlaced?.(r);
  }

  paint(false); mark(); paintPeople(); paintCount(); renderDone(); renderGuests();
  return {
    kicker: "Parada 7 · El Muro del Escuadrón", title: "Pon tu bloque en la isla", expand: true,
    el,
    onShow() { renderDone(); renderGuests(); }
  };
}
