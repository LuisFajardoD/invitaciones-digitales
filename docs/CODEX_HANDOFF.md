# CODEX HANDOFF

Guia rapida para que cualquier chat nuevo de Codex entienda el proyecto en minutos.

Actualizado: 7 de marzo de 2026

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
- Estilos:
  - `src/crm/admin.css` -> scope CRM admin (`.app-admin`)
  - `src/crm/viewer.css` -> scope viewer publico (`.app-viewer`)
  - `components/site/*.module.css` -> landing/login/public shell
  - Tema viewer por `data-theme` en `src/crm/App.tsx`:
    - `default` (base)
    - `watercolor-space` para `theme_id="astronautas"`
  - En `watercolor-space`, el fallback visual `default` vive en CSS (`viewer-stage__fallback` y `hero-cinematic__media--default`) y los fondos imagen/video siguen siendo controlados por editor.

## 3) Rutas y responsables

### Publico

- `/` y `/examples`
  - `app/page.tsx`
  - `app/examples/page.tsx`
  - `components/site/Landing.tsx`
  - `components/site/Landing.module.css`

- `/i/[slug]` y `/i/[slug]/rsvp`
  - `app/i/[slug]/page.tsx`
  - `app/i/[slug]/rsvp/page.tsx`
  - `app/i/viewer-react-app.tsx`
  - `src/crm/viewer-sections.tsx`
  - `src/crm/viewer.css`

- RSVP publico por slug
  - `app/api/public/invitations/[slug]/rsvp/route.ts`
  - `app/api/public/invitations/[slug]/og-image/route.ts` (preview OG 1200x630 para shares)
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
   - `/examples`
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
