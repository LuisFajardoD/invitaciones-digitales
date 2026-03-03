# Comandos

Guia minima de uso diario para trabajar localmente sin buscar entre varios docs.

## Arranque recomendado

Levanta Next + frontend React:

```powershell
npm.cmd run dev:all
```

Esto deja:
- Next en `http://localhost:3000`
- React en `http://localhost:5173`

## Si PowerShell bloquea `npm`

Usa:

```powershell
cmd /c npm.cmd run dev:all
```

## Solo Next

```powershell
npm.cmd run dev
```

## Build

### Build de Next

```powershell
npm.cmd run build
```

### Build del frontend React

```powershell
npm.cmd run frontend:build
```

## Preview estable de Next

```powershell
npm.cmd run preview
```

## Login demo

Si no hay `.env.local`, usa:

- Email: `demo@invitaciones.local`
- Password: `demo12345`

## Rutas utiles

### Login admin

- `http://localhost:3000/admin`

### Lista de invitaciones

- `http://localhost:3000/admin/invitations`

### Editor demo

- `http://localhost:3000/admin/invitations/11111111-1111-4111-8111-111111111111`

### Invitacion publica demo

- `http://localhost:3000/i/cumple-7-luis-arturo-astronautas`

### CRM React directo

- `http://localhost:5173/admin/invitations`
- `http://localhost:5173/admin/invitations/11111111-1111-4111-8111-111111111111`

### Viewer React directo

- `http://localhost:5173/i/cumple-7-luis-arturo-astronautas`

## Si algo se rompe raro

1. Deten `dev:all`
2. Vuelve a correr:

```powershell
npm.cmd run dev:all
```

3. Haz recarga dura en el navegador:

```text
Ctrl + F5
```
