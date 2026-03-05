import { resolveBackendOrigin } from "../../shared/origins";
import type { BackgroundMediaConfig, InvitationRecord, KenBurnsConfig } from "./viewer-types";

function getConfiguredBackendOrigin() {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "";
  }

  return "";
}

export function getSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/i\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function getViewerRoute(pathname: string, search: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  const adminLoginMatch = normalizedPath.match(/^\/admin(?:\/login)?$/);
  if (adminLoginMatch) {
    return {
      slug: "",
      mode: "admin-login" as const,
      token: "",
      id: "",
    };
  }

  const adminNewMatch = normalizedPath.match(/^\/admin\/invitations\/new$/);
  if (adminNewMatch) {
    return {
      slug: "",
      mode: "admin-new" as const,
      token: "",
      id: "",
    };
  }

  const adminEditorMatch = normalizedPath.match(/^\/admin\/invitations\/([^/]+)$/);
  if (adminEditorMatch) {
    return {
      slug: "",
      mode: "admin-editor" as const,
      token: "",
      id: decodeURIComponent(adminEditorMatch[1]),
    };
  }

  const adminListMatch = normalizedPath.match(/^\/admin\/invitations$/);
  if (adminListMatch) {
    return {
      slug: "",
      mode: "admin-list" as const,
      token: "",
      id: "",
    };
  }

  const invitationMatch = normalizedPath.match(/^\/i\/([^/]+)$/);
  if (invitationMatch) {
    return {
      slug: decodeURIComponent(invitationMatch[1]),
      mode: "invitation" as const,
      token: "",
      id: "",
    };
  }

  const clientRsvpMatch = normalizedPath.match(/^\/i\/([^/]+)\/rsvp$/);
  if (clientRsvpMatch) {
    return {
      slug: decodeURIComponent(clientRsvpMatch[1]),
      mode: "client-rsvp" as const,
      token: new URLSearchParams(search).get("token")?.trim() || "",
      id: "",
    };
  }

  if (normalizedPath.startsWith("/admin")) {
    return {
      slug: "",
      mode: "admin-login" as const,
      token: "",
      id: "",
    };
  }

  return {
    slug: "",
    mode: "unknown" as const,
    token: "",
    id: "",
  };
}

export function getBackendAssetOrigin() {
  return resolveBackendOrigin(window.location, getConfiguredBackendOrigin());
}

export function resolveMediaUrl(url: string, assetOrigin: string) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${assetOrigin}${url}`;
  }

  return url;
}

export function splitTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return [title.trim()];
  }

  const firstLine = words.slice(0, 2).join(" ");
  const remaining = words.slice(2);

  if (remaining.length <= 2) {
    return [firstLine, remaining.join(" ")];
  }

  if (remaining.length === 3) {
    return [firstLine, remaining.slice(0, 2).join(" "), remaining.slice(2).join(" ")];
  }

  const targetLength = Math.ceil(remaining.join(" ").length / 2);
  const secondLineWords: string[] = [];
  let currentLength = 0;

  for (const word of remaining) {
    const nextLength = currentLength + word.length + (secondLineWords.length ? 1 : 0);
    if (secondLineWords.length && nextLength > targetLength) {
      break;
    }

    secondLineWords.push(word);
    currentLength = nextLength;
  }

  const thirdLineWords = remaining.slice(secondLineWords.length);

  if (!thirdLineWords.length) {
    return [firstLine, secondLineWords.join(" ")];
  }

  return [firstLine, secondLineWords.join(" "), thirdLineWords.join(" ")];
}

export function resolveBackground(invitation: InvitationRecord) {
  const hero = invitation.sections.hero;
  const background = hero.background;

  if (background?.type === "image" && background.image_url) {
    return background.image_url;
  }

  return hero.background_image_url || "";
}

export function resolveShellBackground(invitation: InvitationRecord): BackgroundMediaConfig {
  if (!invitation.background || invitation.background.mode === "default_app") {
    return {
      type: "default",
      image_url: "",
      video_url: "",
      poster_url: "",
    };
  }

  if (invitation.background.mode === "custom") {
    return {
      ...invitation.background.custom,
      kenburns: invitation.background.kenburns,
    };
  }

  return {
    type: invitation.sections.hero.background?.type || (invitation.sections.hero.background_image_url ? "image" : "default"),
    image_url: invitation.sections.hero.background?.image_url || invitation.sections.hero.background_image_url || "",
    video_url: invitation.sections.hero.background?.video_url || "",
    poster_url: invitation.sections.hero.background?.poster_url || "",
    kenburns: invitation.background.kenburns,
  };
}

export function resolveHeroBackground(invitation: InvitationRecord): BackgroundMediaConfig {
  return {
    type: invitation.sections.hero.background?.type || (invitation.sections.hero.background_image_url ? "image" : "default"),
    image_url: invitation.sections.hero.background?.image_url || invitation.sections.hero.background_image_url || "",
    video_url: invitation.sections.hero.background?.video_url || "",
    poster_url: invitation.sections.hero.background?.poster_url || "",
    kenburns: invitation.sections.hero.background?.kenburns,
  };
}

export function normalizeKenBurns(config?: KenBurnsConfig): KenBurnsConfig {
  return {
    enabled: Boolean(config?.enabled),
    strength: config?.strength || "medium",
  };
}

function toCalendarStamp(input: string) {
  return new Date(input).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildGoogleCalendarUrl(invitation: InvitationRecord) {
  const start = new Date(invitation.event_start_at);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const title = invitation.sections.hero.title || "Invitacion";
  const details = invitation.sections.hero.subtitle || "";
  const location = `${invitation.sections.event_info.venue_name} ${invitation.sections.event_info.address_text}`.trim();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details,
    location,
    dates: `${toCalendarStamp(start.toISOString())}/${toCalendarStamp(end.toISOString())}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getCountdown(targetAt: string) {
  const diff = Math.max(0, new Date(targetAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Dias", value: days },
    { label: "Horas", value: hours },
    { label: "Min", value: minutes },
    { label: "Seg", value: seconds },
  ];
}

export function trimList(items?: string[]) {
  return (items || []).map((item) => item.trim()).filter(Boolean);
}

