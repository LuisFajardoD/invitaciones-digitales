export type InvitationStatus = "draft" | "published";
export type BackgroundMediaType = "default" | "image" | "video";
export type BackgroundMode = "default_app" | "inherit_hero" | "custom";
export type KenBurnsStrength = "low" | "medium" | "high";
export type SectionKey =
  | "hero"
  | "event_info"
  | "quick_actions"
  | "countdown"
  | "map"
  | "gallery"
  | "notes"
  | "rsvp"
  | "contact"
  | "itinerary"
  | "dress_code"
  | "gifts"
  | "faq"
  | "livestream"
  | "transport"
  | "lodging";

export type BackgroundMediaConfig = {
  type: BackgroundMediaType;
  image_url: string;
  video_url: string;
  poster_url: string;
  kenburns?: KenBurnsConfig;
};

export type KenBurnsConfig = {
  enabled: boolean;
  strength: KenBurnsStrength;
};

export type HeroAstronaut = {
  enabled: boolean;
  image_url: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
  opacity?: number;
};

export type QuickActionItem = {
  type: "confirm" | "location" | "calendar" | "share";
  label: string;
};

export type GenericSection = {
  enabled: boolean;
  title?: string;
  text?: string;
  items?: string[];
  url?: string;
};

export type InvitationRecord = {
  id: string;
  slug: string;
  status: InvitationStatus;
  theme_id: string;
  timezone: string;
  event_start_at: string;
  rsvp_until: string;
  background?: {
    mode: BackgroundMode;
    kenburns?: KenBurnsConfig;
    custom: {
      type: Exclude<BackgroundMediaType, "default">;
      image_url: string;
      video_url: string;
      poster_url: string;
    };
  };
  sections_order: SectionKey[];
  sections: {
    hero: {
      enabled: boolean;
      badge: string;
      accent: string;
      title: string;
      subtitle: string;
      background_image_url: string;
      background?: BackgroundMediaConfig;
      astronaut?: HeroAstronaut;
    };
    event_info: {
      enabled: boolean;
      weekday_text: string;
      date_text: string;
      time_text: string;
      venue_name: string;
      address_text: string;
    };
    quick_actions: {
      enabled: boolean;
      items: QuickActionItem[];
    };
    countdown: {
      enabled: boolean;
      label: string;
      target_at: string;
    };
    map: {
      enabled: boolean;
      maps_url: string;
      address_text: string;
      dark?: boolean | null;
      embed?: {
        lat: number;
        lng: number;
        zoom: number;
      };
    };
    gallery: {
      enabled: boolean;
      image_urls: string[];
      max_images: number;
    };
    notes: {
      enabled: boolean;
      items: string[];
    };
    rsvp: {
      enabled: boolean;
      closed_message: string;
      fields: {
        guests_count?: boolean;
        message?: boolean;
        allow_guests_count?: boolean;
        allow_message?: boolean;
      };
    };
    contact: {
      enabled: boolean;
      name: string;
      label: string;
      whatsapp_number: string;
      whatsapp_url: string;
      avatar_image_url?: string;
    };
    itinerary: GenericSection;
    dress_code: GenericSection;
    gifts: GenericSection;
    faq: GenericSection;
    livestream: GenericSection;
    transport: GenericSection;
    lodging: GenericSection;
  };
};

export type ApiSuccess = {
  invitation: InvitationRecord;
};

export type AdminInvitationListSuccess = {
  invitations: InvitationRecord[];
};

export type RsvpResponseRecord = {
  id: string;
  name: string;
  attending: boolean;
  guests_count: number | null;
  message: string | null;
  created_at: string;
};

export type RsvpSummary = {
  attendingCount: number;
  notAttendingCount: number;
  totalCount: number;
  responses: RsvpResponseRecord[];
};

export type ClientRsvpView = {
  invitation: InvitationRecord;
  summary: RsvpSummary;
};

export type ClientRsvpApiSuccess = {
  result: ClientRsvpView;
};

export const sectionDisplayLabels: Record<Exclude<SectionKey, "hero">, string> = {
  event_info: "Bitacora de mision",
  quick_actions: "Acciones rapidas",
  countdown: "Cuenta regresiva",
  map: "Ubicacion",
  gallery: "Momentos especiales",
  notes: "Checklist",
  rsvp: "Confirma tu asistencia",
  contact: "Canal directo",
  itinerary: "Itinerario",
  dress_code: "Codigo de vestimenta",
  gifts: "Regalos",
  faq: "Preguntas frecuentes",
  livestream: "Transmision en vivo",
  transport: "Transporte",
  lodging: "Hospedaje",
};
