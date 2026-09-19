# Catálogo de invitaciones Gloobi

## Flujo vigente desde el 17 de septiembre de 2026

Las muestras de Imagen Esencial, Interactiva y Video Invitación se administran en Sitio Web Público → Muestras → Muestras de archivo. En Imagen Esencial se sube un solo AVIF terminado y se usa en la tarjeta y su modal. En Interactiva y Video Invitación se sube el PDF o WebM terminado y una imagen estática aparte para tarjeta y modal. Allí se asignan título de tarjeta, descripción, categoría, subcategoría, estilos y etiquetas manuales pertinentes al formato. Se guardan en `SiteSettingsData.catalog_samples`.

Los demos Web Esencial y Web Premium se editan en Demos y guardan sus datos de tarjeta y vista previa en `sections.__catalog`. Las tarjetas públicas usan la imagen estática; sólo el enlace inferior abre el demo web. Imagen Esencial no muestra enlace inferior; Interactiva abre el PDF y Video Invitación abre el WebM. Las secciones históricas de este documento sobre fuentes de datos, tarjetas e iframes describen estados anteriores y quedan reemplazadas por este flujo.

La vista previa pública ajusta la imagen completa al área disponible de la pantalla, sin desplazamiento interno. La tarjeta pequeña mantiene su recorte actual.

> Estado vigente desde el 15 de septiembre de 2026. Las notas históricas posteriores a esta sección quedan reemplazadas cuando contradigan la lógica descrita aquí.

## Jerarquía vigente de filtros

El orden en escritorio, tablet, drawer móvil y accesos rápidos móviles es: **Tipo de invitación**, **Categoría**, **Estilo**.

- Tipo es obligatorio, de selección única y no incluye “Todas”. Los cinco slugs viven en `lib/catalog-taxonomy.ts`: `imagen-esencial`, `interactiva`, `video-invitacion`, `web-esencial`, `web-premium`.
- `DEFAULT_INVITATION_TYPE` vive en el mismo archivo y actualmente es `web-premium`.
- `?tipo=` válido se respeta. Si falta o es inválido, se normaliza la URL con el default. Atrás/adelante se sincronizan mediante `popstate`.
- Cambiar de tipo reinicia categoría, subcategoría y estilos.
- Categoría aparece en segundo lugar, inicia en “Todas” y conserva las subcategorías existentes. Sólo muestra opciones con resultados para el tipo activo.
- Estilo aparece al final. Cero selecciones significa todos; varias selecciones usan OR. Entre grupos se aplica `Tipo AND Categoría AND (Estilo A OR Estilo B)`.
- “Limpiar filtros” conserva el tipo obligatorio y limpia sólo filtros secundarios, búsqueda y orden.
- El filtro Funciones no existe; las funciones reales siguen visibles como badges informativos.

Cada demo publicado define en el CRM su tipo, categoría, subcategoría y estilos. Se guardan bajo `sections.__catalog` y alimentan los filtros públicos; el mapa por slug permanece sólo para muestras históricas. Los filtros muestran categorías y subcategorías que tengan demos publicados del tipo elegido.

Los títulos de los cinco productos del Home enlazan a `/invitaciones?tipo={slug}`. Las tarjetas, preview, modal, hover y responsive del catálogo no fueron rediseñados.

Ruta nueva: `/invitaciones`.

## Archivos

Nuevos: `app/invitaciones/page.tsx`, `components/site/InvitationCatalog.tsx`, `InvitationCatalog.module.css`, `CatalogDialog.tsx`, `CatalogChrome.module.css`, `catalog-chrome.ts`, `lib/invitation-catalog.ts`, `lib/catalog-taxonomy.ts` y este documento.

Modificados: `public/index.html` (solo 10 href), `docs/CODEX_HANDOFF.md`, `docs/ESTADO_ACTUAL.md`, `docs/CAMBIOS_RECIENTES.md`. Los cambios preexistentes del repositorio se conservaron.

## Diseño y componentes

Se inspeccionó `C:/Users/yasma/Downloads/0. Sitios Web/open9-package/open9/explore-3.html` y su `assets/css/shortcodes.css`. Se adaptó su composición de sidebar, grid de tres columnas, imagen/información, lift, transición del botón desde 30% hasta el centro en 200 ms, carga incremental y responsive. No se copiaron librerías ni archivos vendor completos.

El botón original apunta mediante `data-target="#popup_bid"` al modal de Bootstrap con “Subscribe to our newsletter”. El nuevo `CatalogDialog` es independiente: no carga Bootstrap ni scripts Open9 y no modifica modales de otras páginas. El footer del catálogo conserva contenido e imagen del footer Gloobi, sustituyendo únicamente su formulario de correo por un enlace real al contacto. No se modifica el footer del Home.

Se reutilizan los fragmentos de rail, logo, fondo animado y footer del Home. Los estilos necesarios se limitan al contenedor del catálogo mediante CSS Modules; no se cargan hojas globales de la plantilla. El tema usa `useSiteTheme`, `site-theme-mode` y `site-theme-change`. La tipografía Urbanist corresponde al Home.

