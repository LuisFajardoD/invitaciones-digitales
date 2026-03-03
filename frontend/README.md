# Frontend React (Vite)

Base inicial para migrar la capa visual fuera de Next sin romper el backend actual.

## Flujo actual

- Este frontend consume `GET /api/public/invitations/:slug`.
- En desarrollo, Vite proxya `/api` a `http://localhost:3000`.
- Next sigue funcionando como backend temporal.

## Arranque local

1. Levanta el backend actual:
   - `npm.cmd run preview`
   - o `npm.cmd run dev`
2. En otra terminal:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3. Abre:
   - `http://localhost:5173/i/cumple-7-luis-arturo-astronautas`

## Siguiente fase

- Migrar el render completo de `/i/[slug]` a este frontend.
- Reemplazar después el `iframe` del editor para apuntar a `http://localhost:5173/i/:slug`.
- Cuando la capa pública ya esté estable, mover el CRM.
