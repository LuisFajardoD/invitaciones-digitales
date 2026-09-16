# Cambios recientes

## 2026-09-16 - Eliminación de carpeta de imágenes legacy site-shell/assets/img
- Se desenlazaron las rutas `../img/` y `/assets/site-shell/assets/img/` en `components/site/Landing.module.css` y `public/assets/site-shell/assets/css/style.css`, redirigiéndolas a los recursos unificados de `public/assets/gloobi-home/` o a `none` para máscaras no utilizadas.
- Se eliminó definitivamente la carpeta legacy `public/assets/site-shell/assets/img` para evitar consumo de almacenamiento innecesario en el servidor.
- Validación aprobada con `npm run css:guard` y `npm run build`.

## 2026-09-15 - Video configurado del encabezado sin destello anterior
- El Home ya no descarga ni muestra primero el video estático de respaldo antes de recibir la configuración del CRM.
- La pantalla carga directamente el video guardado en `pages.home.hero.video_url`, lo revela cuando sus datos están listos y reserva el video original sólo para una falla de la API pública.

## 2026-09-15 - Selección de demos Web Premium destacadas
- La sección `05 · Demos destacadas` de `/admin/site` permite elegir cuatro invitaciones publicadas clasificadas como `Web Premium`, con posiciones independientes y sin duplicados.
- Las cuatro tarjetas del Home toman de esa selección su invitación, título, descripción y enlace, conservando la carga diferida de los iframes.
- Las invitaciones Web Premium que se agreguen al catálogo quedan disponibles automáticamente en el selector del editor.

## 2026-09-15 - Carga inicial del Home y título dinámico
- El contenido recibido desde el CRM ya no reemplaza las letras de “Hazlo Mágico” cuando el texto no cambió; cuando sí cambia, el título vuelve a registrar y ejecutar su animación.
- Los cuatro demos destacados, el demo del comparador y la tarjeta de mensaje conservan `data-src` hasta acercarse al viewport. Esto evita cargar aplicaciones embebidas durante la apertura del Home y elimina reasignaciones redundantes de `src`.

## 2026-09-15 - Animación de entrada de “Hazlo Mágico”
- Se restauró la onda automática de letras del encabezado del Home y se programó una repetición breve cada pocos segundos para que permanezca perceptible después de la carga. El título también permite reiniciar la animación con un clic, pausa su ciclo cuando la pestaña está oculta y respeta `prefers-reduced-motion`.

## 2026-09-15 - Slider de experiencias sobre el velo global
- Se elevó como una sola capa el slider de dos imágenes y un video del Home, incluidos sus textos y controles, para evitar que el velo global oscuro o claro cubra su contenido.

## 2026-09-15 - Tarjetas de precios sin botones internos

- Se retiraron los cinco botones `Cotizar invitación` y los cuatro botones `Agregar extra` de las tarjetas del Home porque no ejecutaban una acción útil.
- El espacio liberado se asignó a los encabezados y listas, eliminando el traslape entre descripciones, precios y características en escritorio y móvil.

## 2026-09-14 - Editor integral del sitio público en el CRM

- `/admin/site` dejó de editar la landing React histórica y ahora organiza el sitio vigente en seis pestañas identificables: Home, Muestras, Sobre Gloobi, FAQ, Contacto y Acceso CRM.
- Cada pestaña presenta las secciones en el mismo orden de la página pública y permite editar visibilidad, textos, botones, imágenes, videos, fondos dark/light y contenido repetible según corresponda.
- El Home incorpora edición de hero, fondo global, categorías, comparativa, demos, beneficios, video de compartir, galería visual, tipos de celebración, paquetes/precios, proceso, tarjeta de mensaje y footer.
- Muestras conecta encabezado, fondo líquido, filtros, demos publicados y footer con `/invitaciones`; Sobre Gloobi conecta principios y galería; FAQ permite agregar/quitar preguntas; Contacto conecta canales, formulario y WhatsApp; Acceso CRM conecta la presentación del login.
- Se añadieron `GET /api/public/site` para lectura pública y `POST /api/admin/site/media` para subir imágenes o videos desde el editor.
- `public/assets/site-shell/assets/js/gloobi-site-content.js` aplica los datos guardados a las páginas HTML actuales. Los fondos líquidos conservan las fuentes personalizadas al cambiar de tema.
- Verificación: `npm.cmd run css:guard`, `npm.cmd run build` y smoke Playwright en escritorio/móvil sobre las seis pestañas y las rutas públicas, sin errores de página.

## 2026-09-09 - Auditoría frontend, estilos y rendimiento

- Loader sin mínimo artificial; navegación coherente con la instancia existente de Lenis.
- Tema temprano en HTML y persistencia React protegida; footer mantiene texto claro en ambos temas.
- Pausas por visibilidad, eliminación de intervalo inválido y RAF vendor sin objetivos, carga cercana al viewport de demos.
- Ocho categorías WebP (originales conservados): 22.28 MB a 1.03 MB en total; retirada de CSS duplicado idéntico.
- Tres documentos de auditoría/arquitectura y scripts reproducibles. Build y guard aprobados. Medidas locales y pendientes se detallan en `PERFORMANCE_AUDIT.md`.

## 2026-09-08 - Limpieza definitiva de páginas públicas AIOR y nueva 404

- Se conservaron únicamente los cinco HTML conectados a la navegación pública: `public/index.html`, Sobre Gloobi, Contacto, FAQ y el iframe interno de la tarjeta animada.
- Se eliminaron 39 HTML de demos, variantes, blog, casos, equipo, pricing y otras páginas AIOR sin entrada desde Gloobi; también se retiró el componente histórico que cargaba el fragmento AIOR eliminado.
- La página `error.html` de AIOR fue sustituida por la 404 nativa de Next (`app/not-found.tsx`) con identidad Gloobi, tema claro/oscuro y enlaces al HOME y Contacto.
- Se retiraron la opción `Tienda`, la ruta `/tienda` y sus componentes exclusivos por indicación del propietario del sitio.
- Se eliminó la ilustración AIOR `theme-img/error.png`, que quedó sin uso al retirar la página anterior.

