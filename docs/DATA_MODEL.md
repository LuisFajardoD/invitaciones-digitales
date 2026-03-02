# DATA_MODEL.md — Modelo de Datos (v1)

Modelo pensado para Postgres (ideal con Supabase). Objetivos:
- Flexibilidad (JSON para secciones y landing).
- Simplicidad (pocas tablas, fácil de implementar).
- Buen rendimiento básico (índices donde importa).

---

## 1) Tablas

## 1.1 `invitations`
Guarda cada invitación y su configuración (contenido + secciones + vigencia + metadata para compartir).

### Campos
- `id` (UUID, PK, default `gen_random_uuid()`)
- `slug` (TEXT, UNIQUE, NOT NULL)  
  Se usa en: `/i/<slug>`
- `status` (TEXT, NOT NULL)  
  Valores: `draft` | `published`
- `theme_id` (TEXT, NOT NULL)  
  Ej: `astronautas`
- `layout_id` (TEXT, NOT NULL)  
  Ej: `layout_v1_unico`
- `animation_profile` (TEXT, NOT NULL)  
  Valores: `lite` | `pro` | `max`

### Tiempo / vigencia
- `timezone` (TEXT, NOT NULL)  
  Ej: `America/Mexico_City`
- `event_start_at` (TIMESTAMPTZ, NOT NULL)
- `rsvp_until` (TIMESTAMPTZ, NOT NULL)
- `active_until` (TIMESTAMPTZ, NOT NULL)

### Secciones (configurable)
- `sections_order` (JSONB, NOT NULL)  
  Ej: `["hero","event_info","quick_actions","countdown","map","gallery","notes","rsvp","contact"]`
- `sections` (JSONB, NOT NULL)  
  Objeto con todas las secciones y sus datos. Cada sección tiene `enabled`.

### Compartir / Open Graph
- `share` (JSONB, NOT NULL)  
  Campos sugeridos:
  - `og_title`
  - `og_description`
  - `og_image_url`
  - `og_type`

### Pantalla al expirar
- `expired_page` (JSONB, NOT NULL)  
  Campos sugeridos:
  - `title`
  - `message`
  - `primary_cta` `{ text, href }`
  - `secondary_cta` `{ text, href }`

### Vista cliente RSVP (sin cuenta)
- `client_view_token` (TEXT, NOT NULL)  
  Token secreto para: `/i/<slug>/rsvp?token=...`

### Auditoría
- `created_at` (TIMESTAMPTZ, NOT NULL, default `now()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `now()`)

### Índices recomendados
- UNIQUE (`slug`)
- INDEX (`status`)
- INDEX (`event_start_at`)
- INDEX (`active_until`)

---

## 1.2 `rsvp_responses`
Guarda cada confirmación RSVP de un invitado.

### Campos
- `id` (UUID, PK, default `gen_random_uuid()`)
- `invitation_id` (UUID, NOT NULL, FK -> `invitations(id)`, ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `attending` (BOOLEAN, NOT NULL)  // sí/no
- `guests_count` (INTEGER, NULL)   // opcional
- `message` (TEXT, NULL)          // opcional
- `created_at` (TIMESTAMPTZ, NOT NULL, default `now()`)

### Índices recomendados
- INDEX (`invitation_id`)
- INDEX (`created_at`)

### Reglas (lógicas, aplicadas en app/CRM)
- Solo permitir insertar RSVP si:
  - `invitations.sections.rsvp.enabled = true`
  - `now <= invitations.rsvp_until`

---

## 1.3 `assets`
Assets asociados a invitaciones (portada, galería, imagen OG, etc.).
Se recomienda guardar archivos en Storage y aquí solo la URL + meta.

### Campos
- `id` (UUID, PK, default `gen_random_uuid()`)
- `invitation_id` (UUID, NULL, FK -> `invitations(id)`, ON DELETE CASCADE)
  - Puede ser NULL si es asset global/tema/landing (opcional)
- `type` (TEXT, NOT NULL)  
  Valores sugeridos: `hero` | `gallery` | `og` | `theme_asset` | `example_cover`
- `url` (TEXT, NOT NULL)
- `meta` (JSONB, NOT NULL, default `{}`)  
  Ej: `{ "width": 1200, "height": 630 }`
- `created_at` (TIMESTAMPTZ, NOT NULL, default `now()`)

### Índices recomendados
- INDEX (`invitation_id`)
- INDEX (`type`)

---

## 1.4 `site_settings`
Configuración global para la landing `/` (editable desde CRM).
Se maneja como una sola fila (recomendado: `id = "main"`).

### Campos
- `id` (TEXT, PK)  
  Recomendado: `main`
- `data` (JSONB, NOT NULL)  
  Contiene bloques y su orden (hero, paquetes, ejemplos, contacto, etc.)
- `created_at` (TIMESTAMPTZ, NOT NULL, default `now()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `now()`)

