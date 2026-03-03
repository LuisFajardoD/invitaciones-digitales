# Cambios Recientes

Changelog corto para que un chat nuevo entienda rapido que se movio sin leer toda la conversacion.

## Ultima actualizacion

- Se actualizo el handoff general en:
  - `README.md`
  - `docs/README.md`
  - `docs/ESTADO_ACTUAL.md`

## Migracion Next -> React

- Se creo un frontend React con Vite en `frontend/`
- Ya existe viewer publico React para:
  - `/i/[slug]`
  - `/i/[slug]/rsvp?token=...`
- Ya existe CRM React inicial para:
  - `/admin/invitations`
  - `/admin/invitations/[id]`

## Bridge local

- En local, Next puede detectar que `:5173` esta activo y mandar hacia React
- Esto ya aplica a rutas publicas y a parte del admin
- Existe bypass con `?no_react_bridge=1`

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
3. Continuar desacoplando Next para dejarlo como backend/API
