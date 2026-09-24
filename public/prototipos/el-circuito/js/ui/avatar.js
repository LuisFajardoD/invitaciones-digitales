// Corredor dibujado en un <canvas> pequeño para la interfaz (vista previa, tabla, estado confirmado).
import { demoData } from "../data.js";
import { makeLook, makePose, poseFor, drawRunner } from "../game/runner-art.js";

const GUEST_BASE = { skin: "#F0C29B", hair: "#4A3020", shorts: "#1B1F3B", shoes: "#FFFFFF", headband: "#FFFFFF" };
/** Apariencia de un invitado: color de playera + peinado, dorsal con su inicial. */
export function guestLook(color, hair = "short", name = "") {
  const initial = (String(name).trim()[0] || "?").toUpperCase();
  return makeLook({ ...GUEST_BASE, shirt: color, hairStyle: hair, headband: color === "#FFC93C" ? "#FF5A5F" : "#FFC93C" }, initial);
}
export const childLook = (bib) => makeLook(demoData.child.runner, bib);

/** Canvas con un corredor (css w×h). */
export function runnerCanvas(look, { w = 44, h = 54, anim = "stand", t = 0.3, scale } = {}) {
  const c = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  c.style.width = `${w}px`; c.style.height = `${h}px`;
  paintRunner(c, look, { w, h, anim, t, scale });
  return c;
}
const pose = makePose();
export function paintRunner(c, look, { w, h, anim = "stand", t = 0.3, scale } = {}) {
  const dpr = c.width / w, x = c.getContext("2d");
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  const s = scale || (h - 4) / 82;
  poseFor(anim, t, pose);
  drawRunner(x, w / 2 - 3 * s, h - 3, s, look, pose);
}
