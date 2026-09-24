// Render del panel. Sólo usa el tema (tokens vía CSS, vocabulario, renderHero, renderGuestAvatar);
// nada de colores ni textos de un tema específico aquí.
import { event, fmt } from "./data.js";
import { stats, query, recent } from "./filters.js";
import { peopleLabel } from "../../_shared/rsvp-contract.js";

export function h(tag, props, ...kids) {
  const id = (tag.match(/#([\w-]+)/) || [])[1];
  const [base, ...cls] = tag.replace(/#[\w-]+/, "").split(".");
  const el = document.createElement(base || "div");
  if (id) el.id = id;
  if (cls.length) el.className = cls.join(" ");
  if (props instanceof Node || typeof props === "string" || Array.isArray(props)) { kids.unshift(props); props = null; }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

/* Íconos de UI (currentColor: toman el color del tema) */
const I = {
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  wa: '<path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-3.8-1z"/><path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1.2 2 .8c-.2 1.3-1.3 2-2.5 1.8-3-.5-5.4-2.9-5.9-5.9C8 8.3 8.7 7.2 10 7l.8 2z"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
  xls: '<path d="M4 5h16v14H4zM4 10h16M10 5v14"/>',
  copy: '<path d="M8 8h11v12H8z"/><path d="M5 16V4h11"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>'
};
export const ico = (n, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const title = () => `Cumpleaños de ${event.childName} · ${event.age} años`;

/* ---------- 1. Encabezado ---------- */
export function header(theme, { onCopyLink, onShare, onPdf, onCsv }) {
  const art = h("div.hero-art");
  theme.renderHero(art, event);
  const cd = fmt.countdown();
  const actions = [
    h("button.btn", { type: "button", onclick: onCopyLink, html: `${ico("link")}<span>Copiar enlace</span>` }),
    h("button.btn", { type: "button", onclick: onShare, html: `${ico("wa")}<span>Compartir por WhatsApp</span>` }),
    h("button.btn", { type: "button", onclick: onPdf, html: `${ico("pdf")}<span>Exportar PDF</span>` }),
    h("button.btn", { type: "button", onclick: onCsv, html: `${ico("xls")}<span>Exportar Excel</span>` })
  ];
  return h("header.hero.surface",
    art,
    h("div.hero-body",
      h("h1.hero-title", { text: title() }),
      h("p.hero-meta", { text: `${fmt.dateLong} · ${fmt.time}` }),
      h("p.hero-meta", { text: event.venueName }),
      h(`span.countdown.is-${cd.key}`, { text: cd.text })),
    h("nav.actions", { "aria-label": "Compartir y exportar" }, ...actions));
}

/* ---------- 2. Números clave ---------- */
export function keyNumbers(theme, s) {
  const v = theme.vocabulary;
  const cards = [
    h("div.stat.surface", h("span.stat-n", { text: s.responses }), h("span.stat-l", { text: "Respuestas recibidas" })),
    h("div.stat.surface", h("span.stat-n", { text: s.declined }), h("span.stat-l", { text: "No asistirán" }))
  ];
  if (s.pending != null) cards.push(h("div.stat.surface", h("span.stat-n", { text: s.pending }), h("span.stat-l", { text: "Pendientes" })));
  const progress = s.expected ? h("div.progress",
    h("div.progress-top", h("span", { text: `${v.confirmed}: ${s.attending}` }), h("span", { text: `${s.responses} de ${s.expected} respondieron` })),
    h("div.bar", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": s.expected, "aria-valuenow": s.responses, "aria-label": "Respuestas recibidas" },
      h("i.bar-yes", { style: `width:${(s.attending / s.expected) * 100}%` }),
      h("i.bar-no", { style: `width:${(s.declined / s.expected) * 100}%` }))) : null;
  return h("section.key", { "aria-label": "Números clave" },
    h("div.big.surface",
      h("p.big-l", { text: "Personas confirmadas" }),
      h("p.big-n", { text: s.people }),
      h("p.big-split", h("span", { html: `<b aria-hidden="true">🧑</b> Adultos <strong>${s.adults}</strong>` }), h("span", { html: `<b aria-hidden="true">🧒</b> Niños <strong>${s.children}</strong>` }))),
    h("div.stats", ...cards),
    progress);
}

/* ---------- 3. Para el banquete ---------- */
export function banquet(s, { onCopy }) {
  return h("section.banquet.surface", { "aria-labelledby": "banq-t" },
    h("h2.sec-t#banq-t", { text: "Para el banquete" }),
    h("div.menus",
      h("div.menu", h("span.menu-n", { text: s.adults }), h("span.menu-l", { text: "Menús de adultos" })),
      h("div.menu", h("span.menu-n", { text: s.children }), h("span.menu-l", { text: "Menús de niños" }))),
    h("button.btn.btn-primary.btn-block", { type: "button", onclick: onCopy, html: `${ico("copy")}<span>Copiar resumen para el salón</span>` }));
}
export const banquetText = (s) => `Fiesta de ${event.childName} – ${fmt.dateLong}, ${fmt.time}. Menús de adultos: ${s.adults}. Menús de niños: ${s.children}. Total: ${s.people} personas.`;

/* ---------- 4. Muro de invitados ---------- */
export function wall(theme, rsvps, { onPick }) {
  const yes = rsvps.filter((r) => r.attending);
  return h("section.wall.surface", { "aria-labelledby": "wall-t" },
    h("div.sec-head", h("h2.sec-t#wall-t", { text: theme.vocabulary.list }), h("span.pill", { text: plural(yes.length, theme.vocabulary.guest, theme.vocabulary.guests.toLowerCase()) })),
    h("p.hint", { text: theme.vocabulary.wallHint }),
    h("div.wall-grid", ...yes.map((r) => h("button.wall-item", { type: "button", "aria-label": `${r.guestName}: ${peopleLabel(r)}`, onclick: () => onPick(r.id) },
      h("span.wall-av", { html: theme.renderGuestAvatar(r, 52) }),
      h("span.wall-name", { text: r.guestName })))));
}

/* ---------- 5. Lista de respuestas ---------- */
export function list(theme, rsvps, state, { onChange }) {
  const rows = query(rsvps, state);
  const chip = (id, label) => h(`button.chip${state.filter === id ? ".is-on" : ""}`, { type: "button", "aria-pressed": state.filter === id ? "true" : "false", onclick: () => onChange({ filter: id }) }, label);
  const search = h("input.search", { type: "search", placeholder: "Buscar por nombre", "aria-label": "Buscar por nombre", value: state.q });
  search.addEventListener("input", () => onChange({ q: search.value }, { keepFocus: true }));
  const sort = h("div.seg", { role: "group", "aria-label": "Orden" },
    h(`button${state.sort === "recent" ? ".is-on" : ""}`, { type: "button", "aria-pressed": state.sort === "recent" ? "true" : "false", onclick: () => onChange({ sort: "recent" }) }, "Más recientes"),
    h(`button${state.sort === "az" ? ".is-on" : ""}`, { type: "button", "aria-pressed": state.sort === "az" ? "true" : "false", onclick: () => onChange({ sort: "az" }) }, "A–Z"));
  const ul = h("ul.rows");
  rows.forEach((r) => {
    const badges = r.attending
      ? [r.adults ? h("span.badge", { text: plural(r.adults, "adulto", "adultos") }) : null, r.children ? h("span.badge", { text: plural(r.children, "niño", "niños") }) : null]
      : [h("span.badge.is-no", { text: "No asistirá" })];
    const detail = h("div.row-detail", { hidden: true }, r.message ? h("p.row-msg", { text: `“${r.message}”` }) : h("p.row-msg.is-empty", { text: "Sin mensaje" }), h("p.row-date", { text: `Respondió el ${fmt.stamp(r.updatedAt)}` }));
    const btn = h("button.row-main", { type: "button", "aria-expanded": "false" },
      h("span.row-av", { html: theme.renderGuestAvatar(r, 40) }),
      h("span.row-info", h("span.row-name", { text: r.guestName }), h("span.row-badges", ...badges)),
      h("span.row-side", r.message ? h("span.row-has-msg", { html: ico("msg", 18), title: "Tiene mensaje", "aria-label": "Tiene mensaje" }) : null, h("span.row-when", { text: fmt.relative(r.updatedAt) })));
    btn.addEventListener("click", () => { const open = detail.hidden; detail.hidden = !open; btn.setAttribute("aria-expanded", String(open)); li.classList.toggle("is-open", open); });
    const li = h(`li.row${r.attending ? "" : ".is-no"}`, { id: `r-${r.id}` }, btn, detail);
    ul.append(li);
  });
  return h("section.list.surface", { "aria-labelledby": "list-t" },
    h("div.sec-head", h("h2.sec-t#list-t", { text: "Respuestas" }), h("span.pill", { text: `${rows.length}` })),
    h("div.tools", h("label.search-wrap", { html: ico("search", 18) }, search),
      h("div.chips", chip("all", "Todos"), chip("yes", "Asisten"), chip("no", "No asisten"), chip("msg", "Con mensaje")), sort),
    rows.length ? ul : h("p.none", { text: "Nadie coincide con la búsqueda." }));
}

/* ---------- 6. Mensajes ---------- */
export function messages(theme, rsvps) {
  const ms = rsvps.filter((r) => r.message).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (!ms.length) return null;
  return h("section.messages.surface", { "aria-labelledby": "msg-t" },
    h("h2.sec-t#msg-t", { text: `Mensajes para ${event.childName}` }),
    h("div.msg-grid", ...ms.map((r) => h("figure.note",
      h("blockquote", { text: r.message }),
      h("figcaption", h("span.note-av", { html: theme.renderGuestAvatar(r, 28) }), h("span", { text: r.guestName }))))));
}

/* ---------- 7. Actividad reciente ---------- */
export function activity(theme, rsvps) {
  const items = recent(rsvps, 5);
  return h("section.activity.surface", { "aria-labelledby": "act-t" },
    h("h2.sec-t#act-t", { text: "Actividad reciente" }),
    h("ol.timeline", ...items.map((r) => h("li",
      h("span.tl-av", { html: theme.renderGuestAvatar(r, 32) }),
      h("span.tl-text", h("strong", { text: r.guestName }), r.attending ? ` confirmó ${plural(r.adults + r.children, "persona", "personas")}` : " no podrá asistir"),
      h("span.tl-when", { text: fmt.relative(r.updatedAt) })))));
}

/* ---------- 8. Estado vacío ---------- */
export function empty(theme, { onShare }) {
  // El encabezado ya muestra la ilustración del tema; aquí sólo un ícono de sobre.
  return h("section.empty.surface",
    h("div.empty-ico", { "aria-hidden": "true", html: ico("msg", 40) }),
    h("h2.sec-t", { text: "Aún no hay respuestas" }),
    h("p", { text: "¡Comparte la invitación! Aquí verás a cada invitado en cuanto confirme." }),
    h("button.btn.btn-primary.btn-lg", { type: "button", onclick: onShare, html: `${ico("wa", 22)}<span>Compartir por WhatsApp</span>` }));
}

export { stats, title };
