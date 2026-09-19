// Taxonomía central del catálogo, tomada de las categorías existentes del Home.
export const categories = [
  {
    "id": "infantiles",
    "label": "Infantiles",
    "subcategories": [
      "Dinosaurios",
      "Espacio",
      "Princesas / fantasía",
      "Animales",
      "Deportes",
      "Videojuegos",
      "Carreras",
      "Sirenas",
      "Superhéroes",
      "Aventuras",
      "Temáticas personalizadas"
    ]
  },
  {
    "id": "cumpleanos",
    "label": "Cumpleaños",
    "subcategories": [
      "Adolescentes",
      "Jóvenes",
      "Adultos",
      "18 años",
      "30 / 40 / 50 / 60 años",
      "Elegantes",
      "Temáticos",
      "Fiesta / neón"
    ]
  },
  {
    "id": "xv-anos",
    "label": "XV años",
    "subcategories": [
      "Elegantes",
      "Florales",
      "Modernos",
      "Princesa",
      "Neón",
      "Temáticos"
    ]
  },
  {
    "id": "bodas",
    "label": "Bodas",
    "subcategories": [
      "Save the date",
      "Pedida de mano / compromiso",
      "Despedida de soltera",
      "Despedida de soltero",
      "Boda civil",
      "Boda religiosa",
      "Aniversarios",
      "Bodas de plata",
      "Bodas de oro",
      "Renovación de votos"
    ]
  },
  {
    "id": "bebe",
    "label": "Bebé",
    "subcategories": [
      "Baby shower",
      "Revelación de género",
      "Bienvenida del bebé",
      "Primer añito"
    ]
  },
  {
    "id": "religiosas",
    "label": "Celebraciones religiosas",
    "subcategories": [
      "Bautizos",
      "Primera comunión",
      "Confirmación"
    ]
  },
  {
    "id": "graduaciones",
    "label": "Graduaciones",
    "subcategories": [
      "Preescolar",
      "Primaria",
      "Secundaria",
      "Preparatoria",
      "Universidad",
      "Fiesta de graduación"
    ]
  },
  {
    "id": "reuniones",
    "label": "Reuniones",
    "subcategories": [
      "Reuniones familiares",
      "Posadas",
      "Reunión de Navidad",
      "Fiesta de Año Nuevo",
      "Cenas",
      "Fiestas temáticas",
      "Reencuentros",
      "Reuniones de amigos"
    ]
  },
  {
    "id": "corporativos",
    "label": "Eventos corporativos",
    "subcategories": [
      "Inauguraciones",
      "Lanzamientos",
      "Conferencias",
      "Convenciones",
      "Cenas empresariales",
      "Aniversarios de empresa",
      "Posadas empresariales",
      "Fiesta corporativa de Año Nuevo",
      "Reuniones empresariales",
      "Eventos internos",
      "Premiaciones"
    ]
  }
];
export const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const catalogStyles = [
  "Moderno",
  "Elegante",
  "Colorido",
  "Neón",
  "Boho",
  "Temático",
  "Floral",
  "Clásico",
  "Tierno",
  "Glamour",
  "Minimalista",
  "Divertido",
  "Fantasía",
  "Rústico",
];
export const catalogFeatures = ["Música", "Mapa GPS", "Confirmación RSVP", "Cuenta regresiva", "Galería de fotos", "Mesa de regalos", "Itinerario / programa", "Código de vestimenta"];
export const invitationTypes = [
  { slug: "imagen-esencial", label: "Imagen Esencial" },
  { slug: "interactiva", label: "Interactiva" },
  { slug: "video-invitacion", label: "Video Invitación" },
  { slug: "web-esencial", label: "Web Esencial" },
  { slug: "web-premium", label: "Web Premium" },
] as const;

export type InvitationTypeSlug = (typeof invitationTypes)[number]["slug"];
export const DEFAULT_INVITATION_TYPE: InvitationTypeSlug = "web-premium";
export const catalogFileFeatures: Record<"imagen-esencial" | "interactiva" | "video-invitacion", string[]> = {
  "imagen-esencial": ["Imagen lista para compartir", "Descarga de imagen", "Diseño personalizado", "Formato AVIF"],
  interactiva: ["Documento PDF", "Enlaces interactivos", "Descarga de PDF", "Diseño personalizado"],
  "video-invitacion": ["Video animado", "Reproducción en línea", "Descarga de video", "Formato WebM"],
};
