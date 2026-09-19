# CODEX HANDOFF

## Rediseño del Archivo Visual en Editor CRM — 2026-09-18

Las tarjetas de imágenes de la sección Archivo visual (`DraftInvitationRecord.sections.gallery`) en el editor de invitaciones y demos se organizan en una cuadrícula fluido-responsiva de 2 columnas (Imagen 1 izquierda, Imagen 2 derecha; Imagen 3 izquierda, Imagen 4 derecha, etc.). Esto reproduce la disposición exacta de 2 columnas de la galería de la invitación en el panel de vista previa del teléfono. Se retiraron párrafos explicativos/descripciones de títulos de tarjetas para mantener encabezados limpios sin texto secundario redundante. La barra de navegación superior, el menú lateral izquierdo de categorías y el teléfono de vista previa permanecieron intactos.

## Nombre del demo y título de portada — 2026-09-18

`normalizeInvitationRecord` ya no reemplaza nombres escritos en `sections.hero.title`; antes cambiaba «Luis Arturo» por «Mateo» en todos los demos al teclear. El nombre del demo en CRM y catálogo se obtiene de `catalog.card_title`, con respaldo de `share.og_title` para registros anteriores (por ejemplo `demo-prueba`, donde el primero estaba vacío). Al abrir un demo heredado, el editor rellena `catalog.card_title` en el borrador para fijar ese nombre en el siguiente guardado. El encabezado del editor, la lista de demos, los selectores de origen para nuevas invitaciones y el catálogo público comparten esa lectura. En invitaciones reales, el encabezado sigue usando el título principal de la portada.

## Desbordamiento del editor CRM — 2026-09-18

En la categoría General y Compartir, el `input[type=file]` invisible de `MediaField` heredaba el ancho del formulario y, al estar posicionado de forma absoluta sin contenedor relativo, se extendía fuera de la ventana. El botón `.site-upload-button` ahora es su contenedor de posición. La columna de vista previa puede encogerse dentro de sus 360 px y el marco se ajusta a su ancho disponible; permanecen las dos columnas centrales. El cuerpo de páginas admin usa el mismo negro que `.app-admin`, mientras que las páginas públicas conservan su fondo. Verificado a 1920, 3840 y 1366 px sin desplazamiento horizontal; a 3840 × 2020 tampoco hay desplazamiento vertical cuando cabe el contenido.

## Marcos de dispositivos — 2026-09-17

La invitación vuelve a ocupar toda la pantalla del marco en ambos editores. Se retiraron las franjas decorativas del navegador y su selector; la cámara permanece superpuesta dentro del área visible. Viewports de referencia: iPhone 17 Pro Max 440×956, HONOR Magic6 Lite 400×884 e iPad 810×1080 px CSS. La escala del marco no altera el viewport interno.


## Vista previa del editor — 2026-09-17

El editor compartido usa iframes con pantalla lógica fija: iPhone 15 Pro Max 430×932, iPhone 13/14 390×844, Galaxy S24 Ultra 384×832, S23 Ultra 384×824, Pixel 8 412×915 e iPad 10.2 810×1080 px CSS. Son tamaños de referencia sin barras del navegador; Android puede variar con la escala del sistema. `ResizeObserver` adapta la escala visual sin cambiar el viewport interno. La rueda se escucha con `passive: false`, normaliza `deltaMode` y compensa esa escala, igual que el arrastre. Verificado con Playwright en ambos editores, sin guardar datos.

Para validar mientras está abierto `next dev`, `NEXT_DIST_DIR=.codex-artifacts/validation-build` permite ejecutar el build en otra carpeta y evita corromper el `.next` del servidor de desarrollo.

## Fondo del login CRM — 2026-09-17

`/admin/login` conserva los gradientes y las burbujas de `.viewer-login-ambient`, pero ya no aplica las imágenes `background_dark_url` y `background_light_url` recibidas de Site Settings. El cambio está limitado al login en `src/crm/App.tsx` y `src/crm/admin.css`; las URLs permanecen guardadas para otras páginas.

## Cuenta regresiva renovable en demos — 2026-09-17

