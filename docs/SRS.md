# SRS.md — Plataforma de Invitaciones Digitales (CRM + Invitación Pública + Landing Editable)

## 1. Propósito
Construir una plataforma web para crear y administrar invitaciones digitales animadas (enfocadas primero en infantiles), donde:
- **El administrador (Luis)** crea/edita invitaciones desde un **CRM interno**.
- Los invitados ven la invitación pública en un link tipo `/i/<slug>` desde celular.
- La página de inicio `/` es una **landing editable** (paquetes, precios, ejemplos, contacto).
- El sistema maneja **RSVP**, **vigencia** y **pantalla de evento finalizado**.

La primera implementación real (v1) será la invitación **Premium Astronautas** para “Cumple 7 de Luis Arturo”.

---

## 2. Alcance (v1)
### Incluye
- Landing pública `/` editable desde el CRM.
- Invitación pública `/i/<slug>` con **1 layout único** (muy pulido), tema Astronautas y animaciones avanzadas.
- Sistema de **secciones activables/desactivables** por invitación (switch).
- **Mapa embebido** (no botón) cuando la sección está activa.
- RSVP: guardar respuestas, ver resultados en CRM y vista cliente por **token** (sin cuentas).
- Control de vigencia:
  - Antes o durante vigencia: se ve invitación normal.
  - Después de `active_until`: se muestra pantalla “evento finalizado” con CTA a `/` y WhatsApp.
- Preview para compartir en WhatsApp (Open Graph): título, descripción e imagen OG.

### No incluye (por ahora)
- Clientes creando sus invitaciones (autoservicio).
- Pagos en línea.
- Multiidioma.
- Editor tipo Canva.
- Múltiples layouts en v1 (solo uno).

---

## 3. Roles
### 3.1 Administrador (Luis)
- Accede al CRM (solo admin).
- Crea, edita, publica y duplica invitaciones.
- Activa/desactiva secciones.
- Configura vigencia y RSVP.
- Administra landing `/` (paquetes, promos, ejemplos, contacto).
- Consulta y exporta RSVP.

### 3.2 Invitado (público)
- Abre `/i/<slug>` en celular.
- Ve la invitación con animaciones.
- Puede confirmar asistencia (RSVP) si está habilitado y dentro del tiempo permitido.
- Puede ver mapa embebido si está habilitado.

### 3.3 Cliente (solo lectura, sin cuenta)
- Accede a resultados RSVP mediante link privado:
  - `/i/<slug>/rsvp?token=...`
- Solo puede ver (no editar).

---

## 4. Rutas principales
- `/` — Landing editable (precios/paquetes/ejemplos/contacto).
- `/i/<slug>` — Invitación pública.
- `/i/<slug>/rsvp?token=...` — Resultados RSVP para cliente (solo lectura).
- `/admin` — CRM (requiere login).
  - `/admin/invitations` — lista.
  - `/admin/invitations/<id>` — editor.
  - `/admin/rsvp/<id>` — dashboard RSVP.
  - `/admin/site` — editor de landing.

---

## 5. Reglas de negocio
### 5.1 Secciones
- El sistema soporta “todas las secciones posibles”.
- Cada sección tiene `enabled: true|false`.
- Si `enabled=false`, **no se renderiza** la sección (aunque tenga datos).
- El orden se controla con `sections_order`.

Secciones previstas (mínimo):
- hero (portada)
- event_info (datos clave)
- quick_actions (botones)
- countdown (cuenta regresiva)
- map (mapa embebido)
- gallery (galería)
- notes (notas/avisos)
- rsvp (confirmación)
- contact (contacto)
Secciones disponibles pero opcionales:
- itinerary, dress_code, gifts, faq, livestream, transport, lodging

### 5.2 Mapa embebido (obligatorio cuando está activo)
- La sección `map` debe renderizar un mapa embebido usando coordenadas.
- Debe incluir dirección en texto y link de Google Maps como respaldo.

### 5.3 RSVP
- Solo disponible si `sections.rsvp.enabled=true`.
- Solo acepta registros si `now <= rsvp_until`.
- Campos mínimos:
  - nombre (obligatorio)
  - asiste (sí/no)
- Opcionales según configuración:
  - número de asistentes
  - mensaje

### 5.4 Vigencia y expiración
- Cada invitación tiene:
  - `event_start_at`
  - `rsvp_until`
  - `active_until`
- Si `now > active_until`:
  - No se muestra la invitación.
  - Se muestra pantalla “evento finalizado” con:
    - título, mensaje
    - botón a `/`
    - botón a WhatsApp

### 5.5 Compartir (WhatsApp preview)
- `/i/<slug>` debe incluir metadata Open Graph desde servidor:
  - `og:title`, `og:description`, `og:image`, `og:url`
