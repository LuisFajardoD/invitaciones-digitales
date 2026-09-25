// Ilustraciones SVG (versión sin WebGL y tema del panel RSVP): astronauta chibi, Gloobi, cohete de juguete,
// Luna, media luna, estación, estrellas. Mismo estilo que la escena 3D: suave, cálido, sin contornos duros.
let uid = 0;
const id = (p) => `${p}${++uid}`;
const CREAM = "#FFF7EC", INK = "#1E1B4B";

/** Gloobi: planeta celeste con anillo dorado, carita y halo. face: "smile" | "sleep" | "wow" | "laugh". (cx, cy, r) */
export function gloobiSVG(cx, cy, r, { face = "smile", ring = true } = {}) {
  const g = id("gl"), h = id("gh");
  const eye = (x) => face === "sleep" || face === "laugh"
    ? `<path d="M${x - r * 0.16} ${cy - r * (face === "laugh" ? 0.02 : 0.06)}q${r * 0.16} ${face === "laugh" ? -r * 0.18 : r * 0.14} ${r * 0.32} 0" fill="none" stroke="${INK}" stroke-width="${r * 0.08}" stroke-linecap="round"/>`
    : `<ellipse cx="${x}" cy="${cy - r * 0.05}" rx="${r * (face === "wow" ? 0.15 : 0.13)}" ry="${r * (face === "wow" ? 0.19 : 0.17)}" fill="${INK}"/><circle cx="${x - r * 0.05}" cy="${cy - r * 0.11}" r="${r * 0.05}" fill="#fff"/>`;
  const mouth = face === "wow" ? `<ellipse cx="${cx}" cy="${cy + r * 0.3}" rx="${r * 0.08}" ry="${r * 0.1}" fill="${INK}"/>`
    : face === "sleep" ? `<ellipse cx="${cx}" cy="${cy + r * 0.3}" rx="${r * 0.05}" ry="${r * 0.04}" fill="none" stroke="${INK}" stroke-width="${r * 0.04}"/>`
      : face === "laugh" ? `<path d="M${cx - r * 0.2} ${cy + r * 0.2}q${r * 0.2} ${r * 0.34} ${r * 0.4} 0z" fill="${INK}"/>`
        : `<path d="M${cx - r * 0.15} ${cy + r * 0.22}q${r * 0.15} ${r * 0.16} ${r * 0.3} 0" fill="none" stroke="${INK}" stroke-width="${r * 0.06}" stroke-linecap="round"/>`;
  const ringBack = `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.55}" ry="${r * 0.42}" transform="rotate(-18 ${cx} ${cy})" fill="none" stroke="#E0A94A" stroke-width="${r * 0.13}"/>`;
  const ringFront = `<path d="M${cx - r * 1.47} ${cy + r * 0.47}A${r * 1.55} ${r * 0.42} -18 0 0 ${cx + r * 1.47} ${cy - r * 0.47}" transform="" fill="none" stroke="#FFC96B" stroke-width="${r * 0.13}" stroke-linecap="round"/>`;
  return `<g class="gloobi">
    <defs><radialGradient id="${h}"><stop offset="0" stop-color="#8ED8F8" stop-opacity=".55"/><stop offset="1" stop-color="#8ED8F8" stop-opacity="0"/></radialGradient>
    <radialGradient id="${g}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#B7E8FC"/><stop offset=".6" stop-color="#8ED8F8"/><stop offset="1" stop-color="#6FC3EA"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="url(#${h})"/>
    ${ring ? ringBack : ""}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>
    <circle cx="${cx - r * 0.45}" cy="${cy - r * 0.5}" r="${r * 0.22}" fill="#B7E8FC" opacity=".8"/><circle cx="${cx + r * 0.55}" cy="${cy + r * 0.45}" r="${r * 0.18}" fill="#6FC3EA" opacity=".7"/>
    ${eye(cx - r * 0.34)}${eye(cx + r * 0.34)}
    <ellipse cx="${cx - r * 0.56}" cy="${cy + r * 0.18}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#FF8FA3" opacity=".75"/><ellipse cx="${cx + r * 0.56}" cy="${cy + r * 0.18}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#FF8FA3" opacity=".75"/>
    ${mouth}
    ${ring ? ringFront : ""}
  </g>`;
}

/**
 * Astronauta chibi (pies en (x, y), altura ~ 200·s). pose: "float" | "wave" | "sleep". photo: URL del visor.
 */
