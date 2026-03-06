# Cambios recientes

Actualizado: 6 de marzo de 2026

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
