# Invitaciones Digitales

Plataforma web para crear, editar y publicar invitaciones digitales animadas con flujo CRM + viewer publico + panel RSVP cliente.

Actualizado: 6 de marzo de 2026

## Stack actual

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (cuando hay variables configuradas)
- Fallback demo persistente en `.mock-data/store.json` cuando no hay Supabase
- Playwright para previews/capturas de dispositivos
- UI principal en:
  - `components/*` (landing y admin)
  - `src/crm/*` (viewer, RSVP cliente, utilidades visuales compartidas)

## Rutas principales

- Publico
  - `/` landing
  - `/examples` landing variante demos
  - `/i/[slug]` invitacion publica
  - `/i/[slug]/rsvp?token=...` panel RSVP cliente (acceso privado por token)

- Admin
  - `/admin` redirige segun sesion
  - `/admin/login` login CRM
  - `/admin/invitations` lista de invitaciones
  - `/admin/invitations/new` crear invitacion
  - `/admin/invitations/[id]` editor
  - `/admin/rsvp/[id]` redirige al panel RSVP cliente de esa invitacion
  - `/admin/site` editor de configuracion de landing

## Estructura clave del codigo

- `app/`
  - rutas Next (paginas y APIs)
- `components/site/`
  - landing + shells publicos
- `components/admin/`
  - dashboard, editor, formularios admin
- `src/crm/`
  - `App.tsx`, `RequireAuth.tsx`, `viewer-sections.tsx`, `viewer.css`, `admin.css`
- `lib/`
  - auth, repository, defaults, utilidades, preview
- `types/`
  - tipos del dominio (`invitations.ts`)
- `docs/`
  - handoff y guias operativas

## Variables de entorno

Archivo: `.env.local`

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ENABLE_DEMO_AUTH` (solo desarrollo, con restricciones)

Notas:

- En produccion, `ADMIN_EMAIL` es obligatorio para permitir acceso admin.
- Si faltan variables de Supabase, la app cae a mock local segun `lib/repository.ts`.

## Comandos

- Desarrollo:
  - `npm run dev`
- Build:
  - `npm run build`
- Start (prod):
  - `npm run start`
- Preview local prod:
  - `npm run preview`
- Guard CSS:
  - `npm run css:guard`
- Smoke test:
  - `npm run test:smoke`

## Regla de lectura para retomar en un chat nuevo

1. Leer [`docs/CODEX_HANDOFF.md`](docs/CODEX_HANDOFF.md)
2. Leer [`docs/ESTADO_ACTUAL.md`](docs/ESTADO_ACTUAL.md)
3. Leer [`docs/CAMBIOS_RECIENTES.md`](docs/CAMBIOS_RECIENTES.md)
4. Revisar [`docs/COMANDOS.md`](docs/COMANDOS.md)

Con eso ya se puede entrar a trabajar sin reconstruir contexto desde cero.