`src/crm/viewer-utils.ts` calcula la próxima fecha de un demo en ciclos de 28 días cuando vence `sections.countdown.target_at`. `getDisplayInvitation` crea sólo para la vista una copia con fecha, hora y cuenta regresiva coherentes; no cambia Supabase ni el registro guardado. La condición exclusiva es slug `demo-*`. En `lib/repository.ts`, crear una invitación desde un demo exige un slug sin ese prefijo y reemplaza `event_start_at` y `sections.countdown.target_at` por la fecha real indicada. Mantener esa frontera al modificar el visor o la copia.

## Archivo visual de demos — 2026-09-17

Las diez imágenes `public/assets/Archivo-visual-demos/momento-magico-{1..10}.avif` se exponen en el editor de demos como opciones reutilizables. La galería muestra exactamente las imágenes agregadas, sin un límite numérico independiente. Los ocho demos base usan 4–8 imágenes según su cantidad anterior. `lib/demo-gallery.ts` centraliza sus rutas; `lib/demo-data.ts` contiene el seed y los ocho registros publicados en Supabase se actualizaron de forma individual, conservando el resto de sus secciones.

## Galería pública ampliada — 2026-09-17

El lightbox de `src/crm/viewer.css` ocupa `100dvh` y centra las fotos dentro del espacio disponible, bajo el botón Cerrar. El panel y la imagen limitan ancho y alto sin recortar fotos verticales. Verificado con Playwright en 1440 × 800 y 390 × 844.

## Nombres en la portada pública de demos — 2026-09-17

Los ocho demos infantiles conservan sus títulos temáticos en el CRM y catálogo. `HeroSectionViewer` sustituye ese título únicamente al pintar la portada: Luis Arturo para Espacio, Dinosaurios, Fútbol, Carreras, Animales y Videojuegos; Karen Vanessa para Fantasía y Princesas. La sustitución sólo aplica si el título guardado sigue siendo el título temático original, por lo que una personalización posterior desde el editor se respeta.

## Portada de sirenas en escritorio — 2026-09-17

El visor público muestra una columna de 440 px en escritorio. La portada de sirenas usa medidas equivalentes a un viewport móvil de 440 × 956 px en esa columna para título, edad, mensaje e ilustración; los `vw`/`vh` de la ventana completa desordenaban la composición. El ajuste vive al final de `src/crm/viewer.css`, limitado a `.viewer-shell--public.app-viewer--theme-sirenas` y `min-width: 1024px`. En móvil continúa el diseño fluido existente, sin marco visual.

## Catálogo de muestras por producto — 2026-09-17

`/admin/demos` conserva sólo demos Web Esencial y Web Premium. El editor web guarda en `sections.__catalog` el título y descripción de la tarjeta, clasificación, estilos y `preview_url` estático. Los demos web nuevos necesitan una imagen de vista previa para publicarse; los históricos conservan respaldo en la imagen OG o la portada.

Las muestras terminadas de Imagen Esencial (AVIF), Interactiva (PDF) y Video Invitación (WebM) se administran en `/admin/site`, pestaña Muestras, sección `05 · Muestras de archivo`. Se guardan en `SiteSettingsData.catalog_samples`, no se crean como invitaciones ni aparecen en el editor de demos web. Imagen Esencial carga sólo el AVIF final y lo reutiliza para tarjeta y vista previa; PDF y WebM requieren una imagen de vista previa aparte. El backend comprueba las extensiones al publicar y la API de medios comprueba el formato real al subir.

`lib/invitation-catalog.ts` reúne demos web publicados y muestras de archivo publicadas. Las tarjetas usan exclusivamente la imagen estática; el modal la muestra completa. Imagen Esencial no tiene enlace inferior; PDF y WebM abren su archivo, los demos web abren `/i/[slug]`. Los slugs demo históricos con clasificación no web sólo permanecen para edición privada y no se listan en el catálogo.

## Demos e invitaciones — 2026-09-16

El editor compartido distingue demos por `demo-*`: oculta “Guardar como plantilla”, el campo técnico de tema y la vista RSVP de cliente. La previa de borrador usa `/i/[slug]?crm_preview=1` o `?crm_live=...`; página y API públicas sólo aceptan registros no publicados con una sesión admin válida. Sin sesión se mantiene la restricción de `getPublicInvitationBySlug`. Nunca usar la consulta de preview para publicar o exponer borradores a visitantes.

