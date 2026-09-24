// Meta: "¡TERMINASTE!", tiempo, récord personal y fotos; pestañas "Inscríbete a la carrera" (primero y
// destacada), "Mejores tiempos" y "Álbum de la carrera"; botones "Correr otra vez" y "Ver info".
import { demoData } from "../data.js";
import { h, fmtTime } from "../util.js";
import { state } from "../state.js";
import { sheet, icon, albumGrid, openViewer } from "./content.js";
import { guestLook, runnerCanvas, childLook } from "./avatar.js";
import { createRsvpForm, savedRsvp } from "./rsvp.js";

/** Tabla de mejores tiempos: mockGuests + el invitado (si confirmó, con su nombre; si no, "Tú"). */
export function leaderboard({ auto }) {
  const r = savedRsvp();
  const me = state.get().bestTime;
  const rows = demoData.rsvp.mockGuests.map((g) => ({ name: g.guestName, time: g.bestTime, look: guestLook(g.avatar.color, g.avatar.hair, g.guestName) }));
  if (me != null) rows.push({ name: r?.attending ? r.guestName : "Tú", time: me, me: true, look: r?.attending ? guestLook(r.avatar.color, r.avatar.hair, r.guestName) : guestLook("#FF5A5F", "short", "Tú") });
  rows.sort((a, b) => a.time - b.time);
  const list = h("ol.lb", ...rows.map((row, i) => h(`li${row.me ? ".is-me" : ""}`,
    h(`span.lb-pos${i < 3 ? `.g${i + 1}` : ""}`, { "aria-label": `Lugar ${i + 1}`, text: String(i + 1) }),
    runnerCanvas(row.look, { w: 36, h: 44, anim: i === 0 ? "celebrate" : "stand", t: 0.1 }),
    h("span.lb-name", { text: row.me ? `${row.name}${row.name === "Tú" ? "" : " (tú)"}` : row.name }),
    h("span.lb-time", { text: fmtTime(row.time) }))));
  list.querySelectorAll("canvas").forEach((c) => c.classList.add("lb-av"));
  return h("div.stack", list, auto ? h("p.note", { text: "En el modo automático no se registra tiempo. ¡Juega para entrar a la tabla!" }) : me == null ? h("p.note", { text: "Termina una carrera jugando para aparecer en la tabla." }) : null);
}

export function openFinish(ui, { time, auto, newRecord, photos, audio, onRsvp, onAgain, onInfo }) {
  const ever = [...new Set([...state.get().photosEver, ...photos])];
  const result = h("div.stack",
    h("div.result",
      auto ? h("span.pill", { text: "Modo automático" }) : h("span.pill", { "aria-label": `Tu tiempo: ${fmtTime(time)}`, html: `${icon("flag", { size: 20 })}<span>${fmtTime(time)}</span>` }),
      h("span.pill", { "aria-label": `Fotos encontradas: ${photos.length} de ${demoData.gallery.length}`, html: `${icon("camera", { size: 20 })}<span>${photos.length}/${demoData.gallery.length}</span>` })),
    newRecord && !auto ? h("p.record", { text: "¡NUEVO RÉCORD PERSONAL!" }) : null);
  const tabsDef = [["rsvp", "Inscríbete a la carrera"], ["times", "Mejores tiempos"], ["album", "Álbum de la carrera"]];
  const panel = h("div", { role: "tabpanel", id: "fin-panel" });
  const tabBtns = tabsDef.map(([id, label], i) => h(`button${i === 0 && !savedRsvp() ? ".is-hot" : ""}`, { type: "button", role: "tab", id: `tab-${id}`, "aria-controls": "fin-panel", "aria-selected": i === 0 ? "true" : "false", onclick: () => select(id) }, label));
  const tabs = h("div.tabs", { role: "tablist", "aria-label": "Meta" }, ...tabBtns);
  function select(id) {
    audio.tap();
    tabBtns.forEach((b) => b.setAttribute("aria-selected", b.id === `tab-${id}` ? "true" : "false"));
    panel.setAttribute("aria-labelledby", `tab-${id}`);
    if (id === "rsvp") panel.replaceChildren(createRsvpForm({ ui, audio, onSubmit: (r) => { tabBtns[0].classList.remove("is-hot"); onRsvp(r); } }).el);
    if (id === "times") panel.replaceChildren(leaderboard({ auto }));
    if (id === "album") panel.replaceChildren(albumGrid(ever, (i) => openViewer(ui, i, audio)));
  }
  const foot = h("div.row",
    h("button.fl.fl-lime", { type: "button", onclick: onAgain, html: `${icon("replay")}<span>Correr otra vez</span>` }),
    h("button.fl.fl-white", { type: "button", onclick: onInfo, html: `${icon("info")}<span>Ver info</span>` }));
  const c = sheet(ui, { kicker: "Meta", title: "¡TERMINASTE!", body: h("div.stack", result, tabs, panel), foot, stripe: "var(--coral)", cls: "is-finish" });
  select("rsvp");
  return c;
}
