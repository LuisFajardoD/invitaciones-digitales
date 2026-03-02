"use client";

import { useState } from "react";
import { buildCalendarDataUri } from "@/lib/utils";
import type { InvitationRecord, QuickActionsSectionData } from "@/types/invitations";

type QuickActionsSectionProps = {
  data: QuickActionsSectionData;
  invitation: InvitationRecord;
};

export function QuickActionsSection({ data, invitation }: QuickActionsSectionProps) {
  const [message, setMessage] = useState("");

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
    if (type === "confirm") {
      document.getElementById("rsvp-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (type === "location") {
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
    <section className="section-shell">
      <p className="eyebrow">Acciones rapidas</p>
      <div className="quick-grid">
        {data.items.map((item) => (
          <button
            type="button"
            key={item.type}
            className="button-secondary quick-button"
            onClick={() => handleAction(item.type)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {message ? <p className="helper-text">{message}</p> : null}
    </section>
  );
}
