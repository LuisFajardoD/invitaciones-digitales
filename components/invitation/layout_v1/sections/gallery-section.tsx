"use client";

import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { GallerySectionData } from "@/types/invitations";

type GallerySectionProps = {
  data: GallerySectionData;
};

export function GallerySection({ data }: GallerySectionProps) {
  const images = data.image_urls?.slice(0, data.max_images) || [];

  return (
    <InvitationSectionFrame
      eyebrow="Archivo visual"
      title="Momentos de la mision"
      subtitle="Espacio reservado para tus fotos favoritas."
      tone="gold"
    >
      <div className="gallery-grid gallery-grid--mission">
        {images.length
          ? images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="gallery-tile gallery-tile--mission"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent, rgba(3, 17, 42, 0.4)), url(${url})`,
                }}
              />
            ))
          : Array.from({ length: 3 }).map((_, index) => (
              <div key={`placeholder-${index}`} className="gallery-tile gallery-tile--placeholder">
                <span>Placeholder {index + 1}</span>
              </div>
            ))}
      </div>
      {!images.length ? (
        <p className="mission-caption">
          Placeholder activo: reemplaza estos bloques con el arte final cuando cargues assets reales.
        </p>
      ) : null}
    </InvitationSectionFrame>
  );
}
