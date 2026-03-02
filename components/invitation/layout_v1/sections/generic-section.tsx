"use client";

import type { GenericTextSectionData } from "@/types/invitations";

type GenericSectionProps = {
  title: string;
  data: GenericTextSectionData;
};

export function GenericSection({ title, data }: GenericSectionProps) {
  return (
    <section className="section-shell">
      <p className="eyebrow">Extra</p>
      <h2>{data.title || title}</h2>
      {data.text ? <p className="muted">{data.text}</p> : null}
      {data.items?.length ? (
        <div className="notes-list">
          {data.items.map((item) => (
            <div key={item} className="note-card">
              {item}
            </div>
          ))}
        </div>
      ) : null}
      {data.url ? (
        <a href={data.url} className="button-secondary">
          Abrir enlace
        </a>
      ) : null}
    </section>
  );
}
