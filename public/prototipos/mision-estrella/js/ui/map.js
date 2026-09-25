// Mapa ilustrado genérico (calles, parque y el salón con un pin), en SVG. Lo usan la pantalla holográfica de la
// estación (como textura) y la versión ilustrada. Sin Three.js.
import { demoData } from "../data.js";
import { esc } from "../util.js";

/** Mapa ilustrado genérico (calles, parque y el salón con un pin). También lo usa la versión ilustrada. */
export function mapSVG() {
  const v = esc(demoData.event.venueName);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">
  <rect width="640" height="400" rx="28" fill="#20306B"/>
  <g stroke="#6FD6E8" stroke-opacity=".35" stroke-width="2">${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 40} 0v400"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 40}h640"/>`).join("")}</g>
  <path d="M-10 250C120 230 200 280 330 250S520 190 650 210" fill="none" stroke="#FFF7EC" stroke-width="22" stroke-linecap="round" opacity=".9"/>
  <path d="M190 -10C200 120 170 240 210 410" fill="none" stroke="#FFF7EC" stroke-width="16" opacity=".85"/>
  <path d="M470 -10v420" fill="none" stroke="#FFF7EC" stroke-width="14" opacity=".75"/>
  <path d="M-10 110h660" fill="none" stroke="#FFF7EC" stroke-width="10" opacity=".6"/>
  <path d="M40 290c30-30 110-26 128 6 12 24-8 70-66 70s-92-44-62-76z" fill="#9BE5B4"/>
  <g fill="#5FB88A">${[[70, 318], [100, 300], [130, 330], [90, 345]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join("")}</g>
  <text x="104" y="385" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-weight="800" font-size="17" fill="#9BE5B4">Parque</text>
  <rect x="290" y="140" width="130" height="80" rx="14" fill="#FF8FA3" stroke="#FFF7EC" stroke-width="5"/>
  <path d="M290 150l65-44 65 44" fill="#FFD27A" stroke="#FFF7EC" stroke-width="5" stroke-linejoin="round"/>
  <path d="M355 30c-24 0-40 18-40 38 0 28 40 62 40 62s40-34 40-62c0-20-16-38-40-38z" fill="#FFD27A" stroke="#1E1B4B" stroke-width="4"/>
  <circle cx="355" cy="68" r="13" fill="#1E1B4B"/>
  <rect x="210" y="300" width="290" height="46" rx="23" fill="#1E1B4B" stroke="#FFD27A" stroke-width="3"/>
  <text x="355" y="330" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-weight="600" font-size="22" fill="#FFF7EC">${v}</text>
</svg>`;
}
