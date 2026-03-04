import { DEFAULT_SECTION_ORDER } from "@/lib/constants";
import { demoInvitation } from "@/lib/demo-data";
import type {
  BackgroundMediaConfig,
  GenericTextSectionData,
  HeroAstronautConfig,
  InvitationBackgroundConfig,
  InvitationRecord,
  InvitationSections,
  KenBurnsConfig,
  QuickActionItem,
} from "@/types/invitations";

export const INVITATION_BACKGROUND_STORAGE_KEY = "__invitation_background";
export const DEFAULT_ASTRONAUT_ASSET = "/assets/astronaut-luis-arturo.webp";

export const DEFAULT_HERO_BACKGROUND: BackgroundMediaConfig = {
  type: "default",
  image_url: "",
  video_url: "",
  poster_url: "",
  kenburns: {
    enabled: false,
    strength: "medium",
  },
};

export const DEFAULT_INVITATION_BACKGROUND: InvitationBackgroundConfig = {
  mode: "inherit_hero",
  kenburns: {
    enabled: false,
    strength: "medium",
  },
  custom: {
    type: "image",
    image_url: "",
    video_url: "",
    poster_url: "",
  },
};

export const DEFAULT_HERO_ASTRONAUT: HeroAstronautConfig = {
  enabled: true,
  image_url: "",
  position: "bottom-right",
  opacity: 0.24,
};

function normalizeStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeGenericSection(
  value: Partial<GenericTextSectionData> | null | undefined,
  fallback: GenericTextSectionData,
): GenericTextSectionData {
  const candidate = value || {};

  return {
    ...fallback,
    ...candidate,
    items: normalizeStringList(candidate.items, fallback.items || []),
  };
}

function normalizeQuickActionItems(value: unknown, fallback: QuickActionItem[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<QuickActionItem>;
      const fallbackItem = fallback[index] || fallback[0];

      return {
        type:
          candidate.type === "confirm" ||
          candidate.type === "location" ||
          candidate.type === "calendar" ||
          candidate.type === "share"
            ? candidate.type
            : fallbackItem.type,
        label: typeof candidate.label === "string" ? candidate.label : fallbackItem.label,
      };
    })
    .filter((item): item is QuickActionItem => item !== null);

  return normalized.length ? normalized : [...fallback];
}

export function normalizeKenBurns(value?: Partial<KenBurnsConfig> | null): KenBurnsConfig {
  const candidate = value || {};

  return {
    enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : false,
    strength:
      candidate.strength === "low" || candidate.strength === "high" || candidate.strength === "medium"
        ? candidate.strength
        : "medium",
  };
}

export function normalizeBackgroundMedia(
  value?: Partial<BackgroundMediaConfig> | null,
  legacyImageUrl?: string,
): BackgroundMediaConfig {
  const candidate = value || {};
  const fallbackImage = candidate.image_url?.trim() || legacyImageUrl?.trim() || "";
  const fallbackVideo = candidate.video_url?.trim() || "";
  let type = candidate.type;

  if (!type) {
    if (fallbackVideo) {
      type = "video";
    } else if (fallbackImage) {
      type = "image";
    } else {
      type = "default";
    }
  }

  return {
    type,
    image_url: fallbackImage,
    video_url: fallbackVideo,
    poster_url: candidate.poster_url?.trim() || "",
    kenburns: normalizeKenBurns(candidate.kenburns),
  };
}

export function normalizeInvitationBackground(
  value?: Partial<InvitationBackgroundConfig> | null,
): InvitationBackgroundConfig {
  const candidate = value || {};
  const customCandidate = (candidate.custom || {}) as Partial<InvitationBackgroundConfig["custom"]>;
  const customType =
    customCandidate.type === "video" || customCandidate.type === "image"
      ? customCandidate.type
      : customCandidate.video_url
        ? "video"
        : "image";

  return {
    mode:
      candidate.mode === "default_app" || candidate.mode === "custom" || candidate.mode === "inherit_hero"
        ? candidate.mode
        : DEFAULT_INVITATION_BACKGROUND.mode,
    kenburns: normalizeKenBurns(candidate.kenburns),
    custom: {
      type: customType,
      image_url: customCandidate.image_url?.trim() || "",
      video_url: customCandidate.video_url?.trim() || "",
      poster_url: customCandidate.poster_url?.trim() || "",
      kenburns: normalizeKenBurns(customCandidate.kenburns),
    },
  };
}