- `og:image` es una imagen tipo “tarjeta” por invitación (1200x630 recomendado).

---

## 6. Requisitos funcionales (FR)
### FR-01 Landing editable
- Mostrar bloques: hero, ejemplos, promo, paquetes, extras, cómo funciona, FAQ, contacto.
- Cada bloque puede habilitarse/deshabilitarse.
- El orden de bloques debe respetarse.
- Todo se alimenta de `site_settings`.

### FR-02 CRM de invitaciones (admin)
- Crear invitación (draft).
- Editar campos de evento (fecha/hora, lugar, dirección, coords).
- Activar/desactivar secciones y editar datos por sección.
- Subir assets (portada, galería, OG).
- Previsualizar invitación (vista móvil).
- Publicar invitación (status=published).
- Duplicar invitación (para crear otra rápido).

### FR-03 Invitación pública
- Resolver por `slug`.
- Si no existe o no publicada: mostrar “No disponible”.
- Renderizar layout único con animaciones.
- Respetar `sections_order` y `enabled`.

### FR-04 RSVP
- Guardar respuestas vinculadas a la invitación.
- Evitar errores por refresh (idempotencia opcional en v2; en v1 mínimo validar datos).
- Mostrar confirmación visual “éxito” (premium).

### FR-05 Dashboard RSVP (admin)
- Totales: asiste / no asiste.
- Tabla de respuestas con fecha.
- Exportar CSV.

### FR-06 Vista cliente RSVP por token
- Requiere token válido.
- Solo lectura.
- Muestra totales + tabla.

### FR-07 Pantalla expirada (evento finalizado)
- Muestra título/mensaje y CTAs.
- CTA principal a `/`.
- CTA secundario a WhatsApp.

---

## 7. Requisitos no funcionales (NFR)
### NFR-01 Rendimiento móvil
- Debe cargar rápido en celular.
- Animaciones fluidas (evitar sobrecargar con partículas).
- Cargar pesado bajo demanda (galería, mapa).

### NFR-02 UX premium
- Layout único con “sensación de app”.
- Animaciones:
  - Portada con efecto wow (parallax suave + escena).
  - Entradas por sección.
  - Confirmación RSVP con animación corta.

### NFR-03 Accesibilidad básica
- Texto legible, botones grandes.
- Evitar animaciones agresivas; soportar “reducir movimiento” si se puede.

### NFR-04 Seguridad
- CRM protegido por login.
- Vista cliente RSVP protegida por token.
- No exponer datos sensibles en público.

### NFR-05 Mantenibilidad
- Separar “layout” (estructura) de “tema” (skin).
- Guardar configuración en JSON para no tocar código por invitación.

---

## 8. Caso v1 (Invitación real: Astronautas — Cumple 7)
Datos base:
- Título: “Cumple 7 de Luis Arturo”
- Subtítulo: “¡La misión es que nos acompañes a celebrar!”
- Fecha/hora: “Sábado 18 de abril • A partir de las 11:00 am”
- Lugar: “Jardín del Valle”
- Dirección: “Cda. Tlalimaya 25, San Andrés Ahuayucan, Xochimilco, 16880, CDMX”
- Coordenadas: 19.220703435663584, -99.10241678480557
- Notas:
  - “Trae mucha energía para jugar 🪐”
  - “Si gustas, ven con outfit espacial (opcional)”
- Contacto: “Adry Rodriguez — WhatsApp 5527225459”
- Countdown: activo
- RSVP: activo hasta fin del día del evento
- Vigencia: hasta 1 día después del evento (fin del día)

---

## 9. Criterios de aceptación (AC)
- AC-01: `/` muestra paquetes/ejemplos/contacto desde `site_settings` sin tocar código.
- AC-02: `/admin` permite editar landing y guardar cambios.
- AC-03: `/admin` permite crear/editar invitación y activación por secciones.
- AC-04: `/i/<slug>` renderiza invitación premium con animaciones y secciones correctas.
- AC-05: Si `map.enabled=true`, se ve mapa embebido.
- AC-06: RSVP guarda respuestas y muestra confirmación.
- AC-07: `/admin` muestra RSVP y exporta CSV.
- AC-08: `/i/<slug>/rsvp?token=...` funciona sin cuenta y es solo lectura.
- AC-09: Si `now > active_until`, `/i/<slug>` muestra “evento finalizado” y botón a `/`.
- AC-10: Al compartir el link, existen OG tags (title/description/image).

---

## 10. Notas de implementación (guía)
- Mantener 1 layout v1 (LayoutV1) y separar temas (skins).
- Usar `animation_profile` para controlar intensidad (lite/pro/max). En v1 se usa `max`.
- La imagen OG por invitación debe existir para que WhatsApp muestre vista previa tipo tarjeta.