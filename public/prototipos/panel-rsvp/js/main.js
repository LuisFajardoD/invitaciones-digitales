// Panel RSVP (prototipo): arranque, estado de la URL (?theme, ?empty, ?n, ?debug), acciones y debug.
import { loadTheme, applyTheme, THEMES } from "./theme.js";
import { event, sampleRsvps, INVITATIONS, clock, start, dayStart, end } from "./data.js";
import { h, header, keyNumbers, banquet, banquetText, wall, list, messages, activity, empty, stats } from "./render.js";
import { downloadCsv } from "./export-csv.js";

const params = new URLSearchParams(location.search);
const opts = {
  theme: THEMES.includes(params.get("theme")) ? params.get("theme") : "default",
  empty: params.get("empty") === "1",
  n: Math.max(1, Math.min(200, Number(params.get("n")) || 18)),
  debug: params.get("debug") === "1",
  when: params.get("when") || "" // before | today | after (fecha simulada)
};
const listState = { q: "", filter: "all", sort: "recent" };
const root = document.getElementById("panel");
const toastEl = document.getElementById("toast");
let theme, rsvps = [];

function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("is-on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
}
async function copy(text, ok) {
  try { await navigator.clipboard.writeText(text); toast(ok); return; } catch { /* respaldo */ }
  const ta = Object.assign(document.createElement("textarea"), { value: text });
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.append(ta); ta.select();
  try { document.execCommand("copy"); toast(ok); } catch { toast("No se pudo copiar"); }
  ta.remove();
}
const inviteUrl = () => new URL(INVITATIONS[opts.theme].path, location.href).href;
const shareUrl = () => `https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Estás invitado a la fiesta de ${event.childName}! 🎉 Confirma aquí: ${inviteUrl()}`)}`;
const syncUrl = () => {
  const p = new URLSearchParams();
  p.set("theme", opts.theme);
  if (opts.empty) p.set("empty", "1");
  if (opts.n !== 18) p.set("n", String(opts.n));
  if (opts.when) p.set("when", opts.when);
  if (opts.debug) p.set("debug", "1");
  history.replaceState(null, "", `?${p}`);
};
const printUrl = () => { const p = new URLSearchParams(location.search); p.delete("debug"); return `print.html?${p}`; };

function simulateDate() {
  if (opts.when === "before") clock.set(start - 51 * 86400000);
  else if (opts.when === "today") clock.set(dayStart + 10 * 3600000);
  else if (opts.when === "after") clock.set(end + 2 * 86400000);
  else clock.reset();
}

function render({ keepFocus = false } = {}) {
  const s = stats(rsvps, event.expectedInvites);
  const handlers = {
    onCopyLink: () => copy(inviteUrl(), "Enlace copiado"),
    onShare: () => window.open(shareUrl(), "_blank", "noopener"),
    onPdf: () => window.open(printUrl(), "_blank"),
    onCsv: () => { downloadCsv(rsvps); toast("Archivo de Excel descargado"); }
  };
  const focusedSearch = keepFocus && document.activeElement?.classList.contains("search");
  const caret = focusedSearch ? document.activeElement.selectionStart : 0;
  const parts = [header(theme, handlers)];
  if (!rsvps.length) {
    parts.push(empty(theme, { onShare: handlers.onShare }));
    root.replaceChildren(h("div.col-full", ...parts));
    return;
  }
  const onPick = (id) => {
    listState.filter = "all"; listState.q = "";
    render();
    const row = document.getElementById(`r-${id}`);
    if (!row) return;
    row.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    row.querySelector(".row-main")?.click();
    row.classList.add("is-flash"); setTimeout(() => row.classList.remove("is-flash"), 1400);
  };
  const onChange = (patch, o) => { Object.assign(listState, patch); render(o); };
  root.replaceChildren(
    h("div.col-full", parts[0]),
    h("div.col-main", keyNumbers(theme, s), banquet(s, { onCopy: () => copy(banquetText(s), "Resumen copiado para el salón") }), list(theme, rsvps, listState, { onChange })),
    h("div.col-side", wall(theme, rsvps, { onPick }), messages(theme, rsvps), activity(theme, rsvps)));
  if (focusedSearch) { const el = root.querySelector(".search"); el.focus(); el.setSelectionRange(caret, caret); }
}

async function boot() {
  theme = await loadTheme(opts.theme);
  applyTheme(theme);
  simulateDate();
  rsvps = opts.empty ? [] : sampleRsvps(theme.avatarStyle, { count: opts.n, invitationId: INVITATIONS[opts.theme].id });
  document.title = `Confirmaciones · Cumpleaños de ${event.childName}`;
  render();
}

/* ---------- Debug ---------- */
function debugPanel() {
  const btn = (text, on, fn) => h(`button${on ? ".is-on" : ""}`, { type: "button", onclick: fn }, text);
  const paint = () => {
    panel.replaceChildren(
      h("button.debug-toggle", { type: "button", "aria-expanded": String(!panel.classList.contains("is-min")), onclick: () => { panel.classList.toggle("is-min"); paint(); } }, `🛠 Debug ${panel.classList.contains("is-min") ? "▸" : "▾"}`),
      h("p", { text: "Tema" }), h("div", ...THEMES.map((t) => btn(t, opts.theme === t, async () => { opts.theme = t; syncUrl(); await boot(); paint(); }))),
      h("p", { text: "Datos" }), h("div",
        btn("Con datos", !opts.empty && opts.n === 18, async () => { opts.empty = false; opts.n = 18; syncUrl(); await boot(); paint(); }),
        btn("60 respuestas", !opts.empty && opts.n === 60, async () => { opts.empty = false; opts.n = 60; syncUrl(); await boot(); paint(); }),
        btn("Vacío", opts.empty, async () => { opts.empty = true; syncUrl(); await boot(); paint(); })),
      h("p", { text: "Fecha simulada" }), h("div", ...[["", "Real"], ["before", "Antes"], ["today", "El día"], ["after", "Después"]].map(([k, l]) => btn(l, opts.when === k, async () => { opts.when = k; syncUrl(); await boot(); paint(); }))));
  };
  const panel = h("aside.debug", { "aria-label": "Panel de pruebas" });
  if (matchMedia("(max-width: 600px)").matches) panel.classList.add("is-min"); // en móvil empieza plegado
  document.body.append(panel);
  paint();
}

await boot();
if (opts.debug) debugPanel();
