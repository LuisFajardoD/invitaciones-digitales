# UI_FLOWS.md — Rutas, Pantallas y Flujos (v1)

Este documento describe:
- Rutas principales del sitio
- Pantallas por rol (invitado / admin / cliente)
- Flujos de navegación y acciones clave
- Estados (vigente, RSVP cerrado, expirado)

---

## 1) Mapa de rutas

### Público
- `/` — Landing (editable)
- `/i/[slug]` — Invitación pública
- `/i/[slug]/rsvp?token=...` — Vista de resultados RSVP para cliente (solo lectura)

### Admin (CRM)
- `/admin` — Login o redirect a `/admin/invitations`
- `/admin/invitations` — Lista de invitaciones
- `/admin/invitations/new` — Crear invitación (draft)
- `/admin/invitations/[id]` — Editor de invitación
- `/admin/rsvp/[id]` — Dashboard RSVP (admin)
- `/admin/site` — Editor de landing (site_settings)

---

## 2) Pantallas y componentes (alto nivel)

## 2.1 Landing `/` (público)
### Objetivo
Convertir visitantes a contacto (WhatsApp) mostrando:
- Ejemplos/demos
- Paquetes y precios
- Promos (si aplica)
- Botón de contacto

### UI (bloques)
Renderizados por `site_settings.data.blocks_order`:
- Hero
- Examples (demos)
- Promo (opcional)
- Packages
- Extras (opcional)
- How it works
- FAQ
- Contact

### Acciones
- CTA “Cotizar por WhatsApp” → abre WhatsApp con texto precargado
- “Ver ejemplos” → scroll al bloque de ejemplos
- Tap en ejemplo → abre `/i/demo-...` (o slug demo)

---

## 2.2 Invitación pública `/i/[slug]` (invitado)
### Objetivo
Mostrar invitación premium con animaciones, optimizada para móvil, con secciones activables.

### Estados de la página
1) **No encontrada / no publicada**
- Si `slug` no existe o `status != published`
- UI: “Invitación no disponible” + botón a `/`

2) **Vigente (normal)**
- Si `now <= active_until`
- Render: layout único (LayoutV1) usando `sections_order` y `sections`

3) **Expirada**
- Si `now > active_until`
- UI: pantalla “Evento finalizado” (usa `expired_page`)
  - CTA principal a `/`
  - CTA secundario a WhatsApp

### Estados dentro de la invitación vigente
- **RSVP abierto**: `now <= rsvp_until` y `sections.rsvp.enabled=true`
  - mostrar formulario RSVP
- **RSVP cerrado**: `now > rsvp_until` y `sections.rsvp.enabled=true`
  - ocultar formulario o mostrar `closed_message`
- **RSVP desactivado**: `sections.rsvp.enabled=false`
  - no mostrar sección RSVP

### Acciones principales (quick actions)
- Confirmar → scroll/abrir sección RSVP (si habilitada)
- Ubicación → scroll/abrir sección Map (si habilitada)
- Agregar al calendario → descarga/abre evento (v1 puede ser link simple o generación .ics)
- Compartir → Web Share API si está disponible; fallback copiar link

---

## 2.3 Vista cliente RSVP `/i/[slug]/rsvp?token=...` (solo lectura)
### Objetivo
Permitir que el cliente (quien pagó) vea confirmaciones sin crear cuenta.

### Validación
- La vista solo se muestra si:
  - `token` coincide con `invitations.client_view_token`
  - invitación existe
- Si token inválido: “Acceso no autorizado” + botón a `/`

### Contenido
- Totales:
  - Asisten (sí)
  - No asisten (no)
  - Total respuestas
- Tabla:
  - Fecha/hora
  - Nombre
  - Asiste
  - # asistentes (si aplica)
  - Mensaje (si existe)
- (Opcional) Botón exportar CSV (si se permite al cliente)

---

## 2.4 Admin: Login `/admin`
### Objetivo
Proteger el CRM.
- Si no hay sesión → pantalla login
- Si hay sesión → redirect a `/admin/invitations`

---

## 2.5 Admin: Lista de invitaciones `/admin/invitations`
### Objetivo
Gestionar todas las invitaciones.

### Contenido
- Tabla/Lista con:
  - Título (desde `sections.hero.title` o fallback)
  - Fecha del evento (`event_start_at`)
  - Estado (`draft/published`)
  - Links rápidos:
    - abrir invitación pública
    - abrir editor
    - ver RSVP
