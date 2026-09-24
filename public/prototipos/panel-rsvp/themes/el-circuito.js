// Tema El Circuito: parque acuático inflable tropical, corredores con playera de color y dorsal,
// botones tipo flotador con contorno tinta y sombra sólida, Titan One + Outfit.
import { demoData } from "../../el-circuito/js/data.js";

const INK = "#1B1F3B";
const GUEST = { skin: "#F0C29B", hair: "#4A3020" };

/** Cabeza de frente: pelo (corto, largo o coletas), cintillo, ojos y sonrisa. Centro (cx, cy), radio r. */
function head(cx, cy, r, { skin, hair, hairStyle = "short", band }) {
  const back = hairStyle === "long"
    ? `<path d="M${cx - r * 1.02} ${cy - r * 0.2}q-${r * 0.12} ${r * 1.2} ${r * 0.3} ${r * 1.45}h${r * 1.44}q${r * 0.42}-${r * 0.25} ${r * 0.3}-${r * 1.45}z" fill="${hair}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`
    : hairStyle === "pigtails"
      ? `<g fill="${hair}" stroke="${INK}" stroke-width="2.4"><ellipse cx="${cx - r * 1.12}" cy="${cy + r * 0.15}" rx="${r * 0.36}" ry="${r * 0.5}" transform="rotate(20 ${cx - r * 1.12} ${cy + r * 0.15})"/><ellipse cx="${cx + r * 1.12}" cy="${cy + r * 0.15}" rx="${r * 0.36}" ry="${r * 0.5}" transform="rotate(-20 ${cx + r * 1.12} ${cy + r * 0.15})"/></g>`
      : "";
  const spikes = hairStyle === "short" ? `<path d="M${cx - r * 0.2} ${cy - r * 0.98}l${r * 0.14}-${r * 0.36} ${r * 0.18} ${r * 0.3} ${r * 0.2}-${r * 0.32} ${r * 0.1} ${r * 0.38}" fill="${hair}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` : "";
  return `${back}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${skin}" stroke="${INK}" stroke-width="2.4"/>
    ${spikes}
    <path d="M${cx - r * 0.99} ${cy - r * 0.05}C${cx - r * 1.05} ${cy - r * 1.35} ${cx + r * 1.05} ${cy - r * 1.35} ${cx + r * 0.99} ${cy - r * 0.05}q-${r * 0.2}-${r * 0.35}-${r * 0.5}-${r * 0.42}q-${r * 0.5} ${r * 0.1}-${r * 0.9}-${r * 0.08}q-${r * 0.4} ${r * 0.18}-${r * 0.95} ${r * 0.05}q-${r * 0.3} ${r * 0.1}-${r * 0.53} ${r * 0.45}z" fill="${hair}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M${cx - r * 0.97} ${cy - r * 0.42}Q${cx} ${cy - r * 0.75} ${cx + r * 0.97} ${cy - r * 0.42}" fill="none" stroke="${INK}" stroke-width="${r * 0.34 + 2.2}" stroke-linecap="round"/>
    <path d="M${cx - r * 0.97} ${cy - r * 0.42}Q${cx} ${cy - r * 0.75} ${cx + r * 0.97} ${cy - r * 0.42}" fill="none" stroke="${band}" stroke-width="${r * 0.34}" stroke-linecap="round"/>
    <g fill="${INK}"><ellipse cx="${cx - r * 0.36}" cy="${cy + r * 0.12}" rx="${r * 0.12}" ry="${r * 0.16}"/><ellipse cx="${cx + r * 0.36}" cy="${cy + r * 0.12}" rx="${r * 0.12}" ry="${r * 0.16}"/></g>
    <g fill="#FF9FCB" opacity=".7"><circle cx="${cx - r * 0.62}" cy="${cy + r * 0.42}" r="${r * 0.14}"/><circle cx="${cx + r * 0.62}" cy="${cy + r * 0.42}" r="${r * 0.14}"/></g>
    <path d="M${cx - r * 0.3} ${cy + r * 0.45}q${r * 0.3} ${r * 0.3} ${r * 0.6} 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
}
const bandFor = (shirt) => (shirt.toUpperCase() === "#FFC93C" ? "#FF5A5F" : "#FFC93C");

/** Corredor de cuerpo entero, de frente, con los brazos arriba (para el podio). Pies en (x, y). */
function fullRunner(x, y, s, look, { initial = "" } = {}) {
  const sk = look.skin, arm = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${sk}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${arm("M-9 -40l-9-9 -3-11")}${arm("M9 -40l9-9 3-11")}
    <g fill="${sk}" stroke="${INK}" stroke-width="2.4"><circle cx="-21" cy="-61" r="3.6"/><circle cx="21" cy="-61" r="3.6"/></g>
    ${arm("M-5 -20v14")}${arm("M5 -20v14")}
    <g fill="${look.shoes}" stroke="${INK}" stroke-width="2.4"><ellipse cx="-7" cy="-3" rx="6.5" ry="4"/><ellipse cx="7" cy="-3" rx="6.5" ry="4"/></g>
    <rect x="-10" y="-25" width="20" height="9" rx="3" fill="${look.shorts}" stroke="${INK}" stroke-width="2.4"/>
    <rect x="-11" y="-44" width="22" height="22" rx="7" fill="${look.shirt}" stroke="${INK}" stroke-width="2.4"/>
    <rect x="-6" y="-39" width="12" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.4"/>
    <text x="0" y="-31" text-anchor="middle" font-family="'Titan One', sans-serif" font-size="8" fill="${INK}">${initial}</text>
    ${head(0, -58, 14, { skin: sk, hair: look.hair, hairStyle: look.hairStyle, band: look.headband })}
  </g>`;
}