export function normalizeHeroAstronaut(value?: Partial<HeroAstronautConfig> | null): HeroAstronautConfig {
  const candidate = value || {};
  const nextOpacity = Number(candidate.opacity);

  return {
    enabled: typeof candidate.enabled === "boolean" ? candidate.enabled : DEFAULT_HERO_ASTRONAUT.enabled,
    image_url: candidate.image_url?.trim() || "",
    position:
      candidate.position === "bottom-left" ||
      candidate.position === "top-right" ||
      candidate.position === "top-left" ||
      candidate.position === "center" ||
      candidate.position === "bottom-right"
        ? candidate.position
        : DEFAULT_HERO_ASTRONAUT.position,
    opacity:
      Number.isFinite(nextOpacity) && nextOpacity > 0
        ? Math.min(1, Math.max(0.05, nextOpacity))
        : DEFAULT_HERO_ASTRONAUT.opacity,
  };
}

export function normalizeInvitationRecord(invitation: InvitationRecord): InvitationRecord {
  const fallbackRecord = demoInvitation;
  const rawSections = ((invitation.sections || {}) as Partial<InvitationSections>) as Partial<InvitationSections> &
    Record<string, unknown>;
  const storedBackground = rawSections[INVITATION_BACKGROUND_STORAGE_KEY] as InvitationBackgroundConfig | undefined;
  const hero = {
    ...fallbackRecord.sections.hero,
    ...(rawSections.hero || {}),
  };
  const mapSection = {
    ...fallbackRecord.sections.map,
    ...(rawSections.map || {}),
  };
  const quickActionsSection = {
    ...fallbackRecord.sections.quick_actions,
    ...(rawSections.quick_actions || {}),
    items: normalizeQuickActionItems(rawSections.quick_actions?.items, fallbackRecord.sections.quick_actions.items),
  };
  const gallerySection = {
    ...fallbackRecord.sections.gallery,
    ...(rawSections.gallery || {}),
    image_urls: normalizeStringList(rawSections.gallery?.image_urls, fallbackRecord.sections.gallery.image_urls),
  };
  const notesSection = {
    ...fallbackRecord.sections.notes,
    ...(rawSections.notes || {}),
    items: normalizeStringList(rawSections.notes?.items, fallbackRecord.sections.notes.items),
  };
  const normalizedSections: InvitationSections = {
    hero: {
      ...hero,
      background: normalizeBackgroundMedia(hero.background, hero.background_image_url),
      astronaut: normalizeHeroAstronaut(hero.astronaut),
    },
    event_info: {
      ...fallbackRecord.sections.event_info,
      ...(rawSections.event_info || {}),
    },
    quick_actions: quickActionsSection,
    countdown: {
      ...fallbackRecord.sections.countdown,
      ...(rawSections.countdown || {}),
    },
    map: {
      ...mapSection,
      dark: typeof mapSection.dark === "boolean" ? mapSection.dark : null,
    },
    gallery: gallerySection,
    notes: notesSection,
    rsvp: {
      ...fallbackRecord.sections.rsvp,
      ...(rawSections.rsvp || {}),
      fields: {
        ...fallbackRecord.sections.rsvp.fields,
        ...(rawSections.rsvp?.fields || {}),
      },
    },
    contact: {
      ...fallbackRecord.sections.contact,
      ...(rawSections.contact || {}),
    },
    itinerary: normalizeGenericSection(rawSections.itinerary, fallbackRecord.sections.itinerary),
    dress_code: normalizeGenericSection(rawSections.dress_code, fallbackRecord.sections.dress_code),
    gifts: normalizeGenericSection(rawSections.gifts, fallbackRecord.sections.gifts),
    faq: normalizeGenericSection(rawSections.faq, fallbackRecord.sections.faq),
    livestream: normalizeGenericSection(rawSections.livestream, fallbackRecord.sections.livestream),
    transport: normalizeGenericSection(rawSections.transport, fallbackRecord.sections.transport),
    lodging: normalizeGenericSection(rawSections.lodging, fallbackRecord.sections.lodging),
  };
  const normalizedSectionOrder = Array.isArray(invitation.sections_order)
    ? invitation.sections_order.filter((value): value is InvitationRecord["sections_order"][number] => typeof value === "string")
    : DEFAULT_SECTION_ORDER;

  return {
    ...fallbackRecord,
    ...invitation,
    background: normalizeInvitationBackground(invitation.background || storedBackground),
    sections_order: normalizedSectionOrder,
    sections: normalizedSections,
  };
}

export function toDatabaseInvitationRecord(invitation: InvitationRecord) {
  const normalized = normalizeInvitationRecord(invitation);
  const { background, ...rest } = normalized;

  return {
    ...rest,
    sections: {
      ...normalized.sections,
      [INVITATION_BACKGROUND_STORAGE_KEY]: background,
    },
  };
}
