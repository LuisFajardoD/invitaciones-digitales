# NOTIFICATIONS.md — Reglas de Tiempo, Estados y Mensajes (v1)

Este documento define:
- Reglas de vigencia de invitaciones
- Reglas de cierre de RSVP
- Mensajes y estados que deben mostrarse al usuario
- Reglas de “pantalla expirada” (evento finalizado)
- Recomendaciones de UI/UX para comunicar estado (sin notificaciones push en v1)

> Nota: En v1 NO se implementan notificaciones push. Aquí “notifications” se refiere a mensajes/estados visibles en la UI.

---

## 1) Conceptos y tiempos clave

Cada invitación tiene:
- `event_start_at`: inicio del evento
- `rsvp_until`: límite para aceptar RSVP
- `active_until`: límite para mostrar la invitación

Y siempre se evalúan en:
- `timezone` de la invitación (ej. `America/Mexico_City`)

---

## 2) Reglas de estado (invitation status)

### 2.1 Invitación no disponible
**Condición:**
- invitación no existe, o
- `status != "published"`

**Comportamiento UI:**
- Título: “Invitación no disponible”
- Mensaje: “Este enlace no está activo.”
- CTA principal: “Ver invitaciones” → `/`

---

### 2.2 Invitación vigente (normal)
**Condición:**
- `status = "published"` y `now <= active_until`

**Comportamiento UI:**
- Renderizar LayoutV1 con secciones activas.
- Botones rápidos según secciones activas.

---

### 2.3 Invitación expirada (evento finalizado)
**Condición:**
- `status = "published"` y `now > active_until`

**Comportamiento UI:**
- NO renderizar la invitación.
- Renderizar la pantalla expirada usando `expired_page`:
  - `title`
  - `message`
  - `primary_cta` (a `/`)
  - `secondary_cta` (a WhatsApp)

**Recomendación UX:**
- Mostrar un fondo/estilo neutral (no la escena completa).
- Mantener el diseño consistente con el branding.
- Botón principal claro: “Ver invitaciones y precios”.

---

## 3) Reglas de RSVP

### 3.1 RSVP desactivado
**Condición:**
- `sections.rsvp.enabled = false`

**Comportamiento UI:**
- No mostrar sección RSVP.
- Si existe botón rápido “Confirmar”, ocultarlo o desactivarlo.

---

### 3.2 RSVP abierto
**Condición:**
- `sections.rsvp.enabled = true`
- `now <= rsvp_until`

**Comportamiento UI:**
- Mostrar formulario RSVP.
- Validar campos obligatorios:
  - nombre
  - asiste (sí/no)
- Opcionales:
  - `guests_count`
  - `message`
- Al enviar:
  - mostrar animación de éxito (premium)
  - mostrar confirmación textual

**Mensaje recomendado post-envío:**
- Título: “¡Confirmado!”
- Texto: “Tu respuesta quedó registrada. ¡Nos vemos pronto!”

---

### 3.3 RSVP cerrado
**Condición:**
- `sections.rsvp.enabled = true`
- `now > rsvp_until`

**Comportamiento UI:**
- No permitir enviar RSVP.
- Mostrar mensaje:
  - usar `sections.rsvp.closed_message` si existe
  - fallback: “RSVP cerrado”

**Recomendación UX:**
- Mantener visible la sección (si el layout lo pide) pero en modo “cerrado”.
- Ocultar inputs y mostrar solo el aviso.

---

## 4) Reglas para botones rápidos (Quick Actions)

Los botones rápidos se muestran solo si la sección existe y está habilitada.

### 4.1 “Confirmar”
- Solo si `sections.rsvp.enabled=true`
- Si RSVP está cerrado, el botón:
  - o se oculta
  - o hace scroll a la sección RSVP para que el usuario vea “RSVP cerrado”

### 4.2 “Ubicación”
- Solo si `sections.map.enabled=true`
- Acción:
  - hace scroll a la sección de mapa
  - dentro de la sección, el usuario puede abrir Google Maps con `maps_url`

### 4.3 “Agregar al calendario”
- Disponible siempre que existan:
  - fecha/hora (`event_start_at`)
  - datos mínimos (título y lugar)
- v1: puede ser link o descarga `.ics` simple

### 4.4 “Compartir”
- Usar Web Share API si está disponible
- Fallback: copiar link al portapapeles
- Mensaje de UI:
  - “Link copiado” (toast)

---

## 5) Reglas de pantalla expirada (contenido recomendado)

Usar `expired_page` por invitación, pero tener defaults:

### Default `expired_page`
- title: “Este evento ya pasó”
- message: “Gracias por tu interés”
- primary_cta: { text: “Ver invitaciones y precios”, href: “/” }
- secondary_cta: { text: “Cotizar por WhatsApp”, href: “https://wa.me/...” }

---

## 6) Reglas de landing editable `/` (mensajes/estados)

### 6.1 Bloques apagados
Si un bloque tiene `enabled=false`:
- No renderizarlo.

### 6.2 Promoción con vigencia
Si `promo.enabled=true` y existe `valid_from`/`valid_to`:
- Mostrar promo solo si `now` está dentro del rango.
- Si está fuera, ocultar promo automáticamente.

---

## 7) Manejo de errores (v1)

### 7.1 Error al cargar invitación
- UI: “No se pudo cargar la invitación”
- CTA: “Ir al inicio” → `/`

### 7.2 Error al enviar RSVP
- UI: “No se pudo enviar tu confirmación”
- CTA: “Intentar de nuevo”
- Mantener los datos del formulario si es posible.

### 7.3 Token inválido en vista cliente RSVP
- UI: “Acceso no autorizado”
- CTA: “Ir al inicio” → `/`

---

## 8) Recomendaciones premium (sin romper rendimiento)
- Usar animación fuerte solo en:
  - Portada (Hero)
  - Confirmación de RSVP
- En el resto:
  - transiciones suaves
  - micro-animaciones discretas
- Evitar partículas excesivas (no saturar CPU/GPU de móviles).