`Nuevo Demo Base` usa `/admin/demos/new` y `POST /api/admin/demos`; el editor de demos tiene ruta `/admin/demos/[id]`. La ruta anterior `/admin/invitations/new?mode=demo` redirige al formulario correcto. Los registros activos en Supabase de `demo-espacio`, `demo-dinosaurios` y `demo-princesas` recibieron títulos temáticos en `sections.hero.title` y `share.og_title` el 16 de septiembre de 2026; modificar únicamente los seeds locales no altera esos registros.

La clasificación editorial de cada demo web vive en `InvitationRecord.catalog`; en Supabase se persiste bajo `sections.__catalog` para evitar una columna nueva. El editor de demos, sección Base, usa las opciones de `lib/catalog-taxonomy.ts`. Los datos históricos se normalizan desde `lib/catalog-metadata.ts`.

`/admin/demos` crea borradores demo mediante `mode=demo`; `/admin/invitations` crea invitaciones de cliente. La clasificación actual usa el prefijo reservado `demo-` en el slug; el editor rechaza cambios de slug que cambien el tipo. La duplicación hacia demo requiere `?as=demo`; crear una invitación desde un demo copia el registro indicado por su ID. Los títulos de los demos base describen la temática y no el nombre de un cliente. Antes de sustituir la clasificación por un campo persistido, añadir migración Supabase y compatibilidad con datos existentes.

## Rutas de medios tras reorganización — 2026-09-16

La migración de `public/aior` omitió reglas estructurales del CSS personalizado: la comparativa y el coverflow de `#celebration-categories` tenían ajustes móviles, pero no sus reglas base. Se recuperaron desde capturas del CSS anteriores a la migración y se colocaron al inicio de `gloobi-hero.css` para que los ajustes posteriores conserven precedencia.

Se eliminó un override agregado al final de `gloobi-hero.css` que sustituía la geometría original del Home con reglas `!important`. No volver a añadir un bloque global de "recuperación" de geometría sin comparar hero, tarjetas y fan-stack con la referencia visual.

`normalizeSiteSettingsData` traduce las rutas históricas de `lib/legacy-asset-paths.json` en todos los campos de la configuración, incluidos los valores persistidos del editor. Mantener ese mapa apuntando siempre a archivos existentes; la página estática debe referenciar directamente las rutas actuales. El video de `#mensaje` disponible es `public/assets/gloobi-home/tarjeta/fondo-tarjeta.webm`.

## Auditoría frontend — 2026-09-09

Consultar `docs/PERFORMANCE_AUDIT.md`, `docs/STYLE_ARCHITECTURE.md` y `docs/ANIMATION_ARCHITECTURE.md` para propietarios, cambios y límites de validación. El catálogo activo es `/invitaciones`; `/examples` está retirado. Se ajustaron loader, tema temprano de HTML, scroll Lenis, visibilidad de animaciones/video, carga de demos y categorías WebP, sin rediseño. Footer oscuro con texto claro en ambos temas. Mantener aislamiento de CRM/viewer. Hay pendientes de medición GPU y first paint React, detallados en auditoría.

Guia rapida para que cualquier chat nuevo de Codex entienda el proyecto en minutos.

Actualizado: 15 de septiembre de 2026

## Editor del sitio público — 2026-09-14

`/admin/site` administra el sitio actual mediante `SiteSettingsData.pages`, con pestañas para Home, Muestras, Sobre Gloobi, FAQ, Contacto y Acceso CRM. Los defaults y la migración viven en `lib/site-settings-defaults.ts`; la lectura pública usa `GET /api/public/site`; los HTML actuales consumen `public/assets/site-shell/assets/js/gloobi-site-content.js`; `/invitaciones` recibe su página desde servidor; el login lee la sección `crm/login`. Los medios nuevos usan la Biblioteca Multimedia descrita en `docs/MEDIA_LIBRARY.md`; `public/uploads/site` contiene únicamente uploads históricos sin migrar. Mantener los IDs de sección estables porque la normalización fusiona datos persistidos por ID.

En el Home estático, `gloobi-site-content.js` no debe asignar `src` directamente a iframes todavía diferidos: comparador, demos destacados y tarjeta de mensaje conservan `data-src` hasta que `gloobi-global-bg.js` los observa cerca del viewport. Al reemplazar el título del hero se emite `gloobi-hero-title-change` para volver a preparar sus letras.

