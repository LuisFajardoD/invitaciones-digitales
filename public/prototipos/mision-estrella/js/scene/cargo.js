// Capítulo 7 (segunda parte): cápsulas de carga flotantes, una por regalo. "Tu presencia" (highlight) es la más
// brillante, dorada, con un halo que pulsa.
import * as THREE from "three";
import { vinyl, halo } from "./materials.js";
import { demoData } from "../data.js";

export function createCargo() {
  const group = new THREE.Group(); group.name = "cargo";
  const body = new THREE.CapsuleGeometry(0.5, 0.8, 8, 20), band = new THREE.TorusGeometry(0.52, 0.07, 8, 32);
  const gifts = [...demoData.gifts].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  const pods = gifts.map((g, i) => {
    const pod = new THREE.Group();
    const top = g.highlight;
    const m = new THREE.Mesh(body, top ? vinyl("#FFD27A", { emissive: new THREE.Color("#8a5a10"), emissiveIntensity: 0.55 }) : vinyl(["#FFF7EC", "#C9C2E8", "#BFEFFF"][i % 3]));
    m.rotation.z = Math.PI / 2; pod.add(m);
    [-0.35, 0.35].forEach((x) => { const b = new THREE.Mesh(band, vinyl(top ? "#FF8FA3" : "#FFD27A")); b.rotation.y = Math.PI / 2; b.position.x = x; pod.add(b); });
    if (top) { const h = halo("#FFD27A", 4.2, 0.6); pod.add(h); pod.userData.halo = h; pod.scale.setScalar(1.35); }
    pod.position.set((i - (gifts.length - 1) / 2) * 2.6, (i % 2 ? -0.5 : 0.4), top ? 1.2 : -0.4 * i);
    pod.userData.base = pod.position.clone();
    group.add(pod);
    return pod;
  });
  return {
    group, pods,
    update(dt, t, show) {
      pods.forEach((p, i) => {
        p.position.y = p.userData.base.y + Math.sin(t * 0.9 + i * 1.3) * 0.25;
        p.rotation.set(Math.sin(t * 0.4 + i) * 0.2, t * 0.25 + i, Math.sin(t * 0.3 + i) * 0.15);
        if (p.userData.halo) p.userData.halo.material.opacity = (0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3))) * show;
      });
    }
  };
}
