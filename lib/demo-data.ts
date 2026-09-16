import { DEFAULT_BLOCK_ORDER, DEFAULT_SECTION_ORDER } from "@/lib/constants";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
import { createDefaultSiteSettings } from "@/lib/site-settings-defaults";
import { createWhatsAppUrl } from "@/lib/utils";
import type {
  InvitationRecord,
  InvitationTemplateRecord,
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
  event_start_at: "2027-04-18T17:00:00.000Z",
  rsvp_until: "2027-04-19T04:59:59.000Z",
  active_until: "2035-12-31T23:59:59.000Z",
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
      title: "Cumple 7 de Mateo",
      subtitle: "La misión es que nos acompañes a celebrar una aventura espacial.",
      badge: "Misión espacial demo",
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
      date_text: "24 de octubre de 2026",
      time_text: "A partir de las 11:00 am",
      venue_name: "Salón Galáctico Mágico",
      address_text:
        "Av. de la Galaxia 123, Col. Astral, CDMX",
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
      target_at: "2026-10-24T17:00:00.000Z",
    },
    map: {
      enabled: true,
      embed: {
        lat: 19.4326,
        lng: -99.1332,
        zoom: 16,
      },
      address_text:
        "Av. de la Galaxia 123, Col. Astral, CDMX",
      maps_url:
        "https://www.google.com/maps/search/?api=1&query=19.4326,-99.1332",
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
      name: "Contacto Demo",
      whatsapp_number: "5500000000",
      whatsapp_url: createWhatsAppUrl("5500000000", "Hola, quiero detalles del cumple de Mateo."),
      label: "Contacto por WhatsApp",
    },
    itinerary: {
      enabled: true,
      title: "Itinerario de vuelo",
      items: [
        "11:00 am | Bienvenida y fotos de aterrizaje",
        "11:30 am | Juegos y misiones espaciales",
        "1:00 pm | Pastel y canción para Mateo",
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
        "5500000000",
        "Hola, quiero preguntar sobre los regalos demo.",
      ),
    },
    faq: {
      enabled: true,
      title: "Preguntas frecuentes",
      items: [
        "Estacionamiento disponible dentro del lugar.",
        "Por favor confirma el total de asistentes en tu RSVP.",
      ],
      text: "Información importante antes del despegue.",
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
      text: "Recomendamos hospedarse cerca de la zona en caso de venir de fuera.",
    },
  },
  share: {
    og_title: "Cumple 7 de Mateo | Demo Misión Espacial",
    og_description: "Acompáñanos a celebrar una misión espacial inolvidable en Salón Galáctico Mágico.",
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

export const demoJulietaInvitation: InvitationRecord = {
  id: "97346bce-9963-4b0e-8b17-601d84810957",
  slug: "cumple-5-julieta-mabell",
  status: "published",
  theme_id: "sirenita",
  layout_id: "layout_v1_unico",
  animation_profile: "max",
  timezone: "America/Mexico_City",
  event_start_at: "2027-07-04T12:00:00.000Z",
  rsvp_until: "2027-07-05T04:59:59.000Z",
  active_until: "2035-12-31T23:59:59.000Z",
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
      title: "Cumple 5 de Sofía",
      subtitle: "Acompáñanos a celebrar una aventura mágica bajo el mar.",
      badge: "Cumple 5 Bajo el Mar 🧜‍♀️",
      accent: "Gran fiesta de Sirenas",
      background_image_url:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80",
      background: {
        type: "image",
        image_url:
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80",
        video_url: "",
        poster_url: "",
      },
    },
    event_info: {
      enabled: true,
      weekday_text: "Sábado",
      date_text: "14 de noviembre de 2026",
      time_text: "A partir de las 12:00 pm",
      venue_name: "Salón Arrecife Mágico",
      address_text: "Av. Marina Azul 456, Col. Del Mar, CDMX",
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
      label: "Faltan para la gran fiesta",
      target_at: "2026-11-14T12:00:00.000Z",
    },
    map: {
      enabled: true,
      embed: {
        lat: 19.352,
        lng: -99.162,
        zoom: 16,
      },
      address_text: "Av. Marina Azul 456, Col. Del Mar, CDMX",
      maps_url: "https://www.google.com/maps/search/?api=1&query=19.352,-99.162",
      dark: false,
    },
    gallery: {
      enabled: true,
      max_images: 6,
      image_urls: [
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
      ],
    },
    notes: {
      enabled: true,
      items: [
        "Trae mucha alegría para celebrar con Sofía.",
        "Habrá mesa de dulces temáticos y show en vivo.",
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
      name: "Contacto Demo",
      whatsapp_number: "5500000000",
      whatsapp_url:
        createWhatsAppUrl("5500000000", "Hola, quiero detalles del cumple de Sofía."),
      label: "Contacto por WhatsApp",
    },
    itinerary: {
      enabled: true,
      title: "Itinerario de la aventura",
      items: [
        "12:00 pm | Bienvenida y recepción en el reino marino",
        "1:00 pm | Show acuático y juegos mágicos",
        "3:00 pm | Pastel y piñata con Sofía",
      ],
      text: "Momentos mágicos de principio a fin.",
    },
    dress_code: {
      enabled: true,
      title: "Código de vestimenta",
      text: "Estilo acuático o libre en tonos turquesa, lila, rosa o blanco.",
    },
    gifts: {
      enabled: true,
      title: "Mesa de regalos",
      text: "Tu presencia es nuestro mejor regalo.",
      url: createWhatsAppUrl("5500000000", "Hola, información de regalos demo."),
    },
    faq: {
      enabled: true,
      title: "Preguntas frecuentes",
      items: [
        "Contamos con valet parking en el lugar.",
        "Por favor confirma el total de asistentes en tu mensaje de RSVP.",
      ],
      text: "Información importante para los invitados.",
    },
    livestream: {
      enabled: false,
      title: "Transmisión en vivo",
      text: "Transmisión privada para familiares lejanos.",
      url: "",
    },
    transport: {
      enabled: false,
      title: "Transporte",
      text: "Estacionamiento disponible en la entrada del salón.",
    },
    lodging: {
      enabled: false,
      title: "Hospedaje",
      text: "Recomendamos hospedarse cerca de la zona en caso de venir de fuera.",
    },
  },
  share: {
    og_title: "Cumple 5 de Sofía | Demo Mágica Bajo el Mar",
    og_description: "Acompáñanos a celebrar una aventura mágica bajo el mar en Salón Arrecife Mágico.",
    og_image_url:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    og_type: "website",
  },
  expired_page: {
    title: "Este evento ya pasó",
    message: "Gracias por acompañarnos en esta aventura bajo el mar.",
    primary_cta: {
      text: "Ver invitaciones y precios",
      href: "/",
    },
    secondary_cta: {
      text: "Cotizar por WhatsApp",
      href: "https://wa.me/5527225459?text=Hola%2C%20quiero%20cotizar%20una%20invitaci%C3%B3n%20como%20la%20de%20sirenita.",
    },
  },
  client_view_token: "julieta-token-demo",
  created_at: now,
  updated_at: now,
};

