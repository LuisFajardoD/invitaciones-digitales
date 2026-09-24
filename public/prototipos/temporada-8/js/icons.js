// Íconos SVG originales, estilo grueso y redondeado (viewBox 32×32, contorno azul profundo).
const S = 'stroke="#1B2A6B" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';

const paths = {
  flag: `<path d="M8 28V5" ${S} fill="none"/><path d="M8 6h15l-3.5 5 3.5 5H8z" fill="#9BE564" ${S}/>`,
  controller: `<path d="M6 12.5c0-2 1.6-3.5 3.5-3.5h13c1.9 0 3.5 1.5 3.5 3.5l1.4 8.2c.4 2.3-2.3 3.9-4 2.3L20 19.5h-8L8.6 23c-1.7 1.6-4.4 0-4-2.3z" fill="#B388FF" ${S}/><path d="M10.5 12.8v4.4M8.3 15h4.4" ${S} fill="none"/><circle cx="21" cy="13.6" r="1.4" fill="#1B2A6B"/><circle cx="23.6" cy="16.4" r="1.4" fill="#1B2A6B"/>`,
  cake: `<path d="M5 17h22v10H5z" fill="#FF6B6B" ${S}/><path d="M5 20.5c2.2 1.8 4.2 1.8 5.5 0 1.4 1.8 3.8 1.8 5.5 0 1.4 1.8 3.8 1.8 5.5 0 1.3 1.8 3.3 1.8 5.5 0" fill="none" ${S}/><path d="M8 12h16v5H8z" fill="#FFF8EC" ${S}/><path d="M16 12V8" ${S}/><path d="M16 3.5c1.4 1.3 1.4 2.8 0 3.8-1.4-1-1.4-2.5 0-3.8z" fill="#FFD23F" ${S} stroke-width="1.6"/>`,
  star: `<path d="M16 3.5l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3-7.4-3.9-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2z" fill="#FFD23F" ${S}/>`,
  back: `<path d="M19 7l-9 9 9 9" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  soundOn: `<path d="M5 12.5h5l7-6v19l-7-6H5z" fill="#FFF8EC" ${S}/><path d="M21 11.5c1.6 1.4 1.6 7.6 0 9M24.5 8.5c3.4 3 3.4 12 0 15" fill="none" ${S}/>`,
  soundOff: `<path d="M5 12.5h5l7-6v19l-7-6H5z" fill="#FFF8EC" ${S}/><path d="M21.5 12.5l6 7M27.5 12.5l-6 7" fill="none" ${S}/>`,
  camera: `<path d="M4.5 11c0-1.4 1.1-2.5 2.5-2.5h3.5l2-3h7l2 3H25c1.4 0 2.5 1.1 2.5 2.5v12c0 1.4-1.1 2.5-2.5 2.5H7c-1.4 0-2.5-1.1-2.5-2.5z" fill="#FFF8EC" ${S}/><circle cx="16" cy="17" r="4.8" fill="#4CC9F0" ${S}/>`,
  mission: `<rect x="5" y="4.5" width="22" height="23" rx="4" fill="#FFF8EC" ${S}/><path d="M5 11h22" ${S}/><path d="M10 4.5v-2M22 4.5v-2" ${S}/><path d="M11 18.5l3.2 3.2 6.8-7" fill="none" ${S}/>`,
  map: `<path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3z" fill="#9BE564" ${S}/><path d="M11 5v19M21 8v19" ${S} fill="none"/><circle cx="16" cy="15" r="3" fill="#FF6B6B" stroke="#1B2A6B" stroke-width="2"/>`,
  pass: `<path d="M4 9.5c0-1.4 1.1-2.5 2.5-2.5h19c1.4 0 2.5 1.1 2.5 2.5v3.3a3.2 3.2 0 000 6.4v3.3c0 1.4-1.1 2.5-2.5 2.5h-19C5.1 25 4 23.9 4 22.5v-3.3a3.2 3.2 0 000-6.4z" fill="#FFD23F" ${S}/><path d="M13 12l1.5 3 3.2.4-2.3 2.2.6 3.2-3-1.6" fill="none" stroke="#1B2A6B" stroke-width="2" stroke-linejoin="round"/><path d="M21 9v14" stroke="#1B2A6B" stroke-width="2" stroke-dasharray="2 2.6"/>`,
  shop: `<path d="M6 11h20l-1.6 15.2c-.1 1-1 1.8-2 1.8H9.6c-1 0-1.9-.8-2-1.8z" fill="#FF6B6B" ${S}/><path d="M11.5 14V9.5a4.5 4.5 0 019 0V14" fill="none" ${S}/>`,
  squad: `<rect x="3.5" y="9" width="9" height="9" rx="2.4" fill="#9BE564" ${S}/><rect x="19.5" y="9" width="9" height="9" rx="2.4" fill="#B388FF" ${S}/><rect x="10.5" y="6" width="11" height="11" rx="2.8" fill="#FFD23F" ${S}/><path d="M7 27c0-4 4-7 9-7s9 3 9 7z" fill="#4CC9F0" ${S}/>`,
  replay: `<rect x="3.5" y="6.5" width="25" height="19" rx="4" fill="#B388FF" ${S}/><path d="M13.5 11.5v9l7.5-4.5z" fill="#FFF8EC" ${S} stroke-width="2"/>`,
  calendar: `<rect x="4.5" y="6" width="23" height="21.5" rx="4" fill="#FFF8EC" ${S}/><path d="M4.5 12.5h23" ${S}/><path d="M10.5 3.5v5M21.5 3.5v5" ${S}/><path d="M16 16.5v6M13 19.5h6" ${S}/>`,
  pin: `<path d="M16 29s-9-8.4-9-15a9 9 0 0118 0c0 6.6-9 15-9 15z" fill="#FF6B6B" ${S}/><circle cx="16" cy="14" r="3.4" fill="#FFF8EC" stroke="#1B2A6B" stroke-width="2"/>`,
  clock: `<circle cx="16" cy="16" r="12" fill="#FFF8EC" ${S}/><path d="M16 9v7.5l4.5 3" fill="none" ${S}/>`,
  hosts: `<path d="M16 27.5S4 20.5 4 12.3A6.3 6.3 0 0116 9a6.3 6.3 0 0112 3.3c0 8.2-12 15.2-12 15.2z" fill="#FF6B6B" ${S}/>`,
  heart: `<path d="M16 27.5S4 20.5 4 12.3A6.3 6.3 0 0116 9a6.3 6.3 0 0112 3.3c0 8.2-12 15.2-12 15.2z" fill="#FF6B6B" ${S}/><path d="M9 12.5c.3-1.4 1.3-2.4 2.6-2.6" fill="none" stroke="#FFF8EC" stroke-width="2" stroke-linecap="round"/>`,
  gift: `<rect x="4.5" y="12" width="23" height="6" rx="1.6" fill="#3D8BFF" ${S}/><path d="M6.5 18h19v8.5c0 .8-.7 1.5-1.5 1.5H8c-.8 0-1.5-.7-1.5-1.5z" fill="#3D8BFF" ${S}/><path d="M16 12v16" ${S}/><path d="M16 12c-2-4.5-8-5.5-7.5-2 .3 2 4.5 2 7.5 2zm0 0c2-4.5 8-5.5 7.5-2-.3 2-4.5 2-7.5 2z" fill="#FFD23F" ${S} stroke-width="2"/>`,
  box: `<path d="M4.5 10.5L16 5l11.5 5.5v12L16 28 4.5 22.5z" fill="#9BE564" ${S}/><path d="M4.5 10.5L16 16l11.5-5.5M16 16v12" fill="none" ${S}/><path d="M10 7.8l11.5 5.4" stroke="#1B2A6B" stroke-width="2"/>`,
  envelope: `<rect x="4" y="8" width="24" height="17" rx="3" fill="#FFF8EC" ${S}/><path d="M5 9.5l11 8 11-8" fill="none" ${S}/><circle cx="16" cy="19" r="2.6" fill="#FF6B6B" stroke="#1B2A6B" stroke-width="1.8"/>`,
  nav: `<path d="M27 5L5 14.5l9.5 3 3 9.5z" fill="#4CC9F0" ${S}/>`,
  route: `<circle cx="8" cy="24" r="3.4" fill="#9BE564" ${S}/><path d="M24 14.5s-5-4.7-5-8.2a5 5 0 0110 0c0 3.5-5 8.2-5 8.2z" fill="#FF6B6B" ${S}/><path d="M11 24h6.5a3.5 3.5 0 000-7h-5a3.5 3.5 0 010-7H19" fill="none" ${S} stroke-dasharray="0.1 4.2"/>`,
  chat: `<path d="M16 4.5c6.6 0 12 4.6 12 10.3S22.6 25 16 25c-1.3 0-2.6-.2-3.8-.5L5.5 27.5l1.9-5.3C5.6 20.3 4 17.7 4 14.8 4 9.1 9.4 4.5 16 4.5z" fill="#9BE564" ${S}/><path d="M11 13.5h10M11 17.5h6" ${S}/>`,
  check: `<path d="M7 16.5l6 6L25.5 9.5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M16 7v18M7 16h18" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>`,
  minus: `<path d="M7 16h18" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>`,
  close: `<path d="M9 9l14 14M23 9L9 23" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/>`,
  edit: `<path d="M6 26l1.3-5.4L21 6.9a2.6 2.6 0 013.7 0l.4.4a2.6 2.6 0 010 3.7L11.4 24.7z" fill="#FFD23F" ${S}/><path d="M18.5 9.5l4 4" ${S}/>`,
  skip: `<path d="M6 8l9 8-9 8zM16 8l9 8-9 8z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  shirt: `<path d="M11 4.5L4 9l3 6 3-1.5V27h12V13.5l3 1.5 3-6-7-4.5c-.7 2-2.6 3.3-5 3.3S11.7 6.5 11 4.5z" fill="#4CC9F0" ${S}/>`,
  trophy: `<path d="M10 5h12v6.5a6 6 0 01-12 0z" fill="#FFD23F" ${S}/><path d="M10 7H6c0 4 1.8 6 4.3 6.4M22 7h4c0 4-1.8 6-4.3 6.4" fill="none" ${S}/><path d="M16 17.5V22M11 27h10l-1.2-5h-7.6z" fill="#FFD23F" ${S}/>`
};

export function icon(name, { size = 28, cls = "", label = null } = {}) {
  const body = paths[name] || paths.star;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="ic ${cls}" viewBox="0 0 32 32" width="${size}" height="${size}" ${aria}>${body}</svg>`;
}

