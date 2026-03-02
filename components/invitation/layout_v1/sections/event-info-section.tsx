"use client";

import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import type { EventInfoSectionData, InvitationRecord } from "@/types/invitations";

type EventInfoSectionProps = {
  data: EventInfoSectionData;
  invitation: InvitationRecord;
};

export function EventInfoSection({ data, invitation }: EventInfoSectionProps) {
  return (
    <section className="section-shell">
      <p className="eyebrow">Datos del evento</p>
      <h2>{data.venue_name}</h2>
      <div className="event-grid">
        <div className="event-chip">
          <strong>{data.weekday_text || formatDateLabel(invitation.event_start_at, invitation.timezone)}</strong>
          <p className="muted">{data.date_text}</p>
        </div>
        <div className="event-chip">
          <strong>{data.time_text || formatTimeLabel(invitation.event_start_at, invitation.timezone)}</strong>
          <p className="muted">Hora de llegada</p>
        </div>
        <div className="event-chip">
          <strong>{data.venue_name}</strong>
          <p className="muted">{data.address_text}</p>
        </div>
      </div>
    </section>
  );
}
