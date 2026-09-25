// Versión ilustrada (sin WebGL o ?nowebgl=1): la misma historia como página vertical con ilustraciones SVG en capas y
// parallax CSS por capítulo. Mismo contenido HTML, misma Bitácora y misma confirmación con parche (animación CSS).
import { h, $, $$, tpl, missionName, eventInfo, prefersReduced, waUrl, loadPhoto } from "../util.js";
import { demoData, visorPhotos, VISOR_FALLBACK } from "../data.js";
import { themeOf } from "../themes.js";
import { state, DEMO } from "../state.js";
import { icon } from "../ui/icons.js";
import { gloobiSVG, astronautSVG, rocketSVG, moonSVG, crescentSVG, starsSVG, stationSVG } from "../ui/illustrations.js";
import { patchSVG } from "../ui/patch.js";
import { sampleText } from "../ui/text-sample.js";
import { mapSVG } from "../ui/map.js";
import { dateBlock, countdown, calendarButtons, venueBlock, mapsButtons, transportBlock, itineraryList, giftsList, dressBlock } from "../ui/content.js";
import { toast, openWhatsApp } from "../ui/toasts.js";
import { openViewer } from "../ui/viewer.js";
import { whatsappText, peopleLabel } from "../../../_shared/rsvp-contract.js";

const kid = demoData.child;
const PH = visorPhotos(kid);
const TH = themeOf(kid); // tema de color (cohete y detalles del traje) // dormido en la portada, despierto en el resto
const svg = (vb, body, cls = "") => `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;

function constellationSVG() {
  const A = sampleText(String(kid.age), { font: "600 330px Fredoka, system-ui, sans-serif", spacing: 16, canvasW: 700, canvasH: 380 });
  const B = sampleText(kid.name, { font: "600 170px Fredoka, system-ui, sans-serif", spacing: 13, canvasW: 1100, canvasH: 240 });
  const toXY = ([x, y], s, oy) => [200 + x * s, 200 - (y * s + oy)];
  let paths = "", dots = "";
  const draw = (S, s, oy) => {
    S.lines.forEach((line) => { const pts = line.map((i) => toXY(S.points[i], s, oy).map((v) => v.toFixed(1)).join(",")); paths += `<polyline points="${pts.join(" ")}" pathLength="1"/>`; });
    S.points.forEach((p) => { const [x, y] = toXY(p, s, oy); dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>`; });
  };
  draw(A, 250, 45); draw(B, 340, -70);
  return `<g class="const-lines" fill="none" stroke="#FFE7B0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths}</g><g class="const-dots" fill="#FFD27A">${dots}</g>`;
}

