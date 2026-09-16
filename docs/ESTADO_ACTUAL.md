# Estado actual del proyecto

Actualización 16 de septiembre de 2026: se retiró un override de geometría al final de `gloobi-hero.css` y se restauraron reglas base de la comparativa y el coverflow omitidas al mover `public/aior` a `site-shell`. Las rutas antiguas de medios guardadas en el editor se normalizan al leer la configuración pública mediante `lib/legacy-asset-paths.json`. El Home usa las rutas físicas actuales para el video de la tarjeta y las decoraciones CSS disponibles.

Actualizado: 15 de septiembre de 2026

## Resumen ejecutivo

- El proyecto corre completamente en Next.js.
- No hay frontend Vite activo en este estado.
- El flujo principal de negocio esta funcional:
  - Landing y examples
  - Login admin y dashboard de invitaciones
  - Editor de invitacion con preview de dispositivo
  - Guardado como plantilla + creacion desde plantilla en CRM
  - Viewer publico de invitacion
  - RSVP cliente y panel RSVP cliente privado por token
  - Sitio público editable por página y sección, incluidos medios, fondos, galerías, precios, demos, FAQ y contacto

## Flujo de datos

- Si Supabase esta configurado:
  - Se usa DB real via `lib/repository.ts`.
- Si no hay env completa:
  - Se usa mock persistente local en `.mock-data/store.json`.

## Estado de seguridad y auth

- Middleware protege `/admin/*` excepto `/admin/login`.
- `/admin` redirige a:
  - `/admin/login` sin cookie
  - `/admin/invitations` con cookie
- Session admin:
  - cookie `inv_admin_session`
  - login API en `app/api/admin/login/route.ts`
- API publica sanitizada para no exponer campos internos sensibles.
- Envio RSVP publico endurecido por `slug` (sin aceptar `invitationId` desde cliente).
- Endpoint legado `POST /api/rsvp` marcado como deprecado (`410`).

## Estado visual

