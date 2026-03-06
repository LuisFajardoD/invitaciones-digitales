# Repository instructions for Codex

Antes de proponer o editar codigo en este repositorio, leer en este orden:

1. `docs/CODEX_HANDOFF.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/CAMBIOS_RECIENTES.md`
4. `docs/COMANDOS.md`

Reglas de trabajo para este repo:

- Mantener estilos scopeados:
  - landing/publico: CSS Modules en `components/site/*`
  - admin: `.app-admin` (`src/crm/admin.css`)
  - viewer publico: `.app-viewer` (`src/crm/viewer.css`)
- No introducir selectores globales invasivos para CRM/viewer.
- Validacion minima al cerrar cambios:
  - `npm run css:guard`
  - `npm run build`
- Verificar rutas clave:
  - `/`
  - `/examples`
  - `/admin/login`
  - `/admin/invitations`
  - `/admin/invitations/[id]`
  - `/i/cumple-7-luis-arturo-astronautas`

Si se cambia arquitectura/rutas/auth o estilos base, actualizar:

- `docs/CODEX_HANDOFF.md`
- `docs/ESTADO_ACTUAL.md`
- `docs/CAMBIOS_RECIENTES.md`
