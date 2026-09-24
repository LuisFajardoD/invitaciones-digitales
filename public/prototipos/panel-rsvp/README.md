# Panel RSVP temático (prototipo)

Prototipo estático, sin build. Abre con `?theme=temporada-8 | isla-cubo | el-circuito | default`.
Parámetros: `?empty=1` (estado vacío), `?n=60` (N respuestas de ejemplo), `?when=before|today|after`
(fecha simulada), `?debug=1` (panel de pruebas). `print.html` acepta los mismos, más `?noprint=1`.

## Crear un tema nuevo

1. Copia `themes/default.js` como `themes/<id>.js` y agrega `<id>` a `THEMES` en `js/theme.js`.
2. Completa el objeto que se exporta por defecto:
   - `id`, `avatarStyle`: `"t8-character" | "isla-block" | "circuito-runner" | "default"` (el mismo `avatar.style` del contrato).
   - `fonts`: `href` (Google Fonts), `display`, `body`, `displayWeight`.
   - `tokens`: colores y formas. Cada clave se convierte en `--t-<kebab>` (p. ej. `surfaceAlt` → `--t-surface-alt`).
     Obligatorias: `bg, surface, surfaceAlt, text, muted, primary, onPrimary, accent, success, warn, line,
     lineStrong, radius, radiusSm, borderWidth, shadow, pressShadow, heroBg, heroText, wallBg, wallText, noteBg`.
   - `vocabulary`: `guests`, `list` (título del muro), `confirmed`, `guest` (singular), `wallHint`.
   - `ui.panel`: `"rounded"` (tarjetas redondeadas) o `"stepped"` (esquinas escalonadas tipo pergamino).
     `ui.button`: `"flat" | "solid" | "wood"`.
   - `renderHero(container, event)`: pinta la ilustración del encabezado (SVG en línea). También se usa, en pequeño,
     en la hoja imprimible, así que conviene que sea ligera.
   - `renderGuestAvatar(rsvp, size)`: devuelve el SVG del avatar a partir de `rsvp.avatar` (ver `js/avatars.js`).
3. No escribas colores ni textos del tema en `render.js` o en los CSS: el panel sólo lee tokens y vocabulario.

## Notas para integrar en la app real

- **Datos**: guardar cada respuesta con el formato de `../_shared/rsvp-contract.js`
  (`id, invitationId, guestName, attending, adults, children, message ≤140, avatar {style, color, hair?, symbol?},
  createdAt, updatedAt`). Regla: si `attending`, `adults + children ≥ 1`; si no, ambos en 0.
  Validar con la misma lógica de `createRsvp()` en el servidor. Sin alergias ni dietas.
- **Panel**: sustituir `sampleRsvps()` por la lectura de las respuestas de la invitación; `event` sale de la
  invitación (nombre, edad, fecha, salón, invitaciones enviadas opcional).
- **PDF en servidor**: renderizar `print.html` (con los datos inyectados y `?noprint=1`) en Chrome sin interfaz y
  usar `page.pdf({ preferCSSPageSize: true })`. Tamaño carta, encabezado de tabla repetido y
  "Página X de Y" ya salen del CSS (`@page`).
- **CSV**: `js/export-csv.js` ya genera UTF-8 con BOM (Excel abre bien los acentos); en servidor basta replicar
  columnas y formato de fecha `dd/mm/aaaa hh:mm`.
