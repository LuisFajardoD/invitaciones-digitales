import type { InvitationRecord, RsvpResponse, RsvpSummary } from "@/types/invitations";
import { DEFAULT_WHATSAPP_NUMBER } from "@/lib/constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function createWhatsAppUrl(number?: string, message?: string) {
  const cleanNumber = (number || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
  const text = encodeURIComponent(message || "Hola, quiero cotizar una invitacion digital premium.");
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

export function formatDateLabel(input: string, timezone = "America/Mexico_City") {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(input));
}

export function formatTimeLabel(input: string, timezone = "America/Mexico_City") {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(input));
}

export function formatDateTimeLabel(input: string, timezone = "America/Mexico_City") {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
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
  const attendingCount = responses.filter((item) => item.attending).length;
  const notAttendingCount = responses.filter((item) => !item.attending).length;
  return {
    attendingCount,
    notAttendingCount,
    totalCount: responses.length,
    responses: responses.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  };
}

export function buildCalendarDataUri(invitation: InvitationRecord) {
  const heroTitle = invitation.sections.hero.title || "Invitacion";
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
  const header = ["Fecha", "Nombre", "Asiste", "Acompanantes", "Mensaje"];
  const rows = summary.responses.map((item) => [
    formatDateTimeLabel(item.created_at),
    item.name,
    item.attending ? "Si" : "No",
    item.guests_count?.toString() || "",
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
