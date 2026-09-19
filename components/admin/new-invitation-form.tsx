"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { InvitationTemplateRecord, ThemeRecord } from "@/types/invitations";

type NewInvitationFormProps = {
  themes: ThemeRecord[];
  templates: InvitationTemplateRecord[];
};

export function NewInvitationForm({ themes, templates }: NewInvitationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDemoParam = searchParams.get("fromDemo") || "";
  const isDemo = searchParams.get("mode") === "demo";

  const [slug, setSlug] = useState(isDemo ? "nuevo-demo" : "nueva-invitacion");
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

  useEffect(() => {
    if (fromDemoParam && templates.length > 0) {
      const matched = templates.find(
        (t) => t.id === fromDemoParam || t.slug === fromDemoParam
      );
      if (matched) {
        setTemplateId(matched.id);
        const cleanSlug = (matched.slug || matched.id).replace(/^demo-/, "");
        setSlug(`${cleanSlug}-cliente`);
        if (matched.theme_id) {
          setThemeId(matched.theme_id);
        }
      }
    }
  }, [fromDemoParam, templates]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = !isDemo && templateId ? "/api/admin/invitations/from-template" : "/api/admin/invitations";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: templateId || undefined,
          mode: isDemo ? "demo" : undefined,
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
    <section className="admin-panel" style={{ maxWidth: "840px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a78bfa" }}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <p className="eyebrow" style={{ margin: 0 }}>{isDemo ? "Nuevo Demo" : "Nueva Invitación de Cliente"}</p>
      </div>

      <h2>{isDemo ? "Crear Borrador de Demo" : "Crear Borrador de Invitación"}</h2>
      <p className="helper-text">
        {isDemo
          ? "Configura los datos iniciales para el nuevo demo. Podrás modificar el contenido detallado después."
          : "Completa la información técnica del evento para abrir el editor de contenido personalizado."}
      </p>

      {!isDemo && selectedTemplate ? (
        <div className="admin-subpanel" style={{ marginTop: 16, borderColor: "rgba(139, 92, 246, 0.4)", background: "rgba(139, 92, 246, 0.08)", borderRadius: "14px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <div>
              <strong style={{ color: "#c4b5fd" }}>Basada en el Demo Master: {selectedTemplate.name}</strong>
              <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--admin-text-soft)" }}>
                Se duplicará la plantilla demo para este cliente. El demo original no se modificará.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 20 }}>
        {!isDemo && (
          <label className="field-wide">
            <span>Base de partida (Demo)</span>
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">Sin plantilla (desde cero / tema base)</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.slug})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field">
          <span>Slug público de la invitación</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="ej. boda-luis-y-maria"
            required
          />
        </label>

        <label className="field">
          <span>Tema visual</span>
          <select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Fecha y hora del evento</span>
          <input
            type="datetime-local"
            value={eventAt}
            onChange={(event) => setEventAt(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Lugar / Salón</span>
          <input value={venueName} onChange={(event) => setVenueName(event.target.value)} required />
        </label>

        <label className="field-wide">
          <span>Dirección completa</span>
          <input
            value={addressText}
            onChange={(event) => setAddressText(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Latitud mapa</span>
          <input value={lat} onChange={(event) => setLat(event.target.value)} required />
        </label>

        <label className="field">
          <span>Longitud mapa</span>
          <input value={lng} onChange={(event) => setLng(event.target.value)} required />
        </label>

        <div className="field-wide" style={{ marginTop: 12 }}>
          <button type="submit" className="button-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading
              ? "Creando..."
              : isDemo
              ? "Crear Demo y abrir editor"
              : templateId
              ? "Crear Invitación desde Demo y abrir editor"
              : "Guardar borrador y abrir editor"}
          </button>
        </div>

        {error ? <p className="error-text field-wide">{error}</p> : null}
      </form>
    </section>
  );
}
