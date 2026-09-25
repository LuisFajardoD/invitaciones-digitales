// Temas de color de la invitación (child.colorTheme en data.js). La invitación sirve igual para niños y niñas:
// el tema tiñe el cohete (punta, aletas, franjas, emblema con la edad, marco del mural), la torre y la plataforma
// del despegue (detalles de seguridad), el parche del niño, la luz de borde de la escena y los acentos de la interfaz
// (botón de despegue, insignia, guía de capítulos, botones rosa → primario, textos de la Bitácora).
// NO cambian con el tema: los parches de los invitados (cada uno eligió su color), Gloobi (celeste con anillo dorado)
// y la nebulosa.
// Tokens: primary (color principal), secondary (compañero), accent (detalles de seguridad, luces), gold (detalles
// dorados), body (cuerpo crema del cohete), onPrimary (texto sobre el primario, con buen contraste).
// Sin Three.js: lo usan también la versión ilustrada y el panel RSVP.
export const THEMES = {
  "azul-cohete": { label: "Azul cohete", primary: "#3D6BE0", secondary: "#45C4D9", accent: "#FF9A4D", gold: "#F2C94C", body: "#FFF7EC", onPrimary: "#FFFFFF" },
  turquesa: { label: "Turquesa", primary: "#1FAFBF", secondary: "#8FE3CF", accent: "#FF8A5C", gold: "#F2C94C", body: "#FFF7EC", onPrimary: "#10233F" },
  naranja: { label: "Naranja", primary: "#FF8A3D", secondary: "#FFC857", accent: "#3D8BE0", gold: "#F2C94C", body: "#FFF7EC", onPrimary: "#1E1B4B" },
  verde: { label: "Verde", primary: "#3DB57A", secondary: "#A6DE7E", accent: "#FFB347", gold: "#F2C94C", body: "#FFF7EC", onPrimary: "#10233F" },
  morado: { label: "Morado", primary: "#7C5CE0", secondary: "#B9A2FF", accent: "#FFB05C", gold: "#F2C94C", body: "#FFF7EC", onPrimary: "#FFFFFF" },
  rosa: { label: "Rosa", primary: "#FF8FA3", secondary: "#6FD6E8", accent: "#FF6F8A", gold: "#FFD27A", body: "#FFF7EC", onPrimary: "#1E1B4B" }
};
export const DEFAULT_THEME = "azul-cohete";

/** Tema del niño (child.colorTheme); si no existe, el de la demo. */
export function themeOf(child) {
  const key = child?.colorTheme in THEMES ? child.colorTheme : DEFAULT_THEME;
  return { key, ...THEMES[key] };
}

/** "#RRGGBB" → [r, g, b] (0–255). */
export function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** Mezcla con blanco (k > 0) o con índigo oscuro (k < 0), para versiones claras / oscuras del mismo tono. */
export function tint(hex, k) {
  const a = hexRgb(hex), b = k >= 0 ? [255, 255, 255] : [30, 27, 75], m = Math.abs(k);
  return toHex(a.map((v, i) => v + (b[i] - v) * m));
}

/** Variables CSS del tema (la interfaz las usa en lugar del rosa fijo). */
export function themeCssVars(t) {
  const rgb = hexRgb(t.primary).join(", ");
  return {
    "--pink": t.primary, "--theme": t.primary, "--theme-rgb": rgb, "--on-theme": t.onPrimary,
    "--theme-hi": tint(t.primary, 0.38), "--theme-lo": tint(t.primary, -0.22), "--theme-ink": tint(t.primary, -0.55),
    "--theme-2": t.secondary, "--theme-accent": t.accent, "--theme-gold": t.gold, "--theme-gold-rgb": hexRgb(t.gold).join(", ")
  };
}
export function applyThemeCss(t, el = document.documentElement) {
  for (const [k, v] of Object.entries(themeCssVars(t))) el.style.setProperty(k, v);
  el.dataset.theme = t.key;
}
