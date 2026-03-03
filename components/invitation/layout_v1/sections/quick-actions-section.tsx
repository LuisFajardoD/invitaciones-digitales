"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import { getButtonHoverMotion } from "@/components/invitation/layout_v1/motion";
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

  const primaryItems = useMemo(
    () =>
      items.filter((item) => {
        const actionType = String(item.type);
        return actionType === "confirm" || actionType === "rsvp" || actionType === "location" || actionType === "map";
      }),
    [items],
  );
  const primaryDockItems = primaryItems.slice(0, 2);
  const primaryKeys = new Set(primaryDockItems.map((item) => `${item.type}-${item.label}`));
  const secondaryItems = items.filter((item) => !primaryKeys.has(`${item.type}-${item.label}`));
  const gridItems = secondaryItems.length ? secondaryItems : primaryDockItems.length ? [] : items;

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
    setMessage("Enlace copiado");
    window.setTimeout(() => setMessage(""), 2500);
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
      subtitle="Selecciona un comando y continúa la secuencia."
      tone="gold"
      surface="bare"
    >
      {primaryDockItems.length ? (
        <div className="command-dock" role="group" aria-label="Comandos principales">
          {primaryDockItems.map((item) =>
            renderActionChip({
              item,
              onAction: handleAction,
              reducedMotion,
              emphasis: "primary",
            }),
          )}
        </div>
      ) : null}

      <div className="command-grid" role="group" aria-label="Comandos disponibles">
        {gridItems.map((item) =>
          renderActionChip({
            item,
            onAction: handleAction,
            reducedMotion,
            emphasis: "secondary",
          }),
        )}
      </div>

      {message ? <p className="mission-caption command-feedback">{message}</p> : null}
    </InvitationSectionFrame>
  );
}

type RenderActionChipArgs = {
  item: QuickActionsSectionData["items"][number];
  onAction: (type: string) => void;
  reducedMotion: boolean;
  emphasis: "primary" | "secondary";
};

function renderActionChip({ item, onAction, reducedMotion, emphasis }: RenderActionChipArgs) {
  const actionType = String(item.type);
  const icon = getActionGlyph(actionType);
  const code = getActionCode(actionType);

  return (
    <motion.button
      type="button"
      key={`${item.type}-${item.label}-${emphasis}`}
      className={`command-chip command-chip--${emphasis}`}
      onClick={() => onAction(actionType)}
      whileHover={getButtonHoverMotion(reducedMotion, true)}
      whileTap={
        reducedMotion
          ? undefined
          : {
              scale: 0.98,
              boxShadow: "0 0 0 1px rgba(118, 247, 255, 0.2), 0 0 24px rgba(118, 247, 255, 0.16)",
            }
      }
    >
      <span className="command-chip__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="command-chip__body">
        <span className="command-chip__label">{item.label}</span>
        <span className="command-chip__code">{code}</span>
      </span>
    </motion.button>
  );
}

function getActionCode(type: string) {
  switch (type) {
    case "confirm":
    case "rsvp":
      return "CMD-RSVP";
    case "location":
    case "map":
      return "CMD-MAP";
    case "calendar":
      return "CMD-ICAL";
    case "share":
      return "CMD-LINK";
    default:
      return "CMD-ALT";
  }
}

function getActionGlyph(type: string) {
  switch (type) {
    case "confirm":
    case "rsvp":
      return <RsvpGlyph />;
    case "location":
    case "map":
      return <PinGlyph />;
    case "calendar":
      return <CalendarGlyph />;
    case "share":
      return <ShareGlyph />;
    default:
      return <CommandGlyph />;
  }
}

function RsvpGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 12.5l2.4 2.4L16 9.3M21 12a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />
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

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 12l8-4M8 12l8 4M8 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Zm13-4a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Zm0 8a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z" />
    </svg>
  );
}

function CommandGlyph() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" focusable="false">
      <path d="M8 8h8M8 12h8M8 16h5M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
