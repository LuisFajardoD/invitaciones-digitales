// Lobby: cielo, nubes, bloques flotantes, personaje giratorio, HUD y botón JUGAR.
import { demoData } from "./data.js";
import { h, $, clamp, prefersReduced, inviteTitle } from "./util.js";
import { icon, blockSVG } from "./icons.js";
import { cloudSVG } from "./art.js";
import { createAvatar } from "./avatar.js";
import { state, QUESTS, BONUS } from "./state.js";
import { audio } from "./audio.js";

export function createLobby({ onPlay, onOpen, onToggleSound, onPhoto, onEasterEgg, zoneLabel }) {
  const child = demoData.child;

  /* ---------- Fondo ---------- */
  const clouds = h("div.cloud-layer");
  const CLOUDS = [
    { y: "6%", w: "44%", dur: "150s", delay: "-40s", o: 0.75, v: 1, x0: 10 },
    { y: "15%", w: "62%", dur: "105s", delay: "-80s", o: 0.95, v: 0, x0: 55 },
    { y: "33%", w: "38%", dur: "170s", delay: "-20s", o: 0.6, v: 2, x0: -5 },
    { y: "47%", w: "70%", dur: "90s", delay: "-60s", o: 0.9, v: 1, x0: 60 },
    { y: "66%", w: "84%", dur: "80s", delay: "-10s", o: 1, v: 2, x0: 5 },
    { y: "78%", w: "96%", dur: "70s", delay: "-45s", o: 1, v: 0, x0: 40 }
  ];
  for (const c of CLOUDS) {
    clouds.append(h("div.cloud-track", {
      style: { "--y": c.y, "--w": c.w, "--dur": c.dur, "--delay": c.delay, "--o": c.o, "--x0": c.x0 },
      html: cloudSVG(c.v)
    }));
  }
  // Las variables CSS personalizadas no se asignan con Object.assign; se fijan aparte.
  clouds.querySelectorAll(".cloud-track").forEach((el, i) => {
    for (const [k, v] of Object.entries(CLOUDS[i])) el.style.setProperty(`--${k}`, typeof v === "number" ? v : v);
  });

  const BLOCKS = [
    { l: "6%", t: "30%", s: 34, c: ["#C8F59E", "#9BE564", "#6FBF3E"], dur: "7s", delay: "0s", rot: "-8deg" },
    { l: "82%", t: "36%", s: 46, c: ["#FFE68A", "#FFD23F", "#E0A800"], dur: "8.5s", delay: "-2s", rot: "10deg" },
    { l: "74%", t: "62%", s: 26, c: ["#FFB3B3", "#FF6B6B", "#D94848"], dur: "6.5s", delay: "-4s", rot: "6deg" },
    { l: "10%", t: "60%", s: 22, c: ["#D9C7FF", "#B388FF", "#8A5CE0"], dur: "9s", delay: "-1s", rot: "-12deg" },
    { l: "48%", t: "24%", s: 18, c: ["#BFF0FF", "#4CC9F0", "#2A9FD6"], dur: "10s", delay: "-3s", rot: "4deg" }
  ];
  const floaters = BLOCKS.map((b) => {
    const el = h("div.float-block", { html: blockSVG(...b.c, { size: b.s }) });
    el.style.left = b.l; el.style.top = b.t;
    el.style.setProperty("--dur", b.dur); el.style.setProperty("--delay", b.delay); el.style.setProperty("--rot", b.rot);
    el.style.opacity = b.s < 25 ? 0.75 : 1;
    return el;
  });

  /* ---------- HUD ---------- */
  const photo = h("img.player-photo", { src: child.photo, alt: `Foto de ${child.name}`, width: 56, height: 56, decoding: "async" });
  const levelChip = h("span.chip.player-level", { text: `NIVEL ${child.age}` });
  const xpFill = h("div.xp-fill");
  const xpLabel = h("span.xp-label");
  const nSegs = QUESTS.length + BONUS.length;
  const segs = h("div.xp-segs", null, ...Array.from({ length: nSegs }, () => h("i")));
  segs.style.setProperty("--n", nSegs);
  const xp = h("div.xp", { role: "progressbar", "aria-label": "Experiencia", "aria-valuemin": 0 },
    h("div.xp-track", xpFill, segs, xpLabel));

  const soundBtn = h("button.btn.hud-btn", { type: "button", onclick: () => onToggleSound() });
  const camBtn = h("button.btn.hud-btn", { type: "button", "aria-label": "Modo foto", html: icon("camera", { size: 28 }), onclick: () => onPhoto() });
  const zoneText = h("span");
  const zoneChip = h("button.zone-chip", { type: "button", "aria-label": "Ver la zona en el mapa", onclick: () => onOpen("mapa") },
    h("span.zone-chip-dot"), zoneText);

  const hudTop = h("header.hud-top",
    h("div.player",
      h("div.player-card", photo, h("div.player-meta", h("span.player-tag", { text: child.gamertag }), levelChip)),
      xp),
    h("div.hud-right", h("div.hud-buttons", camBtn, soundBtn), zoneChip)
  );

  const title = h("h1.lobby-title.hud-text", { text: inviteTitle() });

  /* ---------- Escenario del personaje ---------- */
  const avatar = createAvatar(child.avatarColors, { unit: 8, angle: -18, label: `Personaje de ${child.name}` });
  avatar.el.classList.add("stage-avatar");
  const hit = h("button.stage-hit", { type: "button", "aria-label": `Girar el personaje de ${child.name}. Tócalo 5 veces seguidas para una sorpresa.` });

  const firstPhoto = demoData.gallery[0];
  const sideCard = h("button.btn.side-card", { type: "button", onclick: () => onOpen("repeticiones"), "aria-label": "Abrir Mejores momentos (galería de fotos)" },
    h("span.side-card-thumb",
      firstPhoto ? h("img", { src: firstPhoto.src, alt: "", loading: "lazy", decoding: "async" }) : null,
      h("span", { html: icon("replay", { size: 34 }) })),
    h("span", { text: "MEJORES MOMENTOS" }));
  const sideNew = h("span.chip.side-card-new", { text: "NUEVO" });
  sideCard.append(sideNew);

  const platform = h("div.platform", h("div.platform-glow"), h("div.platform-side"), h("div.platform-top"), h("div.platform-ring"));
  const stage = h("div.stage", sideCard, platform, h("div.avatar-shadow"), avatar.el, hit);

  /* ---------- JUGAR ---------- */
  const playBtn = h("button.btn.btn-play", { type: "button", onclick: () => { audio.blip(); onPlay(); } },
    h("span.play-label", { text: "JUGAR" }));
  const tooltip = h("div.tooltip", { text: "¡Toca JUGAR!", hidden: true });
  const playWrap = h("div.play-wrap", h("div.play-pulse", playBtn), tooltip);

  const ui = h("div.lobby-ui", hudTop, title, stage, playWrap);
  const el = h("main#lobby.lobby", { "aria-label": "Lobby" },
    h("div.lobby-sky"), h("div.lobby-sun"), clouds, ...floaters, ui);

  /* ---------- Tamaño del avatar según el espacio ---------- */
  function fit() {
    const r = stage.getBoundingClientRect();
    if (!r.height) return;
    const unit = clamp(Math.min(r.height / 31, r.width / 21), 4.5, 11);
    avatar.el.style.fontSize = `${unit.toFixed(2)}px`;
    stage.style.setProperty("--plat-y", `${Math.max(0, (r.height - unit * 27) / 2 - unit * 1.4)}px`);
  }
  if (typeof ResizeObserver === "function") new ResizeObserver(fit).observe(stage);
  else window.addEventListener("resize", fit);

  /* ---------- Giro con arrastre, inercia y giro lento automático ---------- */
  let angle = -18, vel = 0, dragging = false, lastX = 0, lastT = 0, downX = 0, downT = 0, raf = 0, running = false, prev = 0;
  let idleHold = 0;
  const AUTO = 11; // grados/segundo
  function frame(t) {
    const dt = Math.min(50, prev ? t - prev : 16) / 1000;
    prev = t;
    if (!dragging) {
      if (Math.abs(vel) > 2) {
        angle += vel * dt;
        vel *= Math.pow(0.04, dt); // inercia
        idleHold = 1.2;
      } else if (idleHold > 0) {
        idleHold -= dt;
      } else if (!prefersReduced()) {
        const c = Math.cos((angle * Math.PI) / 180);
        angle += AUTO * (0.28 + 0.72 * (1 - c) / 2) * dt; // se detiene más de frente
      }
    }
    avatar.setAngle(angle);
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; prev = 0; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  let taps = [];
  function registerTap() {
    const now = performance.now();
    taps = taps.filter((t) => now - t < 1800);
    taps.push(now);
    audio.pop(1 + taps.length * 0.12);
    if (taps.length >= 5) {
      taps = [];
      onEasterEgg();
    }
  }

  hit.addEventListener("pointerdown", (e) => {
    dragging = true; vel = 0;
    lastX = downX = e.clientX; lastT = downT = performance.now();
    try { hit.setPointerCapture(e.pointerId); } catch { /* nada */ }
  });
  hit.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    angle += dx * 0.55;
    const dt = Math.max(1, now - lastT);
    vel = clamp((dx * 0.55 * 1000) / dt, -900, 900);
    lastX = e.clientX; lastT = now;
    if (!running) avatar.setAngle(angle);
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    const moved = Math.abs(e.clientX - downX);
    if (performance.now() - lastT > 80) vel = 0;
    if (prefersReduced()) vel = 0;
    if (moved < 8 && performance.now() - downT < 350) { vel = 0; registerTap(); }
    idleHold = 1.5;
  };
  hit.addEventListener("pointerup", end);
  hit.addEventListener("pointercancel", (e) => { dragging = false; vel = 0; });
  hit.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { angle -= 20; idleHold = 2; avatar.setAngle(angle); e.preventDefault(); }
    if (e.key === "ArrowRight") { angle += 20; idleHold = 2; avatar.setAngle(angle); e.preventDefault(); }
    if (e.key === "Enter" || e.key === " ") { registerTap(); e.preventDefault(); }
  });

  /* ---------- API ---------- */
  const api = {
    el,
    avatar,
    playBtn,
    stageEl: stage,
    start, stop,
    setCovered(covered) {
      el.classList.toggle("is-covered", covered);
      el.setAttribute("aria-hidden", covered ? "true" : "false");
      if ("inert" in el) el.inert = covered;
      if (covered) stop(); else if (document.visibilityState === "visible") start();
    },
    setSound(on) {
      soundBtn.innerHTML = icon(on ? "soundOn" : "soundOff", { size: 28 });
      soundBtn.setAttribute("aria-label", on ? "Apagar sonido" : "Encender sonido");
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    },
    renderXP(gained = 0) {
      // El máximo incluye el bonus opcional; subir de nivel sólo exige las misiones (requiredXp)
      const cur = Math.min(state.xp(), state.maxXp()), max = state.maxXp();
      const leveled = state.allDone();
      xpFill.style.transform = `scaleX(${cur / max})`;
      xpLabel.textContent = `XP ${cur}/${max}`;
      xp.setAttribute("aria-valuemax", max);
      xp.setAttribute("aria-valuenow", cur);
      xp.classList.toggle("is-max", leveled);
      levelChip.textContent = leveled ? `NIVEL ${child.age} ★` : `NIVEL ${child.age}`;
      if (gained) {
        const f = h("span.xp-float.hud-text", { text: `+${gained} XP` });
        xp.append(f);
        setTimeout(() => f.remove(), 1400);
      }
      sideNew.hidden = state.get().visited.includes("repeticiones");
    },
    setSoundAvailable(ok) { soundBtn.hidden = !ok; },
    setZoneLabel(text) { zoneText.textContent = text; },
    showTooltip(on) { tooltip.hidden = !on; },
    photoMode(on) { avatar.pose(on); }
  };
  api.renderXP();
  api.setZoneLabel(zoneLabel());
  requestAnimationFrame(fit);
  return api;
}
