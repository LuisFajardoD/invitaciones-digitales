// Corredor infantil de caricatura (proporciones humanas: cabeza grande, cuerpo pequeño), dibujado
// por partes en Canvas 2D: piernas y brazos articulados, torso con dorsal, shorts, tenis, cabeza con
// cintillo, pelo (corto, largo o coletas) y cara expresiva (parpadeo, sonrisa, grito, "O").
// Origen = entre los pies, sobre el suelo; mira a la derecha. Altura total ≈ 78 unidades.
// Sin gradientes ni objetos nuevos por frame: la pose se escribe en un objeto reutilizable.

export const OUTLINE = "#1B1F3B";
const LW = 2.6; // grosor del contorno

/* ---------- Esqueleto (unidades del corredor) ---------- */
const HIP_Y = -25, NECK = 21, HEAD_R = 15.5, THIGH = 12.5, SHIN = 12.5, UPPER = 10, FORE = 9.5;

/** Pose reutilizable. Ángulos en radianes: 0 = hacia abajo, positivo = hacia adelante (derecha). */
export function makePose() {
  return {
    lean: 0, bob: 0, rot: 0, squash: 1,
    legF: [0, 0], legB: [0, 0], armF: [0, 0], armB: [0, 0],
    headTilt: 0, mouth: "smile", eyes: "open", tails: 0, hairSwing: 0
  };
}

const TAU = Math.PI * 2;
/**
 * Escribe en `p` la pose de la animación `anim` en el tiempo `t` (s).
 * anims: idle, run, jump, fall, flip, slide, splash, respawn, celebrate, wave, stand
 */