type CategoryDemoSpec = {
  id: string;
  slug: string;
  category: string;
  cardTitle: string;
  description: string;
  base: "space" | "princess";
  themeId: string;
  coverUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroAccent: string;
  venueName: string;
  countdownLabel: string;
  itineraryTitle: string;
  itineraryItems: string[];
  dressCode: string;
  mapDark: boolean;
  preserveBase?: boolean;
};

const categoryDemoSpecs: CategoryDemoSpec[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    slug: "demo-espacio",
    category: "Espacio",
    cardTitle: "Mision espacial",
    description: "Astronautas, planetas y una invitacion lista para cumpleanos galactico.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/espacio.avif",
    heroTitle: "Cumple espacial de Mateo",
    heroSubtitle: "Prepara tu casco para una fiesta fuera de este mundo.",
    heroBadge: "Mision espacial",
    heroAccent: "Despegue de cumpleanos",
    venueName: "Base Galactica Gloobi",
    countdownLabel: "Faltan para el despegue",
    itineraryTitle: "Itinerario de vuelo",
    itineraryItems: [
      "12:00 pm | Registro de astronautas",
      "1:00 pm | Misiones y juegos espaciales",
      "3:00 pm | Pastel galactico",
    ],
    dressCode: "Look comodo en azul, plata o blanco.",
    mapDark: true,
    preserveBase: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    slug: "demo-dinosaurios",
    category: "Dinosaurios",
    cardTitle: "Aventura jurasica",
    description: "Base editable para fiesta de dinos, exploradores y selva divertida.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/dinosaurios.avif",
    heroTitle: "Cumple jurásico de Leo",
    heroSubtitle: "Una expedicion llena de dinosaurios, pistas y mucha diversion.",
    heroBadge: "Aventura jurásica",
    heroAccent: "Exploradores invitados",
    venueName: "Parque Dino Gloobi",
    countdownLabel: "Faltan para la expedicion",
    itineraryTitle: "Ruta de exploradores",
    itineraryItems: [
      "12:00 pm | Entrada al campamento",
      "1:00 pm | Busqueda de fosiles",
      "3:00 pm | Pastel jurásico",
    ],
    dressCode: "Outfit comodo de explorador o tonos verdes.",
    mapDark: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    slug: "demo-futbol",
    category: "Fútbol",
    cardTitle: "Final de campeones",
    description: "Invitacion tipo estadio para fans, equipos y fiesta deportiva.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/futbol.avif",
    heroTitle: "Cumple de campeones",
    heroSubtitle: "La cancha esta lista para celebrar con goles, juegos y pastel.",
    heroBadge: "Final de cumpleanos",
    heroAccent: "Equipo invitado",
    venueName: "Cancha Campeones Gloobi",
    countdownLabel: "Faltan para el partido",
    itineraryTitle: "Marcador del evento",
    itineraryItems: [
      "12:00 pm | Bienvenida de equipos",
      "1:00 pm | Retas y juegos",
      "3:00 pm | Trofeo, pastel y fotos",
    ],
    dressCode: "Playera de tu equipo favorito o ropa deportiva.",
    mapDark: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    slug: "demo-carreras",
    category: "Carreras",
    cardTitle: "Pista veloz",
    description: "Base para autos, velocidad, neon y celebracion con mucha energia.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/carreras.avif",
    heroTitle: "Cumple a toda velocidad",
    heroSubtitle: "Enciende motores para una fiesta llena de pistas, luces y adrenalina.",
    heroBadge: "Gran premio infantil",
    heroAccent: "Motores listos",
    venueName: "Pista Neon Gloobi",
    countdownLabel: "Faltan para arrancar",
    itineraryTitle: "Vueltas de la fiesta",
    itineraryItems: [
      "12:00 pm | Entrada a pits",
      "1:00 pm | Carrera de retos",
      "3:00 pm | Podio y pastel",
    ],
    dressCode: "Ropa comoda con detalles rojos, negros o neon.",
    mapDark: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    slug: "demo-fantasia",
    category: "Fantasía",
    cardTitle: "Reino encantado",
    description: "Unicornios, castillos y un estilo magico para editar desde CRM.",
    base: "princess",
    themeId: "sirenas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/fantasia.avif",
    heroTitle: "Cumple en el reino encantado",
    heroSubtitle: "Una celebracion con magia, brillos y momentos de cuento.",
    heroBadge: "Fiesta de fantasía",
    heroAccent: "Magia en vivo",
    venueName: "Castillo Encantado Gloobi",
    countdownLabel: "Faltan para abrir el portal",
    itineraryTitle: "Agenda encantada",
    itineraryItems: [
      "12:00 pm | Bienvenida al reino",
      "1:00 pm | Juegos magicos",
      "3:00 pm | Pastel de cuento",
    ],
    dressCode: "Tonos pastel, brillos o tu personaje favorito.",
    mapDark: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    slug: "demo-animales",
    category: "Animales",
    cardTitle: "Safari party",
    description: "Celebracion de selva, animalitos y colores calidos para cumpleanos.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/animales.avif",
    heroTitle: "Safari de cumpleanos",
    heroSubtitle: "Una aventura entre animalitos, juegos y mucha alegria.",
    heroBadge: "Safari party",
    heroAccent: "Exploradores de la selva",
    venueName: "Jardin Safari Gloobi",
    countdownLabel: "Faltan para el safari",
    itineraryTitle: "Expedicion del dia",
    itineraryItems: [
      "12:00 pm | Bienvenida safari",
      "1:00 pm | Juegos de exploracion",
      "3:00 pm | Pastel y fotos salvajes",
    ],
    dressCode: "Tonos tierra, verde o estampado divertido.",
    mapDark: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    slug: "demo-videojuegos",
    category: "Videojuegos",
    cardTitle: "Nivel legendario",
    description: "Demo gamer con lenguaje de niveles, logros y fiesta interactiva.",
    base: "space",
    themeId: "astronautas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/videojuegos.avif",
    heroTitle: "Cumple nivel legendario",
    heroSubtitle: "Presiona start y acompananos a desbloquear una fiesta epica.",
    heroBadge: "Level up party",
    heroAccent: "Partida multijugador",
    venueName: "Arcade Gloobi",
    countdownLabel: "Faltan para iniciar partida",
    itineraryTitle: "Misiones del nivel",
    itineraryItems: [
      "12:00 pm | Login de invitados",
      "1:00 pm | Retos gamer",
      "3:00 pm | Boss final: pastel",
    ],
    dressCode: "Playera gamer, colores neon o ropa comoda.",
    mapDark: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    slug: "demo-princesas",
    category: "Princesas",
    cardTitle: "Cuento magico",
    description: "Base de sirena/princesa para adaptar a castillo, corona o cuento.",
    base: "princess",
    themeId: "sirenas",
    coverUrl: "/assets/gloobi-home/tematicas-infantiles/princesas.avif",
    heroTitle: "Cumple de cuento mágico",
    heroSubtitle: "Una fiesta dulce con coronas, brillos y momentos inolvidables.",
    heroBadge: "Princesas y magia",
    heroAccent: "Baile real",
    venueName: "Palacio Magico Gloobi",
    countdownLabel: "Faltan para el cuento",
    itineraryTitle: "Momentos reales",
    itineraryItems: [
      "12:00 pm | Recepcion real",
      "1:00 pm | Juegos y baile",
      "3:00 pm | Pastel de princesa",
    ],
    dressCode: "Vestido, corona, tonos rosa, lila o libre.",
    mapDark: false,
    preserveBase: true,
  },
];

