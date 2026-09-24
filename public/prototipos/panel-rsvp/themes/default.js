// Tema por defecto (plantillas sin tema propio): limpio y neutro, globos, iniciales.
import { initials } from "../js/avatars.js";

const PALETTE = ["#6B7AFF", "#FF7A8A", "#2BB5A0", "#F5A524", "#9B6BFF", "#3AA0FF"];
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export default {
  id: "default",
  avatarStyle: "default",
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
    display: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    displayWeight: 800
  },
  tokens: {
    bg: "#F6F7FB", surface: "#FFFFFF", surfaceAlt: "#F0F2FA",
    text: "#1D2233", muted: "#5E667D",
    primary: "#5A67F2", onPrimary: "#FFFFFF", accent: "#FF7A8A",
    success: "#1F9D72", warn: "#C9502F",
    line: "#E2E5F0", lineStrong: "#C9CEE0",
    radius: "18px", radiusSm: "12px",
    borderWidth: "1px", shadow: "0 6px 20px rgba(29, 34, 51, .08)", pressShadow: "0 2px 6px rgba(29,34,51,.12)",
    heroBg: "linear-gradient(160deg, #EEF0FF 0%, #FFF0F3 100%)", heroText: "#1D2233",
    wallBg: "#F0F2FA", wallText: "#1D2233", noteBg: "#FFF8E6"
  },
  vocabulary: { guests: "Invitados", list: "Lista de invitados", confirmed: "Confirmados", guest: "invitado", wallHint: "Toca a un invitado para ver su respuesta" },
  ui: { panel: "rounded", button: "flat" },

  renderHero(container, ev) {
    const b = (x, y, c, r) => `<g><path d="M${x} ${y + r} q-4 22 6 ${60 - r}" fill="none" stroke="#9AA3BF" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="${r * 0.86}" ry="${r}" fill="${c}"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.35}" rx="${r * 0.2}" ry="${r * 0.3}" fill="#fff" opacity=".6"/></g>`;
    container.innerHTML = `<svg viewBox="0 0 320 150" role="img" aria-label="Globos de fiesta">
      <circle cx="260" cy="36" r="30" fill="#FFE9A8" opacity=".6"/>
      ${b(70, 60, "#FF7A8A", 26)}${b(112, 44, "#6B7AFF", 30)}${b(152, 66, "#F5A524", 24)}${b(210, 50, "#2BB5A0", 27)}${b(250, 74, "#9B6BFF", 22)}
      <path d="M20 132 Q160 112 300 132" fill="none" stroke="#E2E5F0" stroke-width="3"/>
      <text x="160" y="140" text-anchor="middle" font-family="Inter, sans-serif" font-weight="800" font-size="11" fill="#9AA3BF" letter-spacing="2">¡${ev.age} AÑOS!</text>
    </svg>`;
  },
  renderGuestAvatar(r, size = 44) {
    return initials(r.guestName, { color: PALETTE[hash(r.guestName) % PALETTE.length] }, size);
  }
};
