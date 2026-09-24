// Versión sin WebGL: isla isométrica ilustrada en SVG con las mismas 7 construcciones.
// Implementa la misma API que world/world.js para que la interfaz, el recorrido y la confirmación sean idénticos.
import { textBlocks, cleanMonumentText } from "./world/font3d.js";
import { SYMBOLS } from "./symbols.js";
import { h, rng, clamp, prefersReduced, sleep, mixHex } from "./util.js";

const B = "#5B3A1E";
const SKY = {
  dawn: ["#FFD6A5", "#A0D8F1", 0], morning: ["#A8DDF6", "#E9F6FF", 0], noon: ["#7FD1F7", "#DFF4FF", 0], afternoon: ["#8FD3F2", "#F6EBCF", 0],
  golden: ["#FFC36B", "#FDE3B8", 0], sunset: ["#FF9E6B", "#B388FF", 0], pink: ["#FF9FCB", "#B388FF", 0.1], night: ["#1B2A6B", "#0B1238", 1]
};
const S = 20; // tamaño del cubo isométrico
const iso = (x, y, z) => [400 + (x - z) * S * 0.87, 360 + (x + z) * S * 0.5 - y * S];
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

export async function createFallbackWorld({ container, skyEl, starsEl, frameEl, data, audio, onProgress = () => {} }) {
  onProgress(0.3);
  const R = rng(20261114);
  const accent = data.island.favoriteColor;
  const cubes = [];
  const add = (x, y, z, c, stop = -1, extra = "") => cubes.push({ x, y, z, c, stop, extra });

  /* ---------- Isla ---------- */
  const radiusAt = (a) => 9.2 + 0.9 * Math.sin(3 * a + 0.4) + 0.5 * Math.sin(5 * a + 1.3);
  // La torre va al frente-izquierda: en isométrico, cualquier cosa a la derecha del monumento queda bajo el nombre
  const L = { monument: [0, -6], house: [-5, 3], tower: [-3, 7], tree: [-7, -3], chest: [6, 5], wall: [0, 0], fall: [8, 2] };
  const isPath = (x, z) => (x === 0 || x === 1) && z >= 2 && z <= 8;
  const isSand = (x, z) => Math.hypot(x - L.chest[0], z - L.chest[1]) < 2.4;
  const isWater = (x, z) => z === 2 && x >= 4 && x <= 8;
  for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) {
    const r = Math.hypot(x, z);
    if (r > radiusAt(Math.atan2(z, x))) continue;
    const depth = Math.round(2 + (1 - r / 10) * 6 + (R() - 0.5));
    const top = isWater(x, z) ? -1 : Math.hypot(x, (z + 6) * 1.4) < 3 ? 1 : 0;
    for (let y = -depth; y <= top; y++) {
      const c = y === top ? (isSand(x, z) ? "#F4DDA4" : isPath(x, z) ? "#D8CFC4" : R() < 0.2 ? "#7CC862" : "#8BD46E") : y > top - 2 ? "#C98E5A" : "#9C8F86";
      add(x, y, z, c);
    }
    if (isWater(x, z)) add(x, 0, z, "#5FD3E6", -1, "water");
  }
  for (let y = -1; y >= -6; y--) add(L.fall[0] + 1, y, 2, "#5FD3E6", 5, "water");
  onProgress(0.5);

  /* ---------- Construcciones ---------- */
  // 1. Monumento: letras blanco crema y "8" amarillo pastel sobre pedestal de piedra oscura
  const DARK = "#4A3F3A";
  const tb = textBlocks(cleanMonumentText(data.island.monumentText));
  const ms = Math.min(0.5, 8 / tb.width);
  const es = Math.min(0.62, ms * 1.45);
  const mz = L.monument[1];
  const nameW = tb.width * ms, x0 = -(nameW + 0.6 + 5 * es) / 2;
  const mText = tb.blocks.map((b) => ({ x: x0 + b.x * ms, y: 2.6 + b.y * ms, z: mz + 0.5 }));
  const eightB = textBlocks("8").blocks.map((b) => ({ x: x0 + nameW + 0.6 + b.x * es, y: 2.6 + b.y * es, z: mz + 0.5 }));
  const pl = Math.floor(x0) - 1, pr = Math.ceil(x0 + nameW + 0.6 + 5 * es) + 1;
  const wallTop = Math.max(3, Math.floor(2.6 + 7 * ms - 1.2));
  for (let x = pl; x <= pr; x++) {
    add(x, 2, mz, DARK, 0); add(x, 2, mz + 1, DARK, 0);
    for (let y = 3; y <= wallTop; y++) add(x, y, mz - 1, y === wallTop ? accent : DARK, 0);
  }
  // 2. Casa
  const [hx, hz] = L.house;
  for (let x = hx - 1; x <= hx + 1; x++) for (let z = hz - 1; z <= hz + 1; z++) for (let y = 1; y <= 2; y++) {
    const win = y === 2 && ((z === hz + 1 && x === hx + 1) || (x === hx + 1 && z === hz));
    add(x, y, z, win ? "#FFE9A8" : "#FFF6E5", 1, win ? "glow" : "");
  }
  for (let x = hx - 2; x <= hx + 2; x++) for (let z = hz - 2; z <= hz + 2; z++) add(x, 3, z, (x + z) % 2 ? "#FF6B6B" : "#E4574C", 1);
  for (let x = hx - 1; x <= hx + 1; x++) add(x, 2.5, hz + 2, x % 2 ? "#FF6B6B" : "#FFF6E5", 1);
  add(hx - 2.5, 4.5, hz + 2, "#FFD23F", 1); add(hx + 2.5, 4.2, hz + 2, "#B388FF", 1);
  // 3. Torre
  const [tx, tz] = L.tower;
  for (let y = 1; y <= 7; y++) for (let x = tx; x <= tx + 1; x++) for (let z = tz; z <= tz + 1; z++) add(x, y, z, y === 6 ? "#FFD23F" : y % 2 ? "#D8CFC4" : "#C4B8AC", 2);
  for (let x = tx - 0.5; x <= tx + 1.5; x += 1) for (let z = tz - 0.5; z <= tz + 1.5; z += 1) add(x, 8, z, "#E4574C", 2);
  add(tx + 0.5, 9, tz + 0.5, "#FFD23F", 2);
  // 4. Sendero: banderines
  const flags = [[2, 8], [2, 6], [-1, 4], [-1, 2]];
  flags.forEach(([x, z], i) => { add(x, 1, z, "#7A4A26", 3, `flag f${i}`); add(x, 2, z, "#7A4A26", 3, `flag f${i}`); add(x + 0.5, 2.5, z, i % 2 ? accent : "#FF6B6B", 3, `flag f${i}`); });
  // 5. Árbol
  const [ex, ez] = L.tree;
  for (let y = 1; y <= 3; y++) add(ex, y, ez, "#A8683A", 4);
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) for (let y = 4; y <= 6; y++) if (Math.hypot(x, z, (y - 5) * 1.3) < 2.4) add(ex + x, y, ez + z, R() < 0.1 ? "#FF9FCB" : R() < 0.3 ? "#58B447" : "#6CC24A", 4);
  // 6. Cofre
  const [cx, cz] = L.chest;
  add(cx, 1, cz, "#A8683A", 5); add(cx + 1, 1, cz, "#FFD23F", 5);
  add(cx, 2, cz, "#7A4A26", 5, "lid"); add(cx + 1, 2, cz, "#FFD23F", 5, "lid");
  // 7. Muro y portal
  for (let x = -3; x <= 3; x++) for (let y = 1; y <= 2; y++) add(x, y, 0, x === -3 || x === 3 ? "#A8683A" : (x + y) % 2 ? "#D8CFC4" : "#C4B8AC", 6);
  for (let y = 1; y <= 4; y++) { add(4, y, -1, y % 2 ? accent : "#B388FF", 6); add(6, y, -1, y % 2 ? accent : "#B388FF", 6); }
  for (let x = 4; x <= 6; x++) add(x, 5, -1, x % 2 ? accent : "#B388FF", 6);
  // Faroles
  [[-2, 6], [3, 4], [-4, 0]].forEach(([x, z]) => { add(x, 1, z, "#7A4A26", 3); add(x, 2, z, "#FFE08A", 3, "glow"); });
  onProgress(0.7);

  /* ---------- Render SVG (orden del pintor) ---------- */
  // Colores por cara: superior / frontal (+z, polígono izquierdo) / lateral (+x, polígono derecho)
  const LETTER = { top: "#FFFFFF", left: "#FFF6E5", right: "#E8DCC4" };
  const EIGHT = { top: "#FFF1A8", left: "#FFE68A", right: "#F2C94C" };
  const allCubes = [...cubes];
  // En isométrico el texto quedaría en diagonal e ilegible: el nombre se dibuja como letrero de bloques
  // de frente (cara frontal + canto superior y lateral) sobre el pedestal, con los mismos colores por cara.
  const signBlocks = (() => {
    const [ax, ay] = iso(0, 3.1, mz);
    const bs = Math.min(10, 230 / (tb.width + 1.5 + 5 * 1.45)); // tamaño del bloque en px
    const eb = bs * 1.45;
    const totalPx = tb.width * bs + bs * 1.5 + 5 * eb;
    const left = ax - totalPx / 2;
    const d = Math.max(2, bs * 0.28); // canto que da volumen
    const block = (x, y, s, f, delay) => `<g class="sb" style="--d:${delay}s"><polygon points="${x},${y} ${x + d},${y - d} ${x + s + d},${y - d} ${x + s},${y}" fill="${f.top}"/><polygon points="${x + s},${y} ${x + s + d},${y - d} ${x + s + d},${y + s - d} ${x + s},${y + s}" fill="${f.right}"/><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${f.left}"/></g>`;
    let out = "";
    tb.blocks.forEach((b, i) => { out += block(left + b.x * bs, ay - (b.y + 1) * bs, bs, LETTER, (i / tb.blocks.length).toFixed(2)); });
    textBlocks("8").blocks.forEach((b, i) => { out += block(left + tb.width * bs + bs * 1.5 + b.x * eb, ay - (b.y + 1) * eb, eb, EIGHT, (1 + i / 40).toFixed(2)); });
    return { svg: out, top: ay - 7 * eb, bottom: ay, cx: ax, width: totalPx };
  })();
  allCubes.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y || a.x - b.x);
  const minY = Math.min(...allCubes.map((c) => c.y));
  const poly = (c) => {
    const s = (c.s || 1) * S;
    const [px, py] = iso(c.x, c.y, c.z);
    const w = s * 0.87, hh = s * 0.5;
    const top = `${px},${py - hh} ${px + w},${py} ${px},${py + hh} ${px - w},${py}`;
    const left = `${px - w},${py} ${px},${py + hh} ${px},${py + hh + s} ${px - w},${py + s}`;
    const right = `${px + w},${py} ${px},${py + hh} ${px},${py + hh + s} ${px + w},${py + s}`;
    const d = ((c.y - minY) / 14).toFixed(2);
    const f = c.faces || { top: shade(c.c, 1.08), left: shade(c.c, 0.86), right: shade(c.c, 0.7) };
    return `<g class="c ${c.extra}"${c.stop >= 0 ? ` data-stop="${c.stop}"` : ""} style="--d:${d}s"><polygon points="${top}" fill="${f.top}"/><polygon points="${left}" fill="${f.left}"/><polygon points="${right}" fill="${f.right}"/></g>`;
  };
  const svgNS = "http://www.w3.org/2000/svg";
  const dogSvg = `<g class="fb-dog" data-dog="1"><g class="fb-dog-body"><rect x="-12" y="-10" width="22" height="10" rx="2" fill="#D9A066" stroke="${B}" stroke-width="1.5"/><rect x="6" y="-18" width="10" height="10" rx="2" fill="#D9A066" stroke="${B}" stroke-width="1.5"/><rect x="-10" y="0" width="4" height="5" fill="#C98A52"/><rect x="4" y="0" width="4" height="5" fill="#C98A52"/><rect x="13" y="-14" width="3" height="3" fill="${B}"/><rect x="-16" y="-14" width="4" height="6" fill="#D9A066" stroke="${B}" stroke-width="1"/></g></g>`;
  const svg = `<svg class="fb-svg" viewBox="0 0 800 800" xmlns="${svgNS}" aria-hidden="true">
    <g class="fb-shadow"><ellipse cx="400" cy="640" rx="210" ry="40" fill="rgba(58,36,16,.12)"/></g>
    <g class="fb-cubes" stroke="rgba(91,58,30,.35)" stroke-width="1" stroke-linejoin="round">${allCubes.map(poly).join("")}</g>
    <g class="fb-sign" data-stop="0" stroke="rgba(91,58,30,.45)" stroke-width=".8" stroke-linejoin="round">${signBlocks.svg}</g>
    <g class="fb-days" transform="translate(${iso(tx + 2, 3.2, tz + 1)[0]} ${iso(tx + 2, 3.2, tz + 1)[1]})"><rect x="-26" y="-18" width="52" height="30" rx="4" fill="#A8683A" stroke="${B}" stroke-width="2"/><text class="fb-days-t" x="0" y="5" text-anchor="middle" font-family="Bungee, sans-serif" font-size="17" fill="#FFF6E5">00</text></g>
    <g class="fb-guests"></g>
    <g class="fb-dogwrap" transform="translate(${iso(hx + 1, 1, hz + 3)[0]} ${iso(hx + 1, 1, hz + 3)[1]})">${dogSvg}</g>
  </svg>`;
  const cam = h("div.fb-cam", { html: svg });
  const fx = h("div.fb-fx");
  container.append(cam, fx);
  const svgEl = cam.firstElementChild;
  const style = h("style", { text: `
    .fb-cam { position: absolute; left: 0; top: 0; width: 800px; height: 800px; transform-origin: 0 0; transition: transform 1.1s cubic-bezier(.22,.8,.24,1); }
    .fb-cam.no-anim { transition: none; }
    .fb-svg { width: 100%; height: 100%; overflow: visible; }
    .fb-cubes .c { transform-box: fill-box; }
    .fb-building .fb-cubes .c { animation: fb-drop .5s var(--d) cubic-bezier(.34,1.56,.64,1) both; }
    .fb-building .fb-cubes .c.mono { animation-delay: calc(var(--d) + 1.2s); }
    @keyframes fb-drop { from { opacity: 0; transform: translateY(-140px); } }
    .fb-undo .fb-cubes .c, .fb-undo .fb-sign .sb { animation: fb-up .8s calc(var(--d) * .3) ease-in both; }
    @keyframes fb-up { to { opacity: 0; transform: translateY(-160px); } }
    .fb-sign .sb { transform-box: fill-box; transform-origin: center; }
    .fb-building .fb-sign .sb, .fb-mono-hidden .fb-sign .sb { opacity: 0; }
    .fb-mono .fb-sign .sb { animation: fb-pop .45s cubic-bezier(.34,1.56,.64,1) both; animation-delay: var(--d); }
    .fb-night .fb-sign { filter: drop-shadow(0 0 3px rgba(255, 214, 140, .8)); }
    @keyframes fb-pop { from { opacity: 0; transform: scale(0); } }
    .fb-night .glow polygon { fill: #FFD66B; filter: drop-shadow(0 0 6px #FFB84D); }
    .fb-night .water polygon { fill: #7FE7FF; }
    .fb-flags .flag { animation: fb-drop .5s cubic-bezier(.34,1.56,.64,1) both; }
    .fb-flags .f1 { animation-delay: .35s; } .fb-flags .f2 { animation-delay: .7s; } .fb-flags .f3 { animation-delay: 1.05s; }
    .fb-chest .lid { transform: translate(6px, -14px) rotate(-18deg); transition: transform .5s cubic-bezier(.34,1.56,.64,1); }
    .fb-dog { animation: fb-walk 9s ease-in-out infinite alternate; }
    @keyframes fb-walk { from { transform: translate(-30px, -10px); } to { transform: translate(40px, 12px); } }
    .fb-dog.jump .fb-dog-body { animation: fb-jump .7s ease-out; transform-box: fill-box; transform-origin: center; }
    @keyframes fb-jump { 50% { transform: translateY(-40px) rotate(180deg); } 100% { transform: translateY(0) rotate(360deg); } }
    .fb-fx { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .fb-p { position: absolute; width: 9px; height: 9px; border: 1.5px solid ${B}; border-radius: 2px; animation: fb-burst 1.1s ease-out forwards; }
    @keyframes fb-burst { to { transform: translate(var(--dx), var(--dy)) rotate(260deg); opacity: 0; } }
    .fb-flyer { position: absolute; width: 44px; height: 44px; border: 3px solid ${B}; border-radius: 8px; display: grid; place-items: center; transition: transform .9s cubic-bezier(.4,0,.2,1); }
    .rm .fb-dog { animation: none; }
  ` });
  container.append(style);
  onProgress(0.9);

  /* ---------- Cámara (transformación CSS del SVG) ---------- */
  const stopFocus = [
    [0, 5, L.monument[1]], [hx, 2.5, hz], [tx + 0.5, 5, tz + 0.5], [0.5, 1.5, 5], [ex, 4, ez], [cx + 0.5, 1.5, cz], [1.5, 2.5, 0]
  ].map(([x, y, z]) => iso(x, y, z));
  // Monumento: letrero centrado; su zoom se calcula al encuadrar para que ocupe ~80 % del ancho
  stopFocus[0] = [signBlocks.cx, (signBlocks.top + signBlocks.bottom) / 2 + 10];
  const stopZoom = [0, 2.3, 1.9, 1.9, 2.1, 2.5, 2.0];
  let inset = 0, focus = [400, 380], zoom = 1, mode = "overview", skipped = false;
  const size = () => container.getBoundingClientRect();
  function place(animate = true) {
    const r = size();
    const k = zoom === 0 ? (r.width * 0.8) / signBlocks.width : (Math.min(r.width, r.height * 0.9) / 800) * zoom;
    const visTop = 70;
    const cyv = visTop + (r.height - inset - visTop) / 2;
    const tX = r.width / 2 - focus[0] * k, tY = cyv - focus[1] * k;
    cam.classList.toggle("no-anim", !animate || prefersReduced());
    cam.style.transform = `translate(${tX}px, ${tY}px) scale(${k})`;
  }
  window.addEventListener("resize", () => place(false));

  /* ---------- Hora del día ---------- */
  let timeKey = "dawn";
  function setTime(key) {
    const s = SKY[key]; if (!s) return;
    timeKey = key;
    for (const el of [skyEl, frameEl]) { el?.style.setProperty("--sky-top", s[0]); el?.style.setProperty("--sky-bottom", s[1]); }
    skyEl.style.transition = "background 1.2s";
    starsEl.style.opacity = String(s[2]);
    svgEl.classList.toggle("fb-night", key === "night");
  }
  setTime("dawn");

  /* ---------- Invitados en el muro ---------- */
  let guests = [];
  const slot = (i) => iso(-2.2 + (i % 5) * 1.1, 1.3 + Math.floor(i / 5) * 1.1, 0.6);
  function guestSvg(g, i) {
    const [px, py] = slot(i);
    const w = 18, hh = 10;
    const sym = SYMBOLS[g.symbol] || SYMBOLS.star;
    return `<g class="fb-guest" data-guest="${i}"><polygon points="${px},${py - hh} ${px + w},${py} ${px},${py + hh} ${px - w},${py}" fill="${shade(g.color, 1.08)}"/><polygon points="${px - w},${py} ${px},${py + hh} ${px},${py + hh + 20} ${px - w},${py + 20}" fill="${shade(g.color, 0.86)}"/><polygon points="${px + w},${py} ${px},${py + hh} ${px},${py + hh + 20} ${px + w},${py + 20}" fill="${shade(g.color, 0.7)}"/><path d="${sym.d}" transform="translate(${px - 15} ${py + 4}) scale(.5)" fill="#fff" stroke="${B}" stroke-width="2"/></g>`;
  }
  function drawGuests() { svgEl.querySelector(".fb-guests").innerHTML = guests.map(guestSvg).join(""); }

  const burst = (x, y, colors, n = 26) => {
    for (let k = 0; k < (prefersReduced() ? 6 : n); k++) {
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
      fx.append(h("i.fb-p", { style: { left: `${x}px`, top: `${y}px`, background: colors[k % colors.length], "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d}px` } }));
    }
    setTimeout(() => fx.replaceChildren(), 1300);
  };
  const toScreen = (pt) => {
    const m = svgEl.getScreenCTM(); const r = container.getBoundingClientRect();
    const p = svgEl.createSVGPoint(); p.x = pt[0]; p.y = pt[1];
    const q = p.matrixTransform(m);
    return { x: q.x - r.left, y: q.y - r.top };
  };

  let fps = 60;
  let chestT = 0, flagT = [];
  const world = {
    kind: "svg",
    stops: [["monumento", "Monumento", "dawn"], ["casa", "La Casa de la Fiesta", "morning"], ["torre", "Torre del Reloj", "noon"], ["sendero", "El Sendero", "afternoon"], ["mirador", "El Mirador", "golden"], ["cofre", "El Cofre", "sunset"], ["muro", "El Muro del Escuadrón", "pink"]].map(([id, name, time]) => ({ id, name, time })),
    perf: { get fps() { return fps; }, calls: 0, tris: 0, dpr: 1, blocks: cubes.length },
    start() {}, stop() {}, invalidate() {},
    setInset(px) { inset = px; place(true); },
    setTime,
    get timeKey() { return timeKey; },
    async goTo(i, { instant = false } = {}) { mode = "stop"; focus = stopFocus[i]; zoom = stopZoom[i]; place(!instant); if (!instant) await sleep(prefersReduced() ? 200 : 1100); },
    async overview({ instant = false } = {}) { mode = "overview"; focus = [400, 400]; zoom = 1; place(!instant); if (!instant) await sleep(1100); },
    async build() {
      skipped = false;
      zoom = 1; focus = [400, 400]; place(false);
      if (prefersReduced()) return;
      svgEl.classList.add("fb-building");
      for (let k = 0; k < 10; k++) { await sleep(300); audio.blockPop(0.7 + k * 0.12); }
      await sleep(1600);
      if (!skipped) svgEl.classList.add("fb-mono-hidden"); // el letrero aparece en la fase del monumento
      svgEl.classList.remove("fb-building");
    },
    finishBuild() { skipped = true; svgEl.classList.remove("fb-building", "fb-mono-hidden", "fb-undo"); },
    /** Repetir la construcción: los bloques suben y se desvanecen hacia el cielo (~1.2 s). */
    async disassemble() {
      audio.whoosh();
      zoom = 1; focus = [400, 400]; place(true);
      if (prefersReduced()) return;
      svgEl.classList.add("fb-undo");
      await sleep(1200);
      if (!skipped) svgEl.classList.add("fb-building"); // queda oculto hasta que empiece la construcción
      svgEl.classList.remove("fb-undo");
    },
    async monument() {
      svgEl.classList.add("fb-mono-hidden");
      focus = stopFocus[0]; zoom = stopZoom[0]; place(true);
      await sleep(900);
      svgEl.classList.remove("fb-mono-hidden"); svgEl.classList.add("fb-mono");
      await sleep(900);
      const p = toScreen(stopFocus[0]);
      burst(p.x, p.y - 20, ["#FFD23F", "#FFF6E5", accent]);
      audio.fanfare();
      await sleep(700);
      svgEl.classList.remove("fb-mono");
    },
    labels() {
      return stopFocus.map((f, i) => { const p = toScreen([f[0], f[1] - 40]); return { i, x: p.x, y: p.y, visible: true }; });
    },
    guestScreen(i) { const p = toScreen([slot(i)[0], slot(i)[1] - 14]); return p; },
    pick(x, y) {
      const r = container.getBoundingClientRect();
      const el = document.elementFromPoint(x + r.left, y + r.top);
      if (!el) return null;
      if (el.closest("[data-dog]")) return { type: "dog" };
      const g = el.closest("[data-guest]"); if (g) return { type: "guest", index: +g.dataset.guest };
      const s = el.closest("[data-stop]"); if (s) return { type: "stop", index: +s.dataset.stop };
      return null;
    },
    orbitStart() {}, orbitDrag() {}, orbitEnd() {},
    dogJump() { const d = svgEl.querySelector(".fb-dog"); d.classList.remove("jump"); void d.getBoundingClientRect(); d.classList.add("jump"); },
    setDays(text) { svgEl.querySelector(".fb-days-t").textContent = text; },
    celebrateTower() { const p = toScreen(stopFocus[2]); burst(p.x, p.y, ["#FFD23F", "#FFFFFF", accent]); },
    // Misma interfaz que el mundo 3D (hooks de la navegación central)
    flagsHide() { svgEl.classList.remove("fb-flags"); },
    flagsUp() { svgEl.classList.remove("fb-flags"); },
    raiseFlags({ onFlag = () => {} } = {}) {
      svgEl.classList.remove("fb-flags"); void svgEl.getBoundingClientRect(); svgEl.classList.add("fb-flags");
      flagT.forEach(clearTimeout); flagT = [0, 1, 2, 3].map((i) => setTimeout(() => onFlag(i), i * 250));
    },
    openChest() { svgEl.classList.add("fb-chest"); audio.chest(); const p = toScreen(stopFocus[5]); clearTimeout(chestT); chestT = setTimeout(() => burst(p.x, p.y, ["#FFD23F", "#FF6B6B", "#4CC9F0", "#9BE564"]), 250); },
    closeChest() { clearTimeout(chestT); svgEl.classList.remove("fb-chest"); },
    cancelSpecials() { clearTimeout(chestT); flagT.forEach(clearTimeout); flagT = []; },
    setGuests(list) { guests = list.slice(0, 10); drawGuests(); },
    get guestCount() { return guests.length; },
    async placeGuest(g) {
      guests = guests.filter((x) => !x.me); guests.push({ ...g, me: true }); guests = guests.slice(-10);
      const i = guests.length - 1;
      const end = toScreen([slot(i)[0], slot(i)[1] + 6]);
      const r = container.getBoundingClientRect();
      const fly = h("div.fb-flyer", { style: { left: `${end.x - 22}px`, top: `${end.y - 22}px`, background: g.color, transform: `translate(${r.width / 2 - end.x}px, ${r.height - end.y + 40}px) rotate(200deg)` }, html: `<svg viewBox="0 0 24 24" width="26" height="26"><path d="${(SYMBOLS[g.symbol] || SYMBOLS.star).d}" fill="#fff" stroke="${B}" stroke-width="1.6"/></svg>` });
      fx.append(fly);
      await sleep(30);
      fly.style.transform = "none";
      await sleep(prefersReduced() ? 50 : 950);
      fly.remove();
      drawGuests();
      audio.bigPop();
      burst(end.x, end.y + 10, ["#F4DDA4", "#FFF6E5", "#C9B8A6"], 18);
    },
    night() { setTime("night"); },
    async fireworks(colors) {
      const p = toScreen(stopFocus[0]);
      const n = prefersReduced() ? 1 : 5;
      for (let k = 0; k < n; k++) { burst(p.x + (Math.random() - 0.5) * 160, p.y - 60 - Math.random() * 60, colors, 30); audio.firework(); await sleep(420); }
    },
    loadPhotos() {},
    dispose() { cam.remove(); fx.remove(); style.remove(); }
  };
  place(false);
  // FPS aproximado (sólo informativo para el panel debug)
  let n = 0, t0 = performance.now();
  (function loop(t) { n++; if (t - t0 > 1000) { fps = Math.round((n * 1000) / (t - t0)); n = 0; t0 = t; } requestAnimationFrame(loop); })(t0);
  onProgress(1);
  return world;
}

export { mixHex, clamp };
