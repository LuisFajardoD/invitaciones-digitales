"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import {
  getButtonHoverMotion,
  getButtonTapMotion,
} from "@/components/invitation/layout_v1/motion";
import { buildCalendarDataUri } from "@/lib/utils";
import type { InvitationRecord, QuickActionsSectionData } from "@/types/invitations";

type QuickActionsSectionProps = {
  data: QuickActionsSectionData;
  invitation: InvitationRecord;
};

export function QuickActionsSection({ data, invitation }: QuickActionsSectionProps) {
  const [message, setMessage] = useState("");
  const reducedMotion = Boolean(useReducedMotion());
  const items = data.items.filter((item) => {
    const actionType = String(item.type);

    if (actionType === "confirm" || actionType === "rsvp") {
      return invitation.sections.rsvp.enabled;
    }
    if (actionType === "location" || actionType === "map") {
      return invitation.sections.map.enabled;
    }
    if (actionType === "calendar") {
      return Boolean(invitation.event_start_at && invitation.sections.hero.title);
    }
    return true;
  });

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: invitation.share.og_title,
        text: invitation.share.og_description,
        url,
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setMessage("Link copiado");
    setTimeout(() => setMessage(""), 2500);
  }

  function handleAction(type: string) {
    if (type === "confirm" || type === "rsvp") {
      document.getElementById("rsvp-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (type === "location" || type === "map") {
      document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (type === "calendar") {
      window.open(buildCalendarDataUri(invitation), "_blank");
      return;
    }
    if (type === "share") {
      void handleShare();
    }
  }

  return (
    <InvitationSectionFrame
      eyebrow="Control de misión"
      title="Acciones rápidas"
      subtitle="Toca un comando y continúa el recorrido."
      tone="gold"
    >
      <div className="quick-grid quick-grid--mission">
        {items.map((item) => (
          <motion.button
            type="button"
            key={`${item.type}-${item.label}`}
            className="mission-button mission-button--ghost quick-button"
            onClick={() => handleAction(String(item.type))}
            whileHover={getButtonHoverMotion(reducedMotion, true)}
            whileTap={getButtonTapMotion(reducedMotion)}
          >
            {item.label}
          </motion.button>
        ))}
      </div>
      {message ? <p className="mission-caption">{message}</p> : null}
    </InvitationSectionFrame>
  );
}
