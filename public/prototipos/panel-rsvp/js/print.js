// Hoja imprimible (lista de acceso para la entrada del salón). Mismos datos y tema que el panel.
// Se abre desde "Exportar PDF" y lanza window.print() cuando las fuentes están listas
// (?noprint=1 lo evita, útil para pruebas o para generar el PDF en el servidor).
import { loadTheme, applyTheme, fontsReady, THEMES } from "./theme.js";
import { event, fmt, sampleRsvps, INVITATIONS, clock, start, dayStart, end } from "./data.js";
import { stats, byName } from "./filters.js";
import { h } from "./render.js";

const params = new URLSearchParams(location.search);
const themeId = THEMES.includes(params.get("theme")) ? params.get("theme") : "default";
const n = Math.max(1, Math.min(200, Number(params.get("n")) || 18));
const when = params.get("when") || "";
if (when === "before") clock.set(start - 51 * 86400000);
else if (when === "today") clock.set(dayStart + 10 * 3600000);
else if (when === "after") clock.set(end + 2 * 86400000);

const theme = await loadTheme(themeId);
applyTheme(theme);
const rsvps = params.get("empty") === "1" ? [] : sampleRsvps(theme.avatarStyle, { count: n, invitationId: INVITATIONS[themeId].id });
const s = stats(rsvps, event.expectedInvites);
const plural = (k, a, b) => `${k} ${k === 1 ? a : b}`;

document.title = `Lista de invitados · ${event.childName}`;
const back = new URLSearchParams(params); back.delete("noprint");
document.getElementById("back").href = `index.html?${back}`;
document.getElementById("print").addEventListener("click", () => window.print());

/* ---------- Encabezado ---------- */
const art = h("div.p-art", { "aria-hidden": "true" });
theme.renderHero(art, event);
const now = new Date(clock.now());
const generated = fmt.stamp(now.toISOString());
const head = h("header.p-head",
  art,
  h("div.p-head-text",
    h("p.p-kicker", { text: "Lista de invitados" }),
    h("h1.p-title", { text: `Cumpleaños de ${event.childName} (${event.age} años)` }),
    h("p.p-meta", { text: `${fmt.dateLong} · ${fmt.time}` }),
    h("p.p-meta", { text: `${event.venueName} · ${event.address}` }),
    h("p.p-gen", { text: `Generada el ${generated}` })));

/* ---------- Sin respuestas ---------- */
const sheet = document.getElementById("sheet");
if (!rsvps.length) {
  sheet.replaceChildren(head, h("section.p-empty", h("h2", { text: "Aún no hay confirmaciones" }), h("p", { text: "Cuando tus invitados respondan, aquí aparecerá la lista para la entrada del salón." })));
} else {
  const yes = byName(rsvps.filter((r) => r.attending));
  const no = byName(rsvps.filter((r) => !r.attending));

  const totals = h("section.p-totals", { "aria-label": "Totales" },
    ...[["Personas confirmadas", s.people], ["Adultos", s.adults], ["Niños", s.children], ["Respuestas", s.responses], ["No asistirán", s.declined]]
      .map(([l, v], i) => h(`div.p-tot${i === 0 ? ".is-main" : ""}`, h("span.p-tot-n", { text: v }), h("span.p-tot-l", { text: l }))));

  const banquet = h("section.p-banquet",
    h("h2", { text: "Para el banquete" }),
    h("p", { html: `Menús de adultos: <strong>${s.adults}</strong> · Menús de niños: <strong>${s.children}</strong> · Total: <strong>${s.people} personas</strong>` }));

  const row = (r, i) => h("tr",
    h("td.c-check", { "aria-label": "Llegó" }, h("span.box")),
    h("td.c-name", h("span.num", { text: `${i + 1}.` }), " ", r.guestName),
    h("td.c-n", { text: r.adults }),
    h("td.c-n", { text: r.children }),
    h("td.c-notes"));
  const table = h("table.p-table",
    h("caption", { text: `Acceso · ${plural(yes.length, "invitado", "invitados")} · ${plural(s.people, "persona", "personas")}` }),
    h("thead", h("tr",
      h("th.c-check", { scope: "col", "aria-label": "Llegó", text: "☐" }),
      h("th.c-name", { scope: "col", text: "Invitado / Familia" }),
      h("th.c-n", { scope: "col", text: "Adultos" }),
      h("th.c-n", { scope: "col", text: "Niños" }),
      h("th.c-notes", { scope: "col", text: "Notas" }))),
    h("tbody", ...yes.map(row)),
    h("tfoot", h("tr",
      h("td"), h("td.c-name", { text: `Total (${plural(s.people, "persona", "personas")})` }),
      h("td.c-n", { text: s.adults }), h("td.c-n", { text: s.children }), h("td"))));

  const declined = no.length ? h("section.p-no",
    h("h2", { text: `No asistirán (${no.length})` }),
    h("p", { text: no.map((r) => r.guestName).join(" · ") })) : null;

  sheet.replaceChildren(head, totals, banquet, table, declined);
}
sheet.append(h("footer.p-foot-screen", { text: "Invitación creada con Gloobi" }));

await fontsReady(theme);
document.documentElement.classList.add("is-ready");
if (params.get("noprint") !== "1") requestAnimationFrame(() => setTimeout(() => window.print(), 150));