- Acciones:
  - Crear nueva
  - Duplicar
  - Publicar/Despublicar (opcional)
  - Copiar link

### Flujos desde esta pantalla
- “Nueva invitación” → `/admin/invitations/new`
- “Editar” → `/admin/invitations/[id]`
- “RSVP” → `/admin/rsvp/[id]`

---

## 2.6 Admin: Crear invitación `/admin/invitations/new`
### Objetivo
Crear una invitación en `draft` con valores por defecto.

### Flujo
1) Form inicial mínimo:
- slug (editable)
- tema (default: astronautas o el primero disponible)
- fecha/hora evento
- lugar/dirección/coords
2) Guardar → crea registro en `invitations` (draft)
3) Redirect automático al editor `/admin/invitations/[id]`

---

## 2.7 Admin: Editor de invitación `/admin/invitations/[id]`
### Objetivo
Editar TODO sin tocar código.

### Layout de la pantalla (recomendado)
- Columna izquierda: “Editor”
- Columna derecha: “Vista previa móvil” (preview live)

### Secciones del editor
A) **Datos del evento**
- event_start_at
- timezone
- rsvp_until
- active_until
- status (draft/published)

B) **Tema y animación**
- theme_id
- animation_profile (para v1: `max`)
- (opcional) layout_id fijo (layout único)

C) **Secciones (switch + editar)**
- Lista de secciones con:
  - switch enabled
  - botón “Editar”
  - estado rápido (ej: “Galería: 8 fotos”)
- Orden:
  - v1: fijo por `sections_order`
  - opcional: reordenar con drag-and-drop

D) **Assets**
- Subir portada (hero_asset)
- Subir galería (asset_ids)
- Subir/Generar imagen OG (og_image_url)

E) **Pantalla expirada**
- editar `expired_page` (título, mensaje, CTAs)

F) **Publicación**
- botón “Publicar”
- botón “Copiar link”
- link “Vista cliente RSVP” (con token)

---

## 2.8 Admin: Dashboard RSVP `/admin/rsvp/[id]`
### Objetivo
Ver resultados de RSVP.

### Contenido
- KPIs:
  - Asisten
  - No asisten
  - Total
- Tabla de respuestas
- Filtros:
  - texto por nombre
  - attending sí/no
- Acciones:
  - exportar CSV
  - copiar link vista cliente (token)

---

## 2.9 Admin: Editor landing `/admin/site`
### Objetivo
Editar la landing `/` sin tocar código.

### Contenido
- Editor por bloques:
  - switch enabled
  - editar contenido
  - reordenar (opcional)
- Editores específicos:
  - Paquetes (CRUD)
  - Ejemplos (CRUD)
  - Promo (texto + vigencia opcional)
  - Contacto (WhatsApp + mensaje precargado)
- Vista previa (preview)
- Botón “Guardar” / (opcional) “Publicar”

---

## 3) Flujos principales (paso a paso)

## 3.1 Flujo: Crear y publicar invitación
1) Admin entra a `/admin/invitations`
2) “Nueva invitación” → `/admin/invitations/new`
3) Completa datos mínimos → Guardar
4) En el editor:
   - activa/desactiva secciones
   - sube portada, galería, OG
   - revisa preview móvil
5) Publica → status=published
6) Copia link `/i/[slug]` y lo entrega al cliente

---

## 3.2 Flujo: Invitado confirma RSVP
1) Invitado abre `/i/[slug]`
2) Ve invitación vigente
3) Toca “Confirmar” (quick action) → baja a RSVP
4) Completa datos y envía
5) Ve confirmación visual (premium)
6) Se guarda registro en `rsvp_responses`

---

## 3.3 Flujo: Cliente ve resultados RSVP sin cuenta
1) Admin comparte link privado: `/i/[slug]/rsvp?token=...`
2) Cliente abre link
3) Si token válido → ve totales y lista
4) Si token inválido → acceso no autorizado

---

## 3.4 Flujo: Invitación expirada
1) Invitado abre `/i/[slug]` después de `active_until`
2) No se muestra invitación
3) Se muestra “Evento finalizado”
4) Botón “Ver invitaciones y precios” → `/`
5) Botón “Cotizar por WhatsApp” → WhatsApp

---

## 4) Estados y reglas rápidas (resumen)
- `status != published` → invitación no disponible
- `now > active_until` → pantalla expirada
- `sections.rsvp.enabled=false` → no RSVP
- `now > rsvp_until` → RSVP cerrado (aunque la invitación siga vigente)