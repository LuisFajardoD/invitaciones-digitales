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
| Panel de pruebas (capítulos, calidad, "Regenerar póster y OG") | `…/index.html?debug=1` |
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
| `child.visorPhotoSleeping` | Foto del niño **dormido** (ojos cerrados) en el visor: portada 3D (acurrucado en la luna con Gloobi), `?showcase=1`, póster/OG y portada de la versión ilustrada |
| `child.visorPhotoAwake` | Foto del niño **despierto** (ojos abiertos, sonriendo): al mantener presionado el botón de despegue (fundido cruzado de 0.35 s con destello, al mismo tiempo que Gloobi abre los ojos; si se suelta antes, regresa a dormido) y en todo el resto (despegue, caminata, constelación, recorrido, tripulación, final, versión ilustrada, panel) |
| `child.suitColor`, `child.accentColor` | Traje del astronauta; parche, detalles del traje y cohete |
| `missionName` | "Misión {name}" si es `null`; parches y mensaje de WhatsApp |
| `tagline` | Tarjeta de la caminata espacial (cap. 2) |
| `event.*` | Fecha en la Luna y cuenta regresiva (cap. 4), .ics y Google Calendar, lugar y mapa (cap. 5), Bitácora |
| `itinerary` | Plan de vuelo (cap. 7, puntos de la trayectoria) y Bitácora |
| `dressCode` | "Uniforme de la misión" (cap. 7) y "Antes del despegue" en la Bitácora |
| `checklist` | "Antes del despegue" en la Bitácora |
| `gifts` | Regalos en burbujas de la bodega (cap. 7; `highlight` = caja dorada con corazón que late, primero en cámara) y Bitácora; tocar una fila de la tarjeta gira la cámara hacia ese regalo |
| `gallery` (6 fotos 3:4) | Polaroids del cinturón de recuerdos (cap. 6), visor de fotos, Bitácora |
| `faq`, `liveStream`, `transport`, `lodging`, `contact` | Bitácora (se ocultan si están desactivados o vacíos); `transport` también en el cap. 5 |
| `hosts` | .ics / Google Calendar |
| `rsvp.*` | Formulario de tripulación, mural (`mockGuests`), mensajes de WhatsApp, `deadlineText` |
| `sound.enabledByDefault` | Sonido inicial (luego se recuerda la elección) |

Fotos del visor (el editor pedirá dos: dormido y despierto): cuadradas, cara centrada ocupando casi todo el alto,
fondo oscuro, ≤ 512 px. Formato `.avif` con una copia `.webp` al lado (mismo nombre) que se usa si el navegador no
decodifica AVIF. Si falta la de dormido se usa la de despierto; si faltan ambas, `assets/placeholders/visor.svg`
(`visorPhotos()` en `data.js`). En 3D la foto se dibuja con viñeta circular fundida con el visor (el rostro ≈ 80 % del
alto visible), se ajusta a la luz de cada escena (`LOOK_*` en `timeline.js`) y el vidrio del casco va encima con un
reflejo sutil.

Confirmaciones con el contrato común `../_shared/rsvp-contract.js` (`avatar: { style: "mission-patch", color, symbol }`,
símbolos `star | rocket | planet | heart | moon | comet`). Sin alergias ni dietas.

## Recursos (acabado final)

Sólo el **astronauta** es un modelo externo (GLB desde Blender). Todo lo demás es arte final hecho con código, en
"realismo estilizado de película animada": materiales PBR con rugosidad variable, metal donde corresponde y
microdetalle con normal maps generados en canvas (`materials.js`: `pbr`, `heightToNormal`, `paperNormal`,
`foilNormal`, `solarTexture`, `litCloudTexture`, `flareTexture`), biseles, paneles, remaches y luces pequeñas, pero con
formas redondeadas y la paleta pastel. Geometrías compartidas en `js/scene/shapes.js` (caja redondeada, corazón,
ruido 3D).

