// Indicador de progreso: mini constelación vertical de 9 puntos a la derecha. El punto activo brilla y al tocar
// uno se hace scroll suave a ese capítulo.
import { h } from "../util.js";

export function createProgress(root, { labels, onGo }) {
  const dots = labels.map((l, i) => h("button.dot", { type: "button", "aria-label": `Ir al capítulo ${i + 1}: ${l}`, onclick: () => onGo(i + 1) }, h("span")));
  const el = h("nav.progress", { "aria-label": "Capítulos" }, h("span.progress-line", { "aria-hidden": "true" }), ...dots);
  root.append(el);
  let cur = 0;
  return {
    el,
    show(v) { el.classList.toggle("is-on", v); },
    set(i) {
      if (i === cur) return; cur = i;
      dots.forEach((d, k) => { d.classList.toggle("is-on", k + 1 === i); d.classList.toggle("is-past", k + 1 < i); d.setAttribute("aria-current", k + 1 === i ? "step" : "false"); });
    }
  };
}
