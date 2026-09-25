// Capítulo 7 (primera parte): trayectoria orbital curva que se dibuja con el scroll, con un punto luminoso por
// cada evento del itinerario. El punto activo crece y brilla.
import * as THREE from "three";
import { halo } from "./materials.js";
import { demoData } from "../data.js";

export function createFlightPlan() {
  const group = new THREE.Group(); group.name = "flightplan";
  const pts = [];
  for (let i = 0; i <= 60; i++) { const a = -0.3 + (i / 60) * Math.PI * 1.25; pts.push(new THREE.Vector3(Math.cos(a) * 9, Math.sin(a * 1.6) * 1.8 + (i / 60) * 2.5 - 1.2, Math.sin(a) * 5.5)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, 240, 0.06, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color: "#FFD27A", transparent: true, opacity: 0.95, toneMapped: false });
  const path = new THREE.Mesh(tube, mat); group.add(path);
  const ghost = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: "#B9A2FF", transparent: true, opacity: 0.18, depthWrite: false })); group.add(ghost);
  const total = tube.index.count;
  const events = demoData.itinerary.map((ev, i) => {
    const u = (i + 0.6) / (demoData.itinerary.length + 0.2);
    const p = curve.getPointAt(u);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshBasicMaterial({ color: "#FFF7EC", toneMapped: false })); dot.position.copy(p); group.add(dot);
    const glow = halo(["#FF8FA3", "#6FD6E8", "#FFD27A", "#B9A2FF"][i % 4], 2.2, 0.6); glow.position.copy(p); group.add(glow);
    return { u, dot, glow };
  });
  const head = halo("#FFF7EC", 1.6, 0.9); group.add(head);
  return {
    group, events, curve,
    /** progress 0–1 del trazo; devuelve el índice del evento activo (o -1). */
    update(dt, t, progress) {
      path.geometry.setDrawRange(0, Math.floor(total * progress / 3) * 3);
      head.position.copy(curve.getPointAt(Math.max(0.001, Math.min(0.999, progress))));
      head.visible = progress > 0.01 && progress < 0.999;
      let active = -1;
      events.forEach((e, i) => {
        const reached = progress >= e.u - 0.02;
        if (reached) active = i;
        const s = reached ? 1 : 0.35;
        e.dot.scale.setScalar(THREE.MathUtils.damp(e.dot.scale.x, s * (active === i ? 1.35 : 1), 8, dt));
        e.glow.material.opacity = reached ? (0.45 + 0.25 * Math.sin(t * 3 + i)) * (active === i ? 1.4 : 0.8) : 0.08;
      });
      return active;
    }
  };
}
