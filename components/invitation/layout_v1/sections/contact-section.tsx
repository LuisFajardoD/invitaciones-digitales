"use client";

import { createWhatsAppUrl } from "@/lib/utils";
import type { ContactSectionData } from "@/types/invitations";

type ContactSectionProps = {
  data: ContactSectionData;
};

export function ContactSection({ data }: ContactSectionProps) {
  return (
    <section className="section-shell">
      <p className="eyebrow">Contacto</p>
      <h2>{data.name}</h2>
      <p className="muted">{data.label}</p>
      <a
        href={data.whatsapp_url || createWhatsAppUrl(data.whatsapp_number)}
        className="button-primary"
      >
        WhatsApp
      </a>
    </section>
  );
}
