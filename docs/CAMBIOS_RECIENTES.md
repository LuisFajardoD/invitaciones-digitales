# Cambios Recientes

Changelog corto para que un chat nuevo entienda rapido que se movio sin leer toda la conversacion.

## Ultima actualizacion

- Se limpio CSS legacy muerto del admin en:
  - `frontend/src/styles.css`
  - `app/globals.css`
- Se elimino el bridge legacy:
  - `components/invitation/react-viewer-bridge.tsx`
- Se actualizaron fallbacks de Next del admin para no depender de ese bridge
- Se conecto el entorno local a Supabase via `.env.local`
- Se sincronizo la invitacion `cumple-7-luis-arturo-astronautas` desde mock local hacia Supabase
- Se actualizo el handoff general en:
  - `README.md`
  - `docs/README.md`
  - `docs/ESTADO_ACTUAL.md`

## Migracion Next -> React

- Se creo un frontend React con Vite en `frontend/`
- El viewer publico de Next ahora monta React en:
  - `/i/[slug]`
  - `/i/[slug]/rsvp?token=...`
- El admin principal de Next ahora monta React en:
  - `/admin`
  - `/admin/invitations`
  - `/admin/invitations/[id]`
- `:5173` se mantiene como entorno aislado de desarrollo, no como puente obligatorio

## Preview real con Playwright

- Se agrego render de screenshots reales por dispositivo
- Endpoint principal:
  - `/api/preview`
- Lista de dispositivos:
  - `/api/preview/devices`
- Limpieza:
  - `/api/preview/cleanup`
- Las capturas se guardan en:
  - `public/generated-previews`

## Dispositivos de preview

Ya existen perfiles para:
- iPhone Pro Max
- Galaxy Ultra
- Android comun
- Android grande
- Android pequeno
- Tablet

## Seguridad del preview

- Si se usa `invitationId`, el endpoint requiere cookie admin
- Si se usa `slug`, solo genera si la invitacion esta publicada
- `deviceId` se valida contra whitelist

## Modo demo

- Si no hay `.env.local`, la app usa `.mock-data/store.json`
- Credenciales demo:
  - `demo@invitaciones.local`
  - `demo12345`

## Produccion / Hostinger

- El deploy requiere estas variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAIL`
- El correo de `ADMIN_EMAIL` debe existir en Supabase Auth

## Scripts mas importantes

- `npm.cmd run dev`
  - Next solo

- `npm.cmd run dev:all`
  - Next + frontend React

- `npm.cmd run build`
  - build de Next

- `npm.cmd run frontend:build`
  - build del frontend React

## Problemas conocidos

- Next en local sigue siendo fragil con cache
- El CRM React ya es util, pero visualmente aun necesita un rediseño mas fuerte
- Si el layout "salta" o se ve raro en el preview, revisar si:
  - cambio el dispositivo/modo
  - la captura vieja sigue visible
  - hay reflow por layout global

## Siguiente foco recomendado

1. Mejorar el diseno del CRM React en serio
2. Seguir afinando la consistencia visual del preview
3. Continuar desacoplando Next para dejarlo como backend/API y migrar las pantallas admin legacy que aun faltan
