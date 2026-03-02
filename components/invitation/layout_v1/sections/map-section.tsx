"use client";

import type { MapSectionData } from "@/types/invitations";

type MapSectionProps = {
  data: MapSectionData;
};

export function MapSection({ data }: MapSectionProps) {
  const { lat, lng, zoom } = data.embed;
  const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

  return (
    <section className="section-shell" id="map-section">
      <p className="eyebrow">Ubicacion</p>
      <h2>Mapa embebido</h2>
      <p className="muted">{data.address_text}</p>
      <iframe title="Mapa del evento" src={src} className="map-frame" loading="lazy" />
      <a href={data.maps_url} className="button-secondary">
        Abrir en Google Maps
      </a>
    </section>
  );
}
