"use client";

import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { NotesSectionData } from "@/types/invitations";

type NotesSectionProps = {
  data: NotesSectionData;
};

export function NotesSection({ data }: NotesSectionProps) {
  return (
    <InvitationSectionFrame
      eyebrow="Checklist"
      title="Antes del despegue"
      subtitle="Detalles clave para que la mision salga perfecta."
      tone="default"
    >
      <div className="notes-list notes-list--mission">
        {data.items.map((item, index) => (
          <div key={`${item}-${index}`} className="note-card note-card--mission">
            <span className="note-card__index">{String(index + 1).padStart(2, "0")}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </InvitationSectionFrame>
  );
}
