"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
import { SiteHome } from "@/components/site/site-home";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import type { SiteSettingsData } from "@/types/invitations";

type SiteSettingsFormProps = {
  initialData: SiteSettingsData;
  availableInvitations: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    ogImageUrl: string;
  }>;
};

type ExampleItem = SiteSettingsData["blocks"]["examples"]["items"][number];
type PackageItem = SiteSettingsData["blocks"]["packages"]["items"][number];
type FaqItem = SiteSettingsData["blocks"]["faq"]["items"][number];

function extractInvitationSlug(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsedUrl = new URL(trimmed);
      const match = parsedUrl.pathname.match(/\/i\/([^/?#]+)/i);
      if (match?.[1]) {
        return decodeURIComponent(match[1]);
      }
      return parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    } catch {
      return "";
    }
  }

  const match = trimmed.match(/\/i\/([^/?#]+)/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  return trimmed.replace(/^\/+|\/+$/g, "");
}

function buildOgPreviewUrl(slug: string) {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return "";
  }
  return `/api/public/invitations/${encodeURIComponent(safeSlug)}/og-image`;
}

function createRecommendedPackages() {
  return RECOMMENDED_SITE_PACKAGES.map((item) => ({
    ...item,
    features: [...item.features],
  }));
}

export function SiteSettingsForm({ initialData, availableInvitations }: SiteSettingsFormProps) {
  const router = useRouter();
  const safeInitialData = normalizeSiteSettingsData(initialData);
  const [draft, setDraft] = useState<SiteSettingsData>(() => ({
    ...safeInitialData,
    blocks: {
      ...safeInitialData.blocks,
      examples: {
        ...safeInitialData.blocks.examples,
        items: (safeInitialData.blocks.examples.items || []).map((item, index) => {
          const source = item as ExampleItem & { demo_url?: string };
          const slug = source.slug || extractInvitationSlug(source.demo_url || "");
          return {
            title: source.title || `Demo ${index + 1}`,
            description: source.description || "Modelo listo para publicar.",
            slug,
            cover_url: source.cover_url || buildOgPreviewUrl(slug),
          };
        }),
      },
      packages: {
        ...safeInitialData.blocks.packages,
        service_note:
          safeInitialData.blocks.packages.service_note || DEFAULT_PACKAGES_SERVICE_NOTE,
        items: (safeInitialData.blocks.packages.items || []).map((item, index) => ({
          name: item?.name || `Paquete ${index + 1}`,
          price: item?.price || "",
          description: item?.description || "",
          features: Array.isArray(item?.features) ? item.features.filter(Boolean) : [],
        })),
      },
      faq: {
        ...safeInitialData.blocks.faq,
        items: (safeInitialData.blocks.faq.items || []).map((item, index) => ({
          question: item?.question || `Pregunta ${index + 1}`,
          answer: item?.answer || "",
        })),
      },
      extras: {
        ...safeInitialData.blocks.extras,
        items: (safeInitialData.blocks.extras.items || []).filter(Boolean),
      },
      how_it_works: {
        ...safeInitialData.blocks.how_it_works,
        items: (safeInitialData.blocks.how_it_works.items || []).filter(Boolean),
      },
    },
  }));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function previewData(): SiteSettingsData {
    return draft;
  }

  function updateExample(index: number, patch: Partial<ExampleItem>) {
    const nextItems = [...draft.blocks.examples.items];
    nextItems[index] = { ...nextItems[index], ...patch };
    setDraft((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        examples: {
          ...current.blocks.examples,
          items: nextItems,
        },
      },
    }));
  }

  function updatePackage(index: number, patch: Partial<PackageItem>) {
    const nextItems = [...draft.blocks.packages.items];
    nextItems[index] = { ...nextItems[index], ...patch };
    setDraft((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        packages: {
          ...current.blocks.packages,
          items: nextItems,
        },
      },
    }));
  }

  function updateFaq(index: number, patch: Partial<FaqItem>) {
    const nextItems = [...draft.blocks.faq.items];
    nextItems[index] = { ...nextItems[index], ...patch };
    setDraft((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        faq: {
          ...current.blocks.faq,
          items: nextItems,
        },
      },
    }));
  }

  function applyInvitationToExample(index: number, invitationId: string) {
    const invitation = availableInvitations.find((item) => item.id === invitationId);
    if (!invitation) {
      return;
    }

    updateExample(index, {
      title: invitation.title || draft.blocks.examples.items[index].title,
      slug: invitation.slug || draft.blocks.examples.items[index].slug,
      cover_url:
        draft.blocks.examples.items[index].cover_url ||
        invitation.ogImageUrl ||
        buildOgPreviewUrl(invitation.slug),
    });
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
        <p className="eyebrow">Configuración del sitio</p>
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
            <span>Título principal</span>
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
            <span>Subtítulo principal</span>
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
          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={draft.blocks.examples.enabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    examples: { ...current.blocks.examples, enabled: event.target.checked },
                  },
                }))
              }
            />
            <span>Demos activo</span>
          </label>
          <div className="field-wide">
            <span>Demos</span>
            <div className="simple-list-editor">
              <div className="simple-list-editor__list">
                {draft.blocks.examples.items.map((item, index) => (
                  <div key={`example-${index}`} className="admin-subpanel">
                    <div className="form-grid">
                      <label className="field">
                        <span>Vincular invitación</span>
                        <select
                          value=""
                          onChange={(event) => {
                            applyInvitationToExample(index, event.target.value);
                            event.currentTarget.value = "";
                          }}
                        >
                          <option value="">Selecciona una invitación publicada</option>
                          {availableInvitations
                            .filter((invitation) => invitation.status === "published")
                            .map((invitation) => (
                              <option key={invitation.id} value={invitation.id}>
                                {invitation.title}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>Slug</span>
                        <input
                          value={item.slug}
                          onChange={(event) =>
                            updateExample(index, { slug: extractInvitationSlug(event.target.value) })
                          }
                        />
                      </label>
                      <label className="field-wide">
                        <span>Título</span>
                        <input
                          value={item.title}
                          onChange={(event) => updateExample(index, { title: event.target.value })}
                        />
                      </label>
                      <label className="field-wide">
                        <span>Descripción</span>
                        <textarea
                          value={item.description}
                          onChange={(event) =>
                            updateExample(index, { description: event.target.value })
                          }
                        />
                      </label>
                      <label className="field-wide">
                        <span>URL de portada</span>
                        <input
                          value={item.cover_url}
                          onChange={(event) => updateExample(index, { cover_url: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="inline-actions" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => updateExample(index, { cover_url: buildOgPreviewUrl(item.slug) })}
                      >
                        Usar imagen OG
                      </button>
                      <button
                        type="button"
                        className="button-ghost"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            blocks: {
                              ...current.blocks,
                              examples: {
                                ...current.blocks.examples,
                                items: current.blocks.examples.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            },
                          }))
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    blocks: {
                      ...current.blocks,
                      examples: {
                        ...current.blocks.examples,
                        items: [
                          ...current.blocks.examples.items,
                          {
                            title: "Nuevo demo",
                            description: "Descripción del demo",
                            slug: "",
                            cover_url: "",
                          },
                        ],
                      },
                    },
                  }))
                }
              >
                Agregar demo
              </button>
            </div>
          </div>
          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={draft.blocks.packages.enabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    packages: { ...current.blocks.packages, enabled: event.target.checked },
                  },
                }))
              }
            />
            <span>Paquetes activo</span>
          </label>
          <div className="field-wide">
            <span>Paquetes</span>
            <div className="simple-list-editor">
              <div className="inline-actions" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      blocks: {
                        ...current.blocks,
                        packages: {
                          ...current.blocks.packages,
                          title: "Tipos de invitación y precios",
                          service_note: DEFAULT_PACKAGES_SERVICE_NOTE,
                          items: createRecommendedPackages(),
                        },
                      },
                    }))
                  }
                >
                  Usar paquetes recomendados
                </button>
              </div>
              <div className="simple-list-editor__list">
                {draft.blocks.packages.items.map((item, index) => (
                  <div key={`package-${index}`} className="admin-subpanel">
                    <div className="form-grid">
                      <label className="field">
                        <span>Nombre</span>
                        <input
                          value={item.name}
                          onChange={(event) => updatePackage(index, { name: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span>Precio</span>
                        <input
                          value={item.price}
                          onChange={(event) => updatePackage(index, { price: event.target.value })}
                        />
                      </label>
                      <label className="field-wide">
                        <span>Descripción</span>
                        <textarea
                          value={item.description}
                          onChange={(event) => updatePackage(index, { description: event.target.value })}
                        />
                      </label>
                      <label className="field-wide">
                        <span>Features (una por línea)</span>
                        <textarea
                          value={Array.isArray(item.features) ? item.features.join("\n") : ""}
                          onChange={(event) =>
                            updatePackage(index, {
                              features: event.target.value
                                .split("\n")
                                .map((feature) => feature.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="inline-actions" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="button-ghost"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            blocks: {
                              ...current.blocks,
                              packages: {
                                ...current.blocks.packages,
                                items: current.blocks.packages.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            },
                          }))
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    blocks: {
                      ...current.blocks,
                      packages: {
                        ...current.blocks.packages,
                        items: [
                          ...current.blocks.packages.items,
                          {
                            name: "Nuevo paquete",
                            price: "",
                            description: "",
                            features: [],
                          },
                        ],
                      },
                    },
                  }))
                }
              >
                Agregar paquete
              </button>
            </div>
          </div>
          <label className="field-wide">
            <span>Nota de servicio (aparece en landing)</span>
            <textarea
              value={draft.blocks.packages.service_note || ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    packages: {
                      ...current.blocks.packages,
                      service_note: event.target.value,
                    },
                  },
                }))
              }
            />
          </label>
          <div className="field-wide">
            <span>Extras (uno por línea)</span>
            <textarea
              value={draft.blocks.extras.items.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    extras: {
                      ...current.blocks.extras,
                      items: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    },
                  },
                }))
              }
            />
          </div>
          <div className="field-wide">
            <span>Cómo funciona (uno por línea)</span>
            <textarea
              value={draft.blocks.how_it_works.items.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    how_it_works: {
                      ...current.blocks.how_it_works,
                      items: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    },
                  },
                }))
              }
            />
          </div>
          <label className="checkbox-tile">
            <input
              type="checkbox"
              checked={draft.blocks.faq.enabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  blocks: {
                    ...current.blocks,
                    faq: { ...current.blocks.faq, enabled: event.target.checked },
                  },
                }))
              }
            />
            <span>FAQ activo</span>
          </label>
          <div className="field-wide">
            <span>Preguntas frecuentes</span>
            <div className="simple-list-editor">
              <div className="simple-list-editor__list">
                {draft.blocks.faq.items.map((item, index) => (
                  <div key={`faq-${index}`} className="admin-subpanel">
                    <div className="form-grid">
                      <label className="field-wide">
                        <span>Pregunta</span>
                        <input
                          value={item.question}
                          onChange={(event) => updateFaq(index, { question: event.target.value })}
                        />
                      </label>
                      <label className="field-wide">
                        <span>Respuesta</span>
                        <textarea
                          value={item.answer}
                          onChange={(event) => updateFaq(index, { answer: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="inline-actions" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="button-ghost"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            blocks: {
                              ...current.blocks,
                              faq: {
                                ...current.blocks.faq,
                                items: current.blocks.faq.items.filter((_, itemIndex) => itemIndex !== index),
                              },
                            },
                          }))
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    blocks: {
                      ...current.blocks,
                      faq: {
                        ...current.blocks.faq,
                        items: [...current.blocks.faq.items, { question: "Nueva pregunta", answer: "" }],
                      },
                    },
                  }))
                }
              >
                Agregar pregunta
              </button>
            </div>
          </div>
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