function cloneSections(source: InvitationRecord["sections"]) {
  return JSON.parse(JSON.stringify(source)) as InvitationRecord["sections"];
}

function createCategoryDemoInvitation(spec: CategoryDemoSpec): InvitationRecord {
  const base = spec.base === "princess" ? demoJulietaInvitation : demoInvitation;

  if (spec.preserveBase) {
    return {
      ...JSON.parse(JSON.stringify(base)),
      id: spec.id,
      slug: spec.slug,
      status: "published",
      client_view_token: `${spec.slug}-token-demo`,
      created_at: now,
      updated_at: now,
    } as InvitationRecord;
  }

  const sections = cloneSections(base.sections);

  return {
    ...base,
    id: spec.id,
    slug: spec.slug,
    status: "published",
    theme_id: spec.themeId,
    event_start_at: "2026-10-24T18:00:00.000Z",
    rsvp_until: "2035-12-31T23:59:59.000Z",
    active_until: "2035-12-31T23:59:59.000Z",
    client_view_token: `${spec.slug}-token-demo`,
    sections: {
      ...sections,
      hero: {
        ...sections.hero,
        title: spec.heroTitle,
        subtitle: spec.heroSubtitle,
        badge: spec.heroBadge,
        accent: spec.heroAccent,
        background_image_url: spec.coverUrl,
        background: {
          ...(sections.hero.background || {}),
          type: "image",
          image_url: spec.coverUrl,
          video_url: "",
          poster_url: "",
        },
        astronaut: sections.hero.astronaut
          ? {
              ...sections.hero.astronaut,
              enabled: spec.slug === "demo-espacio",
            }
          : undefined,
      },
      event_info: {
        ...sections.event_info,
        weekday_text: "Sábado",
        date_text: "24 de octubre de 2026",
        time_text: "A partir de las 12:00 pm",
        venue_name: spec.venueName,
        address_text: "Salón Demo Gloobi, CDMX",
      },
      countdown: {
        ...sections.countdown,
        label: spec.countdownLabel,
        target_at: "2026-10-24T18:00:00.000Z",
      },
      map: {
        ...sections.map,
        embed: {
          lat: 19.4326,
          lng: -99.1332,
          zoom: 16,
        },
        address_text: "Salón Demo Gloobi, CDMX",
        maps_url: "https://www.google.com/maps/search/?api=1&query=19.4326,-99.1332",
        dark: spec.mapDark,
      },
      gallery: {
        ...sections.gallery,
        image_urls: [spec.coverUrl, ...sections.gallery.image_urls].slice(0, 6),
      },
      notes: {
        ...sections.notes,
        items: [
          "Demo editable desde el CRM.",
          "Puedes cambiar textos, fotos, colores y secciones cuando adaptes la categoria.",
        ],
      },
      contact: {
        ...sections.contact,
        whatsapp_url: createWhatsAppUrl("5500000000", `Hola, quiero detalles del demo ${spec.category}.`),
      },
      itinerary: {
        ...sections.itinerary,
        title: spec.itineraryTitle,
        items: spec.itineraryItems,
        text: "Una guia base para mostrar como se ve la invitacion.",
      },
      dress_code: {
        ...sections.dress_code,
        title: "Código de vestimenta",
        text: spec.dressCode,
      },
      gifts: {
        ...sections.gifts,
        title: "Mesa de regalos",
        text: "Tu presencia es nuestro mejor regalo.",
      },
      faq: {
        ...sections.faq,
        title: "Preguntas frecuentes",
        text: "Detalles listos para personalizar desde el CRM.",
      },
    },
    share: {
      og_title: `${spec.category} | Demo Gloobi`,
      og_description: spec.heroSubtitle,
      og_image_url: spec.coverUrl,
      og_type: "website",
    },
    expired_page: {
      ...base.expired_page,
      primary_cta: {
        text: "Ver categorías",
        href: "/",
      },
      secondary_cta: {
        text: "Cotizar por WhatsApp",
        href: createWhatsAppUrl("5527225459", `Hola, quiero cotizar una invitacion de ${spec.category}.`),
      },
    },
    created_at: now,
    updated_at: now,
  };
}