## 2026-09-08 - Rediseño visual del acceso administrativo

- Se rediseñó `/admin/login` con la identidad visual de Gloobi: fondo ambiental, tarjeta de vidrio, logotipo, campos con iconos y CTA morado.
- Se añadió un control accesible para mostrar u ocultar la contraseña y estados adaptables a tema claro, móvil y movimiento reducido.
- Se conservaron sin cambios el envío, la validación, la sesión y la persistencia existente de la opción `Recordarme`.

- Mejora de sección de tarjeta animada (`#mensaje`):
  - **Centrado automático full-screen**: La sección vuelve a ocupar el viewport completo y se centra automáticamente al entrar desde arriba o desde abajo, usando ScrollTrigger/Lenis con fallback nativo para evitar que el usuario tenga que ajustar el scroll manualmente.
  - **Scroll fluido desde el iframe**: `mensaje-card-original.html` delega la rueda del mouse al controlador del sitio; si la sección está parcialmente visible primero hace snap al centro, y si ya está centrada permite continuar a la siguiente sección.
  - **Video de fondo optimizado**: Se añadieron versiones 720p optimizadas (`fondo-tarjeta-optimizado.webm` y `.webm`) y el HTML prioriza MP4 H.264 para mejorar la reproducción frente al WebM VP9 original de mayor peso.
  - **Menos carga de video**: Los videos de fondo autoplay/muted se pausan fuera del viewport y se reanudan al acercarse, reduciendo trabajo de decodificación durante el scroll.
  - **Tono pergamino corregido**: El borde lateral, la cubierta interna y las hojas abiertas de la tarjeta dejan el tono verdoso y usan una paleta miel/pergamino consistente con la portada antigua.

- Rediseño del menu flotante y tarjeta destacada del Home Gloobi:
  - **Rail biselado**: El menu lateral de `public/index.html` adopta el estilo biselado/glass de "Momentos Gloobi", con iconos oscuros solidos, estados activos claros y version movil horizontal.
  - **Orden de navegacion actualizado**: El rail queda como Inicio, Demos, Que puedes incluir, Categorias, logo Gloobi desplegable, Tipos de celebracion, Paquetes, Como funciona y Cotizar.
  - **Logo como dropdown**: El circulo Gloobi abre accesos a paginas del sitio: CRM, Muestras, Tienda y FAQ. Se agregaron las rutas publicas `/tienda` y `/faq` con `components/site/GloobiInfoPage.tsx`.
  - **Tarjeta "Mision espacial" renovada**: La tarjeta destacada usa biselado mas limpio y muestra etiquetas compactas de secciones disponibles: Bitacora, Cuenta regresiva, Ubicacion, Checklist, Mesa de regalos, Itinerario, Confirmacion RSVP, Codigo de vestimenta, Galeria de fotos, Preguntas frecuentes y Contacto.

- Nueva seccion de proceso en el Home Gloobi:
  - **Insercion antes de la tarjeta animada**: Se agrego `#proceso` en `public/index.html` inmediatamente arriba de `#mensaje`, sin modificar el iframe de la tarjeta animada.
  - **Diagrama visual bifurcado**: La seccion explica el flujo desde elegir estilo y compartir datos hasta vista previa, decision, aprobacion o ajustes, con regreso visual desde "Realizo los cambios" hacia "Revisa tu vista previa".
  - **Estilos aislados**: Se agrego el namespace `.gloobi-process` en `public/assets/site-shell/assets/css/gloobi-hero.css`, con fondo transparente sobre el lienzo global, nodos oscuros, acentos violeta/lima y version movil vertical.
  - **Animacion reutilizando AIOR**: `public/assets/site-shell/assets/js/main.js` usa GSAP/ScrollTrigger ya cargados para revelar nodos y dibujar progresivamente las lineas SVG, con fallback inmediato para `prefers-reduced-motion`.

- Reorganizacion puntual del Home Gloobi:
  - **Tematicas infantiles simplificadas**: En `public/index.html` se elimino el badge, titulo y enlaces externos de la seccion `#categorias`, dejando solo las 8 tarjetas con sus imagenes, numeros, nombres y efectos visuales internos.
  - **Tarjetas no navegables**: Se removieron los `href` hacia demos dentro de las tarjetas infantiles y se ajusto el cursor a estado normal en `public/assets/site-shell/assets/css/gloobi-hero.css`.
  - **Orden actualizado**: El bloque existente `#comparativa` ahora aparece inmediatamente despues de las tarjetas infantiles, y el bloque existente `#demos` queda inmediatamente despues del diferenciador, antes de `#features-sec`.
  - **Ritmo visual conservado**: La seccion infantil mantiene una altura minima similar y centra verticalmente la grilla de tarjetas sobre el background global continuo.

- Refuerzo de fondo continuo e iluminacion global del Home:
  - **Capa ambiental robusta**: Se ajusto `body::before` en `public/assets/site-shell/assets/css/gloobi-hero.css` para cubrir el alto real del documento completo, no solo el primer viewport.
  - **Composicion global unica**: Se reemplazo la iluminacion por 7 `radial-gradient` violetas/purpuras muy difusos, distribuidos organicamente de arriba a abajo y alternando lados. Las luces se ajustaron a proporciones circulares y ligeramente mas grandes para evitar halos ovalados horizontales.
  - **Secciones importadas normalizadas**: Se agrego un override final para que las secciones normales del Home importadas desde AIOR/Open9 queden transparentes sobre el lienzo global, sin tocar secciones con imagen/video propio como `#contacto` y `.video-area`.

