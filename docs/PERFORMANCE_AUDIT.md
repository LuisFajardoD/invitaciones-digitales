# Auditoría frontend y rendimiento — 2026-09-09

## Alcance y método

Se inspeccionaron HOME estático, About, FAQ, Contacto, catálogo Next, shell administrativo y viewer público. Se conservaron diseño, contenido, rutas funcionales y assets originales. No se modificaron respuestas de FAQ, precios ni clasificación comercial.

El workspace ya tenía cambios anteriores. No se hizo reset, clean, revert masivo ni eliminación de librerías. La arquitectura y propietarios de estilos/animaciones están detallados en `STYLE_ARCHITECTURE.md` y `ANIMATION_ARCHITECTURE.md`.

Arquitectura: `/` redirige a `public/index.html`; las páginas secundarias son HTML en `public`. Next sirve `/invitaciones`, CRM y viewer. `components/site` usa CSS Modules; `lib` contiene datos/taxonomía; `src/crm` conserva estilos `.app-admin` y `.app-viewer`; `scripts` contiene validaciones. Los HTML cargan CSS/JS AIOR propios, separados del bundle React. Los assets públicos no pasan por optimización automática de Next Image.

## Hallazgos y correcciones

| Hallazgo / causa comprobada | Impacto | Corrección |
|---|---|---|
| Loader esperaba carga y mínimo 1200 ms | Retardo artificial y bloqueo de interacción | Retiro al DOM listo, fade 180 ms, pointer-events none inmediato, fallback 5 s |
| Rail buscaba window.lenis aunque instancia real era gloobiLenis | Fallback smooth nativo en página con Lenis | Unificar navegación y volver arriba en instancia existente; eliminar jQuery animate en esos caminos |
| Lenis lerp 0.07 | Cola perceptible de interpolación | 0.12, sin añadir motor |
| RAF vendor wheel sin elementos .swiper .single | Trabajo continuo sin resultado en las cuatro páginas | Arrancar solamente si existen objetivos |
| setInterval recibía resultado de moveText | Intervalo inválido/inútil | Invocación directa en hover |
| Comparador podía seguir auto-scroll oculto | Trabajo fuera del viewport | Parar RAF fuera de pantalla/documento oculto, reanudar conservando estado |
| Video ambiental sin pausa al ocultar pestaña | Decodificación innecesaria | Combinar visibilidad de sección y documento, sin reiniciar currentTime |
| Tema se aplicaba después del DOM | Primer fondo/clases podían diferir de preferencia final | Bootstrap mínimo en head y clases de body antes del contenido en cuatro HTML |
| Hook React persistía valor inicial antes de leer almacenamiento | Sobrescritura de preferencia y eventos de tema innecesarios | Esperar inicialización y proteger acceso a localStorage |
| Footer heredaba texto oscuro en light | Contraste incorrecto sobre tarjeta oscura | Variables específicas de footer y selectores delimitados; placeholder, enlaces, títulos e iconos claros |
| Duplicados idénticos .subcategories y strong | Cascada redundante | Retirar una copia idéntica en CSS Module |
| Categorías con imágenes originales de varios MB | Descarga excesiva | Ocho WebP quality 90, máximo 1200 px, mismas imágenes y proporción |
| Ocho iframes de demos en HOME | Runtime de previews antes de necesitarlos | data-src + IntersectionObserver a 300 px, carga única, mantener estado posterior |
| Animación ambiental fuera de pantalla | Composición innecesaria | Pausa CSS de hero/galería por viewport y de superficies ambientales con documento oculto |

Los ocho originales de categorías sumaban **22,280,080 bytes**; las variantes suman **1,033,984 bytes**: reducción de **95.36%** de esos archivos, no del sitio completo. Originales conservados. Se añadió lazy loading/decoding async a imágenes posteriores al hero y preload none al video modal oculto.

## CSS, librerías y composición

