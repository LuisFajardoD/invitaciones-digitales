insert into public.site_settings (id, data)
values (
  'main',
  $json$
  {
    "blocks_order": ["hero", "examples", "promo", "packages", "extras", "how_it_works", "faq", "contact"],
    "blocks": {
      "hero": {
        "enabled": true,
        "badge": "Invitaciones premium v1",
        "title": "Invitaciones digitales que se sienten como una app.",
        "subtitle": "Landing editable, CRM con RSVP y experiencias premium listas para compartir por WhatsApp.",
        "primary_cta_text": "Cotizar por WhatsApp",
        "primary_cta_href": "https://wa.me/5527225459?text=Hola%2C%20quiero%20cotizar%20una%20invitacion%20digital%20premium.",
        "secondary_cta_text": "Ver ejemplos",
        "secondary_cta_href": "#examples"
      },
      "examples": {
        "enabled": true,
        "title": "Ejemplos destacados",
        "items": [
          {
            "title": "Cumple 7 de Luis Arturo",
            "description": "Tema astronautas con animacion premium, mapa y RSVP.",
            "slug": "cumple-7-luis-arturo-astronautas",
            "cover_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
          }
        ]
      },
      "promo": {
        "enabled": true,
        "title": "Promo de lanzamiento",
        "text": "Incluye configuracion inicial del CRM y landing editable en cada paquete premium.",
        "valid_from": "2026-02-01T00:00:00.000Z",
        "valid_to": "2026-12-31T23:59:59.000Z"
      },
      "packages": {
        "enabled": true,
        "title": "Paquetes",
        "items": [
          {
            "name": "Essential",
            "price": "$1,490 MXN",
            "description": "Invitacion mobile-first con RSVP y secciones clave.",
            "features": ["1 tema", "Mapa embebido", "RSVP basico"]
          },
          {
            "name": "Premium Astronautas",
            "price": "$2,990 MXN",
            "description": "Experiencia premium con animaciones wow y panel admin.",
            "features": ["Layout v1 premium", "Open Graph listo para WhatsApp", "Export CSV"]
          }
        ]
      },
      "extras": {
        "enabled": true,
        "title": "Extras",
        "items": ["Personalizacion de copy y colores", "Carga inicial de galeria", "Ajuste de assets para OG"]
      },
      "how_it_works": {
        "enabled": true,
        "title": "Como funciona",
        "items": ["Definimos tema, fecha y lugar.", "Configuramos secciones activas en el CRM.", "Publicas y compartes un link listo para WhatsApp."]
      },
      "faq": {
        "enabled": true,
        "title": "Preguntas frecuentes",
        "items": [
          {
            "question": "Puedo editar la landing sin redeploy?",
            "answer": "Si. Todo se guarda en site_settings y se refleja en /."
          },
          {
            "question": "La vista cliente requiere cuenta?",
            "answer": "No. Se comparte un link privado con token de solo lectura."
          }
        ]
      },
      "contact": {
        "enabled": true,
        "title": "Cotiza tu invitacion",
        "text": "Cuentanos fecha, tema y tipo de evento para preparar una propuesta.",
        "whatsapp_number": "5527225459",
        "whatsapp_prefill_text": "Hola, quiero cotizar una invitacion digital premium."
      }
    }
  }
  $json$::jsonb
)
on conflict (id) do update
set data = excluded.data,
    updated_at = now();

insert into public.themes (id, name, preview_url, defaults)
values (
  'astronautas',
  'Astronautas',
  'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=1200&q=80',
  $json$
  {
    "palette": {
      "bg": "#03112a",
      "accent": "#f7c844",
      "secondary": "#5ef2ff",
      "card": "#0d1f43"
    },
    "fontDisplay": "'Trebuchet MS', 'Segoe UI', sans-serif"
  }
  $json$::jsonb
)
on conflict (id) do update
set name = excluded.name,
    preview_url = excluded.preview_url,
    defaults = excluded.defaults,
    updated_at = now();

