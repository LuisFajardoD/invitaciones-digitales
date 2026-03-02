"use client";

import { ContactSection } from "@/components/invitation/layout_v1/sections/contact-section";
import { CountdownSection } from "@/components/invitation/layout_v1/sections/countdown-section";
import { EventInfoSection } from "@/components/invitation/layout_v1/sections/event-info-section";
import { GallerySection } from "@/components/invitation/layout_v1/sections/gallery-section";
import { GenericSection } from "@/components/invitation/layout_v1/sections/generic-section";
import { HeroSection } from "@/components/invitation/layout_v1/sections/hero-section";
import { MapSection } from "@/components/invitation/layout_v1/sections/map-section";
import { NotesSection } from "@/components/invitation/layout_v1/sections/notes-section";
import { QuickActionsSection } from "@/components/invitation/layout_v1/sections/quick-actions-section";
import { RsvpSection } from "@/components/invitation/layout_v1/sections/rsvp-section";
import type { InvitationRecord, SectionKey } from "@/types/invitations";

type InvitationRendererProps = {
  invitation: InvitationRecord;
  previewMode?: boolean;
};

export function InvitationRenderer({ invitation, previewMode = false }: InvitationRendererProps) {
  return (
    <div className="invitation-shell">
      <div className="invitation-shell__nebula invitation-shell__nebula--one" />
      <div className="invitation-shell__nebula invitation-shell__nebula--two" />
      {invitation.sections_order.map((key) => {
        const section = invitation.sections[key];
        if (!section || !section.enabled) {
          return null;
        }

        return renderSection(key, invitation, previewMode);
      })}
    </div>
  );
}

function renderSection(key: SectionKey, invitation: InvitationRecord, previewMode: boolean) {
  switch (key) {
    case "hero":
      return (
        <HeroSection
          key={key}
          data={invitation.sections.hero}
          invitation={invitation}
          previewMode={previewMode}
        />
      );
    case "event_info":
      return <EventInfoSection key={key} data={invitation.sections.event_info} invitation={invitation} />;
    case "quick_actions":
      return <QuickActionsSection key={key} data={invitation.sections.quick_actions} invitation={invitation} />;
    case "countdown":
      return <CountdownSection key={key} data={invitation.sections.countdown} />;
    case "map":
      return <MapSection key={key} data={invitation.sections.map} />;
    case "gallery":
      return <GallerySection key={key} data={invitation.sections.gallery} />;
    case "notes":
      return <NotesSection key={key} data={invitation.sections.notes} />;
    case "rsvp":
      return <RsvpSection key={key} invitation={invitation} data={invitation.sections.rsvp} previewMode={previewMode} />;
    case "contact":
      return <ContactSection key={key} data={invitation.sections.contact} />;
    default:
      return <GenericSection key={key} title={key} data={invitation.sections[key]} />;
  }
}
