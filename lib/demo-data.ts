import { DEFAULT_BLOCK_ORDER, DEFAULT_SECTION_ORDER } from "@/lib/constants";
import { createWhatsAppUrl } from "@/lib/utils";
import type {
  InvitationRecord,
  RsvpResponse,
  SiteSettingsRecord,
  ThemeRecord,
} from "@/types/invitations";

const now = new Date().toISOString();

export const demoTheme: ThemeRecord = {
  id: "astronautas",
  name: "Astronautas",
  preview_url:
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=1200&q=80",
  defaults: {
    palette: {
      bg: "#03112a",
      accent: "#f7c844",
      secondary: "#5ef2ff",
      card: "#0d1f43",
    },
    fontDisplay: "'Trebuchet MS', 'Segoe UI', sans-serif",
  },
  created_at: now,
  updated_at: now,
};

export const demoInvitation: InvitationRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "cumple-7-luis-arturo-astronautas",
  status: "published",
  theme_id: "astronautas",
  layout_id: "layout_v1_unico",
  animation_profile: "max",
  timezone: "America/Mexico_City",
  event_start_at: "2026-04-18T17:00:00.000Z",
  rsvp_until: "2026-04-19T04:59:59.000Z",
  active_until: "2026-04-20T05:59:59.000Z",
  sections_order: DEFAULT_SECTION_ORDER,
  sections: {
    hero: {
      enabled: true,
      title: "Cumple 7 de Luis Arturo",
      subtitle: "La mision es que nos acompanes a celebrar.",
      badge: "Mision espacial premium",
      accent: "Despegue 11:00 am",
      background_image_url:
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
    },
    event_info: {
      enabled: true,
      weekday_text: "Sabado",
      date_text: "18 de abril de 2026",
      time_text: "A partir de las 11:00 am",
      venue_name: "Jardin del Valle",
      address_text:
        "Cda. Tlalimaya 25, San Andres Ahuayucan, Xochimilco, 16880, CDMX",
    },
    quick_actions: {
      enabled: true,
      items: [
        { type: "confirm", label: "Confirmar" },
        { type: "location", label: "Ubicacion" },
        { type: "calendar", label: "Agregar al calendario" },
        { type: "share", label: "Compartir" },
      ],
    },
    countdown: {
      enabled: true,
      label: "Faltan para el despegue",
      target_at: "2026-04-18T17:00:00.000Z",
    },
    map: {
      enabled: true,
      embed: {
        lat: 19.220703435663584,
        lng: -99.10241678480557,
        zoom: 16,
      },
      address_text:
        "Cda. Tlalimaya 25, San Andres Ahuayucan, Xochimilco, 16880, CDMX",
      maps_url:
        "https://www.google.com/maps/search/?api=1&query=19.220703435663584,-99.10241678480557",
    },
    gallery: {
      enabled: true,
      max_images: 6,
      image_urls: [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1447433819943-74a20887a5b8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
      ],
    },
    notes: {
      enabled: true,
      items: [
        "Trae mucha energia para jugar.",
        "Si gustas, ven con outfit espacial (opcional).",
      ],
    },
    rsvp: {
      enabled: true,
      fields: {
        guests_count: true,
        message: true,
      },
      closed_message: "RSVP cerrado. Gracias por tu interes.",
    },
    contact: {
      enabled: true,
      name: "Adry Rodriguez",
      whatsapp_number: "5527225459",
      whatsapp_url: createWhatsAppUrl("5527225459", "Hola, quiero detalles del cumple de Luis Arturo."),
      label: "Contacto por WhatsApp",
    },
    itinerary: {
      enabled: false,
      title: "Itinerario",
      items: [],
      text: "",
    },
    dress_code: {
      enabled: true,
      title: "Dress code",
      text: "Outfit espacial opcional.",
    },
    gifts: {
      enabled: false,
      title: "Regalos",
      text: "",
    },
    faq: {
      enabled: false,
      title: "FAQ",
      items: [],
      text: "",
    },
    livestream: {
      enabled: false,
      title: "Livestream",
      url: "",
    },
    transport: {
      enabled: false,
      title: "Transporte",
      text: "",
    },
    lodging: {
      enabled: false,
      title: "Hospedaje",
      text: "",
    },
  },
  share: {
    og_title: "Cumple 7 de Luis Arturo | Invitacion Premium Astronautas",
    og_description: "La mision es que nos acompanes a celebrar en Jardin del Valle.",
    og_image_url:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    og_type: "website",
  },
  expired_page: {
    title: "Este evento ya paso",
    message: "Gracias por tu interes. Descubre nuevas invitaciones premium.",
    primary_cta: {
      text: "Ver invitaciones y precios",
      href: "/",
    },
    secondary_cta: {
      text: "Cotizar por WhatsApp",
      href: createWhatsAppUrl("5527225459", "Hola, quiero cotizar una invitacion como la de astronautas."),
    },
  },
  client_view_token: "astronautas-token-demo",
  created_at: now,
  updated_at: now,
};