- Sitio publico:
  - estilo premium en `components/site/*`
  - `/` redirige a `/index.html`
  - `/index.html` se sirve como HTML estatico desde `public/index.html`, usando la plantilla AIOR completa con su carga original de CSS/JS
  - el menu flotante del Home usa un rail biselado con iconos oscuros solidos; el logo Gloobi abre un dropdown hacia paginas del sitio (`/admin/login`, `/invitaciones`, `/faq`)
  - `/faq` forma parte de la navegación pública; `/tienda` fue retirada porque no existe una tienda publicada
  - Todos los recursos multimedia (imágenes, video, favicons, íconos UI) de la landing están unificados en `public/assets/gloobi-home/` organizados en subcarpetas por sección (`brand`, `ui`, `tematicas-infantiles`, `experiencias-slider`, `beneficios`, `compartir`, `galeria-visual`, `categorias`, `cta-final`, `testimonios`, `contacto`, `pie-pagina` y `contacto`)
  - portada Gloobi recreada dentro del hero de AIOR con `public/assets/site-shell/assets/css/gloobi-hero.css` y `public/assets/site-shell/assets/js/gloobi-hero.js`, manteniendo cursor, Lenis, ScrollTrigger, hovers y fondos originales de AIOR
  - el video pequeño del hero no conserva una fuente estática visible durante la carga: espera la URL guardada en el CRM y usa el archivo original sólo como respaldo si falla la configuración pública
  - fondo oscuro base del Home unificado en `#06050b`; la iluminacion violeta/purpura ambiental se aplica como una sola capa global en `body::before`, cubriendo el alto real del documento y dejando transparentes las secciones normales importadas
  - sección `#categorias` integrada directamente en `public/index.html` con el diseño CTA/fan-stack de AIOR, 8 tarjetas de categoria infantil sin encabezado externo ni navegacion, centradas verticalmente dentro de su bloque
  - orden actual del Home: `#categorias`, `#comparativa` ("De una imagen a toda una experiencia"), `#demos` y luego `#features-sec`
  - sección `#demos` reemplaza "Creativity with AI Image Generation" en el HTML estatico y muestra 8 celulares con demos CRM publicados (`/i/demo-espacio`, `/i/demo-dinosaurios`, `/i/demo-futbol`, `/i/demo-carreras`, `/i/demo-fantasia`, `/i/demo-animales`, `/i/demo-videojuegos`, `/i/demo-princesas`)
  - sección `#proceso` insertada antes de `#mensaje`, con diagrama SVG del proceso de trabajo, bifurcacion de aprobacion/cambios y regreso visual a la vista previa
  - sección `#mensaje` ocupa el viewport completo, se centra automaticamente al entrar desde arriba/abajo, usa video de fondo optimizado en MP4/WebM y mantiene la tarjeta animada en iframe con tonos pergamino coherentes con la portada antigua
  - `.mock-data/store.json` y `lib/demo-data.ts` incluyen los 8 demos por categoria, mas templates para reutilizarlos desde el CRM
  - sección `#contacto` recupera el recorte orgánico diagonal superior derecho (`contact_bg_shape.png` con alpha mask) y el fondo 3D violeta/púrpura (`contact_bg_1.avif`)
  - `/admin/site` edita el sitio vigente mediante pestañas: Home, Muestras, Sobre Gloobi, FAQ, Contacto y Acceso CRM
  - `Home > 05 · Demos destacadas` permite seleccionar las cuatro invitaciones `Web Premium` publicadas que aparecen en la portada; evita duplicados y se alimenta del catálogo vigente
  - `GET /api/public/site` entrega la configuración normalizada a las páginas públicas; los HTML estáticos la aplican mediante `public/assets/site-shell/assets/js/gloobi-site-content.js`
  - los iframes del comparador, demos destacados y tarjeta de mensaje usan carga por proximidad mediante `data-src`; el adaptador del CRM preserva esa carga diferida y vuelve a enlazar la animación del título si cambia su texto
  - imágenes, videos y SVG pueden subirse mediante `POST /api/admin/site/media`; se deduplican y usan el storage central configurado
- CRM admin:
  - estilo scopeado en `.app-admin` y `src/crm/admin.css`
  - el editor de sitio usa tarjetas plegables, previsualización de medios, navegación por página y barra fija de guardado
- Viewer publico:
  - estilo scopeado en `.app-viewer` y `src/crm/viewer.css`
  - tema `watercolor-space` activo para invitaciones `theme_id="astronautas"` (fallback `default` para el resto)
  - fondos de portada y secciones vuelven a responder a configuración del editor (tipo, URL, kenburns); el modo `default` en `watercolor-space` usa fallback acuarela
- Tema dark/light:
  - sincronizado con `site-theme-mode` en localStorage

## Rutas actualmente criticas

- Landing:
  - `/`
  - `/invitaciones`
  - `/faq`
  - `/index.html`
- Admin:
  - `/admin/login`
  - `/admin/invitations`
  - `/admin/invitations/new`
  - `/admin/invitations/[id]`
  - `/admin/site`
- Viewer:
  - `/i/[slug]`
  - `/i/[slug]/rsvp?token=...`
  - `/api/public/invitations/[slug]/og-image`
  - `/api/public/og-card`

## Riesgos conocidos

- `middleware.ts` y auth son puntos de alto riesgo para loops de redireccion.
- Cambios en `viewer.css` pueden impactar todas las invitaciones publicas.
- Cambios globales de CSS fuera de scope pueden romper coherencia entre landing, admin y viewer.
- La persistencia física admite `MEDIA_BACKEND=local` con `MEDIA_STORAGE_PATH`, o `MEDIA_BACKEND=hostinger` con FTPS y `MEDIA_BASE_URL`.
- Si en `site_settings` persisten paquetes legacy, se normalizan al catalogo nuevo en runtime; guardar desde `/admin/site` persiste el formato nuevo.

