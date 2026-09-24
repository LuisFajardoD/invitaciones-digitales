// La pista de "El Circuito", hecha a mano (no aleatoria). Unidades del mundo: el agua está en y = 0 y
// la y crece hacia arriba; el corredor mide ~78 y corre a ~260 u/s. Todo el recorrido se describe
// como datos y `buildCourse()` deriva huecos, marcas de reaparición y "saltar este obstáculo".
//
// Tipos:
//  plat   plataforma inflable fija           { x0, x1, y?, color? }
//  float  plataforma flotante que sube/baja   { x0, x1, amp, period, phase }
//  tramp  trampolín inflable (sobre una plataforma)  { x, w }
//  roller rodillo giratorio                   { x, r }
//  sweep  barra barredora (gira horizontal)   { x, len, period }
//  ball   pelota gigante que rueda hacia el corredor  { x, r, speed, trigger (x del corredor que la suelta) }
//  tower  torre alta del tobogán              { x0, x1, y }
//  slide  tobogán (sin input)                  { x0, x1, y0, y1 }
//  cp     punto de control (arco)            { x, n }
//  buoy   marca de reaparición intermedia     { x }
//  photo  foto coleccionable (burbuja)        { x, y, i }
//  finish meta                                 { x }

export const PLAT_Y = 40; // altura de la cara superior de una plataforma normal
export const RUN_SPEED = 262; // u/s
export const SPRINT = 1.1; // último tramo, un poco más rápido
export const SLIDE_SPEED = 1.7;

const C = { coral: "#FF5A5F", yellow: "#FFC93C", blue: "#3D5AFE", lime: "#9BE564" };

/** Definición del recorrido (5 tramos). */
export const COURSE = [
  // ---- Salida + Tramo 1: introductorio (2 huecos fáciles y un trampolín) ----
  { type: "plat", x0: -700, x1: 160, color: C.blue }, // salida (charquito del tutorial en 160–190)
  { type: "plat", x0: 190, x1: 620, color: C.blue },
  { type: "buoy", x: 280 },
  { type: "plat", x0: 720, x1: 1180, color: C.yellow },
  { type: "buoy", x: 760 },
  { type: "photo", x: 950, y: 92, i: 0 }, // en el camino natural (basta con correr)
  { type: "plat", x0: 1300, x1: 2150, color: C.coral },
  { type: "buoy", x: 1340 },
  { type: "tramp", x: 1500, w: 90 },
  { type: "photo", x: 1720, y: 480, i: 1 }, // sólo con el trampolín
  { type: "cp", x: 1960, n: 1 },

  // ---- Tramo 2: rodillos y plataformas flotantes ----
  { type: "roller", x: 2280, r: 27 },
  { type: "plat", x0: 2150, x1: 2640, color: C.coral },
  { type: "roller", x: 2500, r: 27 },
  { type: "float", x0: 2750, x1: 2920, amp: 16, period: 2.4, phase: 0, color: C.lime },
  { type: "float", x0: 3030, x1: 3200, amp: 18, period: 2.1, phase: 1.3, color: C.lime },
  { type: "photo", x: 2975, y: 230, i: 2 }, // salto alto entre flotantes
  { type: "plat", x0: 3310, x1: 4150, color: C.yellow },
  { type: "buoy", x: 3350 },
  { type: "roller", x: 3620, r: 27 },
  { type: "cp", x: 3950, n: 2 },

  // ---- Tramo 3: barra barredora, pelotas y trampolín doble ----
  { type: "plat", x0: 4150, x1: 4800, color: C.yellow },
  { type: "buoy", x: 4180 },
  { type: "sweep", x: 4420, len: 92, period: 2.6 },
  { type: "ball", x: 4780, r: 32, speed: 110, trigger: 4540 }, // rueda cuando ya se pasó la barra
  { type: "plat", x0: 4920, x1: 5620, color: C.blue },
  { type: "buoy", x: 4960 },
  { type: "ball", x: 5420, r: 32, speed: 120, trigger: 4990 },
  { type: "tramp", x: 5520, w: 90 },
  { type: "plat", x0: 5860, x1: 6560, color: C.coral },
  { type: "buoy", x: 5900 },
  { type: "tramp", x: 5990, w: 90 },
  { type: "cp", x: 6400, n: 3 },

  // ---- Tramo 4: el tobogán y huecos con flotantes ----
  { type: "plat", x0: 6560, x1: 6860, color: C.coral },
  { type: "tramp", x: 6740, w: 90 },
  { type: "tower", x0: 6960, x1: 7160, y: 300 },
  { type: "slide", x0: 7160, x1: 8040, y0: 300, y1: PLAT_Y },
  { type: "photo", x: 7560, y: null, onSlide: true, i: 3 }, // en la bajada del tobogán
  { type: "plat", x0: 8040, x1: 8420, color: C.blue },
  { type: "buoy", x: 8100 },
  { type: "float", x0: 8540, x1: 8700, amp: 18, period: 2.2, phase: 0.6, color: C.lime },
  { type: "float", x0: 8820, x1: 8980, amp: 20, period: 1.9, phase: 2.1, color: C.lime },
  { type: "plat", x0: 9100, x1: 9780, color: C.yellow },
  { type: "buoy", x: 9140 },
  { type: "cp", x: 9560, n: 4 },

  // ---- Tramo 5: sprint final con un gran salto ----
  { type: "plat", x0: 9780, x1: 10050, color: C.yellow },
  { type: "roller", x: 9930, r: 27 },
  { type: "plat", x0: 10170, x1: 10560, color: C.coral },
  { type: "buoy", x: 10210 },
  { type: "tramp", x: 10470, w: 90 },
  { type: "photo", x: 10690, y: 480, i: 4 }, // sobre el gran hueco (en la parábola del trampolín)
  { type: "plat", x0: 10840, x1: 11900, color: C.blue },
  { type: "buoy", x: 10880 },
  { type: "finish", x: 11260 }
];

