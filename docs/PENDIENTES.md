# Pendientes priorizados

Actualizado: 6 de marzo de 2026

## Prioridad alta

1. Unificar totalmente panel RSVP
- Mantener una sola experiencia visual y de datos entre:
  - acceso por editor (vista cliente)
  - acceso por lista admin (opcion RSVP)
- Revisar reglas de conteo para confirmados/no asisten/cancelados.

2. Pulir UX de formulario RSVP publico
- Mejorar consistencia de selects e inputs en navegadores moviles.
- Validar que el layout coincida entre preview del editor y pagina publica.

3. Endurecer flujos de seguridad RSVP
- Revisar expiracion/validez de token cliente.
- Confirmar que no existan endpoints publicos que filtren datos sensibles.

## Prioridad media

4. Seguir refinando editor de invitacion
- Ajustar secciones de contenido para menos scroll.
- Mantener coherencia de campos reales vs secciones visibles.
- Mejorar interaccion drag-scroll del preview en desktop.

5. Mejorar exportacion PDF RSVP
- Formato visual mas cuidado para reporte cliente.
- Revisar configuracion print para evitar cortes en varias paginas.

## Prioridad baja

6. Limpieza y deuda tecnica
- Revisar CSS heredado que ya no aporta.
- Mantener separacion estricta entre `.app-admin` y `.app-viewer`.

7. Documentacion continua
- Mantener `CAMBIOS_RECIENTES.md` al dia en cada bloque importante.
- Actualizar `CODEX_HANDOFF.md` cuando cambien rutas o archivos base.
