# Invitaciones Digitales - estado actual del proyecto

Plataforma para crear y administrar invitaciones digitales animadas. Hoy conviven dos capas:
- Next.js sigue siendo el backend principal y la base del deploy actual.
- Un frontend React con Vite en `frontend/` esta en migracion y ya cubre buena parte del viewer publico y del CRM.

Este README ya no solo describe el proyecto; tambien sirve como handoff rapido para retomar el trabajo en un chat nuevo.

## Resumen ejecutivo

- Produccion actual:
  - Sigue dependiendo de Next (`/`, `/i/[slug]`, `/admin`, APIs).
- Migracion en curso:
  - El frontend React en `frontend/` ya renderiza viewer publico, vista cliente RSVP y un editor CRM en migracion.
- En local:
  - Si el viewer React esta activo en `:5173`, Next detecta eso y redirige/puentea varias rutas hacia React.
- Vista previa "real":
  - El editor usa un pipeline de screenshots con Playwright para generar capturas reales por dispositivo.

## Arquitectura actual

### Backend / app principal
- Next.js App Router
- TypeScript
- APIs en `app/api/*`
- Supabase (cuando hay `.env.local`)
- Modo demo persistente local en `.mock-data/store.json` cuando no hay Supabase

### Frontend en migracion
- Vite + React en `frontend/`
- Consume APIs de Next
- En local corre en `http://localhost:5173`

### Render real de preview
- Playwright (Chromium) corre desde el servidor de Next
- Genera PNGs en `public/generated-previews`
- El CRM React consume esas capturas via `/api/preview`

## Estado de la migracion Next -> React

### Ya migrado o parcialmente migrado en React
- Viewer publico de invitacion por `slug`
- Vista cliente RSVP por `slug + token`
- CRM React inicial y ya util para:
  - datos base
  - portada / fondos / astronauta
  - orden y visibilidad de secciones
  - acciones rapidas
  - galeria
  - checklist
  - mapa
  - RSVP y canal directo
  - modulos extra
- Preview por screenshot real con Playwright

### Sigue dependiendo de Next
- Deploy actual
- Middleware / auth
- APIs admin y publicas
- Portada `/`
- Parte del CRM historico
- Fallback completo cuando el frontend React no esta levantado

### Comportamiento del bridge local
- En local, si `:5173` esta activo:
  - `/i/[slug]` puede usar el viewer React
  - `/i/[slug]/rsvp` puede usar el viewer React
  - `/admin/invitations`
  - `/admin/invitations/[id]`
- Si `:5173` no esta activo:
  - todo cae al render normal de Next

## Rutas principales

### Publico
- `/` - Portada editable (Next)
- `/i/[slug]` - Invitacion publica
- `/i/[slug]/rsvp?token=...` - Resultados RSVP para cliente

### Admin
- `/admin` - Login
- `/admin/invitations` - Lista de invitaciones
- `/admin/invitations/new` - Crear borrador
- `/admin/invitations/[id]` - Editor de invitacion
- `/admin/rsvp/[id]` - Panel RSVP
- `/admin/site` - Editor de portada

### APIs nuevas relevantes para la migracion
- `/api/public/invitations/[slug]` - JSON publico de invitacion
- `/api/public/invitations/[slug]/client-rsvp` - JSON de vista cliente RSVP
- `/api/preview` - Genera screenshot real con Playwright
- `/api/preview/devices` - Fuente unica de dispositivos para previews
- `/api/preview/cleanup` - Limpieza de previews vencidas

## Preview real con Playwright

El simulador del CRM React ya no depende solo de un `iframe`. Puede pedir una captura real por dispositivo.

### Dispositivos soportados hoy
- iPhone Pro Max
- Galaxy Ultra
- Android comun
- Android grande
- Android pequeno
- Tablet

### Que emula
- viewport
- DPR
- `isMobile`
- `hasTouch`
- `userAgent`

### Modos
- `viewport` - captura del viewport visible
- `fullpage` - captura completa, util para debug

### Cache
- Se guarda en `public/generated-previews`
- Cache por invitacion + contenido + dispositivo + modo + flags relevantes
- Tiene lock en memoria para evitar carreras
- TTL de 7 dias

### Seguridad
- Si se usa `invitationId`, el endpoint requiere cookie admin
- Si se usa `slug`, solo genera si la invitacion esta publicada

## Setup rapido (local)

### 1) Instalar dependencias

```bash
npm install
```

### 2) Variables de entorno (modo persistente real)

Crea `.env.local` en la raiz con:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Importante:
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa del lado servidor.
- Si no existe `.env.local`, la app entra en modo demo persistente local.

### 3) Modo demo (sin Supabase)

En modo demo:
- Los datos se guardan en `.mock-data/store.json`
- Los cambios sobreviven a recargas y reinicios locales
- Ese archivo esta ignorado por Git

Credenciales demo:
- Email: `demo@invitaciones.local`
- Password: `demo12345`

## Scripts

### Desarrollo normal (solo Next)

```bash
npm run dev
```

En PowerShell:

```powershell
npm.cmd run dev
```

Notas:
- `predev` limpia `.next` antes de arrancar
- Esto evita varios errores de cache de Next en local

### Desarrollo recomendado (Next + React)

```bash
npm run dev:all
```

En PowerShell:

```powershell
npm.cmd run dev:all
```

Esto levanta:
- Next en `http://localhost:3000`
- Frontend React en `http://localhost:5173`

### Build de Next

```bash
npm run build
```

### Build del frontend React

```bash
npm run frontend:build
```

### Preview estable de Next en modo produccion local

```bash
npm run preview
```

### Preview del frontend React

```bash
npm run frontend:preview
```

## Flujo local recomendado

1. Correr `npm.cmd run dev:all`
2. Abrir `http://localhost:3000/admin`
3. Iniciar sesion con las credenciales demo si aplica
4. Entrar a:
   - `http://localhost:3000/admin/invitations`
   - `http://localhost:3000/admin/invitations/11111111-1111-4111-8111-111111111111`
5. Si el bridge local detecta React, la ruta se movera al CRM React automaticamente

## Documentacion recomendada para retomar trabajo

- [docs/README.md](docs/README.md) - indice de docs
- [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) - handoff tecnico y de migracion
- [docs/CAMBIOS_RECIENTES.md](docs/CAMBIOS_RECIENTES.md) - changelog corto de trabajo reciente
- [docs/PENDIENTES.md](docs/PENDIENTES.md) - lista separada de trabajo pendiente
- [docs/COMANDOS.md](docs/COMANDOS.md) - comandos de uso diario
- `docs/SRS.md` - requisitos del sistema
- `docs/DATA_MODEL.md` - modelo de datos
- `docs/UI_FLOWS.md` - rutas y flujos
- `docs/NOTIFICATIONS.md` - reglas de tiempos y estados
- `docs/TRACEABILITY.md` - checklist de validacion

## Reglas clave

- Si `now > active_until`, la invitacion publica muestra pantalla de evento finalizado
- Si `now > rsvp_until`, el RSVP se cierra aunque la invitacion siga vigente
- Si `rsvp.enabled=false`, no se muestra el bloque RSVP
- Para compartir en WhatsApp, usa `share.og_image_url` (recomendado: 1200x630)