Se detectaron jQuery, Bootstrap, Swiper, Magnific Popup, CounterUp, circle progress, jQuery UI, imagesloaded/isotope, nice-select, WOW, GSAP/ScrollTrigger/SplitText/DrawSVG y Lenis. No se confirmó duplicación de versiones que pudiera eliminarse con seguridad. Main.js tiene dependencias directas: retirar scripts por nombre habría podido romper inicialización.

AIOR conserva selectores genéricos y una cascada histórica extensa. `gloobi-hero.css` ronda 167 KB y centenares de !important. No se purgó CSS basándose solamente en cobertura inicial: las clases dinámicas, hover y páginas secundarias lo hacen inseguro. El conflicto confirmado del footer se corrigió dentro de su namespace. Los bloques importados ya tienen namespaces; el flip-card está aislado en iframe.

Existe una instancia de fondo global por cada HTML revisado, fixed al viewport; cinco burbujas, reducidas por breakpoints. El overlay de vidrio global ya utiliza transparencia y sombras, no backdrop blur de pantalla completa. Persisten blur SVG y mix-blend-mode en gradientes: no se sustituyeron sin trazas GPU. La composición colorida del hero es un efecto distinto e intencional. El selector de seguimiento `.gloobi-global-interactive` no coincide con `.gloobi-interactive` en el markup revisado; no se activó un nuevo loop corrigiéndolo a ciegas.

No se acortaron animaciones ambientales de varios segundos. El snap y revelados GSAP requieren evaluación visual dirigida. La estrategia reduced-motion se amplió para superficies ambientales; no equivale a una auditoría exhaustiva de cada efecto vendor.

Fuentes: el layout Next incluye Baloo 2, Nunito, Dongle, Indie Flower y Amatic, además de las fuentes de los HTML. Mantener tipografía del viewer limita una reducción indiscriminada. Separar pesos por ruta requiere cobertura de todas las plantillas. No se cambió identidad tipográfica.

## Video de la tarjeta

Archivo servido: MP4 H.264, 1280×720, 30 fps, 15.0333 s, **8,135,014 bytes**, bitrate de contenedor **4,329,054 bit/s**. Ya existía una versión web razonable frente al WebM original de 31,191,335 bytes. No se recomprimió nuevamente ni cambió contenido.

Se comprobó reproducción con tiempo avanzando, atributos inline y pausa por visibilidad; no se encontró reinicio periódico de currentTime en el controlador revisado. Una muestra inicial headless registró 14 frames descartados de 69. Esto NO identifica la causa de los saltos ni demuestra reproducción fluida en hardware real. Decodificación/composición concurrente es una hipótesis que requiere traza GPU y una muestra estable de 10–15 segundos. La reducción de trabajo fuera de pantalla es aplicada, pero no se declara resuelto el síntoma completo.

## Antes / después medido

Chromium headless, 1440×900, servidor estático Python en 3106, sin throttling, una muestra por ruta. Mismo script `scripts/frontend-audit.cjs`. Loader: tiempo desde navegación hasta observar display:none; LCP/CLS: observaciones locales tras desaparecer loader y esperar un segundo. Resultados orientativos, sensibles a caché/font/network; no son Lighthouse ni Core Web Vitals de producción. El servidor estático no resuelve los demos Next, por lo que no mide su rendimiento real.

| Página | Loader antes → después (ms) | LCP observado antes → después (ms) | CLS antes → después | Recursos antes → después |
|---|---:|---:|---:|---:|
| HOME | 6774 → 1237 | 4224 → 828 | .000869 → .000869 | 94 → 56 |
| About | 2357 → 559 | 548 → 396 | .001493 → .001368 | 44 → 44 |
| FAQ | 2605 → 638 | 416 → 384 | .059502 → .059502 | 34 → 34 |
| Contacto | 2613 → 729 | 448 → 396 | .000863 → .000863 | 36 → 36 |

No se midió INP de campo, FPS sostenido de scroll ni coste GPU del fondo. No extrapolar estas muestras a garantías de fluidez.

## Validación