export function astronautSVG(x, y, s = 1, { pose = "float", photo = null, suit = "#F4F1FA", accent = "#FF8FA3", patch = null } = {}) {
  const v = id("vi"), sg = id("sg"), hg = id("hg");
  const dark = "#BDB6DA";
  const armR = pose === "wave" ? `<g transform="rotate(-150 64 118)"><rect x="54" y="108" width="22" height="46" rx="11" fill="url(#${sg})"/><circle cx="65" cy="158" r="13" fill="${dark}"/></g>` : `<g transform="rotate(${pose === "sleep" ? -60 : 20} 64 118)"><rect x="54" y="108" width="22" height="46" rx="11" fill="url(#${sg})"/><circle cx="65" cy="158" r="13" fill="${dark}"/></g>`;
  const armL = `<g transform="rotate(${pose === "sleep" ? 60 : -25} 136 118)"><rect x="124" y="108" width="22" height="46" rx="11" fill="url(#${sg})"/><circle cx="135" cy="158" r="13" fill="${dark}"/></g>`;
  const legs = pose === "sleep"
    ? `<g transform="rotate(-70 86 176)"><rect x="76" y="168" width="22" height="34" rx="11" fill="url(#${sg})"/><ellipse cx="87" cy="204" rx="15" ry="11" fill="${dark}"/></g><g transform="rotate(-50 114 176)"><rect x="104" y="168" width="22" height="34" rx="11" fill="url(#${sg})"/><ellipse cx="115" cy="204" rx="15" ry="11" fill="${dark}"/></g>`
    : `<g transform="rotate(${pose === "float" ? 12 : 4} 86 176)"><rect x="76" y="168" width="22" height="34" rx="11" fill="url(#${sg})"/><ellipse cx="87" cy="206" rx="16" ry="11" fill="${dark}"/></g><g transform="rotate(${pose === "float" ? -16 : -4} 114 176)"><rect x="104" y="168" width="22" height="34" rx="11" fill="url(#${sg})"/><ellipse cx="115" cy="206" rx="16" ry="11" fill="${dark}"/></g>`;
  const tilt = pose === "sleep" ? "rotate(-28 100 120)" : pose === "float" ? "rotate(-6 100 120)" : "";
  return `<g transform="translate(${x - 100 * s} ${y - 214 * s}) scale(${s})"><g transform="${tilt}">
    <defs>
      <linearGradient id="${sg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="${suit}"/><stop offset="1" stop-color="#D9D2F0"/></linearGradient>
      <radialGradient id="${hg}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="${suit}"/><stop offset="1" stop-color="#CFC6EC"/></radialGradient>
      <clipPath id="${v}"><circle cx="100" cy="78" r="44"/></clipPath>
    </defs>
    <rect x="62" y="104" width="76" height="64" rx="26" fill="${dark}"/>
    ${legs}
    <rect x="66" y="104" width="68" height="76" rx="32" fill="url(#${sg})"/>
    <rect x="66" y="160" width="68" height="9" rx="4.5" fill="${accent}"/>
    ${patch ? `<g transform="translate(106 118) scale(.26)">${patch}</g>` : `<circle cx="113" cy="130" r="11" fill="${accent}"/><path d="M113 123.5l2 4.1 4.5.6-3.3 3.1.8 4.5-4-2.2-4 2.2.8-4.5-3.3-3.1 4.5-.6z" fill="${CREAM}"/>`}
    ${armL}${armR}
    <circle cx="100" cy="78" r="60" fill="url(#${hg})"/>
    <circle cx="100" cy="78" r="47" fill="${accent}"/>
    <circle cx="100" cy="78" r="44" fill="#1A1640"/>
    ${photo ? `<image href="${photo}" x="56" y="34" width="88" height="88" preserveAspectRatio="xMidYMid slice" clip-path="url(#${v})"/>` : ""}
    <circle cx="100" cy="78" r="44" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
    <path d="M70 60a36 36 0 0 1 30-20" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="7" stroke-linecap="round"/>
    <circle cx="124" cy="58" r="4" fill="#fff" opacity=".7"/>
    <path d="M70 26l-8-16" stroke="${dark}" stroke-width="4" stroke-linecap="round"/><circle cx="61" cy="8" r="6" fill="${accent}"/>
  </g></g>`;
}