/** Altura del tobogán en x (bajada que se suaviza al final). */
export function slideY(s, x) {
  const t = Math.min(1, Math.max(0, (x - s.x0) / (s.x1 - s.x0)));
  return s.y1 + (s.y0 - s.y1) * (1 - t) * (1 - t);
}

/** Deriva estructuras de consulta a partir de COURSE. */
export function buildCourse() {
  const by = (t) => COURSE.filter((e) => e.type === t).map((e, k) => ({ ...e, id: `${t}${k}` }));
  const plats = by("plat").map((p) => ({ ...p, y: p.y ?? PLAT_Y, kind: "plat" }));
  const floats = by("float").map((p) => ({ ...p, y: PLAT_Y, kind: "float" }));
  const towers = by("tower").map((p) => ({ ...p, kind: "tower" }));
  const ground = [...plats, ...floats, ...towers].sort((a, b) => a.x0 - b.x0);
  const slides = by("slide");
  const tramps = by("tramp");
  const rollers = by("roller");
  const sweeps = by("sweep");
  const balls = by("ball");
  const cps = by("cp");
  const photos = by("photo").map((p) => (p.onSlide ? { ...p, y: slideY(slides.find((s) => p.x >= s.x0 && p.x <= s.x1), p.x) + 42 } : p));
  const finish = COURSE.find((e) => e.type === "finish");
  // Huecos de agua entre superficies (sin contar el tobogán, que une torre y plataforma)
  const gaps = [];
  for (let k = 0; k < ground.length - 1; k++) {
    const a = ground[k], b = ground[k + 1];
    const slideBetween = slides.some((s) => s.x0 >= a.x1 - 1 && s.x1 <= b.x0 + 1);
    if (b.x0 > a.x1 + 1 && !slideBetween) gaps.push({ id: `gap${k}`, x0: a.x1, x1: b.x0, after: b.x0 + 40 });
  }
  // Marcas de reaparición: salida, boyas y puntos de control (ordenadas)
  const markers = [{ x: 60 }, ...by("buoy").map((b) => ({ x: b.x })), ...cps.map((c) => ({ x: c.x + 30, cp: c.n }))].sort((a, b) => a.x - b.x);
  // "Saltar este obstáculo": posición segura justo después de cada obstáculo
  const hazards = [
    ...rollers.map((o) => ({ id: o.id, kind: "roller", ref: o, after: o.x + o.r + 70 })),
    ...sweeps.map((o) => ({ id: o.id, kind: "sweep", ref: o, after: o.x + o.len + 70 })),
    ...balls.map((o) => ({ id: o.id, kind: "ball", ref: o, after: o.x + 60 })),
    ...towers.map((o) => ({ id: o.id, kind: "tower", ref: o, after: o.x1 + 10 }))
  ];
  const sections = [0, ...cps.map((c) => c.x), finish.x]; // para la barra de progreso
  return { ground, plats, floats, towers, slides, tramps, rollers, sweeps, balls, cps, photos, finish, gaps, markers, hazards, sections, length: finish.x };
}
