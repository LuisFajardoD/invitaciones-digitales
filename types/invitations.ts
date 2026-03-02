export type InvitationStatus = "draft" | "published";
export type AnimationProfile = "lite" | "pro" | "max";

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

export interface CtaLink {
  text: string;
  href: string;
}

export interface InvitationShare {
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_type: string;
}

export interface ExpiredPage {
  title: string;
  message: string;
  primary_cta: CtaLink;
  secondary_cta: CtaLink;
}

export interface QuickActionItem {
  type: "confirm" | "location" | "calendar" | "share";
  label: string;
}

export interface SectionBase {
  enabled: boolean;
}

export interface HeroSectionData extends SectionBase {
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  background_image_url: string;
}

export interface EventInfoSectionData extends SectionBase {
  weekday_text: string;
  date_text: string;
  time_text: string;
  venue_name: string;
  address_text: string;
}

export interface QuickActionsSectionData extends SectionBase {
  items: QuickActionItem[];
}

export interface CountdownSectionData extends SectionBase {
  label: string;
  target_at: string;
}

export interface MapSectionData extends SectionBase {
  embed: {
    lat: number;
    lng: number;
    zoom: number;
  };
  address_text: string;
  maps_url: string;
}

export interface GallerySectionData extends SectionBase {
  max_images: number;
  image_urls: string[];
}

export interface NotesSectionData extends SectionBase {
  items: string[];
}

export interface RsvpSectionData extends SectionBase {
  fields: {
    guests_count: boolean;
    message: boolean;
  };
  closed_message: string;
}

export interface ContactSectionData extends SectionBase {
  name: string;
  whatsapp_number: string;
  whatsapp_url: string;
  label: string;
}

export interface GenericTextSectionData extends SectionBase {
  title?: string;
  text?: string;
  items?: string[];
  url?: string;
}

export interface InvitationSections {
  hero: HeroSectionData;
  event_info: EventInfoSectionData;
  quick_actions: QuickActionsSectionData;
  countdown: CountdownSectionData;
  map: MapSectionData;
  gallery: GallerySectionData;
  notes: NotesSectionData;
  rsvp: RsvpSectionData;
  contact: ContactSectionData;
  itinerary: GenericTextSectionData;
  dress_code: GenericTextSectionData;
  gifts: GenericTextSectionData;
  faq: GenericTextSectionData;
  livestream: GenericTextSectionData;
  transport: GenericTextSectionData;
  lodging: GenericTextSectionData;
}

export interface InvitationRecord {
  id: string;
  slug: string;
  status: InvitationStatus;
  theme_id: string;
  layout_id: string;
  animation_profile: AnimationProfile;
  timezone: string;
  event_start_at: string;
  rsvp_until: string;
  active_until: string;
  sections_order: SectionKey[];
  sections: InvitationSections;
  share: InvitationShare;
  expired_page: ExpiredPage;
  client_view_token: string;
  created_at: string;
  updated_at: string;
}

export interface RsvpResponse {
  id: string;
  invitation_id: string;
  name: string;
  attending: boolean;
  guests_count: number | null;
  message: string | null;
  created_at: string;
}

export interface ThemeRecord {
  id: string;
  name: string;
  preview_url: string;
  defaults: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SiteHeroBlock {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  primary_cta_text: string;
  primary_cta_href: string;
  secondary_cta_text: string;
  secondary_cta_href: string;
}

export interface SiteExamplesBlock {
  enabled: boolean;
  title: string;
  items: Array<{
    title: string;
    description: string;
    slug: string;
    cover_url: string;
  }>;
}

export interface SitePromoBlock {
  enabled: boolean;
  title: string;
  text: string;
  valid_from?: string;
  valid_to?: string;
}

export interface SitePackagesBlock {
  enabled: boolean;
  title: string;
  items: Array<{
    name: string;
    price: string;
    description: string;
    features: string[];
  }>;
}

export interface SiteListBlock {
  enabled: boolean;
  title: string;
  items: string[];
}

export interface SiteFaqBlock {
  enabled: boolean;
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface SiteContactBlock {
  enabled: boolean;
  title: string;
  text: string;
  whatsapp_number: string;
  whatsapp_prefill_text: string;
}

export interface SiteBlocks {
  hero: SiteHeroBlock;
  examples: SiteExamplesBlock;
  promo: SitePromoBlock;
  packages: SitePackagesBlock;
  extras: SiteListBlock;
  how_it_works: SiteListBlock;
  faq: SiteFaqBlock;
  contact: SiteContactBlock;
}

export type SiteBlockKey = keyof SiteBlocks;

export interface SiteSettingsData {
  blocks_order: SiteBlockKey[];
  blocks: SiteBlocks;
}

export interface SiteSettingsRecord {
  id: string;
  data: SiteSettingsData;
  created_at: string;
  updated_at: string;
}

export interface RsvpSummary {
  attendingCount: number;
  notAttendingCount: number;
  totalCount: number;
  responses: RsvpResponse[];
}

export interface ClientRsvpView {
  invitation: InvitationRecord;
  summary: RsvpSummary;
}
