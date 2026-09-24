// Tema Temporada 8: cielo diurno, personaje de bloques sobre su plataforma, botones gruesos con
// contorno azul profundo y sombra sólida, Lilita One + Rubik.
import { t8Character } from "../js/avatars.js";
import { flatAvatarSVG } from "../../temporada-8/js/icons.js";

const KID = { shirt: "#4CC9F0", head: "#F2C29B", hair: "#3B2A1A", pants: "#1B2A6B" };

export default {
  id: "temporada-8",
  avatarStyle: "t8-character",
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Lilita+One&family=Rubik:wght@400;600;800&display=swap",
    display: "'Lilita One', 'Rubik', sans-serif",
    body: "'Rubik', system-ui, sans-serif",
    displayWeight: 400
  },
  tokens: {
    bg: "#E6F7FD", surface: "#FFF8EC", surfaceAlt: "#FFFFFF",
    text: "#1B2A6B", muted: "#4A5690",
    primary: "#FFD23F", onPrimary: "#1B2A6B", accent: "#4CC9F0",
    success: "#2E9A45", warn: "#E0483F",
    line: "#1B2A6B", lineStrong: "#1B2A6B",
    radius: "18px", radiusSm: "14px",
    borderWidth: "3px", shadow: "0 5px 0 #1B2A6B", pressShadow: "0 0 0 #1B2A6B",
    heroBg: "linear-gradient(180deg, #259BDA 0%, #45C2EE 55%, #BFF0FF 100%)", heroText: "#FFFFFF",
    wallBg: "radial-gradient(60% 40% at 50% 110%, rgba(255,255,255,.7), transparent 70%), linear-gradient(180deg, #45C2EE 0%, #BFF0FF 100%)", wallText: "#1B2A6B", noteBg: "#FFFFFF"
  },
  vocabulary: { guests: "Jugadores", list: "Escuadrón", confirmed: "Listos para jugar", guest: "jugador", wallHint: "Toca a un jugador para ver su respuesta" },
  ui: { panel: "rounded", button: "solid" },

  renderHero(container, ev) {
    const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".9"><circle cx="20" cy="18" r="14"/><circle cx="40" cy="12" r="18"/><circle cx="60" cy="20" r="12"/><rect x="8" y="18" width="62" height="14" rx="7"/></g>`;
    container.innerHTML = `<svg viewBox="0 0 320 170" role="img" aria-label="Personaje de bloques de ${ev.childName} en el lobby">
      <circle cx="270" cy="30" r="34" fill="#FFF6C8" opacity=".75"/>
      ${cloud(18, 26, 0.9)}${cloud(222, 64, 0.7)}${cloud(120, 8, 0.55)}
      <ellipse cx="160" cy="150" rx="78" ry="16" fill="#2B3D8F" stroke="#1B2A6B" stroke-width="3"/>
      <ellipse cx="160" cy="144" rx="78" ry="16" fill="#E9FBFF" stroke="#1B2A6B" stroke-width="3"/>
      <ellipse cx="160" cy="144" rx="56" ry="10" fill="none" stroke="#FFD23F" stroke-width="3"/>
      <g transform="translate(124 40)">${flatAvatarSVG(KID, 72)}</g>
      <g transform="translate(40 108)">${flatAvatarSVG({ shirt: "#FF9FCB" }, 28)}</g>
      <g transform="translate(252 104)">${flatAvatarSVG({ shirt: "#9BE564", style: "pigtails" }, 30)}</g>
    </svg>`;
  },
  renderGuestAvatar(r, size = 44) {
    return t8Character({ color: r.avatar?.color, hair: r.avatar?.hair }, size);
  }
};
