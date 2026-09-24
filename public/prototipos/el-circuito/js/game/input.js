// Entrada: tocar en cualquier parte del canvas = saltar; mantener = salto un poco más alto; segundo
// toque en el aire = doble salto. Teclado: barra espaciadora o flecha arriba.
export function createInput(target) {
  const st = { pressed: false, held: false, enabled: true, onPress: null };
  let pointers = 0, keyDown = false;
  const press = () => { if (!st.enabled) return; st.pressed = true; st.held = true; st.onPress?.(); };
  const release = () => { if (pointers <= 0 && !keyDown) st.held = false; };
  target.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    pointers++;
    try { target.setPointerCapture(e.pointerId); } catch { /* nada */ }
    press();
  });
  const up = () => { pointers = Math.max(0, pointers - 1); release(); };
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", up);
  target.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" && e.key !== "ArrowUp") return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || tag === "SELECT") return;
    e.preventDefault();
    if (e.repeat) return;
    keyDown = true; press();
  });
  window.addEventListener("keyup", (e) => { if (e.code === "Space" || e.key === "ArrowUp") { keyDown = false; release(); } });
  /** Consume el "toque" de este paso (flanco). */
  st.take = () => { const p = st.pressed; st.pressed = false; return p; };
  st.reset = () => { st.pressed = false; st.held = false; pointers = 0; keyDown = false; };
  return st;
}
