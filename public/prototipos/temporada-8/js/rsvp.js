// Escuadrón (RSVP): adultos y niños por separado, mensaje opcional, "No podré asistir",
// vista previa del avatar, celebración y envío por WhatsApp. Guarda con el contrato común de Gloobi.
import { demoData } from "./data.js";
import { h, $, $$, prefersReduced, vibrate } from "./util.js";
import { PALETTE } from "./particles.js";
import { icon, flatAvatarSVG } from "./icons.js";
import { createAvatar } from "./avatar.js";
import { state, DEMO } from "./state.js";
import { audio } from "./audio.js";
import { createRsvp, whatsappText, MAX_MESSAGE } from "../../_shared/rsvp-contract.js";

export const SWATCHES = [
  { color: "#FF6B6B", name: "Coral" },
  { color: "#9BE564", name: "Lima" },
  { color: "#B388FF", name: "Lila" },
  { color: "#FFD23F", name: "Amarillo" },
  { color: "#4CC9F0", name: "Cielo" },
  { color: "#FF9FCB", name: "Rosa" }
];
export const HAIRS = [
  { id: "short", name: "Corto" },
  { id: "long", name: "Largo" },
  { id: "pigtails", name: "Coletas" }
];
const GUEST_BASE = { head: "#F2C29B", hair: "#5A3A22", pants: "#1B2A6B", shoes: "#FFFFFF", accent: "#FFF8EC" };
const guestColors = (shirt) => ({ ...GUEST_BASE, shirt });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const childName = demoData.child.name;

/** Confirmación guardada, migrando el formato anterior ({ name, count, color, hair }) al contrato. */
export function savedRsvp() {
  const r = state.get().rsvp;
  if (!r) return null;
  if (r.guestName) return r;
  try {
    const migrated = createRsvp({ invitationId: demoData.invitationId, guestName: r.name, attending: true, adults: r.count || 1, children: 0, avatar: { style: "t8-character", color: r.color, hair: r.hair }, createdAt: r.at ? new Date(r.at).toISOString() : undefined });
    state.set({ rsvp: migrated });
    return migrated;
  } catch { return null; }
}

