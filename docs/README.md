# Invitaciones Digitales — CRM + Invitación Pública + Landing Editable

Plataforma web para crear y administrar invitaciones digitales animadas (primero infantiles), donde:
- El **admin** crea/edita invitaciones desde un **CRM interno**.
- Los invitados ven la invitación pública en `/i/[slug]` (mobile-first).
- La landing `/` es **editable** (paquetes, precios, ejemplos, contacto).
- Incluye **RSVP**, control de **vigencia** y pantalla de **evento finalizado**.

## Funcionalidades (v1)
- Landing editable `/` desde el CRM (sin tocar código).
- Invitación pública con **1 layout único** premium y secciones con switch (`enabled/disabled`).
- **Mapa embebido** cuando la sección `map` está activa.
- RSVP guardando respuestas y dashboard para admin.
- Vista de resultados para el cliente por **link con token** (sin cuentas).
- Expiración: después de `active_until` el mismo link muestra “evento finalizado” + CTA a `/`.
- Open Graph para vista previa al compartir (WhatsApp): `og:title`, `og:description`, `og:image`.

## Rutas principales

### Público
- `/` — Landing (editable)
- `/i/[slug]` — Invitación pública
- `/i/[slug]/rsvp?token=...` — Resultados RSVP para cliente (solo lectura)

### Admin (CRM)
- `/admin` — Login / redirect
- `/admin/invitations` — Lista de invitaciones
- `/admin/invitations/new` — Crear invitación (draft)
- `/admin/invitations/[id]` — Editor de invitación
- `/admin/rsvp/[id]` — Dashboard RSVP
- `/admin/site` — Editor landing (site_settings)

## Stack recomendado
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Storage + Auth)
- Animaciones: Framer Motion + Lottie
- Deploy: Vercel

## Documentación del proyecto
- `SRS.md` — Requisitos del sistema
- `DATA_MODEL.md` — Modelo de datos (tablas y JSON)
- `UI_FLOWS.md` — Rutas y flujos
- `NOTIFICATIONS.md` — Reglas de tiempos/estados y mensajes
- `TRACEABILITY.md` — Checklist de validación
- `GUIA_RAPIDA_v1.md` — Guía rápida de ejecución

## Setup rápido (local)

### 1) Instalar dependencias
    npm install

### 2) Variables de entorno
Crear `.env.local` en la raíz con:

    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...

Importante: `SUPABASE_SERVICE_ROLE_KEY` solo se usa del lado servidor (nunca en el cliente).

### 3) Ejecutar en desarrollo
    npm run dev

Abrir:
- http://localhost:3000

## Base de datos (tablas mínimas)
Tablas:
- `invitations`
- `rsvp_responses`
- `assets`
- `site_settings`
- `themes`

Recomendado:
- `invitations.slug` UNIQUE
- índice en `rsvp_responses.invitation_id`

## Storage (imágenes)
Usar un bucket (ej. `public`) para:
- Portada (hero)
- Galería
- Imagen OG (para compartir)
- Covers de ejemplos/demos

Guardar URLs en `assets.url` y referenciar:
- `sections.hero.hero_asset_id`
- `sections.gallery.asset_ids`
- `share.og_image_url`

## Seeds recomendados (para no iniciar vacío)
1) `site_settings`
- Insertar fila única con `id="main"` y `data` (hero, packages, examples, contact, etc.)

2) `themes`
- Insertar tema `"astronautas"` con `defaults` y `preview_url`

3) `invitations`
- Insertar invitación demo o la real “Cumple 7 Astronautas” con:
  - `slug`
  - `sections_order`
  - `sections`
  - `share` (Open Graph)
  - `expired_page`
  - `client_view_token`

## Reglas clave (resumen)
- Vigencia:
  - Si `now > active_until` → mostrar pantalla “evento finalizado” (no la invitación).
- RSVP:
  - Si `now > rsvp_until` → RSVP cerrado (aunque la invitación siga vigente).
  - Si `rsvp.enabled=false` → no mostrar RSVP.
- Compartir:
  - Para vista previa bonita en WhatsApp, usar `share.og_image_url` (recomendado 1200×630).