Los cuatro demos del Home se guardan en `pages.home.sections[id="demos"].items`. `/admin/site` sólo ofrece allí invitaciones publicadas cuya taxonomía del catálogo incluye `web-premium`; no volver a enlazar esta sección por posición con `blocks.examples.items`, porque esa lista pertenece al catálogo completo.

La Biblioteca Multimedia conserva metadata en Supabase y ahora abstrae el archivo físico con `lib/media-storage.ts`. `MEDIA_BACKEND=local` usa filesystem; `MEDIA_BACKEND=hostinger` usa FTPS desde el backend Node hacia `media.gloobimx.com`. Leer `docs/MEDIA_LIBRARY.md` antes de tocar uploads. Nunca exponer variables `MEDIA_FTP_*` al cliente ni desactivar validación TLS para el alias FTP actual, cuyo certificado no coincide con el hostname.

## 1) Que es este sistema

Aplicacion de invitaciones digitales con tres frentes:

- Sitio publico (landing + examples)
- CRM admin (login, lista, editor, ajustes)
- Viewer publico de invitacion + panel RSVP cliente

Todo vive en Next.js. No hay workspace Vite activo en esta version.

## 2) Arquitectura real (estado actual)

- Framework principal: Next App Router (`app/*`)
- Capa de dominio/datos:
  - `lib/repository.ts` (fuente principal de lectura/escritura)
  - `lib/auth.ts` (sesion admin y politicas)
- Capa UI:
  - `components/site/*` (landing y shell publico)
  - `components/admin/*` (dashboard/editor/admin forms)
  - `src/crm/*` (viewer y bloques visuales compartidos)
- Catalogo comercial de landing:
  - `lib/site-packages.ts` (paquetes recomendados)
  - `lib/site-settings-defaults.ts` (defaults + normalizacion/migracion de bloques legacy)
- Estilos:
  - `src/crm/admin.css` -> scope CRM admin (`.app-admin`)
  - `src/crm/viewer.css` -> scope viewer publico (`.app-viewer`)
  - `components/site/*.module.css` -> landing/login/public shell
  - Tema viewer por `data-theme` en `src/crm/App.tsx`:
    - `default` (base)
    - `watercolor-space` para `theme_id="astronautas"`
  - En `watercolor-space`, el fallback visual `default` vive en CSS (`viewer-stage__fallback` y `hero-cinematic__media--default`) y los fondos imagen/video siguen siendo controlados por editor.
- Integración de plantilla AIOR (`C:\Users\yasma\Downloads\Aior...`):
  - `/index.html` se sirve como HTML estatico desde `public/index.html`, generado desde la plantilla AIOR completa para preservar su orden natural de CSS/JS, cursor, Lenis, ScrollTrigger y hovers.
  - La portada original de AIOR fue reemplazada dentro de ese HTML por una portada Gloobi (`public/assets/site-shell/assets/css/gloobi-hero.css` y `public/assets/site-shell/assets/js/gloobi-hero.js`) basada en el hero React anterior.
  - `/` redirige a `/index.html`; la landing React anterior queda disponible como base historica para `/invitaciones` y componentes publicos.
  - El menu flotante del Home usa un rail biselado. El logo central abre un dropdown de paginas del sitio (`/admin/login`, `/invitaciones`, `/faq`) y los iconos restantes navegan secciones internas.
  - `/faq` redirige a la página estática Gloobi. La ruta `/tienda` y su navegación fueron retiradas porque no forman parte del sitio publicado.
  - `#categorias`: Seccion AIOR CTA dentro del HTML estatico, con 8 categorias infantiles (Espacio, Dinosaurios, Futbol, Carreras, Fantasia, Animales, Videojuegos y Princesas), imagenes en `public/assets/gloobi-home/tematicas-infantiles/`, animacion fan-stack nativa de AIOR, sin encabezado externo ni enlaces en las tarjetas.
  - Orden inmediato actual del Home: `#categorias` -> `#comparativa` ("De una imagen a toda una experiencia") -> `#demos` -> `#features-sec`.
  - `#demos`: Reemplazo de "Creativity with AI Image Generation" dentro del HTML estatico por una grilla de 8 demos en celulares `iframe`, apuntando a invitaciones CRM publicadas `/i/demo-*`.
  - `#proceso`: Diagrama visual del proceso de trabajo agregado antes de `#mensaje`, con lineas SVG, bifurcacion de aprobacion/cambios y animacion GSAP/ScrollTrigger.
  - `#mensaje`: Tarjeta animada servida por iframe desde `/mensaje-card-original.html`, con fondo de video optimizado y centrado automatico full-screen al entrar en la seccion; no tocar su iframe para cambios del diagrama.
  - Datos demo por categoria: `lib/demo-data.ts` exporta `demoCategoryInvitations`, `demoCategoryExampleItems` y `demoCategoryTemplates`; el mock persistente `.mock-data/store.json` tambien contiene esos 8 slugs para desarrollo local.

