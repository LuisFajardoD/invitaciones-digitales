// Picking: raycast contra cajas simplificadas (Box3) de cada construcción, el perrito y los bloques del muro.
import * as THREE from "../../vendor/three.module.min.js";

export function createPicker({ camera, island, fx, root }) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  let wallBoxes = () => [];
  return {
    setWallBoxes(fn) { wallBoxes = fn; },
    /** x, y en px relativos al canvas. Devuelve { type, index } o null. */
    pick(x, y, w, h) {
      ndc.set((x / w) * 2 - 1, -(y / h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const off = root.position.y;
      const tryBox = (box) => {
        const b = box.clone(); b.min.y += off; b.max.y += off;
        return ray.ray.intersectBox(b, hit) ? ray.ray.origin.distanceTo(hit) : Infinity;
      };
      // Objetos pequeños primero (perrito, marcos de fotos del Mirador, bloques del muro)
      if (fx.dog && tryBox(fx.dog.box) < Infinity) return { type: "dog" };
      const photo = fx.pickFrame?.(ray);
      if (photo != null) return { type: "photo", index: photo };
      const wb = wallBoxes();
      for (let i = 0; i < wb.length; i++) if (tryBox(wb[i]) < Infinity) return { type: "guest", index: i };
      let best = null, bestD = Infinity;
      island.stops.forEach((s, i) => {
        const d = tryBox(s.box);
        if (d < bestD) { bestD = d; best = { type: "stop", index: i }; }
      });
      return best;
    }
  };
}
