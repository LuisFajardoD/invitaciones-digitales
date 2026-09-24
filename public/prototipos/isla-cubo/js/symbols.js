// Símbolos de los bloques del muro (SVG 24×24). Se usan en la interfaz (SVG) y en el 3D (Path2D en canvas).
export const SYMBOLS = {
  heart: { name: "Corazón", d: "M12 21s-8.5-5.3-8.5-11.2A4.7 4.7 0 0112 7.1a4.7 4.7 0 018.5 2.7C20.5 15.7 12 21 12 21z" },
  star: { name: "Estrella", d: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" },
  bolt: { name: "Rayo", d: "M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" },
  ball: { name: "Balón", d: "M12 2.5a9.5 9.5 0 110 19 9.5 9.5 0 010-19zm0 4.2l-3.6 2.6 1.4 4.2h4.4l1.4-4.2zM4.6 9.6l2.2 1.6M19.4 9.6l-2.2 1.6M8.5 19.2l1.2-4.4M15.5 19.2l-1.2-4.4" },
  flower: { name: "Flor", d: "M12 8.2a3 3 0 110-.01zM12 2.5a3 3 0 013 3c0 1-.5 1.9-1.2 2.4A3 3 0 0118.5 9a3 3 0 01-1.5 5.6 3 3 0 01-1.4 4.9A3 3 0 0112 18a3 3 0 01-3.6 1.5 3 3 0 01-1.4-4.9A3 3 0 015.5 9a3 3 0 014.7-1.1A3 3 0 019 5.5a3 3 0 013-3z" },
  paw: { name: "Huella", d: "M12 12.5c3 0 5.5 2.6 5.5 4.8 0 1.8-1.4 2.7-3 2.7-1 0-1.7-.5-2.5-.5s-1.5.5-2.5.5c-1.6 0-3-.9-3-2.7 0-2.2 2.5-4.8 5.5-4.8zM6.2 7.5a2 2.3 0 110 4.6 2 2.3 0 010-4.6zM17.8 7.5a2 2.3 0 110 4.6 2 2.3 0 010-4.6zM9.6 3.5a2 2.4 0 110 4.8 2 2.4 0 010-4.8zM14.4 3.5a2 2.4 0 110 4.8 2 2.4 0 010-4.8z" }
};
export const SYMBOL_KEYS = Object.keys(SYMBOLS);
export const BLOCK_COLORS = [
  { color: "#FF6B6B", name: "Rojo" },
  { color: "#9BE564", name: "Lima" },
  { color: "#B388FF", name: "Lila" },
  { color: "#FFD23F", name: "Amarillo" },
  { color: "#4CC9F0", name: "Cielo" },
  { color: "#FF9FCB", name: "Rosa pastel" }
];

export function symbolSVG(key, { size = 24, fill = "#FFFFFF", stroke = "#5B3A1E" } = {}) {
  const s = SYMBOLS[key] || SYMBOLS.star;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${s.d}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd"/></svg>`;
}