export function poseFor(anim, t, p, extra = 0) {
  p.lean = 0; p.bob = 0; p.rot = 0; p.squash = 1; p.headTilt = 0; p.mouth = "smile"; p.eyes = "open"; p.hairSwing = 0;
  // Parpadeo cada ~3.2 s
  if ((t % 3.2) > 3.05) p.eyes = "closed";
  switch (anim) {
    case "run": {
      const f = t * TAU * 2.7;
      const s = Math.sin(f);
      p.lean = 0.2; p.bob = -Math.abs(Math.cos(f)) * 2.6;
      p.legF[0] = 0.8 * s; p.legF[1] = -0.2 - 1.1 * Math.max(0, Math.sin(f + 1.3));
      p.legB[0] = -0.8 * s; p.legB[1] = -0.2 - 1.1 * Math.max(0, Math.sin(f + 1.3 + Math.PI));
      p.armF[0] = -0.85 * s; p.armF[1] = 1.5;
      p.armB[0] = 0.85 * s; p.armB[1] = 1.5;
      p.tails = Math.sin(f * 0.5) * 0.3 + 0.9; p.hairSwing = 0.5;
      p.headTilt = 0.05 * Math.sin(f);
      break;
    }
    case "jump": { // subiendo: rodilla al frente, brazo al frente y el otro atrás (sin tapar la cara)
      p.lean = 0.12;
      p.legF[0] = 1.05; p.legF[1] = -1.55; p.legB[0] = -0.45; p.legB[1] = -0.7;
      p.armF[0] = 1.55; p.armF[1] = 0.55; p.armB[0] = -2.1; p.armB[1] = -0.5;
      p.mouth = "open"; p.tails = 0.4; p.hairSwing = -0.4;
      break;
    }
    case "fall": { // bajando: piernas listas para aterrizar, brazos equilibrando
      const w = Math.sin(t * 14) * 0.15;
      p.lean = 0.05;
      p.legF[0] = 0.45; p.legF[1] = -0.5; p.legB[0] = -0.15; p.legB[1] = -0.35;
      p.armF[0] = 1.6 + w; p.armF[1] = 0.5; p.armB[0] = -1.8 - w; p.armB[1] = -0.3;
      p.tails = -0.6; p.hairSwing = -0.8;
      break;
    }
    case "flip": { // doble salto: voltereta completa en ovillo
      p.rot = -extra * TAU; // extra = progreso 0..1
      p.legF[0] = 1.55; p.legF[1] = -2.3; p.legB[0] = 1.35; p.legB[1] = -2.2;
      p.armF[0] = 1.1; p.armF[1] = 1.3; p.armB[0] = 0.9; p.armB[1] = 1.4;
      p.mouth = "open"; p.eyes = "happy"; p.bob = -8;
      break;
    }
    case "slide": { // tobogán: sentado, brazos arriba, gritando de emoción
      const w = Math.sin(t * 9) * 0.12;
      p.lean = -0.35; p.bob = 9;
      p.legF[0] = 1.45; p.legF[1] = 0.05; p.legB[0] = 1.35; p.legB[1] = 0.1;
      p.armF[0] = 1.95 + w; p.armF[1] = 0.8; p.armB[0] = -2.3 - w; p.armB[1] = -0.3;
      p.mouth = "scream"; p.tails = -0.9; p.hairSwing = -1;
      break;
    }
    case "splash": { // se hunde agitando los brazos
      const w = Math.sin(t * 22);
      p.lean = -0.1;
      p.legF[0] = 0.3 + 0.3 * w; p.legF[1] = -0.6; p.legB[0] = -0.3 - 0.3 * w; p.legB[1] = -0.6;
      p.armF[0] = 1.6 + 0.3 * w; p.armF[1] = 0.8; p.armB[0] = -2.3 - 0.4 * w; p.armB[1] = -0.5;
      p.mouth = "o"; p.eyes = "wide"; p.tails = -0.5;
      break;
    }
    case "celebrate": { // puño arriba por delante de la cara (sin taparla), el otro brazo atrás, y saltitos
      const j = Math.abs(Math.sin(t * TAU * 1.4));
      p.bob = -j * 10; p.squash = 1 + (j < 0.15 ? -0.08 : 0.03);
      p.legF[0] = 0.25 * j; p.legF[1] = -0.5 * j; p.legB[0] = -0.2 * j; p.legB[1] = -0.4 * j;
      p.armF[0] = 1.65; p.armF[1] = 0.7 + Math.sin(t * 12) * 0.08; p.armB[0] = -1.9 - Math.sin(t * 12) * 0.1; p.armB[1] = -0.5;
      p.mouth = "open"; p.eyes = "happy"; p.tails = 0.2;
      break;
    }
    case "wave": { // se despide con la mano (al frente de la cara, sin taparla)
      p.legF[0] = 0.08; p.legB[0] = -0.08;
      p.armF[0] = 1.6; p.armF[1] = 0.6 + Math.sin(t * 10) * 0.35;
      p.armB[0] = -0.2; p.armB[1] = 0.25;
      p.headTilt = -0.05; p.mouth = "open"; p.eyes = "happy";
      break;
    }
    case "stand": {
      p.legF[0] = 0.06; p.legB[0] = -0.06; p.armF[0] = 0.25; p.armF[1] = 0.3; p.armB[0] = -0.2; p.armB[1] = 0.3;
      p.bob = Math.sin(t * 2.4) * 0.6;
      break;
    }
    case "idle":
    default: { // calentando: trote en el lugar con rodillas arriba y cada tanto estira los brazos
      const f = t * TAU * 1.5, cyc = t % 5;
      const kF = Math.max(0, Math.sin(f)), kB = Math.max(0, -Math.sin(f));
      p.bob = -Math.abs(Math.sin(f)) * 2.2;
      p.legF[0] = kF * 0.95; p.legF[1] = -kF * 1.6; p.legB[0] = kB * 0.7; p.legB[1] = -kB * 1.4;
      if (cyc > 3.6) { // estiramiento
        const k = Math.sin(((cyc - 3.6) / 1.4) * Math.PI);
        p.armF[0] = 0.3 + k * 1.7; p.armF[1] = k * 0.8; p.armB[0] = -0.3 - k * 2.1; p.armB[1] = -k * 0.3;
        p.eyes = k > 0.5 ? "happy" : p.eyes;
      } else {
        p.armF[0] = -0.5 * Math.sin(f); p.armF[1] = 1.4; p.armB[0] = 0.5 * Math.sin(f); p.armB[1] = 1.4;
      }
      p.lean = 0.05; p.tails = 0.2 + Math.sin(f) * 0.2; p.hairSwing = 0.2;
    }
  }
  return p;
}