export const demoCategoryInvitations: InvitationRecord[] = categoryDemoSpecs.map(createCategoryDemoInvitation);

export const demoCategoryExampleItems: SiteSettingsRecord["data"]["blocks"]["examples"]["items"] =
  categoryDemoSpecs.map((spec) => ({
    title: spec.category,
    description: spec.description,
    slug: spec.slug,
    cover_url: spec.coverUrl,
  }));

export const demoCategoryTemplates: InvitationTemplateRecord[] = categoryDemoSpecs.map((spec) => ({
  id: `template-${spec.slug}`,
  name: `Demo ${spec.category}`,
  description: spec.description,
  source_invitation_id: spec.id,
  created_at: now,
  updated_at: now,
}));

export const demoSiteSettings: SiteSettingsRecord = {
  id: "main",
  data: {
    blocks_order: DEFAULT_BLOCK_ORDER,
    pages: createDefaultSiteSettings().pages,
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
        items: demoCategoryExampleItems,
      },
      promo: {
        enabled: true,
        title: "Promo de lanzamiento",
        text: "Incluye configuración inicial del CRM y landing editable en cada paquete premium.",
        valid_to: "2026-12-31T23:59:59.000Z",
      },
      packages: {
        enabled: true,
        title: "Paquetes",
        service_note: DEFAULT_PACKAGES_SERVICE_NOTE,
        items: RECOMMENDED_SITE_PACKAGES.map((item) => ({
          ...item,
          features: [...item.features],
        })),
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
      ...demoCategoryTemplates,
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
