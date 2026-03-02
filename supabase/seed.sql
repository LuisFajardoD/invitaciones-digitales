with site_seed as (
  select
    $json$
{
  "id": "main",
  "data": {
    "site": {
      "brand_name": "Invitaciones Digitales",
      "timezone": "America/Mexico_City"
    },
    "blocks_order": ["hero", "examples", "packages", "contact"],
    "blocks": {
      "hero": {
        "enabled": true,
        "title": "Invitaciones digitales animadas",
        "subtitle": "Diseños infantiles premium, listos para compartir por WhatsApp",
        "cta_primary": { "text": "Cotizar por WhatsApp", "action": "whatsapp" },
        "cta_secondary": { "text": "Ver ejemplos", "action": "scroll", "target": "examples" },
        "badge": "Nueva colección infantil 🚀"
      },
      "examples": {
        "enabled": true,
        "title": "Ejemplos (demos)",
        "subtitle": "Toca cualquiera para ver cómo se siente en celular",
        "items": [
          {
            "title": "Astronautas (Premium)",
            "cover_url": "",
            "demo_url": "/i/cumple-7-luis-arturo-astronautas"
          }
        ]
      },
      "packages": {
        "enabled": true,
        "title": "Paquetes",
        "subtitle": "Tú me mandas la info y yo te entrego el link listo para enviar",
        "currency": "MXN",
        "items": [
          {
            "key": "basic",
            "name": "Básica",
            "badge": "",
            "price_text": "$___",
            "delivery_text": "Entrega: __",
            "revisions_text": "1 ronda de cambios",
            "includes": [
              "Invitación animada (1 evento)",
              "Tema infantil a elegir",
              "Mapa embebido + dirección",
              "Cuenta regresiva (opcional)",
              "Galería (hasta 6 fotos)",
              "Notas/Avisos y contacto",
              "Link listo para compartir",
              "Vigencia hasta 1 día después del evento"
            ],
            "rsvp_level": "simple"
          },
          {
            "key": "pro",
            "name": "Pro",
            "badge": "Más vendido",
            "price_text": "$___",
            "delivery_text": "Entrega: __",
            "revisions_text": "2 rondas de cambios",
            "includes": [
              "Todo lo de Básica",
              "Animaciones más avanzadas",
              "RSVP completo (sí/no + # asistentes + mensaje)",
              "Panel de confirmaciones (para ti)",
              "Vista de resultados para el cliente (link privado)",
              "QR para imprimir",
              "Galería (hasta 12 fotos)"
            ],
            "rsvp_level": "full"
          },
          {
            "key": "premium",
            "name": "Premium",
            "badge": "Más espectacular",
            "price_text": "$___",
            "delivery_text": "Entrega: __",
            "revisions_text": "3 rondas de cambios",
            "includes": [
              "Todo lo de Pro",
              "Personalización visual avanzada (más único)",
              "Portada tipo escena (wow) + efectos premium",
              "Secciones avanzadas (itinerario/FAQ/regalos si aplica)",
              "Galería (hasta 20 fotos)",
              "Extensión de vigencia incluida (+30 días después del evento)"
            ],
            "rsvp_level": "full_plus"
          }
        ],
        "note": "Los precios pueden variar según complejidad del tema y urgencia."
      },
      "contact": {
        "enabled": true,
        "title": "Cotiza aquí",
        "subtitle": "Respondo por WhatsApp",
        "whatsapp_number": "52XXXXXXXXXX",
        "whatsapp_prefill_text": "Hola, quiero una invitación digital infantil. Fecha del evento: __. Tema: __. ¿Me pasas paquetes y disponibilidad?",
        "social": {
          "instagram_url": "",
          "tiktok_url": "",
          "facebook_url": ""
        }
      }
    }
  }
}
    $json$::jsonb as doc
)
insert into public.site_settings (id, data)
select
  doc->>'id',
  doc->'data'
from site_seed
on conflict (id) do update
set data = excluded.data,
    updated_at = now();