/** Cubo isométrico (bloque de esquinas suavizadas) para decoración. */
export function blockSVG(top, left, right, { size = 64, cls = "" } = {}) {
  return `<svg class="${cls}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <path d="M32 6 57 19.5v1.3L32 34.3 7 20.8v-1.3z" fill="${top}" stroke="#1B2A6B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M7 20.8 32 34.3V59L8.8 46.4C7.7 45.8 7 44.7 7 43.4z" fill="${left}" stroke="#1B2A6B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M57 20.8 32 34.3V59l23.2-12.6c1.1-.6 1.8-1.7 1.8-3z" fill="${right}" stroke="#1B2A6B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 20l18-9.6" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/**
 * Avatar plano de bloques (vista frontal) para listas y miniaturas.
 * style: peinado "short" | "long" | "pigtails".
 */
export function flatAvatarSVG({ shirt = "#4CC9F0", head = "#F2C29B", hair = "#5A3A22", pants = "#1B2A6B", style = "short" } = {}, size = 44) {
  const back = style === "long"
    ? `<rect x="4.5" y="3" width="31" height="29" rx="6" fill="${hair}" stroke="#1B2A6B" stroke-width="2.5"/>`
    : style === "pigtails"
      ? `<rect x="1" y="11" width="7" height="13" rx="2.5" fill="${hair}" stroke="#1B2A6B" stroke-width="2.2"/><rect x="32" y="11" width="7" height="13" rx="2.5" fill="${hair}" stroke="#1B2A6B" stroke-width="2.2"/>
         <rect x="5.5" y="10" width="4" height="4" rx="1.2" fill="#FF6B6B" stroke="#1B2A6B" stroke-width="1.6"/><rect x="30.5" y="10" width="4" height="4" rx="1.2" fill="#FF6B6B" stroke="#1B2A6B" stroke-width="1.6"/>`
      : "";
  return `<svg viewBox="0 0 40 48" width="${size}" height="${size * 1.2}" aria-hidden="true">
    ${back}
    <rect x="9" y="30" width="22" height="17" rx="4" fill="${shirt}" stroke="#1B2A6B" stroke-width="2.5"/>
    <rect x="14" y="41" width="12" height="6" fill="${pants}"/>
    <rect x="8" y="3" width="24" height="24" rx="5" fill="${head}" stroke="#1B2A6B" stroke-width="2.5"/>
    <path d="M9.3 11.5V8a3.8 3.8 0 013.8-3.8h13.8A3.8 3.8 0 0130.7 8v3.5h-4.5l-1.5-2-1.5 2z" fill="${hair}"/>
    ${style === "long" ? `<rect x="9.3" y="9" width="2.6" height="17" rx="1" fill="${hair}"/><rect x="28.1" y="9" width="2.6" height="17" rx="1" fill="${hair}"/>` : ""}
    <rect x="13.5" y="14.5" width="3.4" height="4.6" rx="1.2" fill="#1B2A6B"/>
    <rect x="23.1" y="14.5" width="3.4" height="4.6" rx="1.2" fill="#1B2A6B"/>
    <path d="M16.5 22c2 1.6 5 1.6 7 0" fill="none" stroke="#1B2A6B" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}
