// Ilustraciones originales en SVG: nubes, globo de bloques, jugador en caída y planeador.

const NAVY = "#1B2A6B";

const CLOUDS = [
  [[52, 64, 28], [92, 46, 38], [138, 58, 30], [168, 70, 20]],
  [[40, 66, 22], [74, 50, 30], [114, 42, 36], [152, 60, 26]],
  [[60, 60, 30], [104, 52, 34], [146, 66, 22]]
];

/** Nube suave de base plana con sombreado inferior. */
export function cloudSVG(variant = 0, { shade = "#CFEAF8", fill = "#FFFFFF" } = {}) {
  const set = CLOUDS[variant % CLOUDS.length];
  const minX = Math.min(...set.map(([x, , r]) => x - r));
  const maxX = Math.max(...set.map(([x, , r]) => x + r));
  const shape = (dy) =>
    set.map(([x, y, r]) => `<circle cx="${x}" cy="${y + dy}" r="${r}"/>`).join("") +
    `<rect x="${minX + 8}" y="${62 + dy}" width="${maxX - minX - 16}" height="${26}" rx="13"/>`;
  return `<svg viewBox="0 0 200 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
    <g fill="${shade}">${shape(4)}</g><g fill="${fill}">${shape(-2)}</g>
    <g fill="#fff" opacity=".7"><circle cx="${set[1][0] - 8}" cy="${set[1][1] - 12}" r="${set[1][2] * 0.45}"/></g>
  </svg>`;
}

/** Globo aerostático hecho de bloques. */
export function balloonSVG({ head = "#F2C29B", hair = "#3B2A1A", shirt = "#4CC9F0" } = {}) {
  const rows = [4, 6, 8, 8, 8, 6, 4, 2];
  const B = 22;
  const stripe = ["#FF6B6B", "#FFD23F", "#FFF8EC", "#4CC9F0", "#4CC9F0", "#FFF8EC", "#FFD23F", "#FF6B6B"];
  let blocks = "";
  rows.forEach((n, r) => {
    const y = 8 + r * B;
    const x0 = 100 - (n * B) / 2;
    for (let i = 0; i < n; i++) {
      const col = (8 - n) / 2 + i;
      const x = x0 + i * B;
      blocks += `<rect x="${x}" y="${y}" width="${B}" height="${B}" rx="5" fill="${stripe[col]}" stroke="${NAVY}" stroke-width="2.6"/>`;
      blocks += `<rect x="${x + 4}" y="${y + 4}" width="${B * 0.4}" height="${B * 0.22}" rx="2" fill="#fff" opacity=".45"/>`;
      if (col >= 5) blocks += `<rect x="${x + 1.3}" y="${y + 1.3}" width="${B - 2.6}" height="${B - 2.6}" rx="4" fill="${NAVY}" opacity=".12"/>`;
    }
  });
  const neckY = 8 + rows.length * B;
  return `<svg viewBox="0 0 200 300" aria-hidden="true">
    ${blocks}
    <path d="M89 ${neckY} 78 ${neckY + 62}M111 ${neckY} 122 ${neckY + 62}M96 ${neckY} 92 ${neckY + 62}M104 ${neckY} 108 ${neckY + 62}" stroke="${NAVY}" stroke-width="2.4"/>
    <g class="balloon-flame"><path d="M100 ${neckY + 8}c6 8 7 14 0 20-7-6-6-12 0-20z" fill="#FFD23F" stroke="#FF6B6B" stroke-width="2.5" stroke-linejoin="round"/></g>
    <g class="balloon-kid">
      <rect x="86" y="${neckY + 44}" width="28" height="24" rx="5" fill="${head}" stroke="${NAVY}" stroke-width="2.6"/>
      <path d="M86.5 ${neckY + 52}v-3a4 4 0 014-4h19a4 4 0 014 4v3z" fill="${hair}"/>
      <g class="balloon-eyes"><rect x="93" y="${neckY + 55}" width="3.6" height="5" rx="1.2" fill="${NAVY}"/><rect x="103.4" y="${neckY + 55}" width="3.6" height="5" rx="1.2" fill="${NAVY}"/></g>
    </g>
    <rect x="72" y="${neckY + 60}" width="56" height="36" rx="6" fill="#D98E48" stroke="${NAVY}" stroke-width="3"/>
    <rect x="68" y="${neckY + 58}" width="64" height="10" rx="4" fill="#B96F30" stroke="${NAVY}" stroke-width="3"/>
    <path d="M86 ${neckY + 70}v24M100 ${neckY + 70}v24M114 ${neckY + 70}v24" stroke="${NAVY}" stroke-opacity=".35" stroke-width="2.4"/>
    <rect x="${128}" y="${neckY + 72}" width="6" height="10" rx="2" fill="${shirt}" stroke="${NAVY}" stroke-width="2"/>
  </svg>`;
}