/* ---------- Dibujo ---------- */
function limb(ctx, x, y, a1, l1, a2, l2, w, color, endFn) {
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  const ex = kx + Math.sin(a1 + a2) * l2, ey = ky + Math.cos(a1 + a2) * l2;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = w + LW * 2; ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  if (endFn) endFn(ex, ey, a1 + a2);
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillStroke(ctx, fill) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = OUTLINE; ctx.stroke(); }

/** Oscurece/aclara un color hex (k < 1 oscurece). Se usa sólo al crear la paleta del corredor. */
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/**
 * Paleta del corredor (se calcula una vez). colors: { skin, hair, hairStyle, shirt, shorts, shoes, headband }
 * bibCanvas: dorsal pre-renderizado (ver makeBib).
 */
export function makeLook(colors, bibText) {
  return {
    ...colors,
    skinDark: shade(colors.skin, 0.86), shirtDark: shade(colors.shirt, 0.8), shortsDark: shade(colors.shorts, 1.4),
    hairStyle: colors.hairStyle || "short", bib: makeBib(bibText)
  };
}
/** Dorsal blanco con número (canvas pequeño, una vez). */
export function makeBib(text) {
  const c = document.createElement("canvas");
  const S = 4; c.width = 15 * S; c.height = 12 * S;
  const x = c.getContext("2d");
  x.scale(S, S);
  roundRect(x, 0.8, 0.8, 13.4, 10.4, 2);
  x.fillStyle = "#FFFFFF"; x.fill(); x.lineWidth = 1.2; x.strokeStyle = OUTLINE; x.stroke();
  x.fillStyle = "#FF5A5F"; x.fillRect(3, 1.6, 1.1, 1.1); x.fillRect(10.9, 1.6, 1.1, 1.1); // imperdibles
  x.fillStyle = OUTLINE;
  x.font = `400 ${String(text).length > 1 ? 7 : 8.2}px "Titan One", "Arial Black", sans-serif`;
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(String(text), 7.5, 6.9);
  return c;
}

/**
 * Dibuja al corredor. (x, y) = pies sobre el suelo en coordenadas del canvas; s = escala.
 * look = makeLook(...); p = pose; flash = opacidad (parpadeo de invulnerabilidad).
 */