/** Cohete de juguete (base en (x, y), alto ~ 300·s). */
export function rocketSVG(x, y, s = 1, { accent = "#FF8FA3", flame = false, photo = null } = {}) {
  const bg = id("rb"), cl = id("rc");
  return `<g transform="translate(${x - 100 * s} ${y - 300 * s}) scale(${s})">
    <defs><linearGradient id="${bg}" x1="0" x2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="${CREAM}"/><stop offset="1" stop-color="#D9D2F0"/></linearGradient><clipPath id="${cl}"><circle cx="100" cy="128" r="25"/></clipPath></defs>
    ${flame ? `<g class="flame"><path d="M78 262q22 70 22 70t22-70z" fill="#FFC9A0"/><path d="M88 262q12 46 12 46t12-46z" fill="#FFF3C4"/></g>` : ""}
    <path d="M100 20C140 50 156 100 156 160c0 44-10 80-22 102H66c-12-22-22-58-22-102 0-60 16-110 56-140z" fill="url(#${bg})"/>
    <path d="M100 20C122 36 136 56 144 80H56c8-24 22-44 44-60z" fill="${accent}"/>
    <rect x="52" y="78" width="96" height="9" rx="4.5" fill="#FFD27A"/>
    <path d="M52 200c-26 12-36 38-36 62h40z" fill="${accent}"/><path d="M148 200c26 12 36 38 36 62h-40z" fill="${accent}"/><path d="M92 222h16v46H92z" fill="${accent}"/>
    <path d="M78 262h44l-6 14H84z" fill="#8C84B8"/>
    <circle cx="100" cy="128" r="31" fill="#FFD27A"/><circle cx="100" cy="128" r="25" fill="#2A2560"/>
    ${photo ? `<image href="${photo}" x="75" y="103" width="50" height="50" preserveAspectRatio="xMidYMid slice" clip-path="url(#${cl})"/>` : ""}
    <path d="M86 116a18 18 0 0 1 14-9" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

export function moonSVG(cx, cy, r, { text = null } = {}) {
  const g = id("mg");
  return `<g><defs><radialGradient id="${g}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF8E8"/><stop offset=".7" stop-color="#F3E6CF"/><stop offset="1" stop-color="#D8C7A8"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.25}" fill="#FFE7C2" opacity=".18"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>
    ${[[-0.4, -0.35, 0.16], [0.35, -0.5, 0.1], [0.5, 0.25, 0.2], [-0.2, 0.5, 0.12], [-0.6, 0.15, 0.08], [0.1, 0.05, 0.06]].map(([dx, dy, rr]) => `<circle cx="${cx + dx * r}" cy="${cy + dy * r}" r="${rr * r}" fill="#E4D3B4" opacity=".8"/>`).join("")}
    ${text ? `<g font-family="Fredoka, system-ui, sans-serif" font-weight="600" fill="#FFB067" text-anchor="middle" style="filter: drop-shadow(0 0 6px rgba(255,176,103,.9))">
      <text x="${cx}" y="${cy - r * 0.36}" font-size="${r * 0.17}">${text.top}</text>
      <text x="${cx}" y="${cy + r * 0.2}" font-size="${r * 0.62}">${text.mid}</text>
      <text x="${cx}" y="${cy + r * 0.52}" font-size="${r * 0.2}">${text.bottom}</text></g>` : ""}
  </g>`;
}

/** Media luna (portada). */
export function crescentSVG(cx, cy, r) {
  const g = id("cg"), m = id("cm");
  return `<g><defs><radialGradient id="${g}" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="#FFF8E8"/><stop offset="1" stop-color="#E6D4B2"/></radialGradient>
    <mask id="${m}"><rect x="${cx - r * 2}" y="${cy - r * 2}" width="${r * 4}" height="${r * 4}" fill="#fff"/><circle cx="${cx + r * 0.45}" cy="${cy - r * 0.2}" r="${r * 0.85}" fill="#000"/></mask></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" mask="url(#${m})"/></g>`;
}

/** Campo de estrellas determinista. */
export function starsSVG(w, h, n = 60, seed = 3) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let out = "";
  for (let i = 0; i < n; i++) { const x = rnd() * w, y = rnd() * h, r = 0.6 + rnd() * rnd() * 2.4; out += `<circle class="tw" style="--d:${(rnd() * 3).toFixed(2)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${rnd() < 0.3 ? "#FFD27A" : CREAM}"/>`; }
  return out;
}

/** Estación espacial sencilla. */
export function stationSVG(cx, cy, s = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <rect x="-150" y="-6" width="300" height="12" rx="6" fill="#C9C2E8"/>
    <rect x="-150" y="-40" width="70" height="80" rx="8" fill="#3D5FCF"/><rect x="80" y="-40" width="70" height="80" rx="8" fill="#3D5FCF"/>
    <path d="M-150 -13h70M-150 13h70M-115 -40v80M80 -13h70M80 13h70M115 -40v80" stroke="#9FD8FF" stroke-width="2"/>
    <rect x="-70" y="-26" width="140" height="52" rx="26" fill="${CREAM}"/>
    <circle cx="0" cy="0" r="34" fill="#E9E4F5"/>
    ${[-46, -30, 30, 46].map((x) => `<circle cx="${x}" cy="0" r="6" fill="#FFE7A8"/>`).join("")}
    <circle cx="0" cy="-6" r="9" fill="#FFE7A8"/>
  </g>`;
}