| Recurso | Archivo | Qué tiene |
|---|---|---|
| Portada | `timeline.js`, `moon.js` | Encuadre automático (caja real del grupo luna + astronauta + Gloobi: ~85 % del ancho entre título y botón, se recalcula al cambiar tamaño o modelo), deriva que oscila alrededor del centro |
| Despegue | `launch.js` | Plataforma con franjas y deflector, torre de vigas con reflectores y brazos que se retiran, humo en dos capas con volumen iluminado, nubes con luz de amanecer |
| Tierra | `earth.js` | Océanos con reflejo del sol, continentes estilizados, nubes en capa aparte con sombra, atmósfera fresnel turquesa |
| Caminata | `rocket-procedural.js`, `timeline.js` | Escotilla con aro, cierre y bisagra; cabina con tablero; abertura real en el casco; cordón con franja en espiral y conectores |
| Constelación / plan de vuelo | `constellation.js`, `flightplan.js` | Líneas de luz con grosor variable, núcleo brillante, halo, brillo que recorre el trazo y destellos de 4 puntas |
| Luna y satélites | `moon.js` | Satélites con lámina dorada, alas solares, antena y luz; pantalla con el número legible, en fila sobre la fecha |
| Estación | `station.js` | Módulos con paneles y ventanas cálidas, escotillas, anillos, truss, alas solares, plato, luces de navegación, holograma con proyector |
| Cinturón | `memories.js` | Polaroids de papel con grosor, curvatura, sombra y cinta; asteroides instanciados con cráteres, grietas y cristales |
| Bodega | `cargo.js` | Cajas redondeadas con papel, listón satinado y moño; burbujas de cristal; regalo dorado con corazón y destellos |
| Mural | `rocket-mural.js`, `ui/patch.js` | Placa esmaltada con marco dorado; parches bordados (satín, merrow, relieve y brillo de hilo) |
| Cometas, cielo | `comets.js`, `stars.js`, `nebula.js` | Núcleo, cola en dos capas y polvo fino; estrellas de tamaños y colores variados; nebulosa con vetas de polvo |
| Gloobi | `characters/gloobi.js` | Gomita (clearcoat + sheen), manchas suaves, anillo dorado con grosor que nunca se pone de canto, ojos con doble brillo que miran a la cámara |

**Nada tapa el visor**: `timeline.js → keepVisorClear()` aparta a Gloobi en pantalla si queda delante del casco
(todos los capítulos). En portada, caminata, constelación completa, tripulación y final el visor se ve de frente o
3/4 frontal; en el recorrido (estación, recuerdos, bodega, plan de vuelo) el astronauta va de 3/4 trasero y gira la
cabeza de vez en cuando (el visor se asoma de perfil).

**Rendimiento**: texturas generadas una vez (≤ 1024 px) y compartidas; instancing en asteroides, vigas, estrellas y
partículas; cada parte se construye al acercarse su capítulo; antes de mostrar el 3D se compilan los shaders y se suben
las texturas a la GPU (sin tirones al despegar). En calidad baja: menos segmentos y partículas, mismo diseño.

## Reemplazar modelos (`js/models.js`)

El astronauta usa `assets/models/astronaut.glb`. Los demás recursos también pueden cambiarse por un GLB desde
`js/models.js` (no hay que tocar nada más). Si un archivo falla al cargar, se usa el procedural sin romper nada.

```js
export const models = {
  astronaut: {
    url: "assets/models/astronaut.glb", // un GLB con todas las poses como animaciones…
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
  Uso: `sleep` portada · `fly` despegue y capítulo final · `wave` caminata y despedidas · `celebrate` tripulación y
  al unirse · `float` el resto. Con un GLB animado las poses se mezclan con un fundido cruzado de 0.5 s
  (`AnimationMixer`); el astronauta procedural queda como respaldo si el GLB no carga.
- **Astronauta actual** (`assets/models/astronaut.glb`, 667 KB, ~41.9k triángulos, meshopt): un solo skin
  (`astronaut_body`, 7 materiales) + `visor` (UV frontal para la foto; se aplica con `flipY = false`, convención
  glTF) + `helmet_glass` (se reemplaza por el vidrio fresnel, que también sigue al esqueleto). Sólo huesos de
  deformación; animaciones horneadas `float`, `wave`, `sleep`, `celebrate`, `fly`, en bucle perfecto. Piernas y cadera
  quedan en su pose de reposo (el cuerpo se mueve entero), salvo en `sleep`: pose fija acurrucada, sólo `thigh_fk` y
  `shin_fk` en su eje de flexión (cadera ≈ 68°, rodilla ≈ 86° medidas en los huesos) y los brazos abrazando a Gloobi
  frente al pecho. Fuente y scripts de Blender fuera del repo (`blender-trabajo/`: `11_animaciones.py`,
  verificación `27_verif_sleep.py`). Compresión: `gltf-transform optimize <raw> <out> --compress meshopt
  --simplify false --texture-compress false --palette false --prune-attributes false` (sin `--prune-attributes
  false` se pierden las UV del visor y la foto sale negra).
- **Portada**: el astronauta duerme en la curva interior de la media luna (cuna, abertura arriba a la derecha),
  espalda y casco apoyados en ella, visor de frente a la cámara; Gloobi va a 0.62× en el abrazo (ancla `hugAnchor`
  en el hueso del pecho, `astro.hugWorld()`) y vuelve a su tamaño al despertar. Ajuste en pruebas: `?cres=` y `?cov=`
  (ver `timeline.js`).

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

Primero por nombre exacto de la pose; si no hay, por palabras clave: `float|idle` → float · `fly|vuelo` → fly ·
`wave|hello|saludo` → wave · `sleep` → sleep · `celebrate|happy|jump|cheer` → celebrate · `sit|seat` → sit. Si falta
una pose se usa `float` (o `fly`). Si el modelo no trae animaciones, se aplica movimiento procedural (flotar,
balanceo y giro suave). Un traje con varios materiales sólo tiñe con `suitColor` las piezas blancas.

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
                      constelación, recuerdos, plan de vuelo, carga, mural, cometas, partículas;
                      materials.js (acabados y texturas compartidas), shapes.js (geometrías compartidas)
tools/                regenerar-poster.mjs (póster por proporción + OG desde la escena real)
js/characters/        astronauta (controlador + procedural), cohete, Gloobi (módulo reutilizable), adaptador GLB
js/ui/                portada, tarjetas, progreso, Bitácora, formulario + parche, visor, avisos, ilustraciones SVG
js/fallback/          versión ilustrada (sin WebGL)
```

Gloobi (`js/characters/gloobi.js`) es independiente: `createGloobi({ size })` devuelve un controlador con
`setMode("sleep"|"awake")`, `laugh()`, `spin()`, `wow()`, `point(-1)`, `lookAt(v)`, `follow(v)` y `update(dt, t, camera)`.

## Póster e imagen para compartir — "Regenerar póster y OG"

Mientras carga el 3D se ve un póster de la portada. Hay una variante por proporción de pantalla en `assets/poster/`
(`poster-9x19.5.webp`, `poster-9x16.webp`, `poster-3x4.webp` y `poster-16x9.webp` para la vitrina) y un script en
línea de `index.html` elige la más cercana al cargar, con `object-fit: cover` y el mismo punto focal que la cámara 3D.
El paso al 3D es un fundido de 0.4 s y sólo ocurre cuando el 3D ya pintó un frame completo (astronauta GLB, foto,
shaders y texturas listos); la deriva de la cámara empieza en la misma fase con la que se genera el póster, así que
nada salta de lugar. `assets/og-image.png` (1200×630) es la imagen para compartir.

**Cada vez que cambie la portada** (escena, modelos, encuadre o textos), regenerar todo con:

```
node public/prototipos/mision-estrella/tools/regenerar-poster.mjs
```

Abre la invitación real con Playwright (GPU real), espera a que el 3D esté listo, captura cada variante con el mismo
encuadre que se ve, escribe `assets/poster/*.webp` y `assets/og-image.png`, y actualiza en `index.html` la lista de
variantes con su punto focal. En `?debug=1` también está el botón "Regenerar póster y OG", que descarga el póster de
la proporción actual (y la OG si la ventana está en horizontal).
Los metadatos del `<head>` son estáticos: en la app real, el servidor debe rellenarlos desde `demoData`.