export function drawRunner(ctx, x, y, s, look, p, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + p.bob * s);
  ctx.scale(s, s * p.squash);
  if (p.rot) { ctx.translate(0, -38); ctx.rotate(p.rot); ctx.translate(0, 38); }
  const hipX = 0, hipY = HIP_Y;
  const lean = p.lean;
  const nx = hipX + Math.sin(lean) * NECK, ny = hipY - Math.cos(lean) * NECK;
  const shX = hipX + Math.sin(lean) * (NECK - 3), shY = hipY - Math.cos(lean) * (NECK - 3);
  const shoe = (color) => (ex, ey, a) => {
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(-a * 0.35);
    ctx.beginPath(); ctx.ellipse(3.2, 1.6, 7.2, 4.2, 0, 0, Math.PI * 2);
    fillStroke(ctx, color);
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-2.5, 3.3, 11, 1.5); // suela
    ctx.restore();
  };
  const hand = (ex, ey) => { ctx.beginPath(); ctx.arc(ex, ey, 3.6, 0, Math.PI * 2); fillStroke(ctx, look.skin); };

  // Coletas / pelo largo detrás de la cabeza
  const headX = nx + Math.sin(lean + p.headTilt) * (HEAD_R - 1), headY = ny - Math.cos(lean + p.headTilt) * (HEAD_R - 1);
  if (look.hairStyle === "long") {
    ctx.beginPath();
    ctx.moveTo(headX - 13, headY - 4);
    ctx.quadraticCurveTo(headX - 20 - p.hairSwing * 4, headY + 10, headX - 14 - p.hairSwing * 6, headY + 20);
    ctx.lineTo(headX - 4, headY + 14); ctx.closePath();
    fillStroke(ctx, look.hair);
  }
  if (look.hairStyle === "pigtails") {
    for (const side of [-1, 1]) {
      const tx = headX - 11 + (side > 0 ? -2 : 0), ty = headY - 2 + side * 6;
      ctx.beginPath(); ctx.ellipse(tx - 6 - p.hairSwing * 3, ty + 3 + side * 2, 6.5, 4.6, 0.6 * side + p.tails * 0.3, 0, Math.PI * 2);
      fillStroke(ctx, look.hair);
    }
  }
  // Extremidades de atrás (tono más oscuro)
  limb(ctx, shX - 1, shY + 2, p.armB[0], UPPER, p.armB[1], FORE, 6, look.skinDark, (ex, ey) => { ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, Math.PI * 2); fillStroke(ctx, look.skinDark); });
  limb(ctx, hipX - 2, hipY + 2, p.legB[0], THIGH, p.legB[1], SHIN, 7, look.skinDark, shoe(shade(look.shoes, 0.8)));
  // Shorts (encima de los muslos)
  ctx.save(); ctx.translate(hipX, hipY); ctx.rotate(lean);
  roundRect(ctx, -9, -5, 18, 11, 4); fillStroke(ctx, look.shorts);
  ctx.fillStyle = look.shortsDark; ctx.fillRect(-9 + LW / 2, 1.5, 17 - LW, 1.6); // franja lateral
  // Torso con playera y dorsal
  roundRect(ctx, -10, -NECK + 1, 20, NECK - 1, 7); fillStroke(ctx, look.shirt);
  ctx.fillStyle = look.shirtDark; ctx.fillRect(-9, -3.5, 18, 2.2); // pliegue
  ctx.drawImage(look.bib, -6.5, -15.5, 13.5, 10.8);
  ctx.restore();
  // Pierna del frente
  limb(ctx, hipX + 2, hipY + 2, p.legF[0], THIGH, p.legF[1], SHIN, 7.5, look.skin, shoe(look.shoes));
  // Cabeza
  ctx.save(); ctx.translate(headX, headY); ctx.rotate(lean * 0.5 + p.headTilt);
  ctx.beginPath(); ctx.ellipse(0, 0, HEAD_R, HEAD_R + 1, 0, 0, Math.PI * 2); fillStroke(ctx, look.skin);
  // oreja (asoma en la parte de atrás de la cabeza)
  ctx.beginPath(); ctx.ellipse(-HEAD_R + 1.5, 3, 3, 4, 0, 0, Math.PI * 2); fillStroke(ctx, look.skin);
  ctx.beginPath(); ctx.ellipse(-HEAD_R + 1.5, 3, 1.2, 2, 0, 0, Math.PI * 2); ctx.fillStyle = look.skinDark; ctx.fill();
  // pelo (casquete)
  ctx.beginPath();
  ctx.moveTo(-HEAD_R - 1, 1);
  ctx.bezierCurveTo(-HEAD_R - 2, -HEAD_R - 6, HEAD_R + 1, -HEAD_R - 7, HEAD_R + 1.5, -5);
  ctx.quadraticCurveTo(6, -9, 2, -7);
  ctx.quadraticCurveTo(-2, -4, -7, -6);
  ctx.quadraticCurveTo(-10, -2, -HEAD_R - 1, 1);
  ctx.closePath(); fillStroke(ctx, look.hair);
  if (look.hairStyle === "short") { // copete: dos picos hacia el frente
    ctx.beginPath(); ctx.moveTo(-2, -HEAD_R - 4.5);
    ctx.lineTo(3 + p.hairSwing, -HEAD_R - 9); ctx.lineTo(5, -HEAD_R - 4);
    ctx.lineTo(10 + p.hairSwing, -HEAD_R - 6.5); ctx.lineTo(10, -HEAD_R - 1);
    ctx.closePath(); fillStroke(ctx, look.hair);
  }
  // cintillo con listones al viento
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-HEAD_R + 1, -3); ctx.quadraticCurveTo(0, -9.5, HEAD_R - 0.5, -7.5);
  ctx.lineTo(HEAD_R, -3.2); ctx.quadraticCurveTo(0, -5, -HEAD_R + 1.5, 1.8); ctx.closePath();
  fillStroke(ctx, look.headband);
  for (const k of [0, 1]) {
    ctx.beginPath(); ctx.moveTo(-HEAD_R + 1, -1);
    const tx = -HEAD_R - 9 - k * 2, ty = -1 + k * 5 + p.tails * 5 * (k ? 1 : -0.6);
    ctx.quadraticCurveTo(-HEAD_R - 4, -3 + k * 3, tx, ty); ctx.lineTo(tx + 1.5, ty + 3.2);
    ctx.quadraticCurveTo(-HEAD_R - 3, k * 3 + 1, -HEAD_R + 1.5, 2); ctx.closePath();
    fillStroke(ctx, look.headband);
  }
  ctx.restore();
  // cara (vista 3/4 hacia la derecha)
  ctx.fillStyle = "rgba(255,110,110,.35)"; ctx.beginPath(); ctx.ellipse(8.5, 6.5, 3.4, 2.2, 0, 0, Math.PI * 2); ctx.fill(); // chapeta
  const eye = (ex) => {
    if (p.eyes === "closed") { ctx.beginPath(); ctx.moveTo(ex - 2.4, 1); ctx.lineTo(ex + 2.4, 1); ctx.lineWidth = 1.8; ctx.strokeStyle = OUTLINE; ctx.stroke(); return; }
    if (p.eyes === "happy") { ctx.beginPath(); ctx.arc(ex, 2, 2.6, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE; ctx.stroke(); return; }
    const r = p.eyes === "wide" ? 3.8 : 3.3;
    ctx.beginPath(); ctx.ellipse(ex, 0.5, r - 0.6, r, 0, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = OUTLINE; ctx.stroke();
    ctx.beginPath(); ctx.arc(ex + 0.9, 0.9, 1.7, 0, Math.PI * 2); ctx.fillStyle = OUTLINE; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 1.5, 0, 0.6, 0, Math.PI * 2); ctx.fillStyle = "#FFFFFF"; ctx.fill();
  };
  eye(3.5); eye(10.5);
  ctx.lineWidth = 1.8; ctx.strokeStyle = OUTLINE;
  ctx.beginPath(); ctx.moveTo(1.5, -4.3); ctx.lineTo(5, -5); ctx.moveTo(9, -5); ctx.lineTo(12.5, -4.3); ctx.stroke(); // cejas
  // boca
  ctx.beginPath();
  if (p.mouth === "smile") { ctx.arc(9, 7.5, 3.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (p.mouth === "o") { ctx.ellipse(9, 9, 2.4, 3, 0, 0, Math.PI * 2); ctx.fillStyle = "#7A1E2A"; ctx.fill(); ctx.stroke(); }
  else { // open / scream: boca abierta con lengua
    const big = p.mouth === "scream" ? 1.35 : 1;
    ctx.moveTo(5.2, 6.5); ctx.quadraticCurveTo(9, 6 - big, 12.8, 6.5); ctx.quadraticCurveTo(9, 6.5 + 7 * big, 5.2, 6.5); ctx.closePath();
    ctx.fillStyle = "#7A1E2A"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(9, 8.8 + 1.5 * big, 2.2, 1.3, 0, 0, Math.PI * 2); ctx.fillStyle = "#FF8A8A"; ctx.fill();
  }
  ctx.restore();
  // Brazo del frente
  limb(ctx, shX + 1, shY + 2, p.armF[0], UPPER, p.armF[1], FORE, 6.5, look.skin, hand);
  // manga
  ctx.save(); ctx.translate(shX + 1, shY + 2); ctx.rotate(-p.armF[0]);
  roundRect(ctx, -4.6, -2.5, 9.2, 8, 3); fillStroke(ctx, look.shirt);
  ctx.restore();
  ctx.restore();
}

/** Mini corredor estático (avatares de invitados, tabla de tiempos, panel). */
export function drawMiniRunner(ctx, x, y, s, look, anim = "stand", t = 0) {
  const p = makePose();
  poseFor(anim, t, p);
  drawRunner(ctx, x, y, s, look, p);
}