insert into public.invitations (
  id,
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
values (
  '11111111-1111-4111-8111-111111111111',
  'cumple-7-luis-arturo-astronautas',
  'published',
  'astronautas',
  'layout_v1_unico',
  'max',
  'America/Mexico_City',
  '2026-04-18T17:00:00.000Z',
  '2026-04-19T04:59:59.000Z',
  '2026-04-20T05:59:59.000Z',
  $json$
  ["hero", "event_info", "quick_actions", "countdown", "map", "gallery", "notes", "rsvp", "contact"]
  $json$::jsonb,
  $json$
  {
    "hero": {
      "enabled": true,
      "title": "Cumple 7 de Luis Arturo",
      "subtitle": "La mision es que nos acompanes a celebrar.",
      "badge": "Mision espacial premium",
      "accent": "Despegue 11:00 am",
      "background_image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80"
    },
    "event_info": {
      "enabled": true,
      "weekday_text": "Sabado",
      "date_text": "18 de abril de 2026",
      "time_text": "A partir de las 11:00 am",
      "venue_name": "Jardin del Valle",
      "address_text": "Cda. Tlalimaya 25, San Andres Ahuayucan, Xochimilco, 16880, CDMX"
    },
    "quick_actions": {
      "enabled": true,
      "items": [
        { "type": "confirm", "label": "Confirmar" },
        { "type": "location", "label": "Ubicacion" },
        { "type": "calendar", "label": "Agregar al calendario" },
        { "type": "share", "label": "Compartir" }
      ]
    },
    "countdown": {
      "enabled": true,
      "label": "Faltan para el despegue",
      "target_at": "2026-04-18T17:00:00.000Z"
    },
    "map": {
      "enabled": true,
      "embed": {
        "lat": 19.220703435663584,
        "lng": -99.10241678480557,
        "zoom": 16
      },
      "address_text": "Cda. Tlalimaya 25, San Andres Ahuayucan, Xochimilco, 16880, CDMX",
      "maps_url": "https://www.google.com/maps/search/?api=1&query=19.220703435663584,-99.10241678480557"
    },
    "gallery": {
      "enabled": true,
      "max_images": 6,
      "image_urls": [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1447433819943-74a20887a5b8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80"
      ]
    },
    "notes": {
      "enabled": true,
      "items": ["Trae mucha energia para jugar.", "Si gustas, ven con outfit espacial (opcional)."]
    },
    "rsvp": {
      "enabled": true,
      "fields": {
        "guests_count": true,
        "message": true
      },
      "closed_message": "RSVP cerrado. Gracias por tu interes."
    },
    "contact": {
      "enabled": true,
      "name": "Adry Rodriguez",
      "whatsapp_number": "5527225459",
      "whatsapp_url": "https://wa.me/5527225459?text=Hola%2C%20quiero%20detalles%20del%20cumple%20de%20Luis%20Arturo.",
      "label": "Contacto por WhatsApp"
    },
    "itinerary": {
      "enabled": false,
      "title": "Itinerario",
      "items": [],
      "text": ""
    },
    "dress_code": {
      "enabled": true,
      "title": "Dress code",
      "text": "Outfit espacial opcional."
    },
    "gifts": {
      "enabled": false,
      "title": "Regalos",
      "text": ""
    },
    "faq": {
      "enabled": false,
      "title": "FAQ",
      "items": [],
      "text": ""
    },
    "livestream": {
      "enabled": false,
      "title": "Livestream",
      "url": ""
    },
    "transport": {
      "enabled": false,
      "title": "Transporte",
      "text": ""
    },
    "lodging": {
      "enabled": false,
      "title": "Hospedaje",
      "text": ""
    }
  }
  $json$::jsonb,
  $json$
  {
    "og_title": "Cumple 7 de Luis Arturo | Invitacion Premium Astronautas",
    "og_description": "La mision es que nos acompanes a celebrar en Jardin del Valle.",
    "og_image_url": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    "og_type": "website"
  }
  $json$::jsonb,
  $json$
  {
    "title": "Este evento ya paso",
    "message": "Gracias por tu interes. Descubre nuevas invitaciones premium.",
    "primary_cta": {
      "text": "Ver invitaciones y precios",
      "href": "/"
    },
    "secondary_cta": {
      "text": "Cotizar por WhatsApp",
      "href": "https://wa.me/5527225459?text=Hola%2C%20quiero%20cotizar%20una%20invitacion%20como%20la%20de%20astronautas."
    }
  }
  $json$::jsonb,
  'astronautas-token-demo'
)
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
