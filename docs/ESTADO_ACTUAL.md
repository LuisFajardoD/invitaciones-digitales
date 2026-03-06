# Estado actual del proyecto

Actualizado: 6 de marzo de 2026

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
- CRM admin:
  - estilo scopeado en `.app-admin` y `src/crm/admin.css`
- Viewer publico:
  - estilo scopeado en `.app-viewer` y `src/crm/viewer.css`
- Tema dark/light:
  - sincronizado con `site-theme-mode` en localStorage

## Rutas actualmente criticas

- Landing:
  - `/`
  - `/examples`
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

## Riesgos conocidos

- `middleware.ts` y auth son puntos de alto riesgo para loops de redireccion.
- Cambios en `viewer.css` pueden impactar todas las invitaciones publicas.
- Cambios globales de CSS fuera de scope pueden romper coherencia entre landing, admin y viewer.

## Verificacion minima obligatoria

1. `npm run css:guard`
2. `npm run build`
3. Validar manual:
   - `/`
   - `/examples`
   - `/admin/login`
   - `/admin/invitations`
   - `/admin/invitations/[id]`
   - `/i/cumple-7-luis-arturo-astronautas`
   - `/i/cumple-7-luis-arturo-astronautas/rsvp?token=...`
