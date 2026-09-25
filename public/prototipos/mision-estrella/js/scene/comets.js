// Lluvia de cometas de colores (al unirse a la tripulación). Pool fijo de billboards aditivos con cola.
import * as THREE from "three";
import { canvasTex } from "./materials.js";
import { createSprites } from "./particles.js";

const COLORS = ["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF", "#9BE5B4", "#FFC9A0"];
function cometTexture() {
  return canvasTex(256, 64, (c, w, hh) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.75, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g; c.beginPath(); c.moveTo(0, hh / 2); c.quadraticCurveTo(w * 0.7, hh * 0.18, w - hh / 2, hh * 0.22); c.arc(w - hh / 2, hh / 2, hh * 0.28, -Math.PI / 2, Math.PI / 2); c.quadraticCurveTo(w * 0.7, hh * 0.82, 0, hh / 2); c.fill();
    const r = c.createRadialGradient(w - hh / 2, hh / 2, 0, w - hh / 2, hh / 2, hh / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = r; c.fillRect(w - hh, 0, hh, hh);
  });
}

export function createComets({ count = 28 } = {}) {
  const sprites = createSprites({ count, texture: cometTexture(), additive: true, renderOrder: 6 });
  sprites.hideAll();
  const pool = Array.from({ length: count }, () => ({ life: -1, p: new THREE.Vector3(), v: new THREE.Vector3(), col: "#fff", size: 1 }));
  let queue = 0, acc = 0;
  const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
  return {
    mesh: sprites.mesh,
    burst(n = 24) { queue += n; },
    update(dt, camera) {
      camera.getWorldDirection(fwd); right.crossVectors(fwd, camera.up).normalize(); up.crossVectors(right, fwd).normalize();
      acc += dt;
      while (queue > 0 && acc > 0.06) {
        acc -= 0.06; queue--;
        const c = pool.find((x) => x.life < 0); if (!c) break;
        c.life = 0;
        c.p.copy(camera.position).addScaledVector(fwd, 9 + Math.random() * 8).addScaledVector(right, (Math.random() - 0.3) * 12).addScaledVector(up, 6 + Math.random() * 3);
        c.v.copy(right).multiplyScalar(-(4 + Math.random() * 3)).addScaledVector(up, -(6 + Math.random() * 3));
        c.col = COLORS[(Math.random() * COLORS.length) | 0]; c.size = 0.9 + Math.random() * 0.8;
      }
      if (queue <= 0) acc = 0;
      // ángulo en pantalla de la velocidad (igual para todos: caen en diagonal)
      tmp.copy(right).multiplyScalar(-5).addScaledVector(up, -7.5);
      const ang = Math.atan2(tmp.dot(up), tmp.dot(right));
      pool.forEach((c, i) => {
        if (c.life < 0) { sprites.hide(i); return; }
        c.life += dt; if (c.life > 1.8) { c.life = -1; sprites.hide(i); return; }
        c.p.addScaledVector(c.v, dt);
        sprites.set(i, c.p.x, c.p.y, c.p.z, c.size, ang, c.col, Math.sin(Math.min(1, c.life / 1.8) * Math.PI), 4);
      });
      sprites.commit();
    }
  };
}
