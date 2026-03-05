"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHome } from "@/components/site/site-home";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import { safeJsonParse } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/invitations";

type SiteSettingsFormProps = {
  initialData: SiteSettingsData;
};

export function SiteSettingsForm({ initialData }: SiteSettingsFormProps) {
  const router = useRouter();
  const safeInitialData = normalizeSiteSettingsData(initialData);
  const [draft, setDraft] = useState<SiteSettingsData>(safeInitialData);
  const [examplesJson, setExamplesJson] = useState(
    JSON.stringify(safeInitialData.blocks.examples.items ?? [], null, 2),
  );
  const [packagesJson, setPackagesJson] = useState(
    JSON.stringify(safeInitialData.blocks.packages.items ?? [], null, 2),
  );
  const [faqJson, setFaqJson] = useState(JSON.stringify(safeInitialData.blocks.faq.items ?? [], null, 2));
  const [extrasText, setExtrasText] = useState((safeInitialData.blocks.extras.items ?? []).join("\n"));
  const [howItWorksText, setHowItWorksText] = useState(
    (safeInitialData.blocks.how_it_works.items ?? []).join("\n"),
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function previewData(): SiteSettingsData {
    return {
      ...draft,
      blocks: {
        ...draft.blocks,
        examples: {
          ...draft.blocks.examples,
          items: safeJsonParse(examplesJson, draft.blocks.examples.items),
        },
        packages: {
          ...draft.blocks.packages,
          items: safeJsonParse(packagesJson, draft.blocks.packages.items),
        },
        faq: {
          ...draft.blocks.faq,
          items: safeJsonParse(faqJson, draft.blocks.faq.items),
        },
        extras: {
          ...draft.blocks.extras,
          items: extrasText.split("\n").map((item) => item.trim()).filter(Boolean),
        },
        how_it_works: {
          ...draft.blocks.how_it_works,
          items: howItWorksText.split("\n").map((item) => item.trim()).filter(Boolean),
        },
      },
    };
  }

  async function handleSave() {
    setLoading(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData()),
      });
      const responsePayload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(responsePayload.error || "No se pudo guardar.");
      }
      setDraft(normalizeSiteSettingsData(previewData()));
      setStatus("Portada guardada.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="two-column">
      <section className="admin-panel">
        <p className="eyebrow">Configuracion del sitio</p>
        <h2>Editar portada</h2>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <label className="field-wide">
            <span>Orden de bloques (separados por coma)</span>
            <input
              value={draft.blocks_order.join(",")}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks_order: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean) as SiteSettingsData["blocks_order"],
                })
              }
            />
          </label>
          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={draft.blocks.hero.enabled}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks: {
                    ...draft.blocks,
                    hero: { ...draft.blocks.hero, enabled: event.target.checked },
                  },
                })
              }
            />
            <span>Hero activo</span>
          </label>
          <label className="field-wide">
            <span>Titulo principal</span>
            <input
              value={draft.blocks.hero.title}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks: {
                    ...draft.blocks,
                    hero: { ...draft.blocks.hero, title: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Subtitulo principal</span>
            <textarea
              value={draft.blocks.hero.subtitle}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks: {
                    ...draft.blocks,
                    hero: { ...draft.blocks.hero, subtitle: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Ejemplos (JSON)</span>
            <textarea value={examplesJson} onChange={(event) => setExamplesJson(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Paquetes (JSON)</span>
            <textarea value={packagesJson} onChange={(event) => setPackagesJson(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Extras (una por linea)</span>
            <textarea value={extrasText} onChange={(event) => setExtrasText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Como funciona (una por linea)</span>
            <textarea value={howItWorksText} onChange={(event) => setHowItWorksText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Preguntas frecuentes (JSON)</span>
            <textarea value={faqJson} onChange={(event) => setFaqJson(event.target.value)} />
          </label>
          <label className="field">
            <span>WhatsApp</span>
            <input
              value={draft.blocks.contact.whatsapp_number}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks: {
                    ...draft.blocks,
                    contact: { ...draft.blocks.contact, whatsapp_number: event.target.value },
                  },
                })
              }
            />
          </label>
          <label className="field-wide">
            <span>Mensaje precargado de WhatsApp</span>
            <textarea
              value={draft.blocks.contact.whatsapp_prefill_text}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  blocks: {
                    ...draft.blocks,
                    contact: {
                      ...draft.blocks.contact,
                      whatsapp_prefill_text: event.target.value,
                    },
                  },
                })
              }
            />
          </label>
        </div>
        <div className="inline-actions" style={{ marginTop: 24 }}>
          <button type="button" className="button-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {status ? <p className="success-text">{status}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </section>
      <section className="admin-panel">
        <p className="eyebrow">Vista previa</p>
        <h2>Inicio /</h2>
        <SiteHome settings={previewData()} />
      </section>
    </div>
  );
}
