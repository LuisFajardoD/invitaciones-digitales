"use client";

import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import type { EventInfoSectionData, InvitationRecord } from "@/types/invitations";

type EventInfoSectionProps = {
  data: EventInfoSectionData;
  invitation: InvitationRecord;
};

export function EventInfoSection({ data, invitation }: EventInfoSectionProps) {
  const eventDateLabel = buildEventDateLabel(data, invitation);
  const arrivalTimeLabel = buildArrivalTimeLabel(invitation);
  const addressLines = splitAddressLines(data.address_text);

  return (
    <InvitationSectionFrame
      eyebrow="Bitácora de misión"
      title={data.venue_name}
      subtitle="Todo listo para el punto de encuentro."
      tone="aurora"
      surface="bare"
    >
      <div className="mission-log mission-log--hud">
        <div className="mission-log__frame">
          <div className="mission-log__status" aria-label="Estado de enlace">
            <span className="mission-log__status-dot" />
            <span className="mission-log__status-label">SYNC OK</span>
          </div>
          <div className="mission-log__rows">
            <div className="mission-log__row">
              <span className="mission-log__icon" aria-hidden="true">
                <CalendarGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value">{eventDateLabel}</strong>
                <span className="mission-log__label">Fecha de despegue</span>
              </div>
              <span className="mission-log__meta">LOG-01</span>
            </div>

            <div className="mission-log__row">
              <span className="mission-log__icon" aria-hidden="true">
                <ClockGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value">{arrivalTimeLabel}</strong>
                <span className="mission-log__label">Hora de llegada</span>
              </div>
              <span className="mission-log__meta">T-00:00</span>
            </div>

            <div className="mission-log__row mission-log__row--address">
              <span className="mission-log__icon" aria-hidden="true">
                <PinGlyph />
              </span>
              <div className="mission-log__content">
                <strong className="mission-log__value mission-log__value--address">
                  {addressLines[0]}
                  {addressLines[1] ? (
                    <span className="mission-log__value-line">{addressLines[1]}</span>
                  ) : null}
                </strong>
                <span className="mission-log__label">Punto de encuentro</span>
              </div>
              <span className="mission-log__meta">COORD</span>
            </div>
          </div>
        </div>
      </div>
    </InvitationSectionFrame>
  );
}

function buildEventDateLabel(data: EventInfoSectionData, invitation: InvitationRecord) {
  const eventDate = new Date(invitation.event_start_at);
  const fallbackDate = formatDateLabel(invitation.event_start_at, invitation.timezone);
  const baseDateText = (data.date_text || "").trim();
  const weekday = (data.weekday_text || fallbackDate).trim();
  const hasExplicitYear = /\b\d{4}\b/.test(baseDateText);
  const year = Number.isNaN(eventDate.getTime()) || hasExplicitYear ? "" : ` de ${eventDate.getFullYear()}`;

  return [weekday, `${baseDateText}${year}`.trim()].filter(Boolean).join(" ").trim();
}

function buildArrivalTimeLabel(invitation: InvitationRecord) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: invitation.timezone || "America/Mexico_City",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(invitation.event_start_at));
  } catch {
    return formatTimeLabel(invitation.event_start_at, invitation.timezone)
      .replace("a. m.", "AM")
      .replace("p. m.", "PM")
      .replace("a. m", "AM")
      .replace("p. m", "PM");
  }
}

function splitAddressLines(address: string) {
  const clean = address.trim();
  const splitIndex = clean.indexOf(",");

  if (splitIndex === -1) {
    return [clean];
  }

  return [clean.slice(0, splitIndex + 1).trim(), clean.slice(splitIndex + 1).trim()];
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function PinGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}
