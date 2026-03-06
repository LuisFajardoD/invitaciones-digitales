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
  background: {
    mode: "inherit_hero",
    custom: {
      type: "image",
      image_url: "",
      video_url: "",
      poster_url: "",
    },
  },
  sections_order: DEFAULT_SECTION_ORDER,
  sections: {
    hero: {
      enabled: true,
      title: "Cumple 7 de Luis Arturo",
      subtitle: "La misión es que nos acompañes a celebrar.",
      badge: "Misión espacial premium",
      accent: "Despegue 11:00 am",
      background_image_url:
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
      background: {
        type: "image",
        image_url:
          "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1400&q=80",
        video_url: "",
        poster_url: "",
      },
      astronaut: {
        enabled: true,
        image_url: "",
        position: "bottom-right",
        opacity: 0.24,
      },
    },
    event_info: {
      enabled: true,
      weekday_text: "Sábado",
      date_text: "18 de abril de 2026",
      time_text: "A partir de las 11:00 am",
      venue_name: "Jardín del Valle",
      address_text:
        "Cda. Tlalimaya 25, San Andres Ahuayucan, Xochimilco, 16880, CDMX",
    },
    quick_actions: {
      enabled: true,
      items: [
        { type: "confirm", label: "Confirmar" },
        { type: "location", label: "Ubicación" },
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
      dark: true,
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
        "Trae mucha energía para jugar.",
        "Si gustas, ven con outfit espacial (opcional).",
      ],
    },
    rsvp: {
      enabled: true,
      fields: {
        guests_count: true,
        message: true,
      },
      closed_message: "RSVP cerrado. Gracias por tu interés.",
    },
    contact: {
      enabled: true,
      name: "Adry Rodríguez",
      whatsapp_number: "5527225459",
      whatsapp_url: createWhatsAppUrl("5527225459", "Hola, quiero detalles del cumple de Luis Arturo."),
      label: "Contacto por WhatsApp",
    },
    itinerary: {
      enabled: true,
      title: "Itinerario de vuelo",
      items: [
        "11:00 am | Bienvenida y fotos de aterrizaje",
        "11:30 am | Juegos y misiones espaciales",
        "1:00 pm | Pastel y canción para Luis Arturo",
        "2:00 pm | Piñata, regalos y despedida",
      ],
      text: "Así se vivirá la celebración de principio a fin.",
    },
    dress_code: {
      enabled: true,
      title: "Código de vestimenta",
      text: "Look cómodo en tonos azul, plata o blanco. Si quieres, suma un detalle espacial.",
    },
    gifts: {
      enabled: true,
      title: "Mesa de regalos",
      text: "Tu presencia es lo más importante. Si quieres llevar un detalle, puede ser un libro, un juego creativo o una sorpresa espacial.",
      url: createWhatsAppUrl(
        "5527225459",
        "Hola, quiero preguntar sobre la mesa de regalos de Luis Arturo.",
      ),
    },
    faq: {
      enabled: true,
      title: "Preguntas frecuentes",
      items: [
        "Hay estacionamiento limitado dentro del salón.",
        "Si confirmas con acompañantes, incluye el total en tu RSVP.",
        "Puedes llegar desde las 10:45 am para entrar con calma.",
      ],
      text: "Lo más importante antes del despegue.",
    },
    livestream: {
      enabled: true,
      title: "Transmisión en vivo",
      text: "Si no puedes venir, tendremos una señal privada para ver el festejo.",
      url: "https://www.youtube.com/watch?v=21X5lGlDOfg",
    },
    transport: {
      enabled: true,
      title: "Transporte",
      text: "Si vienes en auto, usa la entrada principal. Si vienes en taxi o app, comparte la ubicación del mapa para llegar directo.",
    },
    lodging: {
      enabled: true,
      title: "Hospedaje",
      text: "Si vienes de fuera de CDMX, te recomendamos hospedarte cerca de Xochimilco o Coapa para llegar más rápido el día del evento.",
    },
  },
  share: {
    og_title: "Cumple 7 de Luis Arturo | Invitación Premium Astronautas",
    og_description: "La misión es que nos acompañes a celebrar en Jardín del Valle.",
    og_image_url:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    og_type: "website",
  },
  expired_page: {
    title: "Este evento ya pasó",
    message: "Gracias por tu interés. Descubre nuevas invitaciones premium.",
    primary_cta: {
      text: "Ver invitaciones y precios",
      href: "/",
    },
    secondary_cta: {
      text: "Cotizar por WhatsApp",
      href: createWhatsAppUrl("5527225459", "Hola, quiero cotizar una invitación como la de astronautas."),
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
          "Hola, quiero cotizar una invitación digital premium.",
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
            description: "Tema astronautas con animación premium, mapa y RSVP.",
            slug: "cumple-7-luis-arturo-astronautas",
            cover_url:
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
          },
        ],
      },
      promo: {
        enabled: true,
        title: "Promo de lanzamiento",
        text: "Incluye configuración inicial del CRM y landing editable en cada paquete premium.",
        valid_from: "2026-02-01T00:00:00.000Z",
        valid_to: "2026-12-31T23:59:59.000Z",
      },
      packages: {
        enabled: true,
        title: "Paquetes",
        items: [
          {
            name: "Esencial",
            price: "$1,490 MXN",
            description: "Invitación pensada para móvil con RSVP y secciones clave.",
            features: ["1 tema", "Mapa embebido", "RSVP básico"],
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
          "Personalización de copy y colores",
          "Carga inicial de galería",
          "Ajuste de assets para OG",
        ],
      },
      how_it_works: {
        enabled: true,
        title: "Cómo funciona",
        items: [
          "Definimos tema, fecha y lugar.",
          "Configuramos secciones activas en el CRM.",
          "Publicas y compartes un enlace listo para WhatsApp.",
        ],
      },
      faq: {
        enabled: true,
        title: "Preguntas frecuentes",
        items: [
          {
            question: "¿Puedo editar la landing sin redeploy?",
            answer: "Sí. Todo se guarda en site_settings y se refleja en /.",
          },
          {
            question: "¿La vista cliente requiere cuenta?",
            answer: "No. Se comparte un link privado con token de solo lectura.",
          },
        ],
      },
      contact: {
        enabled: true,
        title: "Cotiza tu invitación",
        text: "Cuéntanos fecha, tema y tipo de evento para preparar una propuesta.",
        whatsapp_number: "5527225459",
        whatsapp_prefill_text: "Hola, quiero cotizar una invitación digital premium.",
      },
    },
    invitation_templates: [
      {
        id: "template-astronautas-base",
        name: "Astronautas base",
        description: "Base editable del demo de Luis Arturo.",
        source_invitation_id: "11111111-1111-4111-8111-111111111111",
        created_at: now,
        updated_at: now,
      },
    ],
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
    message: "Nos vemos en la misión.",
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