export function whatsappUrl(r) {
  // api.whatsapp.com directo: la redirección de wa.me convierte los emojis en "�".
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(demoData.rsvp.whatsapp)}&text=${encodeURIComponent(whatsappText(r, demoData.rsvp, childName))}`;
}
/** Modo muestra: en vez de abrir WhatsApp, un aviso con el estilo del juego. */
function demoNotice() {
  if (document.querySelector(".demo-note")) return;
  const opener = document.activeElement;
  const close = () => { m.classList.remove("is-open"); setTimeout(() => m.remove(), prefersReduced() ? 0 : 250); opener?.focus?.({ preventScroll: true }); };
  const ok = h("button.btn.btn-yellow.btn-lg", { type: "button", onclick: () => { audio.blip(); close(); } }, h("span", { text: "Entendido" }));
  const m = h("div.demo-note", { role: "dialog", "aria-modal": "true", "aria-labelledby": "demo-note-t", onclick: (e) => { if (e.target === m) close(); }, onkeydown: (e) => { if (e.key === "Escape") close(); } },
    h("div.card.demo-note-card",
      h("p.demo-note-ic", { "aria-hidden": "true", text: "✨" }),
      h("p.demo-note-text", { id: "demo-note-t", text: "En la invitación real, aquí se abre WhatsApp para enviar la confirmación a los anfitriones." }),
      ok));
  (document.querySelector("#app") || document.body).append(m);
  requestAnimationFrame(() => m.classList.add("is-open"));
  ok.focus({ preventScroll: true });
}
/** Props de un enlace a WhatsApp (en modo muestra, el toque muestra el aviso en vez de salir). */
const waLink = (url, onDemo) => ({ href: url, target: "_blank", rel: "noopener", onclick: (e) => { if (DEMO) { e.preventDefault(); onDemo?.(); demoNotice(); } } });
function openWhatsApp(url) {
  if (DEMO) { demoNotice(); return; }
  let opened = null;
  // Sin "noopener" en features: con él window.open siempre devuelve null.
  try { opened = window.open(url, "_blank"); if (opened) opened.opener = null; } catch { opened = null; }
  if (!opened) { try { location.href = url; } catch { /* queda el botón como respaldo */ } }
}

export function createSquadScreen({ app, fx, onJoined }) {
  const saved = savedRsvp();
  let color = saved?.avatar?.color || SWATCHES[0].color;
  let hair = saved?.avatar?.hair || "short";
  let adults = saved?.attending ? saved.adults : 1;
  let children = saved?.attending ? saved.children : 0;
  let mode = "yes"; // "yes" | "no" (No podré asistir)

  /* ---------- Vista previa ---------- */
  const preview = createAvatar(guestColors(color), { unit: 4.6, spin: !prefersReduced(), tilt: -8, angle: -20, hair });
  const previewBox = h("div.squad-preview", h("div.squad-preview-plat"), preview.el);

  /* ---------- Nombre ---------- */
  const nameInput = h("input.field", { id: "sq-name", type: "text", name: "name", autocomplete: "name", maxLength: 60, placeholder: "Tu nombre o el de tu familia", required: true, value: saved?.guestName || "" });
  const err = h("p.field-error", { id: "sq-err", role: "alert", hidden: true, text: "Escribe tu nombre para unirte." });
  nameInput.setAttribute("aria-describedby", "sq-err");

  /* ---------- Adultos y niños ---------- */
  function stepper(label, get, set, idp) {
    const out = h("output.stepper-val.display", { id: `${idp}-val`, "aria-live": "polite" });
    const minus = h("button.btn.btn-icon.step-btn", { type: "button", "aria-label": `Menos ${label.toLowerCase()}`, html: icon("minus", { size: 24 }), onclick: () => { audio.blip(); set(get() - 1); } });
    const plus = h("button.btn.btn-icon.btn-lime.step-btn", { type: "button", "aria-label": `Más ${label.toLowerCase()}`, html: icon("plus", { size: 24 }), onclick: () => { audio.blip(); set(get() + 1); } });
    const paint = () => { out.textContent = String(get()); minus.disabled = get() <= 0; plus.disabled = get() >= 10; };
    const el = h("div.people-box", h("p.field-label", { text: label }), h("div.stepper", { role: "group", "aria-label": label }, minus, out, plus));
    return { el, paint };
  }
  const adultStep = stepper("Adultos", () => adults, (n) => { adults = Math.max(0, Math.min(10, n)); paintPeople(); }, "sq-adults");
  const kidStep = stepper("Niños del escuadrón", () => children, (n) => { children = Math.max(0, Math.min(10, n)); paintPeople(); }, "sq-kids");
  const total = h("p.people-total", { "aria-live": "polite" });
  const zeroWarn = h("p.people-warn", { role: "status", hidden: true, text: "Agrega al menos una persona para unirte al escuadrón." });

  /* ---------- Mensaje opcional (plegado) ---------- */
  const msgInput = h("textarea.field.msg-field", { id: "sq-msg", maxLength: MAX_MESSAGE, rows: 3, placeholder: `¡Feliz cumple, ${childName}!`, value: saved?.message || "" });
  const msgCount = h("span.msg-count", { "aria-live": "polite" });
  const paintCount = () => { msgCount.textContent = `${msgInput.value.length}/${MAX_MESSAGE}`; };
  msgInput.addEventListener("input", paintCount);
  const msgBox = h("div.msg-box", { hidden: !saved?.message },
    h("label.field-label", { for: "sq-msg", text: `Mensaje para ${childName} (opcional)` }), msgInput, msgCount);
  const msgToggle = h("button.btn.btn-sm.msg-toggle", { type: "button", hidden: !!saved?.message, text: "+ Dejar un mensaje", onclick: () => { audio.blip(); msgBox.hidden = false; msgToggle.hidden = true; msgInput.focus(); } });

  /* ---------- Color y peinado ---------- */
  const swatches = h("div.swatches", { role: "radiogroup", "aria-label": "Color de tu personaje" },
    ...SWATCHES.map((s) => h("button.swatch", { type: "button", role: "radio", "aria-label": s.name, "data-color": s.color, style: { background: s.color }, onclick: (e) => pickColor(s.color, e.currentTarget) })));
  function pickColor(c, btn) {
    color = c;
    preview.setColors({ shirt: c });
    $$(".swatch", swatches).forEach((b) => { const on = b.dataset.color === c; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    renderHairIcons();
    if (btn) { audio.pop(1.2); preview.wave(); }
  }
  const hairs = h("div.hair-opts", { role: "radiogroup", "aria-label": "Peinado" },
    ...HAIRS.map((o) => h("button.hair-opt", { type: "button", role: "radio", "aria-label": o.name, "data-hair": o.id, onclick: (e) => pickHair(o.id, e.currentTarget) }, h("span.hair-ic"), h("span.hair-name", { text: o.name }))));
  function renderHairIcons() { $$(".hair-opt", hairs).forEach((b) => { $(".hair-ic", b).innerHTML = flatAvatarSVG({ shirt: color, style: b.dataset.hair }, 34); }); }
  function pickHair(style, btn) {
    hair = style;
    preview.setHair(style, { pop: !!btn });
    $$(".hair-opt", hairs).forEach((b) => { const on = b.dataset.hair === style; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", on ? "true" : "false"); });
    if (btn) audio.pop(1.35);
  }

  /* ---------- Acciones ---------- */
  const joinBtn = h("button.btn.btn-yellow.btn-lg.btn-block.join-btn", { type: "submit", html: `${icon("squad", { size: 30 })}<span>UNIRME</span>` });
  const declineLink = h("button.decline-link", { type: "button", text: "No podré asistir", onclick: () => setMode("no") });
  const backLink = h("button.decline-link", { type: "button", hidden: true, text: "← Sí voy a ir", onclick: () => setMode("yes") });
  const yesOnly = h("div.yes-only", previewBox,
    h("div.people-row", adultStep.el, kidStep.el), total, zeroWarn,
    h("p.field-label", { text: "Color de tu personaje" }), swatches,
    h("p.field-label", { text: "Peinado" }), hairs);
  const noNote = h("p.decline-note", { hidden: true, text: `Qué pena que no puedas venir. Déjale un mensaje a ${childName} si quieres.` });
  const form = h("form.card.squad-form", { novalidate: true, onsubmit: (e) => { e.preventDefault(); submit(); } },
    noNote,
    h("label.field-label", { for: "sq-name", text: "Nombre del jugador o familia" }), nameInput, err,
    yesOnly, msgToggle, msgBox, joinBtn, declineLink, backLink);

  function paintPeople() {
    adultStep.paint(); kidStep.paint();
    const n = adults + children;
    total.textContent = `Total: ${plural(n, "persona", "personas")}`;
    const bad = mode === "yes" && n < 1;
    zeroWarn.hidden = !bad;
    joinBtn.disabled = bad;
    joinBtn.classList.toggle("is-disabled", bad);
  }
  function setMode(m) {
    audio.blip();
    mode = m;
    const no = m === "no";
    yesOnly.hidden = no; declineLink.hidden = no; backLink.hidden = !no; noNote.hidden = !no;
    joinBtn.innerHTML = no ? "<span>Enviar respuesta</span>" : `${icon("squad", { size: 30 })}<span>UNIRME</span>`;
    joinBtn.classList.toggle("btn-yellow", !no);
    paintPeople();
    nameInput.focus();
  }

  /* ---------- Estado confirmado ---------- */
  const statusBox = h("div.card.squad-status", { hidden: true });
  const squadTitle = h("p.squad-title.hud-text", { text: "ÚNETE AL ESCUADRÓN" });
  function renderStatus() {
    const r = savedRsvp();
    statusBox.hidden = !r;
    form.hidden = !!r;
    squadTitle.textContent = r?.attending ? "¡ESCUADRÓN LISTO!" : "ÚNETE AL ESCUADRÓN";
    if (!r) return;
    const edit = h("button.btn.btn-sm", { type: "button", html: `${icon("edit", { size: 22 })}<span>${r.attending ? "Editar" : "Cambiar respuesta"}</span>`, onclick: () => { audio.blip(); statusBox.hidden = true; form.hidden = false; setMode("yes"); } });
    const resend = h("a.btn.btn-sm.btn-lime", { ...waLink(whatsappUrl(r)), html: `${icon("chat", { size: 22 })}<span>Reenviar</span>` });
    statusBox.classList.toggle("is-no", !r.attending);
    statusBox.replaceChildren(
      h("div.status-badge", { html: flatAvatarSVG({ ...guestColors(r.avatar.color), style: r.avatar.hair || "short" }, 50) }),
      h("div.status-text", r.attending
        ? [h("p.status-title.display", { html: `Ya estás en el escuadrón <span class="ok">✔</span>` }),
          h("p.status-sub", { text: `${r.guestName} · ${plural(r.adults, "adulto", "adultos")}, ${plural(r.children, "niño", "niños")}` })]
        : [h("p.status-title.display", { text: "Respondiste que no podrás asistir" }), h("p.status-sub", { text: r.guestName })]),
      h("div.btn-row", edit, resend));
  }

  /* ---------- Jugadores en el lobby (sólo quienes asisten) ---------- */
  const listCount = h("span.chip.list-count");
  const list = h("ul.player-list");
  function renderList() {
    const r = savedRsvp();
    const people = [
      ...demoData.rsvp.mockPlayers.filter((p) => p.attending !== false).map((p) => ({ name: p.name, color: p.color, hair: p.hair, adults: p.adults ?? 1, children: p.children ?? 0 })),
      ...(r && r.attending ? [{ name: r.guestName, color: r.avatar.color, hair: r.avatar.hair, adults: r.adults, children: r.children, me: true }] : [])
    ];
    const tot = people.reduce((a, p) => a + p.adults + p.children, 0);
    listCount.textContent = `${plural(tot, "jugador listo", "jugadores listos")}`;
    list.replaceChildren(...people.map((p) => h(`li.player-item${p.me ? ".is-me" : ""}`,
      h("span.player-av", { html: flatAvatarSVG({ shirt: p.color, style: p.hair || "short" }, 38) }),
      h("span.player-name", { text: p.me ? `${p.name} (tú)` : p.name }),
      h("span.player-extra", { text: `${p.adults}A · ${p.children}N`, title: `${plural(p.adults, "adulto", "adultos")}, ${plural(p.children, "niño", "niños")}` }),
      h("span.ready", { text: "LISTO" }))));
  }

  const el = h("div.stack.squad",
    h("div.squad-head", squadTitle, h("p.chip.deadline", { html: `${icon("clock", { size: 18 })}<span>${demoData.rsvp.deadlineText}</span>` })),
    statusBox, form,
    h("section.card.squad-list", { "aria-label": "Jugadores en el lobby" },
      h("div.squad-list-head", h("h3.display", { text: "JUGADORES EN EL LOBBY" }), listCount),
      list));

  /* ---------- Envío ---------- */
  function submit() {
    const name = nameInput.value.trim();
    if (!name) {
      err.hidden = false;
      nameInput.classList.remove("shake"); void nameInput.offsetWidth; nameInput.classList.add("shake");
      nameInput.focus(); audio.blip();
      return;
    }
    err.hidden = true;
    let r;
    try {
      r = createRsvp({
        invitationId: demoData.invitationId, guestName: name, attending: mode === "yes",
        adults, children, message: msgBox.hidden ? "" : msgInput.value,
        avatar: { style: "t8-character", color, hair }
      }, { previous: savedRsvp() || undefined });
    } catch { paintPeople(); return; }
    state.set({ rsvp: r });
    renderStatus(); renderList();
    if (r.attending) { celebrate(r); onJoined?.(r); } else farewell(r);
  }

  function celebrate(r) {
    const url = whatsappUrl(r);
    const kid = createAvatar(demoData.child.avatarColors, { unit: 6, angle: 18 });
    const guest = createAvatar(guestColors(r.avatar.color), { unit: 5.4, angle: -18, hair: r.avatar.hair || "short" });
    const waBtn = h("a.btn.btn-lime.btn-lg", { ...waLink(url, () => clearTimeout(t)), html: `${icon("chat", { size: 26 })}<span>Abrir WhatsApp</span>` });
    const done = h("button.btn.btn-lg", { type: "button", text: "¡Listo!", onclick: () => close() });
    const overlay = h("div.party", { role: "dialog", "aria-modal": "true", "aria-label": "Te uniste al escuadrón" },
      h("div.party-rays"),
      h("p.party-title.hud-text", { text: "¡Te uniste al escuadrón!" }),
      h("div.party-duo", h("div.party-slot", kid.el, h("span.chip", { text: childName })), h("div.party-slot.is-guest", guest.el, h("span.chip", { text: r.guestName }))),
      h("p.party-sub", { text: "Abriendo WhatsApp para avisar a los anfitriones…" }),
      h("div.btn-row.party-actions", waBtn, done));
    app.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    audio.fanfare();
    vibrate([30, 40, 60]);
    kid.dance(4200);
    setTimeout(() => guest.dance(4000), 150);
    const rect = app.getBoundingClientRect();
    const confetti = [...PALETTE, r.avatar.color, r.avatar.color, r.avatar.color];
    fx.rain({ count: 110, colors: confetti });
    fx.burst({ x: rect.width / 2, y: rect.height * 0.45, count: 50, power: 11, colors: confetti });
    const t = setTimeout(() => openWhatsApp(url), 1500);
    function close() { clearTimeout(t); audio.blip(); overlay.classList.remove("is-open"); setTimeout(() => overlay.remove(), prefersReduced() ? 0 : 300); }
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    setTimeout(() => done.focus(), 50);
  }

  /** No asistirá: despedida amable (el personaje saluda con la mano), sin fiesta. */
  function farewell(r) {
    const url = whatsappUrl(r);
    const guest = createAvatar(guestColors(r.avatar.color), { unit: 5.4, angle: -12, hair: r.avatar.hair || "short" });
    const done = h("button.btn.btn-lg", { type: "button", text: "Cerrar", onclick: () => close() });
    const overlay = h("div.party.is-calm", { role: "dialog", "aria-modal": "true", "aria-label": "Respuesta enviada" },
      h("p.party-title.hud-text", { text: "¡Gracias por avisar!" }),
      h("div.party-duo", h("div.party-slot", guest.el, h("span.chip", { text: r.guestName }))),
      h("p.party-sub", { text: `Le diremos a ${childName} que le mandas saludos. Abriendo WhatsApp…` }),
      h("div.btn-row.party-actions", h("a.btn.btn-lime.btn-lg", { ...waLink(url, () => clearTimeout(t)), html: `${icon("chat", { size: 26 })}<span>Abrir WhatsApp</span>` }), done));
    app.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    guest.wave();
    setTimeout(() => guest.wave(), 1700);
    audio.blip();
    const t = setTimeout(() => openWhatsApp(url), 1500);
    function close() { clearTimeout(t); overlay.classList.remove("is-open"); setTimeout(() => overlay.remove(), prefersReduced() ? 0 : 300); }
    overlay.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    setTimeout(() => done.focus(), 50);
  }

  pickColor(color); pickHair(hair); paintPeople(); paintCount();
  renderStatus(); renderList();

  return { el, onShow() { renderStatus(); renderList(); }, refresh() { renderStatus(); renderList(); } };
}
