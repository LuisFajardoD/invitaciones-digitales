# Misión Estrella (prototipo aislado)

Invitación estrella de Gloobi, tema astronautas: una película espacial 3D que avanza con el scroll, protagonizada
por el niño (su foto va dentro del visor del casco) y acompañada por **Gloobi**, la mascota de la marca.
HTML + CSS + JavaScript vanilla (ES modules), sin build. Three.js r169 vendorizado en `vendor/`.

## Abrir

La app sirve los prototipos sólo con `index.html` explícito:

| Modo | URL |
|---|---|
| Normal | `/prototipos/mision-estrella/index.html` |
| Demo (sin localStorage, aviso en vez de WhatsApp) | `…/index.html?demo=1` |
| Vitrina para el home (sólo portada en loop, sin UI ni sonido) | `…/index.html?showcase=1` (con título: `&title=1`) |
| Panel de pruebas | `…/index.html?debug=1` |
| Versión ilustrada (sin WebGL) | `…/index.html?nowebgl=1` |
| Forzar calidad | `…/index.html?q=low\|medium\|high` |
| Forzar movimiento reducido | `…/index.html?reduced=1` |
| Panel RSVP con este tema | `/prototipos/panel-rsvp/index.html?theme=mision-estrella` |

## Datos (`js/data.js`)

Todo texto o dato variable sale de `demoData` (misma estructura base que las otras invitaciones + los campos que ya
maneja el editor). Plantillas en textos: `{name}`, `{age}`, `{missionName}`.

| Campo | Dónde se usa |
|---|---|
| `child.name`, `child.age` | Título, insignia, constelación (cap. 3), tarjetas, parches, WhatsApp |
| `child.visorPhoto` | Foto circular dentro del visor del casco (3D, versión ilustrada, panel) |
| `child.suitColor`, `child.accentColor` | Traje del astronauta; parche, detalles del traje y cohete |
| `missionName` | "Misión {name}" si es `null`; parches y mensaje de WhatsApp |
| `tagline` | Tarjeta de la caminata espacial (cap. 2) |
| `event.*` | Fecha en la Luna y cuenta regresiva (cap. 4), .ics y Google Calendar, lugar y mapa (cap. 5), Bitácora |
| `itinerary` | Plan de vuelo (cap. 7, puntos de la trayectoria) y Bitácora |
| `dressCode` | "Uniforme de la misión" (cap. 7) y "Antes del despegue" en la Bitácora |
| `checklist` | "Antes del despegue" en la Bitácora |
| `gifts` | Cápsulas de carga (cap. 7; `highlight` = dorada con halo) y Bitácora |
| `gallery` (6 fotos 3:4) | Polaroids del cinturón de recuerdos (cap. 6), visor de fotos, Bitácora |
| `faq`, `liveStream`, `transport`, `lodging`, `contact` | Bitácora (se ocultan si están desactivados o vacíos); `transport` también en el cap. 5 |
| `hosts` | .ics / Google Calendar |
| `rsvp.*` | Formulario de tripulación, mural (`mockGuests`), mensajes de WhatsApp, `deadlineText` |
| `sound.enabledByDefault` | Sonido inicial (luego se recuerda la elección) |

Confirmaciones con el contrato común `../_shared/rsvp-contract.js` (`avatar: { style: "mission-patch", color, symbol }`,
símbolos `star | rocket | planet | heart | moon | comet`). Sin alergias ni dietas.

## Reemplazar modelos (`js/models.js`)

Los modelos actuales son **provisionales hechos con código**. Para usar archivos reales basta con editar
`js/models.js` (no hay que tocar nada más). Si un archivo falla al cargar, se usa el procedural sin romper nada.

```js
export const models = {
  astronaut: {
    url: null,                    // un GLB con todas las poses como animaciones…
    poses: { fly: null, wave: null, sleep: null, celebrate: null, sit: null }, // …o un GLB por pose
    build: "procedural", height: 1.0
  },
  rocket:   { url: "assets/models/rocket.glb",  build: "procedural", height: 4.6 },
  moon:     { url: "assets/models/moon.glb",    build: "procedural", height: 24 },
  crescent: { url: null,                        build: "procedural", height: 2.2 }, // media luna de la portada
  station:  { url: null,                        build: "procedural", height: 7 }
};
```

