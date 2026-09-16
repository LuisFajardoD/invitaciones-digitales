# Arquitectura de animación

Auditoría: 9 de septiembre de 2026.

| Sistema | Archivo propietario | Inicio / ejecución |
|---|---|---|
| Scroll principal | `public/assets/site-shell/assets/js/main.js` | Lenis, una instancia `window.gloobiLenis`, alimentada por GSAP ticker |
| Secciones / revelados / proceso | `main.js` | GSAP, ScrollTrigger, SplitText y DrawSVG; triggers por sección |
| Sliders vendor | `main.js` | Swiper sobre selectores existentes |
| Galería About | `about-gloobi.js` | Swiper continuo, velocidad 7000 ms ambiental |
| Categorías | `gloobi-hero.js` | carrusel propio, timer y drag; conserva pausas existentes por visibilidad |
| Comparador | `gloobi-hero.js` | pointer/touch/teclado, clip-path, iframe y auto-scroll |
| Hero | `gloobi-hero.js` + `gloobi-hero.css` | letras, confetti canvas finito y CSS ambiental |
| Fondo global | `gloobi-hero.css`, `gloobi-global-bg.js` | keyframes transform; seguimiento JS condicionado al selector existente |
| Tarjeta | `mensaje-card-original.html` | perspectiva/rotación CSS por hover/foco; iframe reenvía rueda al padre |
| Catálogo | CSS Modules, `CatalogDialog.tsx` | hover/reveal CSS y modal/drawer nativo |
| Viewer/CRM | `src/crm`, componentes React | implementación separada; no se reemplazó por el motor AIOR |

## Correcciones del ciclo de vida

- El rail buscaba `window.lenis`, inexistente; ahora usa `window.gloobiLenis`. Antes caía en scroll nativo smooth mientras Lenis estaba activo.
- Navegación de una página y volver arriba usan Lenis cuando existe; fallback nativo sin animación jQuery simultánea. Se corrigió también dependencia de `event` global.
- Lenis pasa de lerp 0.07 a 0.12 para reducir la cola perceptible; no se añadió un segundo motor.
- El efecto wheel vendor no arranca un RAF cuando `.swiper .single` no existe. Las cuatro páginas auditadas tenían cero coincidencias. Su código se conserva para un futuro uso real.
- El comparador termina su RAF al salir de viewport u ocultar documento y reanuda al volver. No descarga ni reinicia el demo.
- El hover reveal ya no llama `setInterval` con el resultado de una función ejecutada inmediatamente.
- Los videos ambientales conservan IntersectionObserver y suman Page Visibility; nunca se reinician por tiempo ni se modifica currentTime.
- Hero y galería CSS pausan por visibilidad; fondo/hero/galería pausan al ocultar documento. Reduced motion conserva contenido sin loops de esas superficies.
- Ocho iframes de demos se cargan a 300 px del viewport; se conservan cargados después de visitarlos para no perder estado. Descargarlos o congelar todo su runtime requiere protocolo explícito con el viewer y queda pendiente.

## Loader

`main.js`: retiro al DOM listo, fade de 180 ms, pointer-events desactivados inmediatamente y fallback de 5 s. Se eliminó espera mínima de 1200 ms, no el diseño del loader. La carga sigue pudiendo depender de descarga/ejecución de scripts previos a main.js; no se garantiza cero tiempo visible.

## Riesgos que no se cambiaron a ciegas

Fan-stack, sliders de revelado, drag y snap de la tarjeta dependen de GSAP/ScrollTrigger y sus propios contratos. No se acortaron todas las duraciones ni se sustituyeron por CSS. El snap puede sentirse como una pausa intencional; retirarlo alteraría comportamiento aprobado. Los filtros SVG/blur/mix-blend-mode requieren trazas GPU reales y comparación visual antes de reducirlos.
