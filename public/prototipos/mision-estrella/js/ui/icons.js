// Íconos SVG propios (trazo redondeado, color heredado con currentColor).
const P = {
  log: '<path d="M6 3.5h10.5A2.5 2.5 0 0119 6v14.5H7.5A1.5 1.5 0 016 19z"/><path d="M6 17.5h13"/><path d="M12.5 7.2l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke-width="1"/>',
  soundOn: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 010 5M17.8 7.2a7 7 0 010 9.6"/>',
  soundOff: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 10l4 4M20 10l-4 4"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  map: '<path d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  nav: '<path d="M4 11.2L20 4l-7.2 16-2-6.8z"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7a3 3 0 000-6H9a3 3 0 010-6h7"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="2.5"/><path d="M3.5 13h17M12 9v11.5M12 9C9.2 9 7.5 7.6 8.4 6.2 9.4 4.8 12 6.4 12 9c0-2.6 2.6-4.2 3.6-2.8.9 1.4-.8 2.8-3.6 2.8"/>',
  photo: '<rect x="3.5" y="5.5" width="17" height="13.5" rx="3"/><circle cx="9" cy="10.5" r="1.8"/><path d="M5 17.5l4.5-4.5 3 3 2.5-2.5 4 4"/>',
  checklist: '<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><path d="M4 6.5l1.2 1.2L7.4 5.4M4 12l1.2 1.2 2.2-2.3M4 17.5l1.2 1.2 2.2-2.3"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.2M12 16.8v.2"/>',
  broadcast: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.6 5.6 0 000 8M16 8a5.6 5.6 0 010 8M5.2 5.2a9.6 9.6 0 000 13.6M18.8 5.2a9.6 9.6 0 010 13.6"/>',
  bed: '<path d="M3.5 18.5V6.5M3.5 14.5h17v4M20.5 14.5v-2.5a3 3 0 00-3-3h-7v5.5"/><circle cx="7" cy="11.2" r="1.8"/>',
  chat: '<path d="M4.5 18.5l1.1-3.4A7.6 7.6 0 1112 19.6a7.6 7.6 0 01-3.6-.9z"/>',
  rocket: '<path d="M12 3c3 2.3 4.5 5.7 4.5 9.4v3.4l2 2.2v2.3l-3.4-1.4H8.9L5.5 20.3V18l2-2.2v-3.4C7.5 8.7 9 5.3 12 3z"/><circle cx="12" cy="10" r="1.8"/>',
  replay: '<path d="M4.5 12a7.5 7.5 0 107.5-7.5H9"/><path d="M11 2L8.3 4.5 11 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  edit: '<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="M13 7l4 4"/>',
  send: '<path d="M4 11.5L20 4l-5.5 16-3-6.5z"/><path d="M11.5 13.5L20 4"/>',
  shirt: '<path d="M8.5 3.5l3.5 2 3.5-2 5 4-3 3-2-1.2v11.2h-7V9.3l-2 1.2-3-3z"/>',
  star: '<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
  chevronDown: '<path d="M6 9.5l6 6 6-6"/>',
  whatsapp: '<path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1112 19.8a7.8 7.8 0 01-3.8-1z"/><path d="M9.2 8.6c.2-.5.6-.5.9-.5l.6 1.4-.6.9c.5 1.1 1.4 2 2.5 2.5l.9-.6 1.4.6c0 .3 0 .7-.5.9-1 .5-2.6.1-4-1.3s-1.8-3-1.2-3.9z" fill="currentColor" stroke-width="1"/>'
};
export function icon(name, { size = 22, sw = 2 } = {}) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`;
}