- Formato `.glb`. Se cargan con `GLTFLoader` + `MeshoptDecoder` (recomendado: `gltf-transform` con meshopt y
  texturas webp ≤ 1024 px, < 1.5 MB por modelo). Poner los archivos en `assets/models/`.
- `js/characters/model-adapter.js` normaliza cualquier GLB: escala por bounding box a `height`, centra el pivote,
  suaviza materiales (sin brillo plástico) y les agrega la luz de borde rosa/turquesa de la escena.
- **Poses del astronauta**: `url` con animaciones, o un GLB por pose en `poses` (misma geometría). Los cambios entre
  GLB distintos sólo ocurren durante transiciones de cámara o fuera de cuadro, con un micro fundido.
  Uso: `sleep` portada · `fly` despegue, capítulos 3–7 · `wave` caminata y tripulación · `celebrate` al unirse ·
  `sit` en la ventana del cohete (capítulo final).

### Nombres de piezas que se reconocen (sin distinguir mayúsculas)

| Pieza | Nombres | Qué pasa |
|---|---|---|
| Visor (foto) | `visor`, `faceplate`, `face_plate` | Su material se reemplaza por la foto del niño (CanvasTexture circular). Si no existe, se crea un casquete curvo dentro del casco (`helmet`/`casco`/`head`, o el 45 % superior). |
| Vidrio del casco | `helmet_glass`, `glass`, `cristal`, `vidrio` | Vidrio con fresnel, reflejo de la nebulosa y brillo especular (sin transmisión física). |
| Traje | `suit`, `body`, `traje` | Se tiñe con `suitColor`. |
| Parche | `patch`, `parche`, `badge`, `emblem` | Se tiñe con `accentColor`; muestra el parche del invitado si ya confirmó. |
| Cohete: ventana | `window`, `hatch`, `ventana`, `cockpit` | Punto donde se ve al astronauta en el capítulo final. |
| Cohete: propulsores | `booster`, `engine`, `nozzle`, `thruster` | De ahí sale el humo y la llama del despegue. |
| Cohete: mural | `mural`, `tank`, `tanque` | Los parches de la tripulación se proyectan sobre su superficie (lado +X). |

### Animaciones que se reconocen

`idle|float|fly` → fly · `wave|hello|saludo` → wave · `sleep` → sleep · `celebrate|happy|jump|cheer` → celebrate ·
`sit|seat` → sit. Si el modelo no trae animaciones, se aplica movimiento procedural (flotar, balanceo y giro suave).

## Arquitectura

```
index.html            póster → escena 3D; importmap de "three"
js/main.js            modos, arranque, portada, despegue, HUD, confirmación, visitas repetidas
js/state.js           localStorage "gloobi:{invitationId}" (try/catch; nada con ?demo=1)
js/quality.js         nivel inicial (GPU/dispositivo) y baja automática si < 45 fps durante 2 s
js/audio.js           Web Audio: música (caja musical + pads, LP 4 kHz, 0.2), efectos 0.5, maestro 0.8 + limitador
js/scene/timeline.js  director: mundo por partes, portada / despegue / capítulos, cámara, personajes, toques
js/scene/scroll.js    scroll nativo por capítulos, suavizado, snap "proximity", bloqueo
js/scene/*.js         cielo, nebulosa (render único a textura), estrellas, Tierra, despegue, Luna, estación,
                      constelación, recuerdos, plan de vuelo, carga, mural, cometas, partículas
js/characters/        astronauta (controlador + procedural), cohete, Gloobi (módulo reutilizable), adaptador GLB
js/ui/                portada, tarjetas, progreso, Bitácora, formulario + parche, visor, avisos, ilustraciones SVG
js/fallback/          versión ilustrada (sin WebGL)
```

Gloobi (`js/characters/gloobi.js`) es independiente: `createGloobi({ size })` devuelve un controlador con
`setMode("sleep"|"awake")`, `laugh()`, `spin()`, `wow()`, `point(-1)`, `lookAt(v)`, `follow(v)` y `update(dt, t, camera)`.

## Póster e imagen para compartir

`assets/poster.webp` (portada, se ve al instante mientras carga el 3D) y `assets/og-image.png` (1200×630) salen de la
escena real: en `?debug=1` → "Exportar póster" descarga ambos PNG (1080×1920 y 1200×630). Convertir el primero a webp.
Los metadatos del `<head>` son estáticos: en la app real, el servidor debe rellenarlos desde `demoData`.