export function startFallback({ audio }) {
  document.documentElement.classList.remove("is-locked");
  const root = h("div.fb");
  document.body.append(root);
  let soundOn = state.soundEnabled();
  const info = eventInfo();
  const rsvp = () => state.get().rsvp;
  const card = (kicker, ...body) => h("div.card.is-on.fb-card", kicker ? h("p.kicker", { text: kicker }) : null, ...body);
  const chapter = (cls, art, ...cards) => h(`section.fb-ch.${cls}`, h("div.fb-art", { html: art }), ...cards);
  const cd = countdown({ compact: true });
  const crewBody = h("div.stack");
  const mural = h("div.fb-mural");

  const els = [
    h("header.fb-cover",
      h("div.fb-art.layer", { "data-depth": "0.25", html: svg("0 0 400 700", `${starsSVG(400, 700, 90)}`, "fb-stars") }),
      h("div.fb-art.layer", { "data-depth": "0.1", html: svg("0 0 400 700", `<g class="bob">${crescentSVG(200, 380, 110)}${astronautSVG(205, 420, 0.95, { pose: "sleep", photo: PH.sleeping, accent: TH.primary })}${gloobiSVG(235, 330, 22, { face: "sleep" })}</g>`) }),
      h("div.fb-cover-text",
        h("h1.cover-title", { text: missionName() }),
        h("p.badge", { html: `${icon("star", { size: 18 })}<span>¡Cumple ${kid.age}!</span>` })),
      h("div.fb-cover-bottom",
        h("button.btn.btn-pink.btn-lg", { type: "button", onclick: () => { startAudio(); $(".fb-ch", root).scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" }); }, html: `${icon("rocket", { size: 22 })}<span>Comenzar la misión</span>` }),
        h("button.link", { type: "button", onclick: () => openLog() }, "Ver solo la información"))),
    chapter("fb-launch", svg("0 0 400 520", `<defs><linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2A7A"/><stop offset=".55" stop-color="#B9A2FF"/><stop offset="1" stop-color="#FFC9A0"/></linearGradient></defs><rect width="400" height="520" fill="url(#dawn)"/>${starsSVG(400, 200, 30, 9)}<g class="rise">${rocketSVG(200, 400, 0.95, { accent: TH.primary, flame: true })}</g><g class="puffs">${[60, 110, 170, 230, 290, 340].map((x, i) => `<circle cx="${x}" cy="${470 + (i % 2) * 14}" r="${40 + (i % 3) * 12}" fill="#FFF1E6" opacity=".9"/>`).join("")}</g>`),
      card(null, h("p.big", { text: "¡DESPEGUE!" }), h("p.muted", { text: "La misión comienza. Desliza para seguir el viaje." }))),
    chapter("fb-walk", svg("0 0 400 460", `${starsSVG(400, 460, 40, 5)}<circle cx="200" cy="900" r="560" fill="#3E8FD6"/><circle cx="200" cy="900" r="575" fill="none" stroke="#6FD6E8" stroke-width="14" opacity=".35"/><g class="bob">${astronautSVG(190, 360, 1.1, { pose: "wave", photo: PH.awake, accent: TH.primary })}${gloobiSVG(300, 150, 26)}</g>`),
      card("Caminata espacial", h("p.big", { text: tpl(demoData.tagline) }))),
    chapter("fb-const", svg("0 0 400 400", `${starsSVG(400, 400, 70, 11)}${constellationSVG()}`, "const-svg"),
      card("La constelación", h("p.big", { text: `¡${kid.name} cumple ${kid.age}!` }))),
    chapter("fb-moon", svg("0 0 400 420", `${starsSVG(400, 420, 40, 13)}${moonSVG(200, 200, 150, { text: { top: info.weekday.toUpperCase(), mid: String(info.dayNum), bottom: info.month.toUpperCase() } })}`),
      card("Fecha de lanzamiento", dateBlock(), cd.el, calendarButtons(audio))),
    chapter("fb-station", svg("0 0 400 420", `${starsSVG(400, 420, 40, 17)}${stationSVG(200, 320, 0.9)}<g transform="translate(60 40) scale(.44)">${mapSVG()}</g>`),
      card("Punto de encuentro", venueBlock(), mapsButtons(audio), transportBlock())),
    h("section.fb-ch.fb-photos", h("div.fb-polas", ...demoData.gallery.map((p, i) => h("button.fb-pola", { type: "button", style: { "--r": `${[-6, 4, -3, 6, -5, 3][i]}deg` }, "aria-label": `Foto ${i + 1}: ${p.caption}`, onclick: () => openViewer(root, i, { audio }) },
      h("img", { src: p.src, alt: p.caption, loading: "lazy" }), h("span", { text: p.caption })))),
      card("Cinturón de recuerdos", h("p.big.big-sm", { text: "Nuestros momentos favoritos" }), h("p.hint", { text: "Toca una foto para verla" }))),
    chapter("fb-plan", svg("0 0 400 300", `${starsSVG(400, 300, 30, 19)}<path class="orbit" pathLength="1" d="M30 230C80 90 320 60 370 150" fill="none" stroke="#FFD27A" stroke-width="5" stroke-linecap="round"/>${[[76, 158], [165, 105], [262, 96], [345, 128]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="10" fill="${["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF"][i]}"/><circle cx="${x}" cy="${y}" r="4" fill="#FFF7EC"/>`).join("")}`),
      card("Plan de vuelo", itineraryList()), card("Carga de la misión", giftsList(audio)), card(null, dressBlock())),
    h("section.fb-ch.fb-crew", h("div.fb-rocket-side", { html: svg("0 0 400 360", `${starsSVG(400, 360, 30, 23)}<rect x="40" y="30" width="320" height="300" rx="150" fill="#FFF7EC"/><rect x="40" y="30" width="320" height="300" rx="150" fill="none" stroke="#D9D2F0" stroke-width="8"/><text x="200" y="90" text-anchor="middle" font-family="Fredoka, system-ui" font-weight="600" font-size="20" fill="#3B2A7A">TRIPULACIÓN</text>`) }, mural),
      h("div.card.is-on.fb-card", h("p.kicker", { text: missionName() }), crewBody)),
    chapter("fb-final", svg("0 0 400 420", `<defs><radialGradient id="nb" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#FF8FA3" stop-opacity=".55"/><stop offset=".5" stop-color="#6FD6E8" stop-opacity=".25"/><stop offset="1" stop-color="#1E1B4B" stop-opacity="0"/></radialGradient></defs><rect width="400" height="420" fill="url(#nb)"/>${starsSVG(400, 420, 60, 29)}<g class="away">${rocketSVG(220, 300, 0.6, { accent: TH.primary, flame: true, photo: PH.awake })}${gloobiSVG(300, 140, 16)}</g>`),
      h("div.card.is-on.fb-card", h("p.big", { text: `Te esperamos a bordo, ${info.dateShort}` }), h("div.btn-row.fb-final-row")))
  ];
  root.append(...els);
  // fotos del visor: si el navegador no decodifica el .avif se cambia por su copia .webp (o la ilustración)
  for (const src of new Set([PH.sleeping, PH.awake])) {
    loadPhoto(src, VISOR_FALLBACK).then((img) => {
      const ok = img?.currentSrc || img?.src;
      if (ok && !ok.endsWith(src)) $$(`image[href="${src}"]`, root).forEach((el) => el.setAttribute("href", ok));
    });
  }
  // HUD
  const soundBtn = h("button.icon-btn.hud-btn", { type: "button", onclick: () => toggleSound() });
  const paintSound = () => { soundBtn.innerHTML = icon(soundOn ? "soundOn" : "soundOff", { size: 24 }); soundBtn.setAttribute("aria-label", soundOn ? "Apagar sonido" : "Encender sonido"); };
  paintSound();
  audio.onUnavailable(() => { soundBtn.hidden = true; });
  root.append(h("div.hud.is-on.fb-hud", h("button.icon-btn.hud-btn", { type: "button", "aria-label": "Abrir la bitácora de la misión", html: icon("log", { size: 24 }), onclick: () => openLog() }), soundBtn));
  function toggleSound() { soundOn = !soundOn; if (soundOn) audio.unlock(); if (!audio.setEnabled(soundOn) && soundOn) soundOn = false; state.set({ sound: soundOn }); if (soundOn) audio.music(true); paintSound(); }
  function startAudio() { if (soundOn && audio.unlock()) { audio.setEnabled(true); audio.music(true); } }
  addEventListener("pointerdown", function once() { removeEventListener("pointerdown", once); startAudio(); });

  // Mural de parches
  function renderMural() {
    const r = rsvp();
    const patches = demoData.rsvp.mockGuests.filter((g) => g.attending).map((g) => patchSVG({ color: g.avatar.color, symbol: g.avatar.symbol, top: g.guestName, bottom: missionName() }, 84));
    mural.innerHTML = patches.map((p) => `<span class="fb-patch">${p}</span>`).join("") + (r?.attending ? `<span class="fb-patch is-mine">${patchSVG({ color: r.avatar.color, symbol: r.avatar.symbol, top: r.guestName, bottom: missionName(), you: true }, 84)}</span>` : "");
    const n = patches.length + (r?.attending ? 1 : 0);
    if (r?.attending) crewBody.replaceChildren(h("p.crew-t.crew-done", { html: `${icon("check", { size: 20 })}<span>Ya eres parte de la tripulación</span>` }), h("p.muted", { text: peopleLabel(r) }), h("p.crew-n", { html: `<b>${n}</b> tripulantes a bordo` }), h("div.btn-row", h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => openForm({ previous: r }), html: `${icon("edit", { size: 18 })}<span>Editar</span>` }), h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => send(r), html: `${icon("send", { size: 18 })}<span>Reenviar</span>` })));
    else crewBody.replaceChildren(h("h2.crew-t", { text: "ÚNETE A LA TRIPULACIÓN" }), h("p.deadline", { html: `${icon("clock", { size: 16 })}<span>${demoData.rsvp.deadlineText}</span>` }), h("p.crew-n", { html: `<b>${n}</b> tripulantes a bordo` }), h("button.btn.btn-pink.btn-lg.btn-block", { type: "button", onclick: () => openForm(), html: `<span>¡Quiero unirme!</span>${icon("rocket", { size: 22 })}` }), h("button.link", { type: "button", onclick: () => openForm({ decline: true }) }, "No podré asistir"));
    $(".fb-final-row", root).replaceChildren(h("button.btn.btn-cream.btn-sm", { type: "button", onclick: () => openLog(), html: `${icon("log", { size: 18 })}<span>Bitácora</span>` }), r?.attending ? null : h("button.btn.btn-pink.btn-sm", { type: "button", onclick: () => openForm(), html: `${icon("rocket", { size: 18 })}<span>Confirmar</span>` }), h("button.btn.btn-ghost.btn-sm", { type: "button", onclick: () => scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" }) }, "↺ Ver la misión otra vez"));
  }
  renderMural();
  const waTpl = () => ({ ...demoData.rsvp, messageYes: tpl(demoData.rsvp.messageYes), messageNo: tpl(demoData.rsvp.messageNo) });
  const send = (r) => openWhatsApp(root, waUrl(demoData.rsvp.whatsapp, whatsappText(r, waTpl(), kid.name)));
  async function openForm(opts = {}) {
    const { openCrewForm } = await import("../ui/crew-form.js");
    $(".fb-crew", root).scrollIntoView({ behavior: "auto", block: "start" });
    openCrewForm(root, { audio, ...opts, previous: opts.previous || rsvp(), onSubmit: async (r) => {
      state.set({ rsvp: r });
      renderMural();
      if (r.attending) {
        const mine = $(".fb-patch.is-mine", root); mine?.classList.add("is-sewing");
        comets(); audio.whoosh(); setTimeout(() => audio.stitch(16), 700); setTimeout(() => audio.fanfare(), 1600);
        toast(root, "¡Ya eres parte de la tripulación!", 3200);
      } else { audio.bye(); toast(root, "¡Te extrañaremos, tripulante!", 3200); }
      await new Promise((res) => setTimeout(res, 1500));
      send(r);
    } });
  }
  function comets() {
    if (prefersReduced()) return;
    const box = h("div.fb-comets", { "aria-hidden": "true" }, ...Array.from({ length: 18 }, (_, i) => h("i", { style: { "--x": `${Math.random() * 100}%`, "--d": `${(Math.random() * 1.2).toFixed(2)}s`, "--c": ["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF", "#9BE5B4"][i % 5] } })));
    root.append(box); setTimeout(() => box.remove(), 3200);
  }
  async function openLog() {
    const { openBitacora } = await import("../ui/bitacora.js");
    openBitacora(root, { audio, onJoin: () => openForm(), onPhoto: (i) => openViewer(root, i, { audio }) });
  }
  // aparición por capítulo + parallax CSS
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("is-in", e.isIntersecting)), { threshold: 0.25 });
  $$(".fb-ch, .fb-cover", root).forEach((s) => io.observe(s));
  const layers = $$(".layer", root);
  if (!prefersReduced()) {
    let ticking = false;
    addEventListener("scroll", () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; layers.forEach((l) => { l.style.transform = `translateY(${(scrollY * Number(l.dataset.depth)).toFixed(1)}px)`; }); $$(".fb-art", root).forEach((a) => { const r = a.getBoundingClientRect(); a.style.setProperty("--py", ((r.top + r.height / 2 - innerHeight / 2) / innerHeight).toFixed(3)); }); }); }, { passive: true });
  }
  window.__ready = true;
  void DEMO;
}
