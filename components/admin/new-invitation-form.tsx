"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { InvitationTemplateRecord, ThemeRecord } from "@/types/invitations";

type NewInvitationFormProps = {
  themes: ThemeRecord[];
  templates: InvitationTemplateRecord[];
};

export function NewInvitationForm({ themes, templates }: NewInvitationFormProps) {
  const router = useRouter();
  const [slug, setSlug] = useState("nueva-invitacion");
  const [themeId, setThemeId] = useState(themes[0]?.id || "astronautas");
  const [templateId, setTemplateId] = useState("");
  const [eventAt, setEventAt] = useState("2026-04-18T11:00");
  const [venueName, setVenueName] = useState("Jardín del Valle");
  const [addressText, setAddressText] = useState(
    "Cda. Tlalimaya 25, San Andrés Ahuayucan, Xochimilco, 16880, CDMX",
  );
  const [lat, setLat] = useState("19.220703435663584");
  const [lng, setLng] = useState("-99.10241678480557");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = templateId ? "/api/admin/invitations/from-template" : "/api/admin/invitations";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: templateId || undefined,
          slug,
          theme_id: themeId,
          event_start_at: eventAt,
          venue_name: venueName,
          address_text: addressText,
          lat: Number(lat),
          lng: Number(lng),
        }),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "No se pudo crear la invitación.");
      }
      router.push(`/admin/invitations/${payload.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la invitación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-panel">
      <p className="eyebrow">Nueva invitación</p>
      <h2>Crear borrador</h2>
      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 18 }}>
        <label className="field-wide">
          <span>Base de partida</span>
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">Sin plantilla (desde demo base)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        {templateId ? (
          <p className="helper-text field-wide">
            La invitación se creará desde plantilla y conservará estructura/secciones del origen.
          </p>
        ) : null}
        <label className="field">
          <span>Slug público</span>
          <input value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </label>
        <label className="field">
          <span>Tema</span>
          <select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Fecha / hora del evento</span>
          <input
            type="datetime-local"
            value={eventAt}
            onChange={(event) => setEventAt(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Lugar</span>
          <input value={venueName} onChange={(event) => setVenueName(event.target.value)} required />
        </label>
        <label className="field-wide">
          <span>Dirección</span>
          <input
            value={addressText}
            onChange={(event) => setAddressText(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Latitud</span>
          <input value={lat} onChange={(event) => setLat(event.target.value)} required />
        </label>
        <label className="field">
          <span>Longitud</span>
          <input value={lng} onChange={(event) => setLng(event.target.value)} required />
        </label>
        <div className="field-wide">
          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? "Creando..." : templateId ? "Crear desde plantilla y abrir editor" : "Guardar y abrir editor"}
          </button>
        </div>
        {error ? <p className="error-text field-wide">{error}</p> : null}
      </form>
    </section>
  );
}