/** Mini corredor de frente (busto) con su playera, peinado y la inicial en el dorsal. */
function miniRunner({ color = "#FF5A5F", hair = "short", name = "" } = {}, size = 44) {
  const initial = (String(name).trim()[0] || "?").toUpperCase().replace(/[<&>"]/g, "");
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <path d="M13 64v-9c0-8 6-13 13-13h12c7 0 13 5 13 13v9z" fill="${color}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
    <rect x="24" y="48" width="16" height="13" rx="2.5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>
    <text x="32" y="58.5" text-anchor="middle" font-family="'Titan One', 'Arial Black', sans-serif" font-size="10" fill="${INK}">${initial}</text>
    ${head(32, 26, 16, { skin: GUEST.skin, hair: GUEST.hair, hairStyle: hair, band: bandFor(color) })}
  </svg>`;
}

export default {
  id: "el-circuito",
  avatarStyle: "circuito-runner",
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Titan+One&family=Outfit:wght@400;600;800&display=swap",
    display: "'Titan One', 'Arial Black', sans-serif",
    body: "'Outfit', system-ui, sans-serif",
    displayWeight: 400
  },
  tokens: {
    bg: "#E8FBFF", surface: "#FFFFFF", surfaceAlt: "#F4FCFF",
    text: "#1B1F3B", muted: "#4A5078",
    primary: "#FF5A5F", onPrimary: "#FFFFFF", accent: "#FFC93C",
    success: "#1F8F63", warn: "#D93A3F",
    line: "#1B1F3B", lineStrong: "#1B1F3B",
    radius: "22px", radiusSm: "16px",
    borderWidth: "3px", shadow: "0 5px 0 #1B1F3B", pressShadow: "0 0 0 #1B1F3B",
    heroBg: "linear-gradient(180deg, #5FC8F5 0%, #BDEEFF 62%, #2EC4B6 62%, #1A9E9A 100%)", heroText: "#FFFFFF",
    wallBg: "repeating-linear-gradient(180deg, transparent 0 34px, rgba(255,255,255,.35) 34px 37px), linear-gradient(180deg, #2EC4B6 0%, #1A9E9A 100%)", wallText: "#FFFFFF", noteBg: "#FFFFFF"
  },
  vocabulary: { guests: "Corredores", list: "Inscritos en la carrera", confirmed: "Listos en la salida", guest: "corredor", wallHint: "Toca a un corredor para ver su respuesta" },
  ui: { panel: "rounded", button: "solid" },

  renderHero(container, ev) {
    const kid = demoData.child.runner;
    const block = (x, top, w, fill, n) => `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><rect x="${x}" y="${top}" width="${w}" height="${140 - top}" rx="7" fill="${fill}"/><rect x="${x + 6}" y="${top + 5}" width="${w - 12}" height="6" rx="3" fill="#fff" fill-opacity=".45" stroke="none"/></g><text x="${x + w / 2}" y="${top + 30}" text-anchor="middle" font-family="'Titan One', sans-serif" font-size="20" fill="#fff" stroke="${INK}" stroke-width="4" paint-order="stroke">${n}</text>`;
    container.innerHTML = `<svg viewBox="0 0 320 170" role="img" aria-label="${ev.childName} en el podio de su circuito acuático">
      <circle cx="274" cy="30" r="30" fill="#FFE58A" opacity=".5"/><circle cx="274" cy="30" r="20" fill="#FFD84D"/>
      <g fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"><path d="M22 44a12 12 0 0 1 21-8 16 16 0 0 1 29 4 11 11 0 0 1 7 18H25a10 10 0 0 1-3-14z"/></g>
      <path d="M0 106q14-6 28 0t28 0 28 0 28 0 28 0 28 0 28 0 28 0 28 0 28 0 28 0 28 0" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/>
      <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        <path d="M252 138V76a24 24 0 0 1 48 0v62h-12V77a12 12 0 0 0-24 0v61z" fill="#FF5A5F"/>
        <rect x="249" y="64" width="54" height="14" rx="5" fill="#fff"/>
        <ellipse cx="42" cy="146" rx="26" ry="8" fill="#FFC93C"/><ellipse cx="42" cy="144" rx="11" ry="3.5" fill="#2EC4B6"/>
        <rect x="92" y="134" width="150" height="22" rx="11" fill="#3D5AFE"/>
      </g>
      <path d="M255 71h8M271 71h8M287 71h8" stroke="${INK}" stroke-width="7"/>
      ${block(106, 108, 38, "#3D5AFE", 2)}${block(144, 94, 40, "#FFC93C", 1)}${block(184, 116, 38, "#9BE564", 3)}
      ${fullRunner(164, 95, 0.92, kid, { initial: String(ev.age) })}
    </svg>`;
  },
  renderGuestAvatar(r, size = 44) {
    return miniRunner({ color: r.avatar?.color, hair: r.avatar?.hair, name: r.guestName }, size);
  }
};