- Iluminación ambiental continua violeta/púrpura en el lienzo general del Home:
  - **Capa global continua (`body::before`)**: Se implementó una capa ambiental que cubre el 100% del alto del documento sobre el lienzo unificado `#06050b`, con 6 zonas de luz radiales gigantes muy difusas (`ellipse 1000px-1300px`).
  - **Distribución orgánica**: Luces alternadas a los lados (izquierda a 8%, derecha a 92%, etc.) a lo largo de todo el scroll del documento, manteniendo baja opacidad sutil (`0.08` a `0.12`).
  - **Sin bloqueos ni franjas**: Capa asignada con `pointer-events: none; z-index: 0;` que no interrumpe clics, componentes ni secciones con imágenes/videos reales.

- Unificación estricta del lienzo oscuro base (`#06050b`) en todo el Home:
  - **Eliminación de gradientes y bloques de color de sección**: Se eliminaron los valores `background-color` dispares (como `#101014` en Open9, `#090b11` en comparativa, `#16141B`, etc.) y los gradientes CSS exteriores radiales/lineales.
  - **Variable global `--gloobi-home-bg: #06050b;`**: Todas las secciones normales que no son imágenes/videos reales de fondo se volvieron transparentes (`background: transparent !important;`), descansando sobre una sola superficie continua en `#06050b`.
  - **Eliminación de pseudo-elementos e hilos de corte**: Se desactivaron los overlays en ::before/::after de las secciones normales.

- Unificación del fondo oscuro base (`#06050b`) en todo el Home:
  - **Token de background unificado**: Se definió `--gloobi-page-bg: #06050b;` como fondo continuo en `html`, `body` y `body.theme2`.
  - **Superficie oscura sin cortes**: Se asignó `background-color: transparent !important;` a las secciones normales (`.gloobi-category-section`, `.gloobi-comparison-sec`, `.th-feature-revealing-slider`, `.gloobi-benefits-sec`, `.gloobi-gallery-animated-sec`, `.gloobi-extras-sec`, `.service-area6`, `.gloobi-memory-section`, `.footer-layout3`), eliminando franjas y bloques dispares.
  - **Preservación estricta de excepciones**: Se conservaron intactas las secciones con imágenes de fondo (`#compartir` y `#contacto`), videos/slides y la cuadrícula animada Open9 (`#celebration-categories`), así como el fondo propio de tarjetas y componentes.

