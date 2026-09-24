// Íconos SVG originales (24×24), trazo café y rellenos lisos, estilo juguete de madera.
const B = "#5B3A1E";
const S = `stroke="${B}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"`;
const P = {
  flag: `<path d="M6 21V3.5" ${S} fill="none"/><path d="M6 4.5h11l-2.6 3.6L17 11.7H6z" fill="#FF6B6B" ${S}/>`,
  controller: `<path d="M4.5 9.5A2.5 2.5 0 017 7h10a2.5 2.5 0 012.5 2.5l1 6c.3 1.8-1.8 3-3.1 1.7L15 14.8H9l-2.4 2.4c-1.3 1.3-3.4.1-3.1-1.7z" fill="#B388FF" ${S}/><path d="M8 9.8v3.4M6.3 11.5h3.4" ${S}/><circle cx="15.8" cy="10.4" r="1.1" fill="${B}"/><circle cx="17.8" cy="12.5" r="1.1" fill="${B}"/>`,
  cake: `<path d="M3.5 13h17v7.5h-17z" fill="#FF9FCB" ${S}/><path d="M6 9h12v4H6z" fill="#FFF6E5" ${S}/><path d="M12 9V6" ${S}/><path d="M12 2.5c1 1 1 2.1 0 2.8-1-.7-1-1.8 0-2.8z" fill="#FFD23F" ${S} stroke-width="1.3"/>`,
  star: `<path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="#FFD23F" ${S}/>`,
  gift: `<path d="M3.5 9h17v4.5h-17z" fill="#4CC9F0" ${S}/><path d="M5 13.5h14v7H5z" fill="#4CC9F0" ${S}/><path d="M12 9v11.5" ${S}/><path d="M12 9c-1.5-3.4-6-4-5.6-1.4C6.6 9 9.8 9 12 9zm0 0c1.5-3.4 6-4 5.6-1.4-.2 1.4-3.4 1.4-5.6 1.4z" fill="#FFD23F" ${S} stroke-width="1.5"/>`,
  heart: `<path d="M12 20.5S3.5 15.3 3.5 9.3A4.6 4.6 0 0112 6.8a4.6 4.6 0 018.5 2.5c0 6-8.5 11.2-8.5 11.2z" fill="#FF6B6B" ${S}/>`,
  box: `<path d="M3.5 8L12 3.8 20.5 8v8.5L12 20.7 3.5 16.5z" fill="#9BE564" ${S}/><path d="M3.5 8L12 12.2 20.5 8M12 12.2v8.5" fill="none" ${S}/>`,
  envelope: `<rect x="3" y="6" width="18" height="13" rx="2" fill="#FFF6E5" ${S}/><path d="M3.8 7.2L12 13l8.2-5.8" fill="none" ${S}/>`,
  pin: `<path d="M12 21.5s-6.8-6.3-6.8-11.3a6.8 6.8 0 0113.6 0c0 5-6.8 11.3-6.8 11.3z" fill="#FF6B6B" ${S}/><circle cx="12" cy="10.2" r="2.5" fill="#FFF6E5" ${S} stroke-width="1.5"/>`,
  clock: `<circle cx="12" cy="12" r="8.8" fill="#FFF6E5" ${S}/><path d="M12 7v5.5l3.4 2.2" fill="none" ${S}/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="#FFF6E5" ${S}/><path d="M3.5 9.5h17M8 3v4M16 3v4" ${S}/><path d="M12 12.5v5M9.5 15h5" ${S}/>`,
  map: `<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5L15 20.5l-6-2.5-6 2.5z" fill="#9BE564" ${S}/><path d="M9 3.5V18M15 6v14.5" fill="none" ${S}/>`,
  nav: `<path d="M20.5 3.5L3.5 11l7.2 2.3L13 20.5z" fill="#7FD1F7" ${S}/>`,
  info: `<circle cx="12" cy="12" r="9" fill="#FFF6E5" ${S}/><path d="M12 11v6" ${S} stroke-width="2.6"/><circle cx="12" cy="7.6" r="1.5" fill="${B}"/>`,
  island: `<path d="M3 11h18l-2.5 3.5H5.5z" fill="#8BD46E" ${S}/><path d="M5.5 14.5h13l-3 3.5h-7z" fill="#C98E5A" ${S}/><path d="M9.5 18h5l-2.5 3z" fill="#9C8F86" ${S}/><path d="M14.5 11V6.5" ${S}/><path d="M14.5 4.5a2.8 2.8 0 012.8 2.8h-5.6a2.8 2.8 0 012.8-2.8z" fill="#6CC24A" ${S}/><rect x="6.5" y="7.5" width="4" height="3.5" fill="#FF6B6B" ${S} stroke-width="1.5"/>`,
  soundOn: `<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#FFF6E5" ${S}/><path class="w w1" d="M15.2 9.2c1.2 1 1.2 4.6 0 5.6" fill="none" ${S}/><path class="w w2" d="M17.8 7c2.4 2.2 2.4 7.8 0 10" fill="none" ${S}/>`,
  soundOff: `<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#FFF6E5" ${S}/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" ${S}/>`,
  prev: `<path d="M15 5l-7 7 7 7" fill="none" stroke="${B}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  next: `<path d="M9 5l7 7-7 7" fill="none" stroke="${B}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`,
  check: `<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" stroke="${B}" stroke-width="3.2" stroke-linecap="round"/>`,
  minus: `<path d="M5 12h14" stroke="${B}" stroke-width="3.2" stroke-linecap="round"/>`,
  shirt: `<path d="M8.5 3.5L3 7l2.2 4.3 2.3-1.1V20.5h9V10.2l2.3 1.1L21 7l-5.5-3.5c-.5 1.5-1.9 2.5-3.5 2.5S9 5 8.5 3.5z" fill="#7FD1F7" ${S}/>`,
  users: `<rect x="3" y="6" width="7" height="7" rx="1.6" fill="#9BE564" ${S}/><rect x="14" y="6" width="7" height="7" rx="1.6" fill="#FF9FCB" ${S}/><path d="M4 20c0-3 3-5 8-5s8 2 8 5z" fill="#FFD23F" ${S}/>`,
  chat: `<path d="M12 3.5c5 0 9 3.4 9 7.7s-4 7.6-9 7.6c-1 0-2-.1-2.9-.4L4 20.5l1.4-4c-1.4-1.4-2.4-3.2-2.4-5.3 0-4.3 4-7.7 9-7.7z" fill="#9BE564" ${S}/>`,
  replay: `<path d="M5.5 12a6.5 6.5 0 106.5-6.5H8.5" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round"/><path d="M10.5 2.5 7.5 5.5l3 3" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  house: `<path d="M3.5 11 12 4l8.5 7" fill="#FF6B6B" ${S}/><path d="M5.5 10v10.5h13V10" fill="#FFF6E5" ${S}/><path d="M10 20.5v-5.5h4v5.5" fill="#A8683A" ${S}/>`,
  tree: `<path d="M12 21v-6" ${S}/><path d="M12 3.5c4 0 6.5 2.8 6.5 6 0 3.4-2.9 5.5-6.5 5.5S5.5 12.9 5.5 9.5c0-3.2 2.5-6 6.5-6z" fill="#6CC24A" ${S}/><rect x="14" y="7" width="3" height="3" fill="#FF9FCB"/>`,
  chest: `<path d="M3.5 11h17v9.5h-17z" fill="#A8683A" ${S}/><path d="M4.5 11V8a3 3 0 013-3h9a3 3 0 013 3v3" fill="#C98E5A" ${S}/><rect x="10.3" y="10" width="3.4" height="4" rx=".8" fill="#F2C94C" ${S} stroke-width="1.5"/>`,
  wall: `<rect x="3" y="5" width="18" height="15" rx="1.5" fill="#D8CFC4" ${S}/><rect x="5.5" y="8" width="5" height="5" rx="1" fill="#FF9FCB" ${S} stroke-width="1.5"/><rect x="13.5" y="8" width="5" height="5" rx="1" fill="#9BE564" ${S} stroke-width="1.5"/><rect x="9.5" y="14" width="5" height="5" rx="1" fill="#4CC9F0" ${S} stroke-width="1.5"/>`,
  hand: `<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M24 30V9a5 5 0 0110 0v17l3-1a5 5 0 016 3.5l.3 1.2 2.2-.7a5 5 0 016.2 3.6l.3 1 1.6-.4a4.6 4.6 0 015.6 4.3L60 50c0 11-8 19-19 19h-5c-7 0-12-3-16-9L9.5 44a5 5 0 017.6-6.4L24 44z" fill="#FFF6E5" stroke="${B}" stroke-width="3.6" stroke-linejoin="round"/><path d="M34 26v10M45.5 29.5V38M55.5 34.5V40" stroke="${B}" stroke-width="3" stroke-linecap="round"/></svg>`
};

export function icon(name, { size = 24, label = null } = {}) {
  if (name === "hand") return P.hand;
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" ${aria}>${P[name] || P.star}</svg>`;
}
