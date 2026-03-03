"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  getButtonHoverMotion,
  getButtonTapMotion,
} from "@/components/invitation/layout_v1/motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import { cn } from "@/lib/utils";
import type { InvitationRecord, MapSectionData } from "@/types/invitations";

type MapSectionProps = {
  data: MapSectionData;
  invitation: InvitationRecord;
};

export function MapSection({ data, invitation }: MapSectionProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const { lat, lng, zoom } = data.embed;
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  const shouldUseDarkMap = typeof data.dark === "boolean" ? data.dark : invitation.theme_id === "astronautas";

  return (
    <InvitationSectionFrame
      id="map-section"
      eyebrow="Ruta estelar"
      title="Ubicacion"
      subtitle={data.address_text}
      tone="aurora"
    >
      <div className="mission-map-shell">
        <iframe
          title="Mapa del evento"
          src={src}
          className={cn("map-frame", "map-frame--mission", shouldUseDarkMap && "map-frame--dark")}
          loading="lazy"
        />
      </div>
      <motion.a
        href={data.maps_url}
        className="mission-button mission-button--ghost"
        whileHover={getButtonHoverMotion(reducedMotion, true)}
        whileTap={getButtonTapMotion(reducedMotion)}
      >
        Abrir en Google Maps
      </motion.a>
    </InvitationSectionFrame>
  );
}