/** Jugador en caída libre visto desde arriba, brazos y piernas abiertos. */
export function diverSVG(c) {
  const o = `stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"`;
  const limb = (x, y, rot, top, bottom, w = 13, hgt = 34, split = 0.55) => `
    <g transform="translate(${x} ${y}) rotate(${rot})">
      <rect x="${-w / 2}" y="0" width="${w}" height="${hgt}" rx="4" fill="${bottom}" ${o}/>
      <rect x="${-w / 2 + 1.5}" y="1.5" width="${w - 3}" height="${hgt * split}" rx="3" fill="${top}"/>
    </g>`;
  return `<svg viewBox="0 0 140 150" aria-hidden="true">
    ${limb(56, 88, 28, c.pants, c.shoes, 14, 40, 0.68)}
    ${limb(84, 88, -28, c.pants, c.shoes, 14, 40, 0.68)}
    ${limb(52, 58, 125, c.shirt, c.head, 12, 36, 0.45)}
    ${limb(88, 58, -125, c.shirt, c.head, 12, 36, 0.45)}
    <rect x="52" y="52" width="36" height="42" rx="6" fill="${c.shirt}" ${o}/>
    <rect x="52" y="84" width="36" height="10" rx="3" fill="${c.pants}" ${o}/>
    <rect x="63" y="66" width="14" height="12" rx="3" fill="${c.accent}" ${o} stroke-width="2.4"/>
    <rect x="50" y="16" width="40" height="38" rx="8" fill="${c.hair}" ${o}/>
    <rect x="56" y="22" width="16" height="7" rx="3" fill="#fff" opacity=".2"/>
    <rect x="58" y="46" width="24" height="8" rx="3" fill="${c.head}"/>
  </svg>`;
}

/**
 * Salón visto de frente para el aterrizaje (diseño 400×320, suelo en y≈292).
 * Fachada con cartel, toldo de rayas, puerta iluminada, ventanas y globos a los lados; pin flotando encima.
 */
