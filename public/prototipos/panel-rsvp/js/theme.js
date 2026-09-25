// Carga y aplica un tema: tokens → variables CSS, fuentes → <link>, estilo de UI → data-atributos.
// El panel y la hoja imprimible sólo leen estas variables; ningún color de tema vive en su código.
export const THEMES = ["temporada-8", "isla-cubo", "el-circuito", "mision-estrella", "default"];

export async function loadTheme(id) {
  const safe = THEMES.includes(id) ? id : "default";
  const mod = await import(`../themes/${safe}.js`);
  return mod.default;
}

const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

export function applyTheme(theme, root = document.documentElement) {
  for (const [k, v] of Object.entries(theme.tokens)) root.style.setProperty(`--t-${kebab(k)}`, v);
  root.style.setProperty("--f-display", theme.fonts.display);
  root.style.setProperty("--f-body", theme.fonts.body);
  root.style.setProperty("--f-display-weight", String(theme.fonts.displayWeight ?? 700));
  root.dataset.theme = theme.id;
  root.dataset.panel = theme.ui.panel;
  root.dataset.button = theme.ui.button;
  let link = document.getElementById("theme-fonts");
  if (!link) { link = Object.assign(document.createElement("link"), { id: "theme-fonts", rel: "stylesheet" }); document.head.append(link); }
  if (link.href !== theme.fonts.href) link.href = theme.fonts.href;
}

/** Espera a que las fuentes del tema estén listas (con tope). */
export async function fontsReady(theme, timeout = 3000) {
  if (!document.fonts?.load) return;
  const fam = (s) => s.split(",")[0].trim();
  const loads = [document.fonts.load(`${theme.fonts.displayWeight ?? 700} 24px ${fam(theme.fonts.display)}`), document.fonts.load(`400 16px ${fam(theme.fonts.body)}`)];
  await Promise.race([Promise.all(loads).catch(() => {}), new Promise((r) => setTimeout(r, timeout))]);
  await document.fonts.ready.catch?.(() => {});
}
