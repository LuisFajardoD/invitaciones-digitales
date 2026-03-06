import type { InvitationRecord, RsvpResponse, RsvpSummary } from "@/types/invitations";
import { DEFAULT_WHATSAPP_NUMBER } from "@/lib/constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function createWhatsAppUrl(number?: string, message?: string) {
  const cleanNumber = (number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
  const text = encodeURIComponent(message || "Hola, quiero cotizar una invitación digital premium.");
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

export function optimizeMediaUrl(url?: string, width = 1200) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("images.unsplash.com")) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

export function formatDateLabel(input: string, timezone = "America/Mexico_City") {
  return formatDateWithFallback(
    input,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    timezone,
  );
}

export function formatTimeLabel(input: string, timezone = "America/Mexico_City") {
  return formatDateWithFallback(
    input,
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
    timezone,
  );
}

export function formatDateTimeLabel(input: string, timezone = "America/Mexico_City") {
  return formatDateWithFallback(
    input,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
    timezone,
  );
}

export function isPast(input: string) {
  return new Date().getTime() > new Date(input).getTime();
}

export function isWithinRange(now: Date, from?: string, to?: string) {
  const nowMs = now.getTime();
  const fromMs = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
  const toMs = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY;
  return nowMs >= fromMs && nowMs <= toMs;
}

export function toLocalDatetimeValue(input: string) {
  const date = new Date(input);
  const pad = (value: number) => String(value).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function fromLocalDatetimeValue(input: string) {
  return new Date(input).toISOString();
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function buildRsvpSummary(responses: RsvpResponse[]): RsvpSummary {
  const sortedResponses = [...responses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const latestByGuest = new Map<string, RsvpResponse>();
  for (const response of sortedResponses) {
    const guestKey = normalizeGuestKey(response.name);
    if (!latestByGuest.has(guestKey)) {
      latestByGuest.set(guestKey, response);
    }
  }

  const latestResponses = Array.from(latestByGuest.values());
  const attendingCount = latestResponses
    .filter((item) => item.attending)
    .reduce((total, item) => total + getAttendeeCount(item), 0);
  const notAttendingCount = latestResponses
    .filter((item) => !item.attending)
    .reduce((total, item) => total + getAttendeeCount(item), 0);

  return {
    attendingCount,
    notAttendingCount,
    totalCount: attendingCount + notAttendingCount,
    responses: sortedResponses,
  };
}

function getAttendeeCount(response: Pick<RsvpResponse, "guests_count">) {
  const numericValue = Number(response.guests_count);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return Math.trunc(numericValue);
  }

  return 1;
}

function normalizeGuestKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCalendarDataUri(invitation: InvitationRecord) {
  const heroTitle = invitation.sections.hero.title || "Invitación";
  const venue = invitation.sections.event_info.venue_name || "Evento";
  const address = invitation.sections.event_info.address_text || "";
  const start = toIcsDate(invitation.event_start_at);
  const end = toIcsDate(
    new Date(new Date(invitation.event_start_at).getTime() + 2 * 60 * 60 * 1000).toISOString(),
  );
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitaciones Digitales//ES",
    "BEGIN:VEVENT",
    `UID:${invitation.id}@invitaciones-digitales`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(heroTitle)}`,
    `LOCATION:${escapeIcs(`${venue} ${address}`.trim())}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function toIcsDate(input: string) {
  return new Date(input).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(input: string) {
  return input.replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function serializeCsv(summary: RsvpSummary) {
  const header = ["Fecha", "Invitado/Familia", "Estado", "Asistentes", "Mensaje"];
  const rows = summary.responses.map((item) => [
    formatDateTimeLabel(item.created_at),
    item.name,
    item.attending ? "Asiste" : "No asiste",
    String(getAttendeeCount(item)),
    item.message || "",
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateWithFallback(
  input: string,
  options: Intl.DateTimeFormatOptions,
  timezone = "America/Mexico_City",
) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "Fecha pendiente";
  }

  try {
    return new Intl.DateTimeFormat("es-MX", {
      ...options,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es-MX", options).format(date);
  }
}