## Datos e imágenes

Se combinan los ocho `demoCategoryExampleItems` existentes con las muestras editables de `getSiteSettings()`, dando prioridad al CRM y deduplicando por slug. Se consulta cada registro mediante `getPublicInvitationBySlug`; solo se incluyen publicados. No se publican invitaciones privadas ajenas al conjunto de muestras, ni se serializan tokens del registro al cliente.

Campos reales: `id`, `slug`, `status`, `created_at`, secciones de la invitación y `title`, `description`, `cover_url`, `demo_url` de los ejemplos. La metadata editorial que falta vive en un único mapa por slug. Las funciones se derivan de `sections_order` y `sections[key].enabled`. No hay fuente de música en el modelo actual, por lo que ese filtro puede dar cero resultados. No se muestran métricas inventadas.

La tarjeta y el modal usan `cover_url`; no hay campos separados thumbnail/fullPreview. Los datos actuales pueden contener una ilustración de portada, no una captura de toda la invitación. El modal conserva esa imagen real. Una imagen larga configurada en ese campo se renderiza con `width:auto; max-width:100%; height:auto`, sin `object-fit:cover`, con scroll vertical en su contenedor. No hay iframes en tarjetas ni modal.

“Ver demo” y “Ver demo interactivo” usan `demo_url` válido cuando está configurado; de lo contrario `/i/{slug}`. El demo solo se carga al navegar al enlace.

Slugs centrales: `demo-espacio`, `demo-dinosaurios`, `demo-futbol`, `demo-carreras`, `demo-fantasia`, `demo-animales`, `demo-videojuegos`, `demo-princesas`. También se reconocen las muestras históricas `cumple-7-luis-arturo-astronautas` y `cumple-5-julieta-mabell` cuando están configuradas.

## Interacción

Las nueve categorías son `infantiles`, `cumpleanos`, `xv-anos`, `bodas`, `bebe`, `religiosas`, `graduaciones`, `reuniones`, `corporativos`. Se muestran únicamente las subcategorías de la categoría seleccionada y se limpia la anterior al cambiar. Las listas completas viven en `catalog-taxonomy.ts`.

URL de ejemplo: `/invitaciones?tipo=web-premium&categoria=infantiles&subcategoria=espacio`. El estado también conserva `q`, uno o varios `estilo` y `orden`. `pushState` y `popstate` permiten compartir, recargar y usar atrás/adelante. La búsqueda espera 250 ms e ignora acentos/mayúsculas; consulta título, descripción/temática, categoría, subcategoría, estilos y funciones informativas. El CRM no tiene un campo tags separado.

Los estilos admiten selección múltiple con lógica OR. Orden: posición editorial destacada, fecha real descendente o A–Z. Se muestran diez tarjetas y cada “Cargar más” agrega diez; al filtrar se reinicia el límite. El contador refleja todos los resultados, no solo los visibles.

En móvil, “Filtros” abre un diálogo desplazable y permite aplicar filtros y ver el contador antes de cerrarlo. El modal de preview y el drawer usan `dialog.showModal()`: fondo inerte, fondo inerte del navegador y ciclo explícito de Tab/Shift+Tab, Escape, X y click exterior. Se restaura el foco al disparador y el overflow/padding original del body al cerrar. La cabecera y acciones permanecen accesibles mientras la imagen se desplaza dentro del modal. No se agregó zoom ni dependencias.

El Home conserva su diseño; sus cinco títulos de producto y CTA de demos abren `/invitaciones` con el tipo correspondiente. Los enlaces por celebración conservan la categoría y el catálogo agrega el tipo default central cuando falta.

## Validación

La compilación y CSS guard se ejecutan antes del cierre. Las comprobaciones funcionales y capturas de esta tarea se conservan en `.codex-artifacts/catalog-qa.cjs` y `.codex-artifacts/catalog-*.png`.

Resultados: CSS guard y build aprobados. QA de navegador aprobó búsqueda, categorías/subcategorías, estilos/funciones, orden A–Z, contador, nueve tarjetas iniciales, cargar más, recarga y atrás, correspondencia de imagen/demo, ausencia de iframes, cierre por X/Escape/backdrop, foco contenido/restaurado y drawer móvil. Sin errores de consola en el catálogo. Anchuras verificadas: 1440, 1024, 768, 390 y 320 px, sin overflow horizontal del documento. Se revisaron capturas dark/light y móvil.

Preview larga probada mediante una respuesta de imagen simulada solo en Playwright (no se modifican datos CRM): 390 × 3000 px, renderizada a 348 × 2677 px, con 2055 px de desplazamiento interno y sin overflow horizontal.

Rutas públicas `/`, `/examples`, `/admin/login` y `/i/cumple-7-luis-arturo-astronautas`: HTTP 200. Las rutas `/admin/invitations` y `/admin/invitations/[id]` mantienen su redirección protegida al login. No se pudo verificar su contenido autenticado: las credenciales demo documentadas devolvieron 401 en el entorno actual. No se modificó autenticación.
