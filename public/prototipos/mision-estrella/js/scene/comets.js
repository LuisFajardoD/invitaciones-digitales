// Lluvia de cometas de colores (al unirse a la tripulación). Pool fijo de billboards aditivos: núcleo brillante con
// halo, cola con degradado en dos capas (estela fina y brillante + velo ancho y suave) y partículas finas que se
// desprenden de la cola.
import * as THREE from "three";
import { canvasTex, glowTexture } from "./materials.js";
import { createSprites } from "./particles.js";

const COLORS = ["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF", "#9BE5B4", "#FFC9A0"];
function cometTexture() {
  return canvasTex(512, 96, (c, w, hh) => {
    const cy = hh / 2, hx = w - hh / 2;
    // velo ancho y suave
    let g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.7, "rgba(255,255,255,.22)"); g.addColorStop(1, "rgba(255,255,255,.5)");
    c.fillStyle = g; c.beginPath(); c.moveTo(0, cy); c.quadraticCurveTo(w * 0.72, hh * 0.08, hx, hh * 0.18); c.lineTo(hx, hh * 0.82); c.quadraticCurveTo(w * 0.72, hh * 0.92, 0, cy); c.fill();
    // estela fina y brillante
    g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.55, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,1)");
    c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.1, cy); c.quadraticCurveTo(w * 0.75, hh * 0.36, hx, hh * 0.38); c.lineTo(hx, hh * 0.62); c.quadraticCurveTo(w * 0.75, hh * 0.64, w * 0.1, cy); c.fill();
    // núcleo con halo
    const r = c.createRadialGradient(hx, cy, 0, hx, cy, hh / 2); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.95)"); r.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = r; c.fillRect(w - hh, 0, hh, hh);
  });
}

export function createComets({ count = 28 } = {}) {
  // festejo: caen por delante de todo (sin prueba de profundidad), así el cohete no los tapa
  const sprites = createSprites({ count, texture: cometTexture(), additive: true, depthTest: false, renderOrder: 9 });
  const nDust = count * 8;
  const dust = createSprites({ count: nDust, texture: glowTexture(), additive: true, depthTest: false, renderOrder: 9 });
  sprites.hideAll(); dust.hideAll();
  const group = new THREE.Group(); group.add(sprites.mesh, dust.mesh);
  const pool = Array.from({ length: count }, () => ({ life: -1, p: new THREE.Vector3(), v: new THREE.Vector3(), col: "#fff", size: 1, emit: 0 }));
  const motes = Array.from({ length: nDust }, () => ({ life: -1, p: new THREE.Vector3(), v: new THREE.Vector3(), col: "#fff", s: 0.05, max: 1 }));
  let queue = 0, acc = 0, md = 0;
  const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
  return {
    mesh: group,
    burst(n = 24) { queue += n; },
    update(dt, camera) {
      camera.getWorldDirection(fwd); right.crossVectors(fwd, camera.up).normalize(); up.crossVectors(right, fwd).normalize();
      acc += dt;
      while (queue > 0 && acc > 0.06) {
        acc -= 0.06; queue--;
        const c = pool.find((x) => x.life < 0); if (!c) break;
        c.life = 0; c.emit = 0;
        c.p.copy(camera.position).addScaledVector(fwd, 5 + Math.random() * 5).addScaledVector(right, (Math.random() - 0.2) * 6).addScaledVector(up, 3.2 + Math.random() * 1.8);
        c.v.copy(right).multiplyScalar(-(2.4 + Math.random() * 1.8)).addScaledVector(up, -(3.6 + Math.random() * 1.8));
        c.col = COLORS[(Math.random() * COLORS.length) | 0]; c.size = 0.26 + Math.random() * 0.24;
      }
      if (queue <= 0) acc = 0;
      // ángulo en pantalla de la velocidad (igual para todos: caen en diagonal)
      tmp.copy(right).multiplyScalar(-5).addScaledVector(up, -7.5);
      const ang = Math.atan2(tmp.dot(up), tmp.dot(right));
      pool.forEach((c, i) => {
        if (c.life < 0) { sprites.hide(i); return; }
        c.life += dt; if (c.life > 1.8) { c.life = -1; sprites.hide(i); return; }
        c.p.addScaledVector(c.v, dt);
        const fade = Math.sin(Math.min(1, c.life / 1.8) * Math.PI);
        sprites.set(i, c.p.x, c.p.y, c.p.z, c.size, ang, c.col, fade * 0.8, 5);
        // partículas finas que se desprenden detrás del núcleo
        c.emit += dt * 40;
        while (c.emit >= 1) {
          c.emit -= 1;
          const m = motes[md]; md = (md + 1) % nDust;
          m.life = 0; m.max = 0.5 + Math.random() * 0.7; m.col = Math.random() < 0.5 ? c.col : "#FFF7EC"; m.s = 0.02 + Math.random() * 0.05 * c.size;
          m.p.copy(c.p).addScaledVector(c.v, -Math.random() * 0.12).addScaledVector(up, (Math.random() - 0.5) * 0.15).addScaledVector(right, (Math.random() - 0.5) * 0.15);
          m.v.copy(c.v).multiplyScalar(0.08).addScaledVector(up, (Math.random() - 0.5) * 0.4).addScaledVector(right, (Math.random() - 0.5) * 0.4);
        }
      });
      motes.forEach((m, i) => {
        if (m.life < 0) { dust.hide(i); return; }
        m.life += dt; if (m.life > m.max) { m.life = -1; dust.hide(i); return; }
        m.p.addScaledVector(m.v, dt);
        const k = m.life / m.max;
        dust.set(i, m.p.x, m.p.y, m.p.z, m.s * (1 - k * 0.5), 0, m.col, (1 - k) * 0.9);
      });
      sprites.commit(); dust.commit();
    }
  };
}