### Opcional (si quieres “borrador/publicado”)
- `draft_data` (JSONB, NULL)
- `published_at` (TIMESTAMPTZ, NULL)

---

## 1.5 `themes`
Catálogo de temas (skins) para infantiles (Astronautas, Dinosaurios, etc.).

### Campos
- `id` (TEXT, PK)  
  Ej: `astronautas`
- `name` (TEXT, NOT NULL)  
  Ej: `Astronautas`
- `preview_url` (TEXT, NOT NULL)
- `defaults` (JSONB, NOT NULL)  
  Colores, tipografías, fondos, configuración base del tema
- `created_at` (TIMESTAMPTZ, NOT NULL, default `now()`)
- `updated_at` (TIMESTAMPTZ, NOT NULL, default `now()`)

---

## 2) Contratos JSON (estructura esperada)

## 2.1 `invitations.sections_order`
Array en orden de render:
- Ejemplo:
  - `["hero","event_info","quick_actions","countdown","map","gallery","notes","rsvp","contact"]`

Regla:
- Las secciones que NO estén en `sections_order` NO se renderizan.

---

## 2.2 `invitations.sections`
Objeto con todas las secciones. Cada sección debe tener `enabled`.

Ejemplo resumido:
- `hero`: `{ enabled, title, subtitle, hero_asset_id, effects... }`
- `event_info`: `{ enabled, weekday_text, date_text, time_text, venue_name, address_text }`
- `quick_actions`: `{ enabled, items[] }`
- `countdown`: `{ enabled, label, target_at }`
- `map`: `{ enabled, embed:{lat,lng,zoom}, address_text, maps_url }`
- `gallery`: `{ enabled, max_images, asset_ids[] }`
- `notes`: `{ enabled, items[] }`
- `rsvp`: `{ enabled, fields:{...}, closed_message }`
- `contact`: `{ enabled, name, whatsapp_number, whatsapp_url, label }`

Secciones opcionales (presentes pero pueden ir `enabled=false`):
- `itinerary`: `{ enabled, items[] }`
- `dress_code`: `{ enabled, text }`
- `gifts`: `{ enabled, text, links[] }`
- `faq`: `{ enabled, items[] }`
- `livestream`: `{ enabled, url }`
- `transport`: `{ enabled, text }`
- `lodging`: `{ enabled, text }`

Regla:
- Si `enabled=false`, no se renderiza esa sección aunque tenga datos.

---

## 2.3 `invitations.share`
Estructura sugerida:
- `og_title` (string)
- `og_description` (string)
- `og_image_url` (string URL)
- `og_type` (string, ej. `website`)

---

## 2.4 `invitations.expired_page`
Estructura sugerida:
- `title` (string)
- `message` (string)
- `primary_cta`: `{ text, href }`  // href normalmente "/"
- `secondary_cta`: `{ text, href }` // href wa.me

---

## 2.5 `site_settings.data`
Estructura general:
- `blocks_order`: array de bloques
- `blocks`: objeto donde cada bloque tiene `enabled` y sus datos

Ejemplo de bloques típicos:
- `hero`, `examples`, `promo`, `packages`, `extras`, `how_it_works`, `faq`, `contact`

Regla:
- Solo se renderizan bloques con `enabled=true` y en el orden `blocks_order`.

---

## 3) Reglas de integridad / validación (v1)
- `invitations.slug` único y URL-safe (kebab-case).
- `rsvp_until <= active_until` (si no, corregir en CRM).
- `rsvp_responses.guests_count >= 1` cuando exista.
- Para compartir en WhatsApp: recomendable `share.og_image_url` con imagen 1200x630 (guardar dimensiones en `assets.meta` cuando aplique).

---

## 4) Consideraciones futuras (v2+)
- Idempotencia RSVP (evitar duplicados por refresh / usuario).
- RSVP por invitado (links únicos por invitado).
- Versionado `site_settings` (borrador/publicado).
- Multi-admin / roles.