"use client";

import type { GallerySectionData } from "@/types/invitations";

type GallerySectionProps = {
  data: GallerySectionData;
};

export function GallerySection({ data }: GallerySectionProps) {
  return (
    <section className="section-shell">
      <p className="eyebrow">Galeria</p>
      <h2>Momentos de la mision</h2>
      <div className="gallery-grid">
        {data.image_urls.slice(0, data.max_images).map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="gallery-tile"
            style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(3, 17, 42, 0.4)), url(${url})` }}
          />
        ))}
      </div>
    </section>
  );
}
