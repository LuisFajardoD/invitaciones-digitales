import type { SectionKey, SiteBlockKey } from "@/types/invitations";

export const ADMIN_COOKIE_NAME = "inv_admin_session";
export const DEMO_ADMIN_EMAIL = "demo@invitaciones.local";
export const DEMO_ADMIN_PASSWORD = "demo12345";
export const DEFAULT_WHATSAPP_NUMBER = "525527225459";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "hero",
  "event_info",
  "quick_actions",
  "countdown",
  "map",
  "gallery",
  "notes",
  "rsvp",
  "contact",
];

export const DEFAULT_BLOCK_ORDER: SiteBlockKey[] = [
  "hero",
  "examples",
  "promo",
  "packages",
  "extras",
  "how_it_works",
  "faq",
  "contact",
];
