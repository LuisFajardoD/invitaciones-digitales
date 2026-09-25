// Registro de modelos intercambiables. Para usar un modelo real basta con poner su ruta aquí:
//   url:   un GLB con todo (poses como animaciones: float|idle, fly, wave|hello, sleep, celebrate|happy|jump, sit).
//   poses: (sólo astronauta) un GLB por pose, con la misma geometría. Tiene prioridad sobre url para esa pose.
// Si un archivo falla al cargar, se usa el modelo procedural (build: "procedural") sin romper nada.
// Ver README.md → "Reemplazar modelos".
export const models = {
  astronaut: {
    // GLB animado (float, wave, sleep, celebrate, fly; mallas "visor" y "helmet_glass"). Fundido de 0.5 s entre poses.
    url: "assets/models/astronaut.glb",
    poses: { fly: null, wave: null, sleep: null, celebrate: null, sit: null }, // ej. fly: "assets/models/astronaut-fly.glb"
    build: "procedural",
    height: 1.0 // altura objetivo en unidades de escena (el casco mide ~45 %)
  },
  rocket: { url: null, build: "procedural", height: 4.6 },
  moon: { url: null, build: "procedural", height: 24 }, // diámetro
  crescent: { url: null, build: "procedural", height: 2.2 }, // media luna de la portada
  station: { url: null, build: "procedural", height: 7 }
};
