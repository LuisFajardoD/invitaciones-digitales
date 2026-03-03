"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  getButtonHoverMotion,
  getButtonTapMotion,
} from "@/components/invitation/layout_v1/motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { GenericTextSectionData } from "@/types/invitations";

type GenericSectionProps = {
  title: string;
  data: GenericTextSectionData;
};

export function GenericSection({ title, data }: GenericSectionProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const safeTitle = (data.title || "").trim() || title;
  const safeText =
    (data.text || "").trim() || "Informacion adicional para la mision.";
  const items = (data.items || []).map((item) => item.trim()).filter(Boolean);
  const link = (data.url || "").trim();

  return (
    <InvitationSectionFrame
      eyebrow="Modulo extra"
      title={safeTitle}
      subtitle={safeText}
      tone="default"
    >
      {items.length ? (
        <div className="notes-list notes-list--mission">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="note-card note-card--mission">
              <span className="note-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
      {link ? (
        <motion.a
          href={link}
          className="mission-button mission-button--ghost"
          whileHover={getButtonHoverMotion(reducedMotion, true)}
          whileTap={getButtonTapMotion(reducedMotion)}
        >
          Abrir enlace
        </motion.a>
      ) : null}
    </InvitationSectionFrame>
  );
}
