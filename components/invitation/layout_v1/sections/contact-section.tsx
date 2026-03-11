"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  getButtonHoverMotion,
  getButtonTapMotion,
} from "@/components/invitation/layout_v1/motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import { createWhatsAppUrl } from "@/lib/utils";
import type { ContactSectionData } from "@/types/invitations";

type ContactSectionProps = {
  data: ContactSectionData;
};

export function ContactSection({ data }: ContactSectionProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <InvitationSectionFrame
      eyebrow="Canal directo"
      title={data.name}
      subtitle={data.label}
      tone="gold"
    >
      <div className="contact-command">
        <div className="contact-command__badge">COMMS</div>
        <div>
          <strong>{data.whatsapp_number}</strong>
          <p className="mission-caption">Si necesitas ayuda antes del evento, escríbeme aquí.</p>
        </div>
      </div>
      <motion.a
        href={data.whatsapp_url || createWhatsAppUrl(data.whatsapp_number)}
        className="mission-button"
        whileHover={getButtonHoverMotion(reducedMotion)}
        whileTap={getButtonTapMotion(reducedMotion)}
      >
        Abrir WhatsApp
      </motion.a>
    </InvitationSectionFrame>
  );
}
