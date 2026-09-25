/**
 * Trazo central de un texto (sin Three.js), para escribirlo "con un solo trazo de pluma": se dibuja con una fuente
 * redondeada en un canvas, se adelgaza a 1 px (Zhang-Suen + limpieza de esquinas), se recorre como grafo (extremos y
 * cruces), se podan las ramitas cortas del adelgazado y se suavizan los trazos. Devuelve, en coordenadas normalizadas
 * (ancho del canvas = 1, y hacia arriba, centro = 0):
 *   strokes: [{ pts: [[x, y]…] (denso, suave), key: [índices de pts] (extremos, cruces y curvas), closed }]
 *   height: alto aproximado de las letras, stroke: grosor del trazo original (misma escala).
 */
export function sampleStroke(text, { font = "600 200px Fredoka, system-ui, sans-serif", canvasW = 1000, canvasH = 300, keyEps = 0.05, maxSeg = 0.45 } = {}) {
  const W = canvasW, H = canvasH;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d", { willReadFrequently: true });
  let size = parseFloat(font.match(/(\d+)px/)[1]);
  c.font = font;
  while ((c.measureText(text).width > W * 0.92 || size * 1.05 > H * 0.92) && size > 16) { size *= 0.94; c.font = font.replace(/\d+px/, `${Math.round(size)}px`); }
  c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff";
  c.fillText(text, W / 2, H / 2);
  const data = c.getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) m[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  // grosor del trazo: doble de la distancia media al borde (aprox. por conteo de área / largo del esqueleto, abajo)
  let area = 0; for (let i = 0; i < W * H; i++) area += m[i];
  // --- Zhang-Suen
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : m[y * W + x]);
  // (sólo se recorren los píxeles encendidos, sin crear arreglos por píxel: rápido también en el teléfono)
  for (let y = 0; y < H; y++) { m[y * W] = 0; m[y * W + W - 1] = 0; }
  for (let x = 0; x < W; x++) { m[x] = 0; m[(H - 1) * W + x] = 0; }
  let live = []; for (let i = 0; i < W * H; i++) if (m[i]) live.push(i);
  const P = new Uint8Array(8), del = [];
  for (let changed = true, it = 0; changed && it < 200; it++) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      del.length = 0;
      for (const i of live) {
        if (!m[i]) continue;
        P[0] = m[i - W]; P[1] = m[i - W + 1]; P[2] = m[i + 1]; P[3] = m[i + W + 1]; P[4] = m[i + W]; P[5] = m[i + W - 1]; P[6] = m[i - 1]; P[7] = m[i - W - 1];
        const B = P[0] + P[1] + P[2] + P[3] + P[4] + P[5] + P[6] + P[7];
        if (B < 2 || B > 6) continue;
        let A = 0; for (let k = 0; k < 8; k++) if (!P[k] && P[(k + 1) & 7]) A++;
        if (A !== 1) continue;
        if (step === 0 ? P[0] * P[2] * P[4] || P[2] * P[4] * P[6] : P[0] * P[2] * P[6] || P[0] * P[4] * P[6]) continue;
        del.push(i);
      }
      if (del.length) { changed = true; for (const i of del) m[i] = 0; }
    }
    live = live.filter((i) => m[i]);
  }
  // --- esqueleto mínimo 8-conexo: quita píxeles redundantes (esquinas en escalera) sin romper la conexión
  const OFF = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const nbrs = (x, y) => OFF.filter(([dx, dy]) => at(x + dx, y + dy)).map(([dx, dy]) => [x + dx, y + dy]);
  const oneGroup = (ps) => { // ¿los vecinos forman un solo grupo 8-conexo entre ellos?
    const seen = new Set([0]), st = [0];
    while (st.length) { const a = st.pop(); ps.forEach((q, j) => { if (!seen.has(j) && Math.abs(q[0] - ps[a][0]) <= 1 && Math.abs(q[1] - ps[a][1]) <= 1) { seen.add(j); st.push(j); } }); }
    return seen.size === ps.length;
  };
  for (let changed = true, it = 0; changed && it < 20; it++) {
    changed = false;
    for (const i of live) {
      if (!m[i]) continue;
      const x = i % W, y = (i - x) / W, ns = nbrs(x, y);
      if (ns.length >= 2 && ns.length <= 3 && oneGroup(ns)) { m[i] = 0; changed = true; }
    }
  }
  live = live.filter((i) => m[i]);
  const skel = live.length;
  const strokeW = skel ? area / skel : 20;
  // --- grafo: nodos = extremos (1 vecino) y cruces (≥ 3); cadenas entre nodos; lazos cerrados sin nodos
  const deg = (x, y) => nbrs(x, y).length;
  const key = (x, y) => y * W + x, used = new Set(), chains = [];
  const edgeK = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const isNode = (x, y) => deg(x, y) !== 2;
  const walk = (x0, y0, x1, y1) => {
    const ch = [[x0, y0]]; let px = x0, py = y0, x = x1, y = y1;
    used.add(edgeK(key(px, py), key(x, y)));
    for (let guard = 0; guard < W * H; guard++) {
      ch.push([x, y]);
      if (isNode(x, y) || (x === x0 && y === y0)) break;
      const nx = nbrs(x, y).find(([qx, qy]) => !(qx === px && qy === py) && !used.has(edgeK(key(x, y), key(qx, qy))));
      if (!nx) break;
      used.add(edgeK(key(x, y), key(nx[0], nx[1]))); px = x; py = y; x = nx[0]; y = nx[1];
    }
    return ch;
  };
  for (const i of live) {
    const x = i % W, y = (i - x) / W;
    if (!isNode(x, y)) continue;
    for (const [qx, qy] of nbrs(x, y)) if (!used.has(edgeK(key(x, y), key(qx, qy)))) chains.push(walk(x, y, qx, qy));
  }
  for (const i of live) { // lazos (la "o", el "8" sin cruce)
    const x = i % W, y = (i - x) / W;
    if (isNode(x, y)) continue;
    const n0 = nbrs(x, y).find(([qx, qy]) => !used.has(edgeK(key(x, y), key(qx, qy))));
    if (n0) chains.push(walk(x, y, n0[0], n0[1]));
  }
  // --- nodos agrupados (cruces de varios píxeles → un solo punto) y poda de ramitas del adelgazado
  const snap = Math.max(3, strokeW * 0.35), spur = strokeW * 0.75;
  let C = chains.filter((ch) => ch.length > 1).map((ch) => ({ pts: ch.map(([x, y]) => [x, y]) }));
  const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  // puntos (de la "i", la "j", signos): el adelgazado los deja como un píxel suelto o un trazo diminuto aislado
  const dots = [];
  for (const i of live) { const x = i % W, y = (i - x) / W; if (!deg(x, y)) dots.push([x, y]); }
  C = C.filter((ch) => {
    const a = ch.pts[0], b = ch.pts[ch.pts.length - 1];
    const lone = (p) => !C.some((o) => o !== ch && [o.pts[0], o.pts[o.pts.length - 1]].some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < snap));
    if (len(ch.pts) < strokeW * 1.1 && lone(a) && lone(b)) { dots.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return false; }
    return true;
  });
  const ends = () => { // agrupa extremos cercanos: id de grupo por extremo
    const E = []; C.forEach((ch, i) => { E.push({ i, s: 0, p: ch.pts[0] }, { i, s: 1, p: ch.pts[ch.pts.length - 1] }); });
    const grp = E.map((_, k) => k), find = (k) => (grp[k] === k ? k : (grp[k] = find(grp[k])));
    for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) if (Math.hypot(E[a].p[0] - E[b].p[0], E[a].p[1] - E[b].p[1]) < snap) grp[find(a)] = find(b);
    const count = new Map(); E.forEach((e, k) => { const g = find(k); e.g = g; count.set(g, (count.get(g) || 0) + 1); });
    E.forEach((e) => (e.n = count.get(e.g)));
    return E;
  };
  for (let pass = 0; pass < 4; pass++) { // poda: tramo con un extremo libre (n = 1) y el otro en un cruce, corto
    const E = ends(), drop = new Set();
    C.forEach((ch, i) => { const a = E[i * 2], b = E[i * 2 + 1]; if (((a.n === 1 && b.n >= 3) || (b.n === 1 && a.n >= 3)) && len(ch.pts) < spur) drop.add(i); });
    if (!drop.size) break;
    C = C.filter((_, i) => !drop.has(i));
  }
  for (let pass = 0; pass < 50; pass++) { // une tramos que quedaron encadenados (grupo con exactamente 2 extremos)
    const E = ends(); let merged = false;
    for (let k = 0; k < E.length && !merged; k++) {
      if (E[k].n !== 2) continue;
      const o = E.findIndex((e, j) => j !== k && e.g === E[k].g);
      if (o < 0 || E[o].i === E[k].i) continue;
      const A = C[E[k].i].pts, B = C[E[o].i].pts;
      const a = E[k].s === 1 ? A : A.slice().reverse(), b = E[o].s === 0 ? B : B.slice().reverse();
      C[E[k].i].pts = a.concat(b.slice(1)); C.splice(E[o].i, 1); merged = true;
    }
    if (!merged) break;
  }
  // extremos de un mismo grupo → mismo punto (el centro del grupo): las estrellas de los cruces coinciden
  { const E = ends(), cen = new Map(); E.forEach((e) => { const s = cen.get(e.g) || [0, 0, 0]; s[0] += e.p[0]; s[1] += e.p[1]; s[2]++; cen.set(e.g, s); });
    E.forEach((e) => { const s = cen.get(e.g), p = [s[0] / s[2], s[1] / s[2]], pts = C[e.i].pts; if (e.s === 0) pts[0] = p; else pts[pts.length - 1] = p; }); }
  // --- suavizado (media móvil, extremos fijos) y remuestreo uniforme
  const smoothPts = (pts, closed) => {
    let q = pts.map((p) => p.slice());
    for (let r = 0; r < 3; r++) q = q.map((p, i) => { if (!closed && (i === 0 || i === q.length - 1)) return p; const a = q[(i - 1 + q.length) % q.length], b = q[(i + 1) % q.length]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4]; });
    return q;
  };
  const resample = (pts, step) => {
    const out = [pts[0]]; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      let [ax, ay] = pts[i - 1]; const [bx, by] = pts[i]; let d = Math.hypot(bx - ax, by - ay);
      while (acc + d >= step) { const k = (step - acc) / d; ax += (bx - ax) * k; ay += (by - ay) * k; out.push([ax, ay]); d = Math.hypot(bx - ax, by - ay); acc = 0; }
      acc += d;
    }
    const last = pts[pts.length - 1]; if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > step * 0.3) out.push(last); else out[out.length - 1] = last;
    return out;
  };
  // alto de las letras (para la tolerancia de las estrellas clave)
  let y0 = H, y1 = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 110) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const textH = Math.max(1, y1 - y0);
  const rdp = (pts, a, b, eps, out) => { // Ramer-Douglas-Peucker → índices clave
    let best = -1, bd = 0; const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > bd) { bd = d; best = i; } }
    if (bd > eps && best > 0) { rdp(pts, a, best, eps, out); out.push(best); rdp(pts, best, b, eps, out); }
  };
  const strokes = C.map((ch) => {
    const closed = ch.pts.length > 4 && Math.hypot(ch.pts[0][0] - ch.pts[ch.pts.length - 1][0], ch.pts[0][1] - ch.pts[ch.pts.length - 1][1]) < snap;
    // suavizado fuerte (el esqueleto en píxeles tiene escalones): remuestreo grueso → suaviza → remuestreo fino
    let q = resample(smoothPts(ch.pts, closed), Math.max(2, strokeW * 0.3));
    for (let r = 0; r < 2; r++) q = smoothPts(q, closed);
    const pts = resample(q, Math.max(2, strokeW * 0.25));
    const k = [0]; rdp(pts, 0, pts.length - 1, textH * keyEps, k); k.push(pts.length - 1);
    // tramos largos: estrella intermedia (una constelación no tiene líneas larguísimas)
    const K = [];
    k.sort((a, b) => a - b).forEach((idx, j) => {
      if (j) { const prev = K[K.length - 1], d = len(pts.slice(prev, idx + 1)), n = Math.floor(d / (textH * maxSeg)); for (let s = 1; s <= n; s++) K.push(Math.round(prev + ((idx - prev) * s) / (n + 1))); }
      K.push(idx);
    });
    return { pts, key: [...new Set(K)], closed };
  }).filter((s) => s.pts.length > 1 && len(s.pts) > strokeW * 0.6);
  dots.forEach((p) => strokes.push({ pts: [p], key: [0], closed: false, dot: true }));
  // orden de escritura: de izquierda a derecha (cada trazo empieza por su extremo más a la izquierda)
  strokes.forEach((s) => { if (!s.closed && s.pts[0][0] > s.pts[s.pts.length - 1][0]) { s.pts.reverse(); s.key = s.key.map((i) => s.pts.length - 1 - i).reverse(); } });
  strokes.sort((a, b) => Math.min(...a.pts.map((p) => p[0])) - Math.min(...b.pts.map((p) => p[0])));
  const N = ([x, y]) => [(x - W / 2) / W, -(y - H / 2) / W];
  strokes.forEach((s) => { s.pts = s.pts.map(N); });
  return { strokes, height: textH / W, stroke: strokeW / W };
}

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
