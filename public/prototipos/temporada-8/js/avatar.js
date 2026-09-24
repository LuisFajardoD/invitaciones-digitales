// Avatar de bloques en CSS 3D. Cada parte es un cuboide de 6 caras con esquinas suavizadas.
// Colores por variables CSS (cambio en vivo), iluminación por cara según el ángulo de giro.
import { h } from "./util.js";

// Proporciones en "unidades" (em). La altura total es 25u; el origen está al centro.
const HEAD = { w: 9, h: 9, d: 9 };
const TORSO = { w: 8, h: 8.5, d: 5 };
const ARM = { w: 3.4, h: 8.5, d: 3.6 };
const LEG = { w: 3.8, h: 7.5, d: 4.2 };
const TOP = -12.5;
const NECK_Y = TOP + HEAD.h; // -3.5
const HIP_Y = NECK_Y + TORSO.h; // 5
const SHOULDER_X = TORSO.w / 2 + ARM.w / 2 + 0.12;

const em = (v) => `${v}em`;

/** Cuboide centrado en su origen. faces: { front: {cls, html}, ... } */
function cuboid({ w, h: hh, d }, cls, faces = {}) {
  const box = h(`div.cub.${cls}`, { style: { width: em(w), height: em(hh), left: em(-w / 2), top: em(-hh / 2) } });
  const spec = {
    front: { W: w, H: hh, x: 0, y: 0, t: `translateZ(${em(d / 2)})` },
    back: { W: w, H: hh, x: 0, y: 0, t: `rotateY(180deg) translateZ(${em(d / 2)})` },
    right: { W: d, H: hh, x: (w - d) / 2, y: 0, t: `rotateY(90deg) translateZ(${em(w / 2)})` },
    left: { W: d, H: hh, x: (w - d) / 2, y: 0, t: `rotateY(-90deg) translateZ(${em(w / 2)})` },
    top: { W: w, H: d, x: 0, y: (hh - d) / 2, t: `rotateX(90deg) translateZ(${em(hh / 2)})` },
    bottom: { W: w, H: d, x: 0, y: (hh - d) / 2, t: `rotateX(-90deg) translateZ(${em(hh / 2)})` }
  };
  for (const [name, s] of Object.entries(spec)) {
    const f = faces[name] || {};
    box.append(h(`div.fc.f-${name}${f.cls ? "." + f.cls : ""}`, {
      html: f.html || null,
      style: { width: em(s.W), height: em(s.H), left: em(s.x), top: em(s.y), transform: s.t }
    }));
  }
  return box;
}

/** Articulación: pivote en (x,y,z); el cuboide cuelga desde el pivote. */
function joint(cls, [x, y, z], child, hang = 0) {
  const inner = h(`div.jt-swing`);
  const holder = h("div.jt-hold", { style: { transform: `translate3d(0, ${em(hang)}, 0)` } }, child);
  inner.append(holder);
  return h(`div.jt.${cls}`, { style: { transform: `translate3d(${em(x)}, ${em(y)}, ${em(z)})` } }, inner);
}

const FACE_HTML = `
  <i class="hair-fringe"></i>
  <i class="brow brow-l"></i><i class="brow brow-r"></i>
  <i class="eye eye-l"><b></b></i><i class="eye eye-r"><b></b></i>
  <i class="cheek cheek-l"></i><i class="cheek cheek-r"></i>
  <i class="mouth"></i>`;