## 3) Rutas y responsables

### Publico

- `/` y `/invitaciones`
  - `app/page.tsx`
  - `app/invitaciones/page.tsx`
  - `app/faq/page.tsx`
  - `public/index.html`
  - `components/site/Landing.tsx`
  - `components/site/AiorTemplateFrame.tsx`
  - `components/site/Landing.module.css`

- `/i/[slug]` y `/i/[slug]/rsvp`
  - `app/i/[slug]/page.tsx`
  - `app/i/[slug]/rsvp/page.tsx`
  - `app/i/viewer-react-app.tsx`
  - `src/crm/viewer-sections.tsx`
  - `src/crm/viewer.css`

- RSVP publico por slug
  - `app/api/public/invitations/[slug]/rsvp/route.ts`
  - `app/api/public/invitations/[slug]/og-image/route.ts` (redirect legacy de imagen OG)
  - `app/api/public/og-card/route.ts` (tarjeta OG horizontal 1200x630 para WhatsApp/shares)
  - `lib/repository.ts` (`createPublicRsvpResponse`)

### Admin

- Auth/redirect
  - `middleware.ts`
  - `lib/auth.ts`
  - `app/admin/page.tsx`
  - `app/admin/login/page.tsx`

- Lista de invitaciones
  - `app/admin/invitations/page.tsx`
  - `components/admin/invitations-dashboard.tsx`
  - `components/admin/invitations-dashboard.module.css`

- Plantillas de invitacion
  - `app/api/admin/invitation-templates/route.ts`
  - `app/api/admin/invitations/from-template/route.ts`
  - `app/admin/invitations/new/page.tsx`
  - `components/admin/new-invitation-form.tsx`
  - `components/admin/invitation-editor-form.tsx`

- Editor
  - `app/admin/invitations/[id]/page.tsx`
  - `components/admin/invitation-editor-form.tsx`
  - `components/admin/invitation-editor-form.module.css`

- Site settings
  - `app/admin/site/page.tsx`
  - `components/admin/site-settings-form.tsx`
  - `lib/site-settings-defaults.ts`
  - `app/api/public/site/route.ts`
  - `app/api/admin/site/media/route.ts`
  - `public/assets/site-shell/assets/js/gloobi-site-content.js`
  - páginas editables: Home, Muestras, Sobre Gloobi, FAQ, Contacto y Acceso CRM

## 4) Fuentes de verdad del dato

- Datos persistidos:
  - Supabase si hay env configurado (`lib/supabase/*`)
  - Mock local si no hay env (`.mock-data/store.json`)
- Capa unica de acceso:
  - `lib/repository.ts`
- Modelos/tipos:
  - `types/invitations.ts`
  - `src/crm/viewer-types.ts`

## 5) Archivos sensibles (cambiar con cuidado)

- `middleware.ts`
  - Puede provocar loops de redireccion si se toca mal.
- `lib/auth.ts` + `app/api/admin/login/route.ts`
  - Define sesion persistente y seguridad admin.
- `src/crm/viewer.css`
  - Afecta experiencia publica completa de invitaciones.
- `components/admin/invitation-editor-form.tsx`
  - Es una pantalla compleja; cambios de layout pueden romper UX o sticky preview.
- `app/i/viewer-react-app.tsx`
  - Sincronizacion de tema dark/light entre sitio y viewer.

## 6) Convenciones de estilos para no romper rutas

