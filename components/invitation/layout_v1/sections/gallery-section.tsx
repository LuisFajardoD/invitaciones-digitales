"use client";

import { useEffect, useState } from "react";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { GallerySectionData } from "@/types/invitations";

type GallerySectionProps = {
  data: GallerySectionData;
};

export function GallerySection({ data }: GallerySectionProps) {
  const images = data.image_urls?.slice(0, data.max_images) || [];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      <InvitationSectionFrame
        eyebrow="Archivo visual"
        title="Momentos especiales"
        tone="gold"
      >
        <div className="gallery-grid gallery-grid--mission">
          {images.length
            ? images.map((url, index) => (
                <GalleryTile
                  key={`${url}-${index}`}
                  url={url}
                  index={index}
                  onOpen={() => setSelectedImage(url)}
                />
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div key={`placeholder-${index}`} className="gallery-tile gallery-tile--placeholder">
                  <span>Espacio {index + 1}</span>
                </div>
              ))}
        </div>
        {!images.length ? (
          <p className="mission-caption">
            Espacio temporal activo: reemplaza estos bloques con el arte final cuando cargues recursos reales.
          </p>
        ) : null}
      </InvitationSectionFrame>

      {selectedImage ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Vista completa de imagen"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="gallery-lightbox__close"
            aria-label="Cerrar imagen"
            onClick={() => setSelectedImage(null)}
          >
            Cerrar
          </button>
          <div className="gallery-lightbox__panel" onClick={(event) => event.stopPropagation()}>
            <img src={selectedImage} alt="" className="gallery-lightbox__image" />
          </div>
        </div>
      ) : null}
    </>
  );
}

type GalleryTileProps = {
  url: string;
  index: number;
  onOpen: () => void;
};

function GalleryTile({ url, index, onOpen }: GalleryTileProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <button
      type="button"
      className="gallery-tile gallery-tile--mission gallery-tile-button"
      onClick={onOpen}
      aria-label={`Abrir imagen ${index + 1}`}
    >
      <img
        src={url}
        alt=""
        className="gallery-tile__media"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </button>
  );
}
