# Docs - indice y handoff

Esta carpeta ya no solo guarda documentos funcionales. Tambien sirve para handoff tecnico rapido cuando se reinicia el contexto del chat.

## Leer primero

- [README raiz](../README.md)
- [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md)
- [CAMBIOS_RECIENTES.md](CAMBIOS_RECIENTES.md)
- [PENDIENTES.md](PENDIENTES.md)
- [COMANDOS.md](COMANDOS.md)

## Que contiene cada documento

- `ESTADO_ACTUAL.md`
  - Estado real del proyecto hoy
  - Migracion Next -> React
  - Que rutas ya montan React dentro de Next
  - Preview con Playwright
  - Rutas y flujo local recomendado
  - Problemas conocidos y siguientes pasos

- `CAMBIOS_RECIENTES.md`
  - Changelog corto de cambios recientes
  - Ideal para que un chat nuevo vea rapidamente lo ultimo que se movio

- `PENDIENTES.md`
  - Lista separada de trabajo pendiente
  - Ideal para retomar sin mezclar "lo hecho" con "lo que falta"

- `COMANDOS.md`
  - Comandos de uso diario
  - Flujo rapido de arranque, login y rutas clave

- `SRS.md`
  - Requisitos del sistema

- `DATA_MODEL.md`
  - Modelo de datos y estructura base

- `UI_FLOWS.md`
  - Flujos principales de UI y navegacion

- `NOTIFICATIONS.md`
  - Reglas de tiempos, vigencia y notificaciones

- `TRACEABILITY.md`
  - Checklist de validacion

- `GUIA_RAPIDA_v1.md`
  - Guia operativa historica

- `SEED_INVITATION_ASTRONAUTAS.json`
  - Seed de ejemplo de invitacion

- `SEED_SITE_SETTINGS.json`
  - Seed de configuracion del sitio

## Nota importante

La referencia mas util para retomar trabajo hoy es `ESTADO_ACTUAL.md`. Ese archivo resume cambios recientes que no necesariamente estaban documentados en los docs mas viejos, incluyendo la eliminacion del bridge legacy y que el admin/viewer principales ya entran por React dentro de Next.
