# Estado Actual - handoff tecnico

Este archivo existe para que un chat nuevo entienda rapido donde va el proyecto, que ya se cambio y que sigue pendiente.

## Resumen corto

- Next sigue siendo la app principal y el deploy actual.
- Ya existe una migracion en curso a React + Vite dentro de `frontend/`.
- En local, Next puede puentear varias rutas hacia el frontend React si este esta levantado en `:5173`.
- El preview del CRM React ya puede usar capturas reales por dispositivo generadas con Playwright.
- Sin Supabase, el proyecto trabaja en modo demo persistente local con `.mock-data/store.json`.

## Estado de la migracion

### Sigue en Next

- Deploy actual
- Middleware y login
- APIs admin y publicas
- Portada `/`
- Fallbacks cuando React no esta activo

### Ya migrado o parcialmente migrado a React

Ubicacion:
- `frontend/`

Rutas React ya funcionales:
- `/i/[slug]`
- `/i/[slug]/rsvp?token=...`
- `/admin/invitations`
- `/admin/invitations/[id]`

Cobertura actual del editor React:
- configuracion general
- hero y fondos
- astronauta
- fondo global
- orden y visibilidad de secciones
- acciones rapidas
- galeria
- checklist
- mapa
- RSVP y canal directo
- modulos extra
- preview dentro de marco tipo telefono

## Bridge local Next -> React

Objetivo:
- seguir entrando por `localhost:3000`, pero usar React si esta disponible

Comportamiento:
- si `http://localhost:5173` responde en local, Next redirige o puentea hacia React en varias rutas
- si `:5173` no esta activo, todo cae al render de Next

Rutas donde esto ya importa:
- `/i/[slug]`
- `/i/[slug]/rsvp`
- `/admin/invitations`
- `/admin/invitations/[id]`

Archivo clave:
- `components/invitation/react-viewer-bridge.tsx`

Nota:
- existe bypass de bridge via `?no_react_bridge=1`, usado por el renderer de Playwright

## Preview real con Playwright

Ya no depende solo de un iframe. El sistema puede generar screenshots reales de la invitacion publica con emulacion de dispositivo.

### Source de dispositivos

Archivo unico de verdad:
- `lib/preview/devices.ts`

API de lectura para frontend:
- `/api/preview/devices`

Regla:
- si agregas un device en `devices.ts`, el selector del frontend lo recibe sin tocar `App.tsx`

### Endpoint principal

- `/api/preview`

Parametros soportados:
- `invitationId` o `slug`
- `deviceId`
- `mode=viewport|fullpage`
- `force=1`

### Emulacion real

Cada perfil define:
- viewport
- DPR
- `isMobile`
- `hasTouch`
- `userAgent`

Ademas:
- espera `networkidle`
- espera `document.fonts.ready`
- fuerza `reducedMotion`
- apaga animaciones, transitions y cursor blink
- fuerza `color-scheme: dark`

### Cache

- Directorio: `public/generated-previews`
- Cache key incluye:
  - invitacion
  - hash de contenido
  - `deviceId`
  - `mode`
  - flags de render relevantes
- TTL: 7 dias
- Lock en memoria para evitar carreras cuando entran requests iguales al mismo tiempo

### Seguridad

- Por `invitationId`: requiere cookie admin
- Por `slug`: solo genera si la invitacion esta publicada
- `deviceId` se valida contra whitelist

## Modo demo y persistencia

Si no existe `.env.local`:
- se activa modo demo
- la persistencia cae en `.mock-data/store.json`

Consecuencia:
- los cambios sobreviven localmente
- no se suben con Git
- no sustituyen una base real en produccion

Credenciales demo:
- Email: `demo@invitaciones.local`
- Password: `demo12345`

## Flujo local recomendado

### Arranque

```powershell
npm.cmd run dev:all
```

Eso levanta:
- Next en `http://localhost:3000`
- React en `http://localhost:5173`

### Login

1. abrir `http://localhost:3000/admin`
2. iniciar sesion con usuario demo si aplica

### Trabajo diario

1. entrar por `http://localhost:3000/admin/invitations`
2. dejar que el bridge mande a React si corresponde
3. usar el preview de screenshot para validar por dispositivo

## Problemas conocidos

### Next en local es fragil

- `next dev` suele quedar con cache roto
- por eso existe `predev` para limpiar `.next`
- si algo raro persiste, reiniciar `dev:all`

### El editor React aun no es el diseno final

- funcionalmente ya cubre bastante
- visualmente sigue necesitando una pasada fuerte de UI
- el usuario quiere algo mas cercano a Bentofolio:
  - look negro
  - menos "tripa" vertical
  - modulos mas compactos
  - mejor uso del ancho en desktop

### El preview puede parecer inconsistente si cambia el dispositivo

Se corrigio una fuente importante del problema:
- ahora una captura vieja no se reutiliza si el `deviceId` o `mode` ya cambiaron
- mientras llega la nueva, se muestra placeholder estable

Si vuelve a haber "saltos", revisar:
- cambios de layout por scrollbar
- imagenes tardias
- cambios de tamano fuera del screenshot

## Archivos clave para seguir

### Backend / preview
- `lib/preview/devices.ts`
- `lib/preview/screenshots.ts`
- `app/api/preview/route.ts`
- `app/api/preview/devices/route.ts`
- `app/api/preview/cleanup/route.ts`

### Bridge y rutas Next
- `components/invitation/react-viewer-bridge.tsx`
- `app/i/[slug]/page.tsx`
- `app/i/[slug]/rsvp/page.tsx`
- `app/admin/invitations/page.tsx`
- `app/admin/invitations/[id]/page.tsx`

### Frontend React
- `frontend/src/App.tsx`
- `frontend/src/styles.css`
- `frontend/src/viewer-types.ts`
- `frontend/src/viewer-utils.ts`
- `frontend/src/viewer-sections.tsx`

## Pendientes mas utiles

1. Redisenar de verdad el CRM React
   - layout tipo dashboard desktop
   - menos bloques largos
   - modulos colapsables
   - mejor relacion entre panel izquierdo y preview

2. Afinar consistencia visual del preview
   - revisar cualquier salto de layout en la pagina completa
   - estabilizar tamaños globales del admin si vuelve a "verse agrandado"

3. Seguir desacoplando Next del frontend
   - mantener Next como backend/API
   - mover mas UI publica y admin a React

4. Definir estrategia de produccion
   - hoy el deploy principal sigue siendo Next
   - la capa React aun esta pensada para migracion local y progresiva