export function venueFrontSVG(venueName = "") {
  const o = `stroke="${NAVY}" stroke-width="4" stroke-linejoin="round"`;
  const name = String(venueName).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const fs = name.length > 16 ? 15 : 18;
  // Toldo: rayas coral/hueso con borde festoneado
  let stripes = "";
  for (let i = 0; i < 10; i++) stripes += `<rect x="${92 + i * 21.6}" y="196" width="21.6" height="30" fill="${i % 2 ? "#FFF8EC" : "#FF6B6B"}"/>`;
  let scallops = "";
  for (let i = 0; i < 10; i++) scallops += `<path d="M${92 + i * 21.6} 226a10.8 10.8 0 0021.6 0z" fill="${i % 2 ? "#FFF8EC" : "#FF6B6B"}" ${o} stroke-width="3"/>`;
  const balloon = (x, y, c, r = 17) => `
    <path d="M${x} ${y + r} q-6 30 3 ${292 - y - r}" fill="none" stroke="${NAVY}" stroke-width="2" opacity=".7"/>
    <ellipse cx="${x}" cy="${y}" rx="${r * 0.86}" ry="${r}" fill="${c}" ${o} stroke-width="3.5"/>
    <ellipse cx="${x - r * 0.3}" cy="${y - r * 0.35}" rx="${r * 0.2}" ry="${r * 0.28}" fill="#fff" opacity=".6"/>`;
  const bush = (x, s) => `<rect x="${x}" y="${292 - s}" width="${s * 1.3}" height="${s}" rx="${s * 0.3}" fill="#4CAF50" ${o} stroke-width="3.5"/><rect x="${x + 5}" y="${296 - s}" width="${s * 0.5}" height="${s * 0.25}" rx="4" fill="#fff" opacity=".3"/>`;
  return `<svg class="venue-front" viewBox="0 0 400 320" aria-hidden="true">
    <!-- colinas y árboles de bloques al fondo -->
    <path d="M-120 292a180 64 0 01360 0z" fill="#A8E68A"/>
    <path d="M150 292a190 76 0 01380 0z" fill="#9BDF7C"/>
    <rect x="18" y="208" width="34" height="34" rx="9" fill="#52C159" ${o} stroke-width="3"/><rect x="31" y="242" width="8" height="50" fill="#B87A3E"/>
    <rect x="352" y="196" width="38" height="38" rx="10" fill="#3FAE4A" ${o} stroke-width="3"/><rect x="367" y="234" width="8" height="58" fill="#B87A3E"/>
    <!-- edificio -->
    <rect x="98" y="160" width="204" height="12" rx="4" fill="#FF6B6B" ${o}/>
    <rect x="96" y="170" width="208" height="122" rx="6" fill="#FFD23F" ${o}/>
    <rect x="100" y="174" width="200" height="16" fill="#fff" opacity=".25"/>
    <rect x="132" y="118" width="136" height="44" rx="10" fill="#1B2A6B"/>
    <rect x="136" y="122" width="128" height="36" rx="8" fill="#FFF8EC"/>
    <text x="200" y="${146 + (18 - fs) / 3}" text-anchor="middle" font-family="'Lilita One', 'Arial Black', sans-serif" font-size="${fs}" fill="${NAVY}">${name}</text>
    ${stripes}
    <rect x="92" y="196" width="216" height="30" fill="none" ${o}/>
    ${scallops}
    <rect x="114" y="244" width="46" height="34" rx="6" fill="#8FE3FA" ${o} stroke-width="3.5"/><path d="M137 244v34M114 261h46" stroke="${NAVY}" stroke-width="3"/>
    <rect x="240" y="244" width="46" height="34" rx="6" fill="#8FE3FA" ${o} stroke-width="3.5"/><path d="M263 244v34M240 261h46" stroke="${NAVY}" stroke-width="3"/>
    <rect x="172" y="238" width="56" height="56" rx="8" fill="#B96F30" ${o}/>
    <rect x="180" y="246" width="40" height="48" rx="5" fill="#FFE9A8"/>
    <rect x="180" y="246" width="40" height="14" rx="5" fill="#fff" opacity=".6"/>
    ${bush(98, 22)}${bush(272, 22)}
    <!-- globos a los lados de la entrada -->
    ${balloon(66, 150, "#FF6B6B")}${balloon(84, 176, "#4CC9F0", 15)}${balloon(58, 198, "#B388FF", 14)}
    ${balloon(334, 150, "#9BE564")}${balloon(316, 176, "#FFD23F", 15)}${balloon(342, 198, "#FF9E6B", 14)}
    <!-- pin de ubicación flotando encima -->
    <g transform="translate(200 62)"><g class="ground-pin">
      <path d="M0 44C-8 30-30 14-30-8a30 30 0 0160 0C30 14 8 30 0 44z" fill="#FF6B6B" ${o} stroke-width="4.5"/>
      <circle cx="0" cy="-8" r="13" fill="#FFF8EC" ${o} stroke-width="3.5"/>
    </g></g>
  </svg>`;
}

/** Planeador de bloques: ala en V con puntales hacia las manos del jugador. */
export function gliderSVG(c) {
  const B = 24;
  const cols = [c.accent, "#FF6B6B", c.accent, "#FFF8EC", "#FFF8EC", c.accent, "#FF6B6B", c.accent];
  let blocks = "";
  for (let i = 0; i < 8; i++) {
    const x = 14 + i * B;
    const dy = Math.abs(i - 3.5) * 5;
    blocks += `<rect x="${x}" y="${20 + dy}" width="${B}" height="${B * 0.9}" rx="5" fill="${cols[i]}" stroke="${NAVY}" stroke-width="3"/>`;
    blocks += `<rect x="${x + 4}" y="${24 + dy}" width="${B * 0.45}" height="4" rx="2" fill="#fff" opacity=".5"/>`;
    blocks += `<rect x="${x + 1.5}" y="${20 + dy + B * 0.55}" width="${B - 3}" height="${B * 0.3}" rx="3" fill="${NAVY}" opacity=".16"/>`;
  }
  return `<svg viewBox="0 0 220 120" aria-hidden="true">
    <path d="M60 56 84 116M160 56l-24 60M100 46v70M120 46v70" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round"/>
    ${blocks}
    <rect x="98" y="8" width="24" height="14" rx="4" fill="${NAVY}"/>
  </svg>`;
}