- Publico landing:
  - usar CSS Modules de `components/site/*`
  - prefijos `landing-*` / `site-*`
- Admin CRM:
  - limitar a `.app-admin ...`
- Viewer publico:
  - limitar a `.app-viewer ...`
- Evitar selectores globales en `html`, `body`, `:root` para estilos del CRM/viewer.

## 7) Casos comunes: que archivo tocar

- Cambiar UI de landing:
  - `components/site/Landing.tsx`
  - `components/site/Landing.module.css`

- Cambiar login premium:
  - `components/site/PublicLoginShell.tsx`
  - `components/site/PublicLoginShell.module.css`
  - `app/admin/login/page.tsx` (montaje)

- Cambiar lista `/admin/invitations`:
  - `components/admin/invitations-dashboard.tsx`
  - `components/admin/invitations-dashboard.module.css`

- Cambiar editor `/admin/invitations/[id]`:
  - `components/admin/invitation-editor-form.tsx`
  - `components/admin/invitation-editor-form.module.css`

- Cambiar secciones visibles de invitacion publica:
  - `src/crm/viewer-sections.tsx`
  - `src/crm/viewer.css`

- Cambiar acceso/seguridad API publica:
  - `app/api/public/invitations/[slug]/route.ts`
  - `app/api/public/invitations/[slug]/rsvp/route.ts`
  - `app/api/public/invitations/[slug]/client-rsvp/route.ts`
  - `app/api/public/invitations/[slug]/og-image/route.ts`
  - `lib/public-invitation.ts`

- Endpoint legado RSVP (deprecado):
  - `app/api/rsvp/route.ts` (responde `410`)

- Cambiar sesion admin:
  - `app/api/admin/login/route.ts`
  - `app/api/admin/logout/route.ts`
  - `middleware.ts`
  - `lib/constants.ts` (`ADMIN_COOKIE_NAME`)

## 8) Checklist de no-regresion antes de cerrar cambios

1. `npm run css:guard`
2. `npm run build`
3. Verificar manual:
   - `/`
   - `/invitaciones`
   - `/faq`
   - `/admin/login`
   - `/admin/invitations`
   - `/admin/invitations/[id]`
   - `/i/cumple-7-luis-arturo-astronautas`
   - `/i/cumple-7-luis-arturo-astronautas/rsvp?token=...`

## 9) Comandos rapidos

```bash
npm run dev
npm run css:guard
npm run build
npm run test:smoke
```

## 10) Nota de continuidad para futuros chats

Si un chat nuevo necesita contexto rapido:

1. leer este archivo
2. abrir `app/*` de la ruta objetivo
3. abrir componente de `components/*` o `src/crm/*` asociado
4. confirmar impacto en `middleware.ts` y estilos scopeados

Con eso se evita tocar capas equivocadas.

## Catálogo de invitaciones — 8 de septiembre de 2026

- Nueva ruta Next `/invitaciones`, independiente del Home estático.
- `lib/invitation-catalog.ts` combina `demoCategoryExampleItems` con `siteSettings.data.blocks.examples.items`, deduplica por slug y verifica publicación mediante `getPublicInvitationBySlug`. Solo envía al cliente datos de catálogo; nunca el registro completo ni tokens privados.
- Taxonomía en `lib/catalog-taxonomy.ts`; metadata editorial temporal centralizada por slug en `lib/invitation-catalog.ts`. Las funciones proceden de secciones activas reales, sin inventar música o métricas de popularidad.
- Interfaz en `components/site/InvitationCatalog.tsx`, modal nativo accesible en `CatalogDialog.tsx`, CSS Modules aislados. Fragmentos existentes de navegación, fondo animado y footer del Home en `catalog-chrome.ts`, con sus estilos seleccionados y scopeados en `CatalogChrome.module.css`.
- Parámetros: `tipo` obligatorio/canónico, `categoria`, `subcategoria`, `q`, uno o varios `estilo` y `orden`. No existe filtro `funcion`. Categorías: `infantiles`, `cumpleanos`, `xv-anos`, `bodas`, `bebe`, `religiosas`, `graduaciones`, `reuniones`, `corporativos`. La subcategoría usa el nombre normalizado sin acentos, separado por guiones.
- El Home solo cambia href del CTA y nueve tarjetas de `#celebration-categories`; conserva el diseño y las demás secciones.
- Previews: se reutiliza `cover_url`. No existen thumbnail/fullPreview separados en el modelo actual: el modal muestra la portada disponible completa, no una captura nueva ni un iframe. Para mostrar una captura larga debe configurarse una imagen larga en el campo existente.
- Referencia Open9: estructura sidebar/grid/cards, lift, botón centrado que aparece de 30% a 50% en 200 ms, carga incremental y adaptación responsive. No se importan scripts, navbar ni footer de Open9. Su `#popup_bid` abre newsletter y no se reutiliza ni modifica.
- Validación detallada: `docs/CATALOGO_INVITACIONES.md`.

