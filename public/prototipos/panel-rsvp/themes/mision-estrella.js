// Tema Misión Estrella: espacio de cuento (índigo → violeta, rosa, durazno, turquesa y dorado), astronauta con
// Gloobi, tarjetas suaves con esquinas de 24 px, Fredoka + Figtree. El muro de invitados es el mural de parches
// bordados de la tripulación.
import { demoData, visorPhotos } from "../../mision-estrella/js/data.js";
import { astronautSVG, gloobiSVG, starsSVG } from "../../mision-estrella/js/ui/illustrations.js";
import { patchSVG } from "../../mision-estrella/js/ui/patch.js";

const kid = demoData.child;
const asset = (p) => `../mision-estrella/${p}`;

export default {
  id: "mision-estrella",
  avatarStyle: "mission-patch",
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Figtree:wght@400;600;800&display=swap",
    display: "'Fredoka', 'Figtree', system-ui, sans-serif",
    body: "'Figtree', system-ui, sans-serif",
    displayWeight: 600
  },
  tokens: {
    bg: "#F3EEFF", surface: "#FFFFFF", surfaceAlt: "#FBF8FF",
    text: "#1E1B4B", muted: "#4B4680",
    primary: "#FF8FA3", onPrimary: "#1E1B4B", accent: "#6FD6E8",
    success: "#2F9E6B", warn: "#D23F63",
    line: "#DCD4F5", lineStrong: "#B9A2FF",
    radius: "24px", radiusSm: "16px",
    borderWidth: "1.5px", shadow: "0 8px 24px rgba(59, 42, 122, .14)", pressShadow: "0 2px 8px rgba(59, 42, 122, .14)",
    heroBg: "radial-gradient(60% 70% at 18% 20%, rgba(255, 143, 163, .45), transparent 70%), radial-gradient(55% 60% at 85% 80%, rgba(111, 214, 232, .35), transparent 70%), linear-gradient(180deg, #1E1B4B 0%, #3B2A7A 100%)",
    heroText: "#FFF7EC",
    // mural: el costado crema del cohete, con una costura punteada alrededor
    wallBg: "repeating-linear-gradient(90deg, rgba(185, 162, 255, .5) 0 8px, transparent 8px 14px) top / 100% 2px no-repeat, repeating-linear-gradient(90deg, rgba(185, 162, 255, .5) 0 8px, transparent 8px 14px) bottom / 100% 2px no-repeat, radial-gradient(120% 90% at 30% 15%, #FFFFFF, #FFF7EC 55%, #E9E2F7 100%)",
    wallText: "#1E1B4B", noteBg: "#FFFFFF"
  },
  vocabulary: { guests: "Tripulantes", list: "Tripulación de la misión", confirmed: "A bordo", guest: "tripulante", wallHint: "Toca un parche para ver su respuesta" },
  ui: { panel: "rounded", button: "solid" },

  renderHero(container, ev) {
    container.innerHTML = `<svg viewBox="0 0 320 170" role="img" aria-label="${ev.childName} flota en el espacio con Gloobi">
      ${starsSVG(320, 170, 40, 7)}
      <circle cx="262" cy="150" r="70" fill="#FFE7C2" opacity=".14"/>
      <g class="hero-float">${astronautSVG(150, 168, 0.72, { pose: "float", photo: asset(visorPhotos(kid).awake), accent: kid.accentColor, suit: kid.suitColor })}</g>
      ${gloobiSVG(236, 58, 17)}
    </svg>`;
  },
  renderGuestAvatar(r, size = 44) {
    const big = size >= 64;
    return patchSVG({ color: r.avatar?.color || "#FF8FA3", symbol: r.avatar?.symbol || "star", top: big ? r.guestName.split(" ")[0] : "", bottom: "" }, size);
  }
};
