export type InvitationOgImageOverride = {
  path: string;
  width: number;
  height: number;
  type: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
  version: string;
};

const INVITATION_OG_IMAGE_OVERRIDES: Record<string, InvitationOgImageOverride> = {
  "cumple-5-julieta-mabell": {
    path: "/assets/sirenas/julieta-og-v1.jpg",
    width: 1080,
    height: 1350,
    type: "image/jpeg",
    version: "20260602-julieta-og-v1",
  },
};

const RSVP_OG_IMAGE_OVERRIDES: Record<string, InvitationOgImageOverride> = {
  "cumple-5-julieta-mabell": {
    path: "/assets/sirenas/rsvp-og-v1.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    version: "20260602-rsvp-og-v1",
  },
};

export function getInvitationOgImageOverride(slug: string) {
  return INVITATION_OG_IMAGE_OVERRIDES[slug] ?? null;
}

export function getRsvpOgImageOverride(slug: string) {
  return RSVP_OG_IMAGE_OVERRIDES[slug] ?? null;
}

export function buildVersionedOgImagePath(image: InvitationOgImageOverride) {
  const separator = image.path.includes("?") ? "&" : "?";
  return `${image.path}${separator}v=${encodeURIComponent(image.version)}`;
}
