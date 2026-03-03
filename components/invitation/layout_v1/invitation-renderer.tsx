"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
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
import {
  DEFAULT_HERO_BACKGROUND,
  normalizeBackgroundMedia,
  normalizeKenBurns,
  normalizeInvitationRecord,
} from "@/lib/invitation-defaults";
import { usePerfMode } from "@/lib/use-perf-mode";
import { sectionDisplayLabels } from "@/lib/section-labels";
import { optimizeMediaUrl } from "@/lib/utils";
import type {
  BackgroundMediaConfig,
  InvitationRecord,
  KenBurnsConfig,
  SectionKey,
} from "@/types/invitations";

type InvitationRendererProps = {
  invitation: InvitationRecord;
  previewMode?: boolean;
};

const fallbackHeroBackdrop = [
  "radial-gradient(circle at 18% 20%, rgba(118, 247, 255, 0.18), transparent 24%)",
  "radial-gradient(circle at 80% 12%, rgba(248, 201, 75, 0.14), transparent 22%)",
  "linear-gradient(180deg, #020915 0%, #03101f 38%, #061a37 100%)",
].join(", ");

export function InvitationRenderer({ invitation, previewMode = false }: InvitationRendererProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { lowMotion } = usePerfMode();
  const normalized = normalizeInvitationRecord(invitation);
  const fallbackBackdrop = [
    fallbackHeroBackdrop,
    "radial-gradient(circle at 14% 18%, rgba(54, 154, 214, 0.18), transparent 20%)",
    "radial-gradient(circle at 78% 14%, rgba(246, 194, 96, 0.08), transparent 16%)",
  ].join(", ");
  const shellBackground = resolveShellBackground(normalized);
  const shellKenBurns = resolveShellKenBurns(normalized);
  const allowBackgroundMotion = !prefersReducedMotion && !lowMotion;

  return (
    <div className={`invitation-shell${previewMode ? " invitation-shell--preview" : ""}`}>
      <BackgroundMedia
        className="invitation-shell__media"
        config={shellBackground}
        kenburns={shellKenBurns}
        allowMotion={allowBackgroundMotion}
        fallbackBackdrop={fallbackBackdrop}
      />
      {normalized.sections_order.map((key) => {
        const section = normalized.sections[key];
        if (!section || !section.enabled) {
          return null;
        }

        return renderSection(key, normalized, previewMode);
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
      return <MapSection key={key} data={invitation.sections.map} invitation={invitation} />;
    case "gallery":
      return <GallerySection key={key} data={invitation.sections.gallery} />;
    case "notes":
      return <NotesSection key={key} data={invitation.sections.notes} />;
    case "rsvp":
      return <RsvpSection key={key} invitation={invitation} data={invitation.sections.rsvp} previewMode={previewMode} />;
    case "contact":
      return <ContactSection key={key} data={invitation.sections.contact} />;
    default:
      return <GenericSection key={key} title={sectionDisplayLabels[key]} data={invitation.sections[key]} />;
  }
}

function resolveShellBackground(invitation: InvitationRecord): BackgroundMediaConfig {
  if (invitation.background?.mode === "default_app") {
    return DEFAULT_HERO_BACKGROUND;
  }

  if (invitation.background?.mode === "custom") {
    return normalizeBackgroundMedia(invitation.background.custom);
  }

  return normalizeBackgroundMedia(
    invitation.sections.hero.background,
    invitation.sections.hero.background_image_url,
  );
}

function resolveShellKenBurns(invitation: InvitationRecord): KenBurnsConfig {
  if (invitation.background?.mode === "default_app") {
    return normalizeKenBurns();
  }

  return normalizeKenBurns(invitation.background?.kenburns);
}

function BackgroundMedia({
  className,
  config,
  kenburns,
  allowMotion,
  fallbackBackdrop,
}: {
  className: string;
  config: BackgroundMediaConfig;
  kenburns: KenBurnsConfig;
  allowMotion: boolean;
  fallbackBackdrop: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const kenBurnsClassName = getKenBurnsClassName(kenburns, allowMotion);

  if (config.type === "video" && config.video_url) {
    const poster = optimizeMediaUrl(config.poster_url || config.image_url);

    return (
      <div className={className} aria-hidden="true">
        <div className={`invitation-shell__media-frame${kenBurnsClassName}`}>
          <video
            className="invitation-shell__video"
            autoPlay
            loop
            muted
            playsInline
            poster={poster || undefined}
          >
            <source src={config.video_url} />
          </video>
        </div>
      </div>
    );
  }

  if (config.type === "image" && config.image_url && !imageFailed) {
    return (
      <div
        className={className}
        aria-hidden="true"
      >
        <div className={`invitation-shell__media-frame${kenBurnsClassName}`}>
          <img
            className="invitation-shell__media-image"
            src={optimizeMediaUrl(config.image_url)}
            alt=""
            aria-hidden="true"
            loading="eager"
            onError={() => setImageFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <div className="invitation-shell__media-frame" style={{ backgroundImage: fallbackBackdrop }} />
    </div>
  );
}

function getKenBurnsClassName(kenburns: KenBurnsConfig, allowMotion: boolean) {
  if (!allowMotion || !kenburns.enabled) {
    return "";
  }

  return ` invitation-shell__media-frame--kenburns invitation-shell__media-frame--kenburns-${kenburns.strength}`;
}
