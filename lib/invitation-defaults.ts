import type {
  BackgroundMediaConfig,
  HeroAstronautConfig,
  InvitationBackgroundConfig,
  InvitationRecord,
  InvitationSections,
  KenBurnsConfig,
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
  const rawSections = invitation.sections as InvitationSections & Record<string, unknown>;
  const storedBackground = rawSections[INVITATION_BACKGROUND_STORAGE_KEY] as InvitationBackgroundConfig | undefined;
  const hero = invitation.sections.hero;

  return {
    ...invitation,
    background: normalizeInvitationBackground(invitation.background || storedBackground),
    sections: {
      ...invitation.sections,
      hero: {
        ...hero,
        background: normalizeBackgroundMedia(hero.background, hero.background_image_url),
        astronaut: normalizeHeroAstronaut(hero.astronaut),
      },
      map: {
        ...invitation.sections.map,
        dark:
          typeof invitation.sections.map.dark === "boolean" ? invitation.sections.map.dark : null,
      },
    },
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