- `npm run css:guard`: aprobado (también ejecutado por prebuild).
- `npm run build`: aprobado, incluido lint y tipos de Next. Aviso de edge runtime deshabilitando generación estática en una ruta; no fallo.
- Cuatro HTML × dos temas × seis anchos (1920, 1440, 1366, 768, 390, 320): sin overflow horizontal ni excepciones JS observadas. Colores computados del footer claros en ambos temas.
- Catálogo: combinación categoría + tipo + estilo, seis resultados; abrir/cerrar preview, limpiar filtros, drawer móvil con orden Categoría / Tipo de invitación / Estilo, cambio light y seis anchos sin overflow.
- `/` redirige al HOME; login y viewer de astronautas responden 200. Rutas administrativas protegidas redirigen al login sin sesión. `/examples` devuelve 404 deliberadamente por eliminación solicitada antes de esta auditoría.
- Inventario de los cuatro HTML sin IDs duplicados. Prueba de navegación de producción sin pageerrors; única respuesta HTTP de error registrada: `/examples`, intencional.
- No se enviaron mensajes de WhatsApp ni se escribieron RSVP/datos administrativos. No se certifican flujos autenticados sin sesión de prueba.

Una repetición intermedia registró React #418 (hydration mismatch) sin ruta asociada. Tras instrumentar URL y repetir el recorrido, y también abrir rutas individualmente con espera de hidratación, no se reprodujo. Se conserva como incidencia intermitente sin causa confirmada; no se afirma que haya sido corregida. La última muestra del video registró 0 descartados de 62 frames; su diferencia con la primera muestra confirma que hace falta medición sostenida, no una conclusión a partir de pocos segundos.

Evidencia local: `.codex-artifacts/before.json`, `after.json`, `responsive.json`, `interactions.json`, `asset-inventory.json`, `image-optimization.json`, `memory-audit.png`. Las capturas y muestras no sustituyen una revisión visual exhaustiva de todos los estados.

## Archivos de esta auditoría

- `public/index.html`; `public/about.html`, `faq.html`, `contact.html`: tema temprano, referencias optimizadas y carga diferida según página.
- `public/assets/site-shell/assets/js/main.js`, `gloobi-hero.js`, `gloobi-global-bg.js`: loader, scroll y ciclos de vida.
- `public/assets/site-shell/assets/css/gloobi-hero.css`: footer y pausas de animación delimitadas.
- `components/site/InvitationCatalog.module.css`: duplicado idéntico retirado.
- `components/admin/use-site-theme.ts`: inicialización y persistencia segura.
- Ocho `.webp` nuevos en `public/assets/gloobi-home/categorias/`.
- Tres scripts `scripts/frontend-*-audit.cjs` y los tres documentos de arquitectura/auditoría; actualización del handoff, estado y cambios recientes.

## Pendientes con riesgo o evidencia insuficiente

1. Traza Chrome con GPU real para video, scroll, blur y composición; repetir varias cargas frías y calientes y medir interacciones, antes de prometer resolución de los saltos.
2. First paint de React: el hook evita sobrescribir preferencia pero sigue después de hidratación. Sincronizar tema SSR requiere un contrato de cookie/head que no introduzca hydration mismatch; no se trasladó el bootstrap HTML indiscriminadamente a CRM/viewer.
3. Pausar runtimes internos de demos ya cargados requiere protocolo explícito de visibilidad con viewer; descargar iframes perdería estado. Se difiere su carga inicial, no se destruyen al salir.
4. Depurar CSS vendor/important y cargar librerías por página requiere cobertura de menús, drag, todos los sliders, modales y componentes dinámicos. No hay una certificación exhaustiva de ausencia de listeners duplicados en cada vendor.
5. FAQ conserva CLS local .0595; localizar contribuyente con trazas por entrada antes de cambiar tamaños o tipografía.
6. Fondos grandes restantes y pesos tipográficos: optimizar con comparación visual de todas las rutas. Cache headers de assets públicos deben verificarse en hosting real; hashes Next ya cubren bundles, archivos públicos conservan nombres estables y necesitan política de revalidación coherente.
