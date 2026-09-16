# CODEX HANDOFF

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
