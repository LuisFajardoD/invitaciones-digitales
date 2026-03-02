Esta guía asume:
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Storage + Auth)
- Deploy en Hostinger Node.js Apps

## Deploy en Hostinger Node.js Apps
1) Import Git repo desde Hostinger (hPanel -> Websites -> Add Website -> Node.js Apps -> Import Git repository)
2) Install: `npm ci` (o `npm install`)
3) Build: `npm run build`
4) Start: `npm run start`
5) Env vars a configurar en Hostinger:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6) Verifica que `package.json` use:
   - `"start": "next start -p $PORT"`

## Deploy en Hostinger Node.js Apps (GitHub)
1) En hPanel: Websites → Add Website → Node.js Apps
2) Elige tu dominio/subdominio (ej. `invites.tudominio.com`)
3) Selecciona **Importa un repositorio Git** y conecta tu GitHub
4) Selecciona el repositorio del proyecto
5) Configura los comandos:
   - Install: `npm ci` (o `npm install`)
   - Build: `npm run build`
   - Start: `npm run start`
6) Configura variables de entorno en Hostinger:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo si se usa en servidor)
7) Nota importante:
   - En `package.json`, el script debe ser: `"start": "next start -p $PORT"`

---

## 1) Requisitos
- Node.js 18+ (recomendado 20+)
- npm o pnpm
- Cuenta y proyecto en Supabase

---

## 2) Variables de entorno
Crear un archivo `.env.local` en la raíz del proyecto:

- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` *(solo server; no exponer en cliente)*
- `ADMIN_EMAIL=...` *(opcional si controlas acceso por email)*
- `WHATSAPP_DEFAULT=5255XXXXXXXXXX` *(número por defecto para CTAs si no viene en settings)*

Notas:
- `NEXT_PUBLIC_*` se puede usar en el cliente.
- `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en server (route handlers/Server Actions).

---

## 3) Instalación y ejecución local
En la carpeta del proyecto:

1) Instalar dependencias:
- `npm install`

2) Levantar en desarrollo:
- `npm run dev`

3) Abrir:
- `http://localhost:3000`

---

## 4) Estructura de rutas (esperada)
- `/` landing (lee `site_settings`)
- `/i/[slug]` invitación pública
- `/i/[slug]/rsvp?token=...` vista cliente RSVP
- `/admin` CRM
- `/admin/invitations` lista
- `/admin/invitations/new` crear
- `/admin/invitations/[id]` editor
- `/admin/rsvp/[id]` dashboard
- `/admin/site` editor landing

---

## 5) Base de datos (tablas mínimas)
Tablas:
- `invitations`
- `rsvp_responses`
- `assets`
- `site_settings`
- `themes`

Recomendación:
- Crear índices en `invitations.slug` (UNIQUE) y `rsvp_responses.invitation_id`.

---

## 6) Seed inicial recomendado (para no iniciar vacío)
### 6.1 `site_settings`
- Insertar una fila con `id="main"` y `data` con:
  - hero, packages, examples, contact, etc.

### 6.2 `themes`
- Insertar tema `astronautas` con `defaults` y `preview_url`.

### 6.3 `invitations` (demo o la real de Astronautas)
- Crear invitación con:
  - `slug="cumple-7-luis-arturo-astronautas"`
  - `status="draft"` (luego publicar)
  - `sections` y `sections_order`
  - `share` (og_title, og_description, og_image_url)
  - `expired_page`
  - `client_view_token`

---

## 7) Storage (imágenes)
Usar un bucket (ej. `public`) para:
- Portada (`hero`)
- Galería (`gallery`)
- OG (`og`)
- Covers de demos (`example_cover`)

Guardar URLs resultantes en `assets.url` y referenciar en:
- `sections.hero.hero_asset_id`
- `sections.gallery.asset_ids`
- `share.og_image_url`

---

## 8) Autenticación del admin (CRM)
En v1 se recomienda un enfoque simple:
- Proteger rutas `/admin/*` con sesión (Supabase Auth) y permitir solo ciertos correos (whitelist).
- Alternativa rápida: un “admin password” server-side (no recomendado a largo plazo).

Criterio:
- Si no está autenticado → mostrar login.
- Si está autenticado pero no autorizado → “Acceso denegado”.

---

## 9) Deploy (opcional) — Vercel
1) Subir repo a GitHub
2) Importar en Vercel
3) Configurar env vars en Vercel (las mismas de `.env.local`)
4) Deploy

Notas:
- Mantener `SUPABASE_SERVICE_ROLE_KEY` solo en variables de servidor.
- Verificar que OG tags se generen server-side en `/i/[slug]`.

---

## 10) Checklist rápido (smoke test)
1) `/` carga y muestra paquetes desde `site_settings`
2) `/admin` requiere login
3) Crear invitación → guardar
4) Publicar invitación
5) Abrir `/i/<slug>` en móvil (o emulador)
6) Confirmar RSVP y ver que aparece en `/admin/rsvp/<id>`
7) Probar link cliente: `/i/<slug>/rsvp?token=...`
8) Forzar expiración (active_until al pasado) y ver pantalla “evento finalizado”