## Verificacion minima obligatoria

1. `npm run css:guard`
2. `npm run build`
3. Validar manual:
   - `/`
   - `/invitaciones`
   - `/faq`
   - `/admin/login`
   - `/admin/invitations`
   - `/admin/invitations/[id]`
   - `/i/cumple-7-luis-arturo-astronautas`
   - `/i/cumple-7-luis-arturo-astronautas/rsvp?token=...`

## Catálogo público — 8 de septiembre de 2026

Disponible en `/invitaciones`: muestras publicadas del CRM y demos centrales existentes, filtros jerárquicos por tipo/categoría/subcategoría/estilo, búsqueda, ordenamiento y carga incremental de diez tarjetas. Modal de imagen completa con scroll interno y diálogo de filtros móvil. La ruta antigua `/examples` fue eliminada; el catálogo canónico es `/invitaciones`. Ver `docs/CATALOGO_INVITACIONES.md` para fuentes, limitaciones y validación.

## Home y About — 8 de septiembre de 2026

- `public/index.html` es el HOME oficial; `/` abre ese archivo mediante redirección Next.
- Las variantes y demos HTML sobrantes de AIOR fueron eliminadas; el único HOME estático es `public/index.html`.
- `app/not-found.tsx` atiende rutas inexistentes con una experiencia 404 Gloobi y conserva la URL incorrecta.
- `/about.html` presenta la historia y filosofía de Gloobi, comparte dark/light, fondo animado, rail, branding, footer y librerías de animación con el HOME.


## Auditoría frontend — 2026-09-09

Correcciones técnicas de loader, Lenis, inicialización/persistencia de tema, footer light, carga diferida de iframes e imágenes y pausa de trabajo fuera de viewport. Build y css:guard aprobados; pruebas locales en seis anchos. Ver `PERFORMANCE_AUDIT.md` para métricas y limitaciones; no asumir resolución definitiva de stutter de video sin prueba GPU real. Arquitecturas documentadas en `STYLE_ARCHITECTURE.md` y `ANIMATION_ARCHITECTURE.md`.

## FAQ Gloobi

FAQ publicada en `/faq` → `/faq.html`, con respuestas sobre invitaciones digitales, personalización, confirmación, catálogo, paquetes y cotización. Usa enlaces reales a `/`, `/invitaciones`, `/#pricing-sec` y `/#contacto`, y footer sincronizado con Home.

## Contacto

La página `contact.html` reúne tarjetas de WhatsApp, correo y atención en línea, seguida del formulario de cotización original. No muestra mapa ni dirección física.
# Catálogo público y tipos de invitación

- `/invitaciones` filtra por Tipo de invitación, Categoría y Estilo. Tipo es obligatorio; Categoría inicia en Todas; cero estilos equivale a todos y la multiselección usa OR.
- Los slugs de tipo están centralizados en `lib/catalog-taxonomy.ts`: `imagen-esencial`, `interactiva`, `video-invitacion`, `web-esencial` y `web-premium`.
- El CRM no almacena esta clasificación comercial; el catálogo la incorpora en su metadata editorial central y mantiene intactas las funciones derivadas de secciones activas. El fallback conservador es Web Premium.

## Biblioteca Multimedia

- `/admin/media` administra los recursos cargados desde el CRM.
- Nuevos recursos se deduplican por SHA-256 y se relacionan mediante `media_usages` al guardar sitio o invitación.
- El backend Hostinger usa `basic-ftp`, TLS estricto, rutas relativas por hash, creación automática de carpetas y eliminación remota durante purga. La cuenta configurada valida TLS mediante `hostinger.com` y devuelve `/public_html` como raíz remota.
- Los uploads históricos de `public/uploads/site` se conservan sin migración automática.
- GLB/GLTF permanecen deshabilitados porque el proyecto no tiene visor de modelos 3D.
