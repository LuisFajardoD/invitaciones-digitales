"use client";

import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import type { EventInfoSectionData, InvitationRecord } from "@/types/invitations";

type EventInfoSectionProps = {
  data: EventInfoSectionData;
  invitation: InvitationRecord;
};

export function EventInfoSection({ data, invitation }: EventInfoSectionProps) {
  return (
    <InvitationSectionFrame
      eyebrow="Bitacora"
      title={data.venue_name}
      subtitle="Todo listo para el punto de encuentro."
      tone="aurora"
    >
      <div className="event-grid event-grid--mission">
        <div className="event-chip event-chip--organic">
          <strong>{data.weekday_text || formatDateLabel(invitation.event_start_at, invitation.timezone)}</strong>
          <p className="mission-caption">{data.date_text}</p>
        </div>
        <div className="event-chip event-chip--organic">
          <strong>{data.time_text || formatTimeLabel(invitation.event_start_at, invitation.timezone)}</strong>
          <p className="mission-caption">Hora de llegada</p>
        </div>
        <div className="event-chip event-chip--organic">
          <strong>{data.venue_name}</strong>
          <p className="mission-caption">{data.address_text}</p>
        </div>
      </div>
    </InvitationSectionFrame>
  );
}