with invitation_seed as (
  select
    $json$
{
  "slug": "cumple-7-luis-arturo-astronautas",
  "status": "published",
  "theme_id": "astronautas",
  "layout_id": "layout_v1_unico",
  "animation_profile": "max",
  "timezone": "America/Mexico_City",
  "event_start_at": "2026-04-18T11:00:00-06:00",
  "rsvp_until": "2026-04-18T23:59:00-06:00",
  "active_until": "2026-04-19T23:59:00-06:00",
  "share": {
    "og_title": "Cumple 7 de Luis Arturo",
    "og_description": "Sábado 18 de abril • 11:00 am • Toca para ver la invitación",
    "og_image_url": "",
    "og_type": "website"
  },
  "expired_page": {
    "title": "Este evento ya pasó",
    "message": "Gracias por tu interés",
    "primary_cta": { "text": "Ver invitaciones y precios", "href": "/" },
    "secondary_cta": {
      "text": "Cotizar por WhatsApp",
      "href": "https://wa.me/525527225459"
    }
  },
  "client_view_token": "rsvp_3p8hQ7vN2kL9xA1dM6sT",
  "sections_order": [
    "hero",
    "event_info",
    "quick_actions",
    "countdown",
    "map",
    "gallery",
    "notes",
    "rsvp",
    "contact"
  ],
  "sections": {
    "hero": {
      "enabled": true,
      "title": "Cumple 7 de Luis Arturo",
      "subtitle": "¡La misión es que nos acompañes a celebrar!",
      "hero_asset_id": null,
      "theme_variant": "astronautas",
      "effects": {
        "stars_background": true,
        "floating_astronaut": true,
        "soft_parallax": true
      }
    },
    "event_info": {
      "enabled": true,
      "weekday_text": "Sábado",
      "date_text": "18 de abril",
      "time_text": "A partir de las 11:00 am",
      "venue_name": "Jardín del Valle",
      "address_text": "Cda. Tlalimaya 25, San Andrés Ahuayucan, Xochimilco, 16880, CDMX"
    },
    "quick_actions": {
      "enabled": true,
      "items": [
        { "type": "rsvp", "label": "Confirmar" },
        { "type": "map", "label": "Ubicación" },
        { "type": "calendar", "label": "Agregar al calendario" },
        { "type": "share", "label": "Compartir" }
      ]
    },
    "countdown": {
      "enabled": true,
      "label": "Despegamos en…",
      "target_at": "2026-04-18T11:00:00-06:00"
    },
    "map": {
      "enabled": true,
      "embed": {
        "lat": 19.220703435663584,
        "lng": -99.10241678480557,
        "zoom": 16
      },
      "address_text": "Cda. Tlalimaya 25, San Andrés Ahuayucan, Xochimilco, 16880, CDMX",
      "maps_url": "https://www.google.com/maps?q=19.220703435663584,-99.10241678480557"
    },
    "gallery": {
      "enabled": true,
      "max_images": 9,
      "asset_ids": []
    },
    "notes": {
      "enabled": true,
      "items": [
        "Trae mucha energía para jugar 🪐",
        "Si gustas, ven con outfit espacial (opcional)"
      ]
    },
    "rsvp": {
      "enabled": true,
      "fields": {
        "name_required": true,
        "attending_required": true,
        "allow_guests_count": true,
        "allow_message": true
      },
      "closed_message": "RSVP cerrado"
    },
    "contact": {
      "enabled": true,
      "name": "Adry Rodriguez",
      "whatsapp_number": "5527225459",
      "whatsapp_url": "https://wa.me/525527225459",
      "label": "Para dudas"
    },
    "itinerary": { "enabled": false, "items": [] },
    "dress_code": { "enabled": false, "text": "" },
    "gifts": { "enabled": false, "text": "", "links": [] },
    "faq": { "enabled": false, "items": [] },
    "livestream": { "enabled": false, "url": "" },
    "transport": { "enabled": false, "text": "" },
    "lodging": { "enabled": false, "text": "" }
  }
}
    $json$::jsonb as doc
)
insert into public.invitations (
  slug,
  status,
  theme_id,
  layout_id,
  animation_profile,
  timezone,
  event_start_at,
  rsvp_until,
  active_until,
  sections_order,
  sections,
  share,
  expired_page,
  client_view_token
)
select
  doc->>'slug',
  doc->>'status',
  doc->>'theme_id',
  doc->>'layout_id',
  doc->>'animation_profile',
  doc->>'timezone',
  (doc->>'event_start_at')::timestamptz,
  (doc->>'rsvp_until')::timestamptz,
  (doc->>'active_until')::timestamptz,
  doc->'sections_order',
  doc->'sections',
  doc->'share',
  doc->'expired_page',
  doc->>'client_view_token'
from invitation_seed
on conflict (slug) do update
set status = excluded.status,
    theme_id = excluded.theme_id,
    layout_id = excluded.layout_id,
    animation_profile = excluded.animation_profile,
    timezone = excluded.timezone,
    event_start_at = excluded.event_start_at,
    rsvp_until = excluded.rsvp_until,
    active_until = excluded.active_until,
    sections_order = excluded.sections_order,
    sections = excluded.sections,
    share = excluded.share,
    expired_page = excluded.expired_page,
    client_view_token = excluded.client_view_token,
    updated_at = now();