- Correcciones en el comparador de invitaciones (#comparativa):
  - **Eliminación de lags y movimiento involuntario**: Se eliminó la transición CSS en estado de arrastre (`.is-dragging`) y se sincronizó la actualización del divisor con `requestAnimationFrame` a 60fps instantáneos.
  - **Aceleración del auto-scroll**: Se incrementó la velocidad del scroll automático de la invitación Gloobi dentro del iframe (`scrollStep = 2.4px/frame`) para recorrer toda la invitación de forma rápida y fluida.

- Eliminación de la sección de Testimonios (#testi-sec "Lo que dicen nuestros clientes"):
  - **Remoción en HTML**: Se removió la sección `.testi-area3` en `public/index.html`.

- Implementación de NUEVA sección comparativa "De una imagen a toda una experiencia" (#comparativa):
  - **Ubicación exacta original**: Insertada inicialmente después de "Demos destacadas" (`#demos`) y antes de `#features-sec`; actualmente reubicada entre `#categorias` y `#demos`.
  - **Mockup de teléfono único**: Se utilizó UN SOLO marco de smartphone `.gloobi-comparison__phone` con Dynamic Island, bordes redondeados y sombra continua.
  - **Doble capa recortada por slider**:
    - *Izquierda (Convencional)*: Imagen estática `imagen-sin-gloobi.avif` copiada a `public/assets/gloobi-home/comparativa/imagen-sin-gloobi.avif`.
    - *Derecha (Gloobi)*: Demo real vivo "Misión espacial" servido vía iframe desde la misma fuente `/i/demo-espacio`.
  - **Slider Before/After con divisor y knob blanco**: Reutilización limpia del componente nativo `image-comparison` con `clip-path: inset()`, control táctil, ratón, teclado ARIA y auto-scroll suave del demo.

- Eliminación de la sección pre-footer CTA ("¿Lista para crear una invitación inolvidable?"):
  - **Remoción en HTML**: Se eliminó el bloque `.cta-area2` en `public/index.html` para simplificar la estructura y pasar directamente a la tarjeta animada de mensaje y contacto.

- Renombrado de sección de demos (#demos):
  - **Título actualizado**: Se cambió el nombre de la sección de demos interactivos en `public/index.html` a **"Demos destacadas"**.

- Rediseño tipográfico de títulos en la sección de Experiencias (#features-sec):
  - **Eliminación de "Experiencia 01 / 02 / 03"**: Se removieron los textos `<span class="th-feature-revealing-slide-text">` en los 3 slides.
  - **Formato de texto calado/contorneado (Stroke Outline)**: Se aplicó el estilo de borde en líneas huecas (`-webkit-text-stroke-width: 1.5px`, `-webkit-text-stroke-color: #ffffff`, `color: transparent`) a los títulos principales (*"Tu celebración empieza aquí"*, *"Mira cómo cobra vida"*, *"Hecha para sentirse tuya"*), conservando el efecto hover neón (`#ccff00`).

- Ajuste del gesto de deslizamiento para rotación centralizada en el carrusel de categorías:
  - **Mantenimiento del mazo centrado**: Se eliminó el desplazamiento horizontal acumulativo (`dragOffset`) que desplazaba todas las tarjetas hacia los bordes de la pantalla.
  - **Giro/intercambio rápido por swipe**: Al hacer swipe o arrastrar brevemente a la izquierda/derecha con el ratón o en móvil (`deltaX > 18px`), el carrusel ejecuta inmediatamente el giro de rotación (`nextSlide()` / `previousSlide()`), manteniendo las tarjetas siempre centradas en el foco.

- Reparación de visibilidad de botones laterales y restauración del arrastre suave de tarjetas con mouse:
  - **Elevación de z-index a 300**: Se asignó `z-index: 300 !important` a los botones laterales de navegación (`.gloobi-celebration-arrow`), impidiendo que las tarjetas los tapen o queden por debajo.
  - **Restauración de arrastre táctil y mouse**: Se implementó seguimiento de arrastre en tiempo real (`mousedown`/`mousemove`/`mouseup` y `touchstart`/`touchmove`/`touchend`) que desliza físicamente las tarjetas al arrastrar con el puntero del mouse y cambia de tarjeta al soltar (`click izquierdo arrastra y suelta`).
  - **Bloqueo de drag nativo de imágenes/enlaces**: Se desactivó el arrastre nativo del navegador (`dragstart`) en imágenes y tarjetas para prevenir interferencias y garantizar un deslizamiento 100% fluido.

- Alineación recta, eliminación de transparencia y aceleración del carrusel "Explora por tipo de celebración":
  - **Alineación recta perfecta (0° de rotación)**: Se eliminó la inclinación/inclinado lateral (`rotation = 0deg`) en todas las tarjetas de la sección `#celebration-categories`, dejándolas 100% verticales y rectas exactamente igual al diseño de referencia (*OpenN9*).
  - **Opacidad 100% (sin transparencia)**: Se configuró `opacity: 1` y un fondo oscuro sólido (`#171a25`) para todas las tarjetas visibles, evitando transparencias incómodas y superposiciones translúcidas.
  - **Mayor velocidad de rotación y transición**: Se redujo el tiempo de autoplay a `3200ms` (3.2s) y la duración de animación de transición a `0.42s` en CSS y `450ms` en JS, logrando un intercambio de tarjetas ágil, fluido y dinámico.

- Reemplazo de video YouTube por video local `video-central.webm` en la sección "Compartir":
  - **Reemplazo de iframe por video MP4 nativo**: Se eliminó el enlace y modal a YouTube en la sección *Video Area* ("Compartirla es así de fácil") de `public/index.html`.
  - **Vista previa en frame + reproductor modal HD**: El video `video-central.webm` de `public/assets/gloobi-home/compartir/` ahora se reproduce silenciosamente como vista previa dentro de la tarjeta contenedora y se despliega en un reproductor modal HD nativo con sonido al presionar el botón de play.
  - **Control inteligente de reproducción**: Se implementó auto-play al abrir el modal y auto-pausa al cerrarlo sin librerías externas ni iFrames de terceros.

- Reestructuración y reorganización completa de fotos y videos de `public/index.html`:
  - **Carpeta madre unificada**: Todos los recursos multimedia de la landing principal se ubicaron de forma clara en `public/assets/gloobi-home/`.
  - **Subcarpetas organizadas por sección**: Los assets están agrupados en subcarpetas expresivas con nombres claros (`brand`, `ui`, `tematicas-infantiles`, `experiencias-slider`, `beneficios`, `compartir`, `galeria-visual`, `categorias`, `cta-final`, `testimonios`, `contacto`, `pie-pagina` y `contacto`).
  - **Nombres descriptivos en español**: Los archivos se renombraron (ej. `slide-1-imagen.jpg`, `slide-2-video.mp4`, `infantiles.jpg`, `logo-gloobi.svg`, `flecha-derecha.svg`) para facilitar su identificación y reemplazo inmediato por el usuario sin adivinar.
  - **Actualización de referencias en el sitio**: Se actualizaron las 62 referencias de imágenes/video en `public/index.html` y hojas CSS (`public/assets/site-shell/assets/css/gloobi-hero.css` y `style.css`), eliminando enlaces muertos a la plantilla original.
  - **Reparación de tarjeta animada**: Se corrigió el cierre del tag `<style>` en `mensaje-card-original.html` para evitar fugas de código CSS en texto plano. La tarjeta renderiza ahora de forma perfecta en 3D flotando sobre el fondo violeta oscuro (`#06050b`).
  - **Carga instantánea de botones**: Se fijó la regla CSS explícita en `.gloobi-top-btn` con fondo morado `#7c5cff`, texto blanco `#ffffff` y tapa amarillo lima `#ccff00`, garantizando despliegue inmediato en 0ms sin esperar scripts externos o variables diferidas.

- Solución definitiva a la sección de la tarjeta animada (`#mensaje` / `mensaje-card-original.html`):
  - **Eliminación del bloqueo/brinco de scroll**: Se agregó reenvío de eventos `wheel` dentro de `mensaje-card-original.html` hacia el scroll del sitio. El ajuste posterior de septiembre mantiene la sección en pantalla completa y centra automáticamente el viewport al llegar a `#mensaje`.
  - **Fondo violeta oscuro (#06050b) en Modo Oscuro**: Se aplicó fondo transparente al `body` interno del iframe y `background: #06050b !important;` a la sección externa `.gloobi-memory-section` en Modo Oscuro, integrando la tarjeta perfectamente con el fondo general del sitio.

- Optimización de carga instantánea de botones superiores y corrección de scroll en slider interactivo:
  - **Carga inmediata de botones**: Se eliminó la transición CSS inicial de `0.8s` en pseudo-elementos al renderizarse la página; ahora los botones superiores cargan al instante con 0ms de retraso y mantienen la animación hover fluida.
  - **Desbloqueo de scroll con rueda del mouse**: Se corrigió el interceptor en `public/assets/site-shell/assets/js/main.js` para que la sección de tarjetas animadas (`.th-feature-revealing-slider`) no atrape el scroll de la rueda cuando se encuentra en el primer o último slide, permitiendo continuar navegando hacia arriba o abajo de forma natural y fluida.
  - **Fondo púrpura oscuro (#06050b) en Modo Oscuro**: Se aplicó el tono `#06050b` al contenedor y slides de la sección interactiva en Modo Oscuro para unificarse con el estilo general del sitio.

- Restauración del componente original `th-btn` con animación interactiva hover y dimensión simétrica (`216px x 52px`):
  - Ambos botones ("Ver Invitaciones" y "Cotizar") adoptan exactamente la estructura HTML y estilos nativos del tema (`class="th-btn"`), recuperando la animación fluida donde la tapa amarillo lima (`#ccff00`) se expande al 100% sobre el cuerpo morado (`#7c5cff`) al pasar el cursor.
  - Ambos botones cuentan con exactamente las mismas dimensiones gemelas (`216px x 52px`), manteniendo el centrado perfecto en los bloques a la izquierda y derecha de la ola superior.

- Ajuste de dimensión y posición de la forma central superior (`.gloobi-top-wave`):
  - Se descendió la forma 8px (`top: -21px`), alineando sus curvas inferiores a la parte interior del marco superior en lugar del borde superior exterior.
  - Se incrementó un 50% su ancho (`width: min(1470px, 81vw)`), logrando un barrido más amplio y balanceado en la parte superior del encabezado.
  - Se ajustó la posición de la barra de filtros (`top: 18px`) para conservar un centrado vertical impecable dentro de la forma.

- Desactivación del efecto circular lupa/cursor en el título principal "Hazlo mágico":
  - Se eliminó la clase `.cursor-lg` de `<h1 class="gloobi-hero-title">` y se excluyó el selector en `public/assets/site-shell/assets/js/main.js`, desactivando la expansión del círculo lente/cursor al pasar el mouse por encima del título.

- Ajuste de tono púrpura nocturno elegante (`#18122b`) en el borde y formas del encabezado para Modo Oscuro:
  - En **Modo Oscuro**, el marco contenedor de 12px (`.gloobi-hero-backdrop`), la ola superior (`.gloobi-top-wave`) y las formas del panel izquierdo (`.gloobi-theme-dock-shape` y `.gloobi-card-left-shape`) adoptan el tono púrpura noche suavemente aclarado (`#18122b`).
  - La estructura completa comparte el mismo tono `#18122b`, permitiendo percibir sutilmente el matiz púrpura nocturno sin perder la integración con el fondo general del sitio.

- Elevación de tarjetas inferiores e integración continua del marco blanco:
  - Se ajustó la posición vertical del panel izquierdo (`.gloobi-left-panel`) a `translateY(23px)`, eliminando la micro-línea divisoria de 1-2px y logrando un contacto a ras exacto con el borde del marco blanco.
  - Se eliminó la sombra oscura inferior en los bordes de superposición (`filter: drop-shadow(...)`), logrando una fusión de blanco puro idéntico (`#ffffff`) entre las tarjetas y el marco.

- Corrección del fondo exterior en el encabezado (`.gloobi-hero`) en Modo Oscuro:
  - Se configuró el fondo del contenedor `.gloobi-hero` para que en modo Dark utilice el tono púrpura/violeta casi negro (`#06050b`), de modo que detrás del marco blanco de 12px se aprecie exactamente el mismo color oscuro del resto del sitio.
  - El lienzo interior del hero conserva su animación líquida de burbujas enmarcadas por el borde blanco puro de 12px.

- Implementación del Modo Claro (Light Mode) e icono de Sol en la landing principal:
  - Se corrigió el icono del Sol en el conmutador de tema mapeando el glifo de FontAwesome Pro (`.fa-sun:before { content: "\f185" }`), solucionando la sustitución por el icono del engrane.
  - Se convirtió el conmutador a botones interactivos `<button class="gloobi-btn-dark">` y `<button class="gloobi-btn-light">` con persistencia en `localStorage`.
  - Se implementó la capa completa de estilos **Light Mode** en `public/assets/site-shell/assets/css/gloobi-hero.css` afectando a `#hero`, `#categorias`, `#demos`, `#precios`, `#contacto` y `#footer`, alternando fondos claros (`#f4f6fc` / `#ffffff`), tipografías oscuras legibles (`#0f172a`), tarjetas de cristal con bordes suaves y persistencia de preferencia por usuario.

- Ajuste del marco del encabezado (`.gloobi-hero`) a blanco puro y fondo de sitio por tema:
  - Se configuró el borde exterior y marco contenedor de `.gloobi-hero` y `.gloobi-hero-shell` como blanco sólido puro (`#ffffff`), permitiendo que los botones "Ver Invitaciones", "Cotizar", la barra lateral izquierda y las tarjetas inferiores se fundan de forma limpia y continua con el marco.
  - Se establecieron reglas de fondo temático en `public/assets/site-shell/assets/css/gloobi-hero.css`: en modo **Dark** el fondo exterior utiliza el tono obsidiana púrpura/violeta casi negro (`#06050b`), mientras que en modo **Light** se conserva el fondo neutro claro.

- Restauración de la forma orgánica y fondo 3D en la tarjeta de contacto (`#contacto`):
  - Se regeneró `public/assets/site-shell/assets/img/bg/contact_bg_shape.png` con transparencia alfa para aplicar la máscara con recorte orgánico inclinado en la esquina superior derecha (`mask-image`), ajustando la profundidad y rango horizontal para que no corte el logo ni la tarjeta lateral.
  - Se añadió `margin-top: 48px` en `.gloobi-contact-sec .contact-review` dentro de `public/assets/site-shell/assets/css/gloobi-hero.css` para alinear perfectamente la tarjeta de opinión/logo debajo de la bajada de la máscara.
  - Se actualizó `public/assets/site-shell/assets/img/bg/contact_bg_1.avif` con el fondo 3D violeta/púrpura abstracto de alta calidad de AIOR.
  - Se agregaron reglas explícitas de `-webkit-mask-image` y `mask-image` en `public/assets/site-shell/assets/css/gloobi-hero.css` para visores desktop mayores a 991px.

- Precios y extras en la plantilla AIOR estatica:
  - La seccion de precios de `public/index.html` ahora usa el diseno de tarjetas de AIOR con tabs `Paquetes` y `Extras`.
  - `Paquetes` muestra Imagen Esencial, Interactiva, Video Invitacion, Web Esencial y Web Premium con precios MXN, beneficios y CTA a WhatsApp.
  - `Extras` muestra Entrega express, Cambio de fecha, Reporte Excel y QR impreso como costos adicionales independientes.
  - `public/assets/site-shell/assets/css/gloobi-hero.css` ajusta la grilla, alturas y textos para conservar el look oscuro/violeta de AIOR sin capitalizacion forzada.

- Categorias infantiles y demos CRM en la plantilla AIOR estatica:
  - `public/index.html` ahora muestra 8 categorias en la seccion CTA/fan-stack de AIOR: Espacio, Dinosaurios, Futbol, Carreras, Fantasia, Animales, Videojuegos y Princesas.
  - La seccion "Creativity with AI Image Generation" fue reemplazada por una seccion de demos con 8 celulares interactivos, cada uno apuntando a `/i/demo-*`.
  - Se agregaron los 8 demos editables en `lib/demo-data.ts`, `lib/repository.ts` y `.mock-data/store.json`; Astronauta se conserva como base de Espacio y Sirenas/Princesas como base de Fantasia y Princesas.
  - `public/assets/site-shell/assets/js/main.js` ajusta la animacion inicial de fan-stack para 8 tarjetas, manteniendo el efecto nativo de AIOR.
  - `app/i/viewer-react-app.tsx` evita mismatch de hidratacion del tema en dev para que los celulares iframe no muestren el indicador rojo de Next.
  - Las tarjetas de demos recuperan la placa trasera violeta de AIOR solo en hover, visible por las orillas detras de la tarjeta oscura.
  - `demo-espacio` y `demo-princesas` vuelven a ser copias intactas de las invitaciones originales de astronauta y sirena; las imagenes de categoria ya no reemplazan sus fondos.
  - El marco de celular de los demos fuerza `content-box` y escala interna de 390px para que cada iframe quede recortado dentro de la pantalla simulada.

- Actualización de imágenes en carrusel CTA de `public/index.html`:
  - Reemplazo de los placeholders (`cta-img-1.jpg` a `cta-img-7.jpg`) por las 7 ilustraciones 3D reales de `/assets/adventures/` (Espacio, Dinosaurios, Fútbol, Carreras, Fantasía, Animales y Videojuegos) tanto en `<img>` como en los enlaces de visualización lightbox.

- Reemplazo de la landing pública por montaje AIOR completo preservando portada Gloobi:
  - `/index.html` ahora es HTML estatico en `public/index.html`, generado desde la plantilla AIOR completa para conservar su carga nativa de estilos, scripts, cursor, Lenis y ScrollTrigger.
  - La portada/hero Gloobi se recreo dentro del bloque hero de AIOR con `public/assets/site-shell/assets/css/gloobi-hero.css` y `public/assets/site-shell/assets/js/gloobi-hero.js`.
  - `/` redirige a `/index.html`, dejando la plantilla Aior como nuevo sitio publico principal.
  - Se elimino la ruta Next `app/index.html/page.tsx` para que no compita con el HTML estatico.
  - `scripts/css-guard.mjs` excluye `public/` porque es CSS vendor externo de la plantilla AIOR.

- Integración de sección Showcase Video Area inspirada en la plantilla AIOR (`Video Area` en `home-ai-image-generate-op.html`):
  - Rediseño de la sección `#demos` ("Modelos Interactivos / Ejemplos demos") en `components/site/Landing.tsx` y `Landing.module.css`.
  - Integración de fondos originales de la plantilla (`video_bg_2.png` para rejilla de líneas y `video_bg_1.png` para el marco/dashboard contenedor).
  - Integración de imágenes flotantes laterales (`video-img.jpg` y `video-img2.jpg`) animadas dinámicamente al hacer scroll (efecto parallax scroll scrub).
  - Preservación de la interactividad de los `iframe` dentro de la simulación de celulares y botones de acción ("Ver demo interactiva" y "Cotizar esta temática").
  - Soporte completo para modos **Dark** (fondo obsidiana `#07080e` con marco glassmorphism y brillos) y **Light** (fondo claro con rejilla neutra y sombras suaves).

- Integración de sección CTA de Tarjetas Amontonadas ("Fan Stack to Grid") inspirada en la plantilla AIOR (`home-ai-image-generate-op.html`):
  - Rediseño de la sección `#aventuras` en `components/site/Landing.tsx` y `Landing.module.css`.
  - Animación de despliegue 3D con `framer-motion` utilizando los ángulos e inclinaciones exactos de la plantilla (`xPercent` de 60% a -60% y rotaciones de 10° a -10° -> 0° al entrar en vista).
  - Soporte completo para modo **Dark** (fondo obsidiana `#111322` con brillo neón y sombra profunda) y modo **Light** (fondo claro con tarjetas de vidrio esmerilado).
  - Generación de 7 imágenes ilustrativas 3D para cada temática (`public/assets/adventures/`): Espacio, Dinosaurios, Fútbol, Carreras, Fantasía, Animales y Videojuegos.

- Anonimización y maquetación de invitaciones demo públicas (`lib/demo-data.ts`, `lib/site-settings-defaults.ts`, `components/site/Landing.tsx`, `Landing.module.css` y `.mock-data/store.json`):
  - Anonimización completa de los datos reales de niños y eventos: los nombres, fechas, salones, teléfonos de contacto e itinerarios se cambiaron por datos simulados ficticios ("Cumple 7 de Mateo" y "Cumple 5 de Sofía").
  - Eliminación total del fondo/marco de ventana de PC/escritorio para centrar la atención únicamente en la experiencia para celular.
  - Maquetación en cuadrícula de 2 columnas en paralelo para mostrar un teléfono celular simulado interactivo al lado del otro.
- Activación y duplicación de invitaciones demo reales (`lib/demo-data.ts`, `lib/site-settings-defaults.ts`, `lib/repository.ts` y `.mock-data/store.json`):
  - Extensión de la vigencia (`active_until` hasta 2035) para "Cumple 7 de Luis Arturo" y "Cumple 5 de Julieta Mabell", garantizando que ambas funcionen de forma activa e interactiva sin mostrar la pantalla de "Evento finalizado".
  - Integración de ambas invitaciones en la sección "Ejemplos destacados" del sitio público (`/` y `/invitaciones`).
  - Renderizado dinámico de marco de celular simulado con `iframe` en tiempo real en la parrilla de maquetas (`components/site/Landing.tsx` y `Landing.module.css`), emulando la experiencia del CRM.
- Rediseño de tarjeta de cristal hero (`components/site/Landing.tsx` y `Landing.module.css`):
  - Adaptación de la silueta SVG de la tarjeta "Astronautas & Galaxia" con trazado Bezier C1 continuo y bordes fluidos con silueta escavada alrededor de la insignia/badge inferior izquierda ("Gloobi"), replicando el diseño orgánico estilo glassmorphism.
- Rediseño mágico e infantil del sitio público (`components/site/Landing.tsx` y `Landing.module.css`):
  - Integración del degradado de burbujas animado en el hero mediante filtro SVG `#goo` (`feGaussianBlur` + `feColorMatrix`) y keyframes de animación orgánicos adaptados de `F:\Animaciones\0. Degradados\bubbles-background-animation ♥`.
  - Preservación exacta de la animación e identidad del texto del título "Hazlo mágico".
  - Reenfoque visual prioritario a celebraciones infantiles (Espacio 🚀, Dino 🦖, Fútbol ⚽, Carreras 🏎️, Fantasía 🦄, Animales 🦁, Videojuegos 🎮, Princesas 👑) manteniendo la versatilidad para bodas, XV años y otros eventos.
  - Menú de navegación flotante tipo glassmorphism con micro-interacciones, badges brillantes y menú navegable para móviles.
  - Botones CTAs con efecto de brillo mágico, tarjetas de maquetas con marcos redondeados de cristal y parrilla de paquetes destacada.
- Se cerro bypass de RSVP por `invitationId`:
  - nuevo endpoint seguro `POST /api/public/invitations/[slug]/rsvp`
  - endpoint legado `POST /api/rsvp` deprecado (`410`)
- Se agrego base de plantillas en CRM:
  - guardar invitacion como plantilla
  - crear invitacion desde plantilla en `/admin/invitations/new`
- Se reforzo preview movil del editor para evitar seleccion accidental al arrastrar.
- Se reforzo metadata share de `/i/[slug]` para WhatsApp:
  - canonical absoluto
  - `twitter:card=summary_large_image`
  - imagen OG horizontal 1200x630 desde `/api/public/og-card` (evita miniatura compacta con imágenes verticales)
  - `og:image:width`, `og:image:height` y `og:image:type` definidos en metadata
  - `/api/public/invitations/[slug]/og-image` mantenido como redirect legacy con guard anti-loop
  - hotfix de estabilidad: metadata ahora prioriza URL de imagen OG directa (sin pasar por `/api/public/og-card`) para evitar fallos 503 del endpoint dinámico en producción
  - ajuste adicional: metadata vuelve a respetar totalmente `share.og_image_url` configurable en el editor (sin override local por slug)
- Se renovó la landing comercial y su editor:
  - paquetes recomendados en `lib/site-packages.ts` (Imagen Esencial, Interactiva, Video, Web Esencial, Web Premium)
  - servicio/alcance web, extras y politicas renderizadas en `/` y `/invitaciones`
  - editor `/admin/site` con captura estructurada por campos (sin dependencia de JSON manual)
  - migracion automatica de configuraciones legacy (`Esencial` + `Premium Astronautas`) al nuevo catalogo
- Rediseño visual del viewer para `theme_id="astronautas"`:
  - paleta pastel acuarela
  - tipografias redondeadas (`Fredoka` + `Nunito`)
  - tarjetas con doble borde suave
  - contador con numeros grandes sin salto de linea
  - galeria estilo fotos pegadas
  - loading screen sincronizada con el tema del viewer
  - fondo de portada/resto volvió a ser data-driven por editor (image/video/kenburns), con fallback `default` acuarela real
  - migración automática de URLs legacy de fondo (Pexels oscuro) a modo `default` para evitar estados inconsistentes en el editor

- Se fortalecio enrutamiento admin para evitar loops y estados no deterministas.
- Se mejoro persistencia de sesion admin por cookie.
- Se aplicaron hotfixes de seguridad en APIs publicas RSVP/invitacion.
- Se pulio editor:
  - categorias
  - sticky preview
  - dispositivos de preview realistas
  - sortable en flujo de secciones

## Cambios funcionales relevantes

- Plantillas:
  - metadata persistida en `site_settings.data.invitation_templates`
  - APIs admin:
    - `GET/POST /api/admin/invitation-templates`
    - `POST /api/admin/invitations/from-template`

- RSVP cliente:
  - mejor jerarquia visual
  - tabla de respuestas
  - etiquetas de estado (confirmado/no asiste/cancelo)
  - exportacion preparada para impresion

- Viewer de invitacion:
  - ajustes de layout/animaciones por seccion
  - mejoras en portada y elementos tematicos
  - mejoras de consistencia visual entre preview y pagina publica

- Contacto:
  - soporte de avatar opcional en canal directo

## Cambios de mantenimiento/documentacion

- Se actualizaron docs clave para eliminar referencias obsoletas de Vite/frontend.
- Se agrego `docs/CODEX_HANDOFF.md` como entrada rapida para nuevos chats.

## 8 de septiembre de 2026 — Catálogo de invitaciones

- Se crea `/invitaciones` con estructura inspirada en explore-3 de Open9 y componentes visuales Gloobi, sin importar contenido ni dependencias del marketplace.
- Fuente central con deduplicación por slug y verificación de publicación; taxonomía temporal única y funciones derivadas del CRM.
- Búsqueda con debounce, filtros y chips, URL con historial, ordenamiento, contador, estado vacío y cargar más.
- Modal de imagen accesible con Escape, backdrop, foco contenido y restaurado, bloqueo del body y scroll vertical; drawer de filtros en móvil.
- Home: solo se actualizan los diez href de la sección de celebraciones.
- Nuevos estilos limitados a CSS Modules; sin cambios en auth, CRM ni viewer.

## 8 de septiembre de 2026 — Sobre Gloobi y renombrado del HOME

- El HOME real se movió de `public/home-ai-image-generate.html` a `public/index.html`; el archivo anterior quedó como redirección mínima compatible con query y hash.
- `app/page.tsx` ahora dirige `/` a `/index.html`; los enlaces activos usan `/` y sus anchors reales.
- La portada ficticia `public/index.html` fue sustituida por una redirección mínima a `/`, evitando un segundo HOME completo.
- `public/about.html` fue adaptado por completo a Gloobi. Se eliminaron la navegación, cronología, awards, métricas, equipo y testimonios ficticios de AIOR.
- About conserva las animaciones y librerías compartidas, y suma estilos/script aislados para tema, galería y menú en `about-gloobi.css` y `about-gloobi.js`.
- Se reutilizaron el fondo global, el menú flotante, el logo, el sistema `site-theme-mode`, el footer y assets locales de celebraciones.


## FAQ Gloobi

Se reemplazó la plantilla AIOR de `public/faq.html` por la FAQ de Gloobi. Se agregaron 15 respuestas, acordeón accesible, bloque de contacto, SEO y estilos/JS scopeados. La ruta React `/faq` conserva la entrada y redirige a la versión estática.

- Se adaptó `public/contact.html` a Gloobi y se movió allí el formulario de cotización original del Home; se eliminaron mapa, dirección y contenido AIOR.

## 9 de septiembre de 2026 — Menú desplegable público

- Se amplió la tarjeta desplegable del rail flotante con acabado glass, filas más altas y mayor separación visual.
- Se agregó un espacio funcional entre el rail y la tarjeta para evitar que ambos menús se encimen sin interrumpir la interacción con cursor o teclado.
- El ajuste se aplicó al HOME, páginas AIOR conservadas y catálogo de invitaciones, manteniendo enlaces y comportamiento.

## 9 de septiembre de 2026 — Tipos de invitación

- La sección comercial `#pricing-sec` conserva su diseño, precios y Extras, y cambia su nomenclatura visible de paquetes a tipos de invitación.
- El catálogo reemplaza el filtro de Funciones por Tipo de invitación y ordena sus bloques como Categoría, Tipo de invitación y Estilo en escritorio y móvil.
- Los cinco tipos y sus slugs quedan centralizados en `lib/catalog-taxonomy.ts`; `lib/invitation-catalog.ts` asigna los formatos disponibles sin modificar el CRM ni las funciones reales de las invitaciones.
- El catálogo admite `?tipo=` combinado con `categoria`, `subcategoria`, `estilo`, búsqueda y ordenamiento, con chips y contador reactivos.

## 9 de septiembre de 2026 — Tipos de invitación

- La sección comercial del HOME conserva `#pricing-sec` y su diseño, pero presenta las cinco opciones como tipos de invitación y mantiene los Extras sin cambios.
- El catálogo reemplaza el filtro de Funciones por Tipo de invitación, con los slugs `imagen-esencial`, `interactiva`, `video-invitacion`, `web-esencial` y `web-premium`.
- Los filtros principales quedan en el orden Categoría, Tipo de invitación y Estilo, tanto en escritorio como en el drawer móvil; las subcategorías permanecen dentro del bloque Categoría.
- El CRM no contiene un campo equivalente. La compatibilidad se centraliza en `lib/invitation-catalog.ts`; las temáticas actuales están disponibles en los cinco formatos y las funciones reales siguen derivándose de las secciones activas.
- Se añadió el parámetro combinable `?tipo=` y su chip activo, sin retirar los indicadores informativos de funciones de las tarjetas.
- Se unificó en negro puro todo el texto interior de la tarjeta animada para mejorar su contraste sobre el papel claro.
# 15 de septiembre de 2026 — Filtros por producto y Biblioteca Multimedia

- `/invitaciones` ordena Tipo, Categoría y Estilo; Tipo es obligatorio, sin “Todas”, con default central `web-premium` y reset de filtros secundarios.
- La multiselección de estilos aplica OR y los parámetros conservan historial del navegador.
- Los cinco títulos comerciales del Home enlazan al catálogo con `?tipo=`.
- Se crea Biblioteca Multimedia deduplicada por SHA-256, usos explícitos, reemplazo seguro, papelera de 7 días y endpoint de limpieza.
- El almacenamiento se centraliza con `MEDIA_STORAGE_PATH` y `MEDIA_BASE_URL`; en producción no se escribe dentro del deploy si faltan.
- Se añade `/admin/media` y un selector compartido para subir o reutilizar archivos desde los editores.
- Migración: `supabase/0003_media_library.sql`. Guía: `docs/MEDIA_LIBRARY.md`.
- La biblioteca incorpora `MediaStorageAdapter`: filesystem local o Hostinger por FTPS con `basic-ftp` 6.2.x, timeout/reintentos limitados, TLS estricto, rollback de upload sin metadata y comprobación física en deduplicación, restauración y purga.
- Se agrega `npm run media:check` para probar conexión, raíz visible, upload público, MIME PDF, Range y limpieza sin registrar credenciales. La cuenta de medios valida TLS con `hostinger.com` y su `PWD` comprobado es `/public_html`.
# 16 de septiembre de 2026 — Restauración de medios del sitio

- La migración de `public/aior` a `public/assets/site-shell` dejó fuera reglas base de `gloobi-hero.css` para la comparativa y el carrusel de categorías de celebración. Se recuperaron del historial anterior a la migración; el Home vuelve a mostrar el teléfono comparativo y el coverflow con sus controles.
- Se retiró el bloque final `Static Home geometry recovered` de `gloobi-hero.css`: forzaba la geometría del hero y de las tarjetas con `!important`, ocultaba el contenido de la tarjeta izquierda y anulaba el abanico animado de categorías. Era la causa directa de la desconfiguración visual.
- La configuración pública normaliza las rutas históricas de medios al leerlas. Los valores guardados por el editor conservan su contenido, pero Home y otras páginas reciben las rutas actuales sin depender de redirecciones por cada imagen.
- Se corrigió la ruta del video de la tarjeta de mensaje y tres referencias CSS a archivos retirados durante la reorganización.
