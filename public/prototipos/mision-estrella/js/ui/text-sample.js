// Muestreo del contorno de un texto (sin Three.js): se dibuja en un canvas fuera de pantalla, se toman puntos del
// borde espaciados y se encadenan por vecino más cercano en polilíneas limpias. Lo usan la constelación 3D y la
// constelación SVG de la versión ilustrada. Coordenadas normalizadas (ancho del canvas = 1, y hacia arriba).
export function sampleText(text, { font = "600 300px Fredoka, system-ui, sans-serif", spacing = 11, canvasW = 900, canvasH = 360 } = {}) {
  const cv = document.createElement("canvas"); cv.width = canvasW; cv.height = canvasH;
  const c = cv.getContext("2d", { willReadFrequently: true });
  let size = parseFloat(font.match(/(\d+)px/)[1]);
  c.font = font;
  while (c.measureText(text).width > canvasW * 0.94 && size > 20) { size *= 0.92; c.font = font.replace(/\d+px/, `${Math.round(size)}px`); }
  c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff";
  c.fillText(text, canvasW / 2, canvasH / 2);
  const data = c.getImageData(0, 0, canvasW, canvasH).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < canvasW && y < canvasH && data[(y * canvasW + x) * 4 + 3] > 128;
  const edge = [];
  for (let y = 1; y < canvasH - 1; y++) for (let x = 1; x < canvasW - 1; x++) if (on(x, y) && (!on(x + 1, y) || !on(x - 1, y) || !on(x, y + 1) || !on(x, y - 1))) edge.push([x, y]);
  const grid = new Map(), pts = [];
  for (const [x, y] of edge) {
    const gx = Math.floor(x / spacing), gy = Math.floor(y / spacing);
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) for (const [px, py] of grid.get(`${gx + dx},${gy + dy}`) || []) if (Math.hypot(px - x, py - y) < spacing) { ok = false; break; }
    if (!ok) continue;
    const k = `${gx},${gy}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push([x, y]); pts.push([x, y]);
  }
  const used = new Uint8Array(pts.length), lines = [], maxJump = spacing * 2.3;
  for (;;) {
    let start = -1;
    for (let i = 0; i < pts.length; i++) if (!used[i] && (start < 0 || pts[i][0] < pts[start][0])) start = i;
    if (start < 0) break;
    const line = [start]; used[start] = 1;
    let cur = start;
    for (;;) {
      let best = -1, bd = Infinity;
      for (let i = 0; i < pts.length; i++) { if (used[i]) continue; const d = Math.hypot(pts[i][0] - pts[cur][0], pts[i][1] - pts[cur][1]); if (d < bd) { bd = d; best = i; } }
      if (best < 0 || bd > maxJump) break;
      used[best] = 1; line.push(best); cur = best;
    }
    if (line.length > 3 && Math.hypot(pts[line[0]][0] - pts[cur][0], pts[line[0]][1] - pts[cur][1]) < maxJump) line.push(line[0]);
    if (line.length > 1) lines.push(line);
  }
  return { points: pts.map(([x, y]) => [(x - canvasW / 2) / canvasW, -(y - canvasH / 2) / canvasW]), lines };
}