const EMBLEM = `<svg class="emblem" viewBox="0 0 20 20" aria-hidden="true"><path d="M11.5 1.5 4 11h5l-1.5 7.5L16 8.5h-5z" fill="var(--c-accent)" stroke="#1B2A6B" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

function buildRig() {
  const head = cuboid(HEAD, "p-head", {
    front: { cls: "skin face", html: FACE_HTML },
    back: { cls: "hair" },
    left: { cls: "head-side" },
    right: { cls: "head-side" },
    top: { cls: "hair" },
    bottom: { cls: "skin" }
  });
  const tuft = cuboid({ w: 5.2, h: 1.6, d: 4 }, "p-tuft", {
    front: { cls: "hair" }, back: { cls: "hair" }, left: { cls: "hair" }, right: { cls: "hair" }, top: { cls: "hair" }, bottom: { cls: "hair" }
  });
  tuft.style.transform = `translate3d(${em(HEAD.w / 2 - 0.9)}, ${em(-0.75)}, ${em(HEAD.d / 2 - 2.6)}) rotateY(-12deg)`;
  head.append(tuft);

  const torso = cuboid(TORSO, "p-torso", {
    front: { cls: "shirt torso-front", html: `<i class="collar"></i>${EMBLEM}<i class="belt"></i>` },
    back: { cls: "shirt", html: `<i class="belt"></i>` },
    left: { cls: "shirt", html: `<i class="belt"></i>` },
    right: { cls: "shirt", html: `<i class="belt"></i>` },
    top: { cls: "shirt", html: `<i class="neck"></i>` },
    bottom: { cls: "pants" }
  });
  const armFaces = () => ({
    front: { cls: "arm-f" }, back: { cls: "arm-f" }, left: { cls: "arm-f" }, right: { cls: "arm-f" },
    top: { cls: "shirt" }, bottom: { cls: "skin" }
  });
  const legFaces = () => ({
    front: { cls: "leg-f", html: `<i class="lace"></i>` }, back: { cls: "leg-f" }, left: { cls: "leg-f" }, right: { cls: "leg-f" },
    top: { cls: "pants" }, bottom: { cls: "shoe-sole" }
  });

  const upper = h("div.av-upper",
    h("div.av-torso-pos", { style: { transform: `translate3d(0, ${em(NECK_Y + TORSO.h / 2)}, 0)` } }, torso),
    joint("j-head", [0, NECK_Y, 0], head, -HEAD.h / 2),
    joint("j-arm-l", [-SHOULDER_X, NECK_Y + 1.2, 0], cuboid(ARM, "p-arm", armFaces()), ARM.h / 2 - 1.2),
    joint("j-arm-r", [SHOULDER_X, NECK_Y + 1.2, 0], cuboid(ARM, "p-arm", armFaces()), ARM.h / 2 - 1.2)
  );
  const legs = [
    joint("j-leg-l", [-LEG.w / 2 - 0.08, HIP_Y, 0], cuboid(LEG, "p-leg", legFaces()), LEG.h / 2),
    joint("j-leg-r", [LEG.w / 2 + 0.08, HIP_Y, 0], cuboid(LEG, "p-leg", legFaces()), LEG.h / 2)
  ];
  return { rig: h("div.av-hop", ...legs, upper), head };
}

/* ---------- Peinados: bloques de cabello añadidos a la cabeza ---------- */
// Coordenadas en la caja de la cabeza: x,y desde la esquina superior izquierda; z=0 es el centro.
const HAIR_FACES = { front: { cls: "hair" }, back: { cls: "hair" }, left: { cls: "hair" }, right: { cls: "hair" }, top: { cls: "hair" }, bottom: { cls: "hair" } };
const TIE_FACES = { front: { cls: "hair-tie" }, back: { cls: "hair-tie" }, left: { cls: "hair-tie" }, right: { cls: "hair-tie" }, top: { cls: "hair-tie" }, bottom: { cls: "hair-tie" } };
function hairBlock(size, [x, y, z], faces = HAIR_FACES, extra = "") {
  const b = cuboid(size, "p-hairstyle", faces);
  b.style.transform = `translate3d(${em(x)}, ${em(y)}, ${em(z)})${extra}`;
  return b;
}
function hairstyleBlocks(style) {
  if (style === "long") {
    // Cabello cayendo a los lados y por detrás hasta los hombros
    return [
      hairBlock({ w: 1.3, h: 11.4, d: 8.4 }, [-0.55, 6.1, -0.3]),
      hairBlock({ w: 1.3, h: 11.4, d: 8.4 }, [HEAD.w + 0.55, 6.1, -0.3]),
      hairBlock({ w: 10.6, h: 11.4, d: 1.3 }, [HEAD.w / 2, 6.1, -HEAD.d / 2 - 0.55])
    ];
  }
  if (style === "pigtails") {
    // Dos coletas de bloques a los lados, con liga
    return [
      hairBlock({ w: 1.8, h: 1.8, d: 1.8 }, [-0.9, 3.4, -0.3], TIE_FACES),
      hairBlock({ w: 2.4, h: 5.4, d: 2.4 }, [-2.2, 6.6, -0.3], HAIR_FACES, " rotateZ(16deg)"),
      hairBlock({ w: 1.8, h: 1.8, d: 1.8 }, [HEAD.w + 0.9, 3.4, -0.3], TIE_FACES),
      hairBlock({ w: 2.4, h: 5.4, d: 2.4 }, [HEAD.w + 2.2, 6.6, -0.3], HAIR_FACES, " rotateZ(-16deg)")
    ];
  }
  return []; // "short": el peinado base (mechón superior)
}
export const HAIR_STYLES = ["short", "long", "pigtails"];

// Luz desde el frente-izquierda. Normales locales de las caras verticales en el plano XZ.
const LIGHT = { x: -0.45, z: 0.89 };
function shadeFor(nx, nz) {
  const dot = nx * LIGHT.x + nz * LIGHT.z;
  return Math.round((0.03 + 0.3 * (1 - dot) / 2) * 50) / 50; // cuantizado a 0.02
}

/**
 * Crea un avatar.
 * @param {object} colors avatarColors
 * @param {object} opts { unit (px por unidad), tilt (grados), angle, label, spin (bool, giro CSS) }
 */
export function createAvatar(colors, { unit = 8, tilt = -10, angle = -20, label = "", spin = false, cls = "", hair = "short" } = {}) {
  const stage = h("div.av-stage");
  const root = h(`div.av${cls ? "." + cls : ""}${spin ? ".av-spin" : ""}`, {
    role: label ? "img" : null,
    "aria-label": label || null,
    "aria-hidden": label ? null : "true",
    style: { fontSize: `${unit}px` }
  }, h("div.av-origin", stage));
  const { rig, head } = buildRig();
  stage.append(rig);

  let lastShade = "";
  const api = {
    el: root,
    stage,
    angle,
    setColors(c = {}) {
      const map = { head: "--c-head", hair: "--c-hair", shirt: "--c-shirt", pants: "--c-pants", shoes: "--c-shoes", accent: "--c-accent" };
      for (const [k, v] of Object.entries(map)) if (c[k]) root.style.setProperty(v, c[k]);
    },
    setAngle(deg) {
      api.angle = deg;
      if (!spin) stage.style.transform = `rotateX(${tilt}deg) rotateY(${deg}deg)`;
      const a = (deg * Math.PI) / 180;
      const s = Math.sin(a), c = Math.cos(a);
      const f = shadeFor(s, c), r = shadeFor(c, -s), b = shadeFor(-s, -c), l = shadeFor(-c, s);
      const key = `${f}|${r}|${b}|${l}`;
      if (key !== lastShade) {
        lastShade = key;
        root.style.setProperty("--sh-front", f);
        root.style.setProperty("--sh-right", r);
        root.style.setProperty("--sh-back", b);
        root.style.setProperty("--sh-left", l);
      }
    },
    /** Baile de victoria: brazos arriba, saltitos. */
    dance(ms = 2400) {
      root.classList.remove("is-dance");
      void root.offsetWidth;
      root.classList.add("is-dance");
      clearTimeout(api._dt);
      api._dt = setTimeout(() => root.classList.remove("is-dance"), ms);
    },
    hair: "short",
    /** Cambia el peinado ("short" | "long" | "pigtails"); pop: rebote corto. */
    setHair(style, { pop = false } = {}) {
      const s = HAIR_STYLES.includes(style) ? style : "short";
      api.hair = s;
      head.querySelectorAll(":scope > .p-hairstyle").forEach((n) => n.remove());
      head.append(...hairstyleBlocks(s));
      if (pop) {
        root.classList.remove("is-pop");
        void root.offsetWidth;
        root.classList.add("is-pop");
        clearTimeout(api._pt);
        api._pt = setTimeout(() => root.classList.remove("is-pop"), 420);
      }
    },
    pose(on) { root.classList.toggle("is-pose", !!on); },
    wave() {
      root.classList.remove("is-wave");
      void root.offsetWidth;
      root.classList.add("is-wave");
      clearTimeout(api._wt);
      api._wt = setTimeout(() => root.classList.remove("is-wave"), 1600);
    }
  };
  if (spin) stage.style.setProperty("--tilt", `${tilt}deg`);
  api.setColors(colors);
  api.setAngle(angle);
  if (hair !== "short") api.setHair(hair);
  return api;
}
