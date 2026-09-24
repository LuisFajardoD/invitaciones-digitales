// Panel de pruebas (sólo con ?debug=1; se carga dinámicamente).
import { h, clock, eventInfo, prefersReduced, setForcedReduced } from "./util.js";
import { state } from "./state.js";

const DAY = 86400000;

export function initDebug({ world, goTo, overview, replayBuild, refresh }) {
  const ev = eventInfo();
  const perf = h("div.debug-perf");
  const btn = (text, fn, attrs = {}) => h("button", { type: "button", onclick: fn, ...attrs }, text);

  const stops = h("div.debug-row", ...world.stops.map((s, i) => btn(String(i + 1), () => goTo(i), { title: s.name })), btn("Isla", () => overview()));
  const times = h("div.debug-row", ...[["dawn", "Amanecer"], ["noon", "Mediodía"], ["sunset", "Atardecer"], ["night", "Noche"]].map(([k, l]) => btn(l, () => world.setTime(k, 800))));
  const days = h("div.debug-row", ...[30, 15, 5, 1, 0, -1].map((d) => btn(d === 0 ? "0 hoy" : d === -1 ? "-1 pasó" : `${d}d`, () => {
    const target = d > 0 ? ev.start - d * DAY : d === 0 ? ev.start - 3 * 3600000 : ev.end + DAY;
    clock.setOffset(target - Date.now());
    refresh();
  })), btn("Real", () => { clock.reset(); refresh(); }));
  const rmBtn = btn("Reduced motion", () => { setForcedReduced(!prefersReduced()); rmBtn.classList.toggle("is-on", prefersReduced()); });
  rmBtn.classList.toggle("is-on", prefersReduced());
  // Superposiciones: en cada parada, marca en rojo lo que (de otra zona) invade el recuadro en
  // pantalla de la construcción protagonista (recuadro punteado).
  let ovOn = !!world.overlaps;
  const ovLayer = h("div.debug-overlap", { "aria-hidden": "true", style: { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "40" } });
  document.body.append(ovLayer);
  const ovInfo = h("div.debug-perf");
  const ovBtn = btn("Superposiciones", () => { ovOn = !ovOn; ovBtn.classList.toggle("is-on", ovOn); drawOverlaps(); });
  ovBtn.classList.toggle("is-on", ovOn);
  const rectEl = (r, css, label) => {
    const el = h("div", { style: { position: "absolute", left: `${r.x0}px`, top: `${r.y0}px`, width: `${r.x1 - r.x0}px`, height: `${r.y1 - r.y0}px`, ...css } });
    if (label) el.append(h("span", { text: label, style: { position: "absolute", left: "0", top: "-16px", font: "700 11px system-ui", color: "#fff", background: "#D62828", padding: "0 4px", borderRadius: "3px", whiteSpace: "nowrap" } }));
    return el;
  };
  function drawOverlaps() {
    ovLayer.replaceChildren();
    if (!ovOn || !world.overlaps) { ovInfo.textContent = ""; return; }
    const r = world.overlaps();
    if (!r) { ovInfo.textContent = "Superposiciones: (sin parada activa)"; return; }
    const c = world.renderer.domElement.getBoundingClientRect();
    const off = (x) => ({ x0: x.x0 + c.left, x1: x.x1 + c.left, y0: x.y0 + c.top, y1: x.y1 + c.top });
    ovLayer.append(rectEl(off(r.band), { borderLeft: "1px dashed rgba(255,255,255,.55)", borderRight: "1px dashed rgba(255,255,255,.55)" }));
    ovLayer.append(rectEl(off(r.hero), { border: "2px dashed rgba(255,255,255,.9)", boxShadow: "0 0 0 1px rgba(0,0,0,.4)" }));
    // Rojo: otra zona visible (opaca) sobre la protagonista o en el tercio central. Gris: desvanecida.
    const bad = r.items.filter((i) => (i.hit || i.center) && !i.faded);
    const faded = r.items.filter((i) => i.faded);
    faded.forEach((i) => ovLayer.append(rectEl(off(i.rect), { border: "2px dashed rgba(90,90,90,.8)" })));
    bad.forEach((i) => ovLayer.append(rectEl(off(i.rect), { border: "2px solid #D62828", background: "rgba(214,40,40,.25)" }, i.name)));
    ovInfo.textContent = `Superposiciones en ${r.stop}: ${bad.length ? bad.map((i) => i.name).join(", ") : "ninguna ✔"}${faded.length ? ` · desvanecidos: ${faded.map((i) => i.name).join(", ")}` : ""}`;
  }
  setInterval(drawOverlaps, 400);

  /* ---------- Plano cenital: zonas, construcciones, cámara y cono de visión de cada parada ---------- */
  const COLORS = { monument: "#4CC9F0", house: "#FF6B6B", tower: "#F6B04A", path: "#9BE564", tree: "#3F8A26", chest: "#C98E5A", wall: "#B388FF" };
  const planCv = h("canvas.debug-plan", { width: 720, height: 720, "aria-hidden": "true", style: { position: "fixed", left: "50%", top: "50%", width: "min(92vw, 92vh)", height: "min(92vw, 92vh)", transform: "translate(-50%, -50%)", zIndex: "45", background: "rgba(255,251,242,.96)", border: "3px solid #5B3A1E", borderRadius: "10px", display: "none", pointerEvents: "none" } });
  document.body.append(planCv);
  let planOn = false;
  const planBtn = btn("Plano", () => { planOn = !planOn; planBtn.classList.toggle("is-on", planOn); planCv.style.display = planOn ? "block" : "none"; drawPlan(); });
  function drawPlan() {
    if (!planOn || !world.plan) return;
    const P = world.plan();
    const cx = planCv.getContext("2d"), W = planCv.width;
    // Escala: la isla y todas las cámaras caben en el lienzo
    // (la cámara de la Vista de la isla está muy lejos: se dibuja pegada al borde)
    const pts = [...P.outline, ...P.cams.slice(0, 7).map((c) => c.pos)];
    const ext = Math.max(...pts.map(([x, z]) => Math.max(Math.abs(x), Math.abs(z)))) + 6;
    const S = (W / 2 - 16) / ext;
    P.cams.forEach((c) => {
      const m = Math.max(Math.abs(c.pos[0]), Math.abs(c.pos[1]));
      if (m > ext - 2) { const k = (ext - 2) / m; c.pos = [c.pos[0] * k, c.pos[1] * k]; c.clamped = true; }
    });
    const X = (x) => W / 2 + x * S, Z = (z) => W / 2 + z * S;
    cx.clearRect(0, 0, W, W);
    cx.lineJoin = "round";
    // Borde de la isla
    cx.beginPath(); P.outline.forEach(([x, z], k) => (k ? cx.lineTo(X(x), Z(z)) : cx.moveTo(X(x), Z(z)))); cx.closePath();
    cx.fillStyle = "#CFEFB8"; cx.fill(); cx.strokeStyle = "#5B3A1E"; cx.lineWidth = 2; cx.stroke();
    // Conos de visión (horizontal) de cada cámara
    P.cams.forEach((c, i) => {
      const on = i === P.active;
      const dx = c.target[0] - c.pos[0], dz = c.target[1] - c.pos[1], d = Math.hypot(dx, dz) + 18, a = Math.atan2(dz, dx), hf = (c.hfov / 2) * Math.PI / 180;
      cx.beginPath(); cx.moveTo(X(c.pos[0]), Z(c.pos[1]));
      cx.lineTo(X(c.pos[0] + Math.cos(a - hf) * d), Z(c.pos[1] + Math.sin(a - hf) * d));
      cx.lineTo(X(c.pos[0] + Math.cos(a + hf) * d), Z(c.pos[1] + Math.sin(a + hf) * d)); cx.closePath();
      cx.fillStyle = on ? "rgba(255,210,63,.28)" : "rgba(91,58,30,.05)"; cx.fill();
      cx.strokeStyle = on ? "rgba(214,40,40,.9)" : "rgba(91,58,30,.25)"; cx.lineWidth = on ? 2 : 1; cx.stroke();
    });
    // Contornos de zona + bloques de cada construcción
    P.zones.forEach((zn) => {
      cx.beginPath(); zn.poly.forEach(([x, z], k) => (k ? cx.lineTo(X(x), Z(z)) : cx.moveTo(X(x), Z(z)))); cx.closePath();
      cx.fillStyle = `${COLORS[zn.zone]}33`; cx.fill(); cx.strokeStyle = COLORS[zn.zone]; cx.lineWidth = 2; cx.setLineDash([6, 4]); cx.stroke(); cx.setLineDash([]);
    });
    for (const [k, list] of Object.entries(P.blocks)) {
      cx.fillStyle = COLORS[k] || (k.startsWith("arbol") ? "#58B447" : "#888");
      list.forEach(([x, z]) => cx.fillRect(X(x) - 1.5, Z(z) - 1.5, 3, 3));
    }
    // Cámaras
    cx.font = "700 13px system-ui"; cx.textAlign = "center";
    P.cams.forEach((c, i) => {
      cx.fillStyle = i === P.active ? "#D62828" : "#5B3A1E";
      cx.beginPath(); cx.arc(X(c.pos[0]), Z(c.pos[1]), 5, 0, Math.PI * 2); cx.fill();
      cx.fillText(i < 7 ? `📷${i + 1}` : "📷isla", X(c.pos[0]), Z(c.pos[1]) - 9);
    });
    P.zones.forEach((zn, i) => {
      const c = zn.poly.reduce((a, p) => [a[0] + p[0] / zn.poly.length, a[1] + p[1] / zn.poly.length], [0, 0]);
      cx.fillStyle = "#3A2410"; cx.fillText(`${i + 1} ${zn.name}`, X(c[0]), Z(c[1]) + 4);
    });
    // Separaciones mínimas entre zonas vecinas
    const near = P.gaps.filter((g) => g.d < 16).sort((a, b) => a.d - b.d);
    cx.textAlign = "left"; cx.font = "700 12px system-ui";
    near.forEach((g, k) => { cx.fillStyle = g.d < 10 ? "#D62828" : "#3F8A26"; cx.fillText(`${g.a}–${g.b}: ${g.d.toFixed(1)}`, 10, 18 + k * 15); });
  }
  setInterval(drawPlan, 500);

  const q = new URLSearchParams(location.search);
  const toggleWebgl = () => { if (q.get("nowebgl") === "1") q.delete("nowebgl"); else q.set("nowebgl", "1"); location.search = q.toString(); };

  const panel = h("div.debug", { role: "region", "aria-label": "Panel de pruebas" },
    h("div.debug-head", h("span", { text: `🛠 Debug · ${world.kind}` }), btn("–", () => panel.classList.toggle("is-min"), { "aria-label": "Minimizar" })),
    perf,
    h("h4", { text: "Paradas" }), stops,
    h("div.debug-row", ovBtn, planBtn), ovInfo,
    h("h4", { text: "Hora del día" }), times,
    h("h4", { text: "Días restantes" }), days,
    h("h4", { text: "Estado" }),
    h("div.debug-row",
      btn("Reiniciar (1ª visita)", () => { state.reset(); location.reload(); }),
      btn("Repetir construcción", () => replayBuild()),
      rmBtn,
      btn(q.get("nowebgl") === "1" ? "Usar WebGL" : "Sin WebGL", toggleWebgl)));
  document.body.append(panel);
  setInterval(() => {
    const p = world.perf;
    perf.textContent = world.kind === "webgl"
      ? `FPS ${p.fps} · draw calls ${p.calls} · tris ${Math.round(p.tris / 1000)}k · DPR ${p.dpr} · bloques ${p.blocks}`
      : `Versión ilustrada (SVG) · FPS ${p.fps}`;
  }, 500);
}