export const demoSiteSettings: SiteSettingsRecord = {
  id: "main",
  data: {
    blocks_order: DEFAULT_BLOCK_ORDER,
    blocks: {
      hero: {
        enabled: true,
        badge: "Invitaciones premium v1",
        title: "Invitaciones digitales que se sienten como una app.",
        subtitle:
          "Landing editable, CRM con RSVP y experiencias premium listas para compartir por WhatsApp.",
        primary_cta_text: "Cotizar por WhatsApp",
        primary_cta_href: createWhatsAppUrl(
          "5527225459",
          "Hola, quiero cotizar una invitacion digital premium.",
        ),
        secondary_cta_text: "Ver ejemplos",
        secondary_cta_href: "#examples",
      },
      examples: {
        enabled: true,
        title: "Ejemplos destacados",
        items: [
          {
            title: "Cumple 7 de Luis Arturo",
            description: "Tema astronautas con animacion premium, mapa y RSVP.",
            slug: "cumple-7-luis-arturo-astronautas",
            cover_url:
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
          },
        ],
      },
      promo: {
        enabled: true,
        title: "Promo de lanzamiento",
        text: "Incluye configuracion inicial del CRM y landing editable en cada paquete premium.",
        valid_from: "2026-02-01T00:00:00.000Z",
        valid_to: "2026-12-31T23:59:59.000Z",
      },
      packages: {
        enabled: true,
        title: "Paquetes",
        items: [
          {
            name: "Essential",
            price: "$1,490 MXN",
            description: "Invitacion mobile-first con RSVP y secciones clave.",
            features: ["1 tema", "Mapa embebido", "RSVP basico"],
          },
          {
            name: "Premium Astronautas",
            price: "$2,990 MXN",
            description: "Experiencia premium con animaciones wow y panel admin.",
            features: [
              "Layout v1 premium",
              "Open Graph listo para WhatsApp",
              "Export CSV",
            ],
          },
        ],
      },
      extras: {
        enabled: true,
        title: "Extras",
        items: [
          "Personalizacion de copy y colores",
          "Carga inicial de galeria",
          "Ajuste de assets para OG",
        ],
      },
      how_it_works: {
        enabled: true,
        title: "Como funciona",
        items: [
          "Definimos tema, fecha y lugar.",
          "Configuramos secciones activas en el CRM.",
          "Publicas y compartes un link listo para WhatsApp.",
        ],
      },
      faq: {
        enabled: true,
        title: "Preguntas frecuentes",
        items: [
          {
            question: "Puedo editar la landing sin redeploy?",
            answer: "Si. Todo se guarda en site_settings y se refleja en /.",
          },
          {
            question: "La vista cliente requiere cuenta?",
            answer: "No. Se comparte un link privado con token de solo lectura.",
          },
        ],
      },
      contact: {
        enabled: true,
        title: "Cotiza tu invitacion",
        text: "Cuentanos fecha, tema y tipo de evento para preparar una propuesta.",
        whatsapp_number: "5527225459",
        whatsapp_prefill_text: "Hola, quiero cotizar una invitacion digital premium.",
      },
    },
  },
  created_at: now,
  updated_at: now,
};

export const demoResponses: RsvpResponse[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    invitation_id: demoInvitation.id,
    name: "Mariana",
    attending: true,
    guests_count: 3,
    message: "Nos vemos en la mision.",
    created_at: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    invitation_id: demoInvitation.id,
    name: "Familia Torres",
    attending: false,
    guests_count: null,
    message: "No podremos asistir, pero muchas felicidades.",
    created_at: now,
  },
];
