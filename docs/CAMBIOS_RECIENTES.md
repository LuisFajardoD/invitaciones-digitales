# Cambios recientes

Actualizado: 7 de marzo de 2026

## Resumen

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
  - imagen OG estable 1200x630 desde `/api/public/invitations/[slug]/og-image`
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
