"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHome } from "@/components/site/site-home";
import { safeJsonParse } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/invitations";

type SiteSettingsFormProps = {
  initialData: SiteSettingsData;
};

export function SiteSettingsForm({ initialData }: SiteSettingsFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialData);
  const [examplesJson, setExamplesJson] = useState(JSON.stringify(draft.blocks.examples.items, null, 2));
  const [packagesJson, setPackagesJson] = useState(JSON.stringify(draft.blocks.packages.items, null, 2));
  const [faqJson, setFaqJson] = useState(JSON.stringify(draft.blocks.faq.items, null, 2));
  const [extrasText, setExtrasText] = useState(draft.blocks.extras.items.join("\n"));
  const [howItWorksText, setHowItWorksText] = useState(draft.blocks.how_it_works.items.join("\n"));
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
      setDraft(previewData());
      setStatus("Landing guardada.");
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
        <p className="eyebrow">Site settings</p>
        <h2>Editar landing</h2>
        <div className="form-grid" style={{ marginTop: 18 }}>
          <label className="field-wide">
            <span>Blocks order (coma separada)</span>
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
            <span>Hero title</span>
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
            <span>Hero subtitle</span>
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
            <span>Examples items (JSON)</span>
            <textarea value={examplesJson} onChange={(event) => setExamplesJson(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Packages items (JSON)</span>
            <textarea value={packagesJson} onChange={(event) => setPackagesJson(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Extras (una por linea)</span>
            <textarea value={extrasText} onChange={(event) => setExtrasText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>How it works (una por linea)</span>
            <textarea value={howItWorksText} onChange={(event) => setHowItWorksText(event.target.value)} />
          </label>
          <label className="field-wide">
            <span>FAQ items (JSON)</span>
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
            <span>Prefill WhatsApp</span>
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
        <p className="eyebrow">Preview</p>
        <h2>Landing /</h2>
        <SiteHome settings={previewData()} />
      </section>
    </div>
  );
}