## Home oficial y Sobre Gloobi — 8 de septiembre de 2026

- El HOME estático oficial vive en `public/index.html`; `/` redirige a `/index.html` desde `app/page.tsx`.
- Las páginas de demostración y variantes HTML originales de AIOR fueron retiradas. En `public/` solo permanecen Sobre Gloobi, Contacto, FAQ y el documento interno de la tarjeta animada.
- Las rutas desconocidas usan la 404 nativa de Next en `app/not-found.tsx`, con identidad Gloobi y sin redirigir la URL solicitada.
- `/about.html` es la página “Sobre Gloobi”. Reutiliza las hojas y scripts AIOR compartidos, el fondo global, rail, tema persistente y footer Gloobi. Sus ajustes están aislados en `public/assets/site-shell/assets/css/about-gloobi.css` y `public/assets/site-shell/assets/js/about-gloobi.js`.
- About contiene propósito, cuatro principios, una sola composición “Detrás de Gloobi”, galería de nueve celebraciones y CTA. No contiene métricas, cronología, premios, testimonios ni equipo ficticio.


## FAQ Gloobi

La ruta `/faq` redirige a `public/faq.html`, una página estática con el lenguaje visual AIOR reutilizado y contenido 100% Gloobi. Incluye 15 preguntas y respuestas, acordeón accesible con botones reales, fondo animado compartido, tema claro/oscuro, navegación lateral y footer canónico de Home. Los estilos y comportamiento específicos viven en `public/assets/site-shell/assets/css/faq-gloobi.css` y `public/assets/site-shell/assets/js/faq-gloobi.js`.

## Contacto Gloobi

`public/contact.html` es la página pública de contacto. El formulario de cotización que antes estaba en Home vive únicamente allí, conserva su envío GET a WhatsApp y usa el mismo fondo/máscara Gloobi. Home ya no contiene ese bloque.
# Nota sobre el catálogo público

Los tipos comerciales del filtro de `/invitaciones` se definen en `lib/catalog-taxonomy.ts` y se asignan en `lib/invitation-catalog.ts`. No pertenecen al modelo persistido del CRM. Las funciones visibles en las tarjetas se siguen derivando de las secciones habilitadas y ya no forman parte de los filtros.
# Biblioteca Multimedia (2026-09-15)

Antes de tocar uploads, leer `docs/MEDIA_LIBRARY.md`. La persistencia nueva usa `MEDIA_STORAGE_PATH` y `MEDIA_BASE_URL`, metadata Supabase de `0003_media_library.sql`, o `.mock-data/media.json` en local. No volver a escribir uploads dinámicos en `public/uploads/site` ni habilitar GLB/GLTF sin un consumidor 3D real.

## Vista previa viva del editor

El iframe del editor compartido de demos e invitaciones usa `/i/[slug]?crm_live=1` con sesión admin. Tras cargar la invitación, el visor avisa al editor mediante `postMessage`; el editor le envía el borrador actual en cada cambio, validando origen y slug en ambos lados. Así se ven de inmediato textos y fondos de imagen o video sin guardar. La URL pública normal sigue leyendo únicamente los datos persistidos.

## Elementos fijos del editor CRM — 2026-09-18

La barra del CRM, el menú lateral del editor y la columna de vista previa permanecen visibles durante el scroll de la página. Los contenedores generales usan `overflow-x: clip` en lugar de `hidden` para recortar desbordamiento sin crear un ancestro de scroll que anule `position: sticky`. Menú y teléfono se fijan bajo la barra superior; la columna del teléfono puede desplazarse internamente cuando supera la altura de la ventana.
