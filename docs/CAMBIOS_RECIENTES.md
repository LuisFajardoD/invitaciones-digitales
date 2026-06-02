# Cambios recientes

Actualizado: 8 de marzo de 2026

## Resumen

- Se agrego modulo de formularios de levantamiento:
  - admin crea formularios en `/admin/intakes`
  - cliente llena un enlace privado `/brief/[token]`
  - el resumen interno vive en `/admin/intakes/[id]`
  - se guarda en tabla separada `event_intake_forms` y no modifica invitaciones automaticamente
  - las paginas de formularios tienen boton modo claro/oscuro; usan tema claro por default, secciones activables con casilla a la izquierda, etiquetas "Activada/Desactivada", selector de hora legible y boton principal "Guardar cambios".
  - en preguntas frecuentes/avisos cada pregunta se puede activar por separado y se mantiene un cuadro libre para otras preguntas, reglas o avisos.
  - se alineo la paleta visual con la landing para evitar fondos/accentos azules en CRM y formularios.
  - el sitio, CRM, viewer publico y formularios migran a tema claro por default, manteniendo modo oscuro manual.
- Viewer publico:
  - se elimino el renderer legacy `components/invitation/layout_v1` para evitar tomar versiones viejas de diseno.
  - cualquier `theme_id` del viewer resuelve a la base visual pastel `watercolor-space`; los nombres de tema solo deben activar detalles especificos.
  - se agrego portada tematica para `theme_id="sirenas"` con fondo marino, burbujas, personaje flotante en video, concha y fuentes locales.
- Login del CRM:
  - se agrego casilla para recordar usuario y contrasena en este navegador usando `localStorage`.
- Se agrego modo demo para enlaces de landing/examples:
  - las tarjetas de demo abren `/i/[slug]?demo=1`
  - el enlace publico normal `/i/[slug]` sigue mostrando expiracion cuando `active_until` ya paso
  - se normaliza el contenido de `expired_page` para evitar mostrar URLs pegadas por error en el titulo o mensaje de expiracion
- Se consolidaron rutas y estilos para experiencia premium en:
  - landing (`/`, `/examples`)
  - login admin
  - lista de invitaciones
  - editor de invitacion
  - viewer publico
  - panel RSVP cliente
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
  - ajuste adicional: metadata respeta `share.og_image_url` configurable en el editor, excepto overrides puntuales por slug cuando una invitacion requiere una imagen OG versionada y estable para WhatsApp
  - la invitacion de Julieta usa imagen OG dedicada en `/assets/sirenas/julieta-og-v1.jpg` y su enlace RSVP usa `/assets/sirenas/rsvp-og-v1.jpg`
- Se renovó la landing comercial y su editor:
  - paquetes recomendados en `lib/site-packages.ts` (Imagen Esencial, Interactiva, Video, Web Esencial, Web Premium)
  - servicio/alcance web, extras y politicas renderizadas en `/` y `/examples`
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
