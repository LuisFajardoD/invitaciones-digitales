# TRACEABILITY.md — Checklist Requisito → Implementación → Pruebas (v1)

Objetivo:
- Evitar que se “pierdan” requisitos al implementar.
- Tener una lista clara de qué se construyó y cómo se valida.

Convención:
- Req = Requisito (tomado de SRS)
- Impl = Dónde se implementa (pantalla, módulo, componente)
- Test = Cómo probarlo (pasos manuales)

---

## 1) Landing editable `/`

### Req L-01: Landing lee `site_settings` (sin tocar código)
- Impl:
  - Página `/` (SiteHome)
  - Carga de `site_settings.data`
- Test:
  1. Editar `site_settings` desde CRM (cambiar título del hero)
  2. Recargar `/`
  3. Ver que el hero cambió sin redeploy

### Req L-02: Bloques con `enabled` se muestran/ocultan
- Impl:
  - Render por `blocks_order`
  - Verifica `blocks[blockKey].enabled === true`
- Test:
  1. En `/admin/site`, apagar bloque “FAQ”
  2. Recargar `/`
  3. Confirmar que FAQ no aparece

### Req L-03: Orden de bloques respeta `blocks_order`
- Impl:
  - Iteración por `blocks_order`
- Test:
  1. Reordenar bloques (si se implementa en v1) o editar `blocks_order`
  2. Recargar `/`
  3. Validar que el orden cambia

### Req L-04: CTA WhatsApp funciona con mensaje precargado
- Impl:
  - `contact.whatsapp_number`
  - `contact.whatsapp_prefill_text`
- Test:
  1. Click “Cotizar por WhatsApp”
  2. Debe abrir WhatsApp con texto precargado

---

## 2) Invitación pública `/i/[slug]`

### Req I-01: Resolver invitación por `slug`
- Impl:
  - Route `/i/[slug]` consulta `invitations.slug`
- Test:
  1. Abrir `/i/<slug_valido>`
  2. Debe cargar la invitación

### Req I-02: Invitación no publicada muestra “No disponible”
- Impl:
  - Condición `status !== "published"`
- Test:
  1. Crear invitación en draft
  2. Abrir su URL pública
  3. Debe mostrar “Invitación no disponible” + CTA a `/`

### Req I-03: Render por `sections_order` y `enabled`
- Impl:
  - LayoutV1 recorre `sections_order`
  - Por cada key: render si `sections[key].enabled === true`
- Test:
  1. Desactivar `gallery.enabled=false`
  2. Abrir `/i/<slug>`
  3. La galería NO debe aparecer
  4. Activar de nuevo y verificar que sí aparece

### Req I-04: Mapa embebido (no botón) cuando `map.enabled=true`
- Impl:
  - `MapSection`
  - Usa `lat/lng/zoom`
- Test:
  1. Activar sección mapa y poner coords
  2. Abrir invitación
  3. Debe verse mapa dentro de la página

### Req I-05: Countdown visible si está activado
- Impl:
  - `CountdownSection`
  - Usa `countdown.target_at`
- Test:
  1. Activar countdown
  2. Abrir invitación
  3. Debe mostrarse contador y actualizarse

### Req I-06: Quick Actions visibles según secciones
- Impl:
  - `QuickActionsSection`
  - Oculta/bloquea acciones no disponibles
- Test:
  1. Apagar RSVP
  2. El botón “Confirmar” no debe aparecer (o debe estar deshabilitado)
  3. Apagar mapa y validar “Ubicación”

---

## 3) RSVP

### Req R-01: Guardar RSVP si está habilitado y en tiempo
- Impl:
  - `RsvpSection` valida `now <= rsvp_until`
  - Inserta en `rsvp_responses`
- Test:
  1. RSVP enabled=true
  2. Enviar RSVP con nombre + attending
  3. Debe confirmar éxito
  4. Debe aparecer en dashboard admin

### Req R-02: Campos obligatorios se validan
- Impl:
  - Validación frontend + backend
- Test:
  1. Intentar enviar sin nombre
  2. Debe mostrar error y no guardar

### Req R-03: RSVP cerrado cuando `now > rsvp_until`
- Impl:
  - Condición en `RsvpSection`
- Test:
  1. Ajustar `rsvp_until` al pasado
  2. Abrir invitación
  3. Debe mostrar “RSVP cerrado” y no permitir enviar

### Req R-04: Animación premium de confirmación (v1)
- Impl:
  - Animación en submit success (Framer Motion/Lottie)
- Test:
  1. Enviar RSVP válido
  2. Debe mostrarse animación corta de éxito

---

## 4) Vigencia / expiración

### Req V-01: Invitación expirada muestra pantalla “evento finalizado”
- Impl:
  - Condición `now > active_until` en `/i/[slug]`
  - Render `expired_page`
- Test:
  1. Ajustar `active_until` al pasado
  2. Abrir `/i/<slug>`
  3. Debe mostrarse pantalla “evento finalizado”

### Req V-02: CTA principal de expirado envía a `/`
- Impl:
  - `expired_page.primary_cta.href`
- Test:
  1. Click en “Ver invitaciones y precios”
  2. Debe abrir `/`

### Req V-03: CTA secundario abre WhatsApp
- Impl:
  - `expired_page.secondary_cta.href`
- Test:
  1. Click en WhatsApp
  2. Debe abrir wa.me

---

## 5) Dashboard RSVP (Admin)

### Req A-01: Ver totales sí/no
- Impl:
  - `/admin/rsvp/[id]` agrupa por `attending`
- Test:
  1. Tener al menos 2 RSVP (sí y no)
  2. Verificar conteos correctos

### Req A-02: Tabla con respuestas y fecha
- Impl:
  - Tabla con columnas: fecha, nombre, asiste, #, mensaje
- Test:
  1. Revisar tabla en admin
  2. Debe coincidir con datos guardados

### Req A-03: Exportar CSV
- Impl:
  - Acción export en `/admin/rsvp/[id]`
- Test:
  1. Exportar
  2. Abrir CSV
  3. Validar columnas y valores

---

## 6) Vista cliente RSVP por token

### Req C-01: Solo lectura con token válido
- Impl:
  - `/i/[slug]/rsvp?token=...`
  - valida `token === client_view_token`
- Test:
  1. Abrir link con token correcto
  2. Debe mostrar totales y tabla

### Req C-02: Token inválido → acceso no autorizado
- Impl:
  - Validación y UI de error
- Test:
  1. Abrir con token incorrecto
  2. Debe mostrar “Acceso no autorizado”

---

## 7) Open Graph / compartir

### Req OG-01: Página `/i/[slug]` incluye OG tags
- Impl:
  - metadata server-side (Next)
  - usa `invitations.share`
- Test:
  1. Ver HTML (view-source) de `/i/<slug>`
  2. Confirmar `og:title`, `og:description`, `og:image`, `og:url`

### Req OG-02: Imagen OG por invitación existe
- Impl:
  - `share.og_image_url` apunta a asset válido
- Test:
  1. Abrir URL de `og_image_url` en navegador
  2. Debe cargar (1200x630 recomendado)

---

## 8) Caso v1 Astronautas (validación rápida)
- Datos coinciden (título, fecha, lugar, coords, notas, contacto)
- Countdown activo
- RSVP hasta fin del día del evento
- Vigencia hasta 1 día después (fin del día)
- Mapa embebido visible
- Galería activa con 6–9 fotos recomendadas (si se cargan)