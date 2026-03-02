"use client";

import type { NotesSectionData } from "@/types/invitations";

type NotesSectionProps = {
  data: NotesSectionData;
};

export function NotesSection({ data }: NotesSectionProps) {
  return (
    <section className="section-shell">
      <p className="eyebrow">Notas</p>
      <h2>Antes del despegue</h2>
      <div className="notes-list">
        {data.items.map((item) => (
          <div key={item} className="note-card">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
