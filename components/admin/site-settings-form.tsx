"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import type { SiteContentItem, SiteContentSection, SitePageKey, SiteSettingsData } from "@/types/invitations";
import { MediaField } from "@/components/admin/media-field";
import { CatalogSamplesEditor } from "@/components/admin/catalog-samples-editor";
import styles from "./site-settings-form.module.css";

type InvitationOption = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  invitationTypes: string[];
  ogImageUrl: string;
};

type Props = {
  initialData: SiteSettingsData;
  availableInvitations: InvitationOption[];
};

const PAGE_ORDER: SitePageKey[] = ["home", "catalog", "about", "faq", "contact", "crm"];

const PAGE_ICONS: Record<SitePageKey, React.ReactNode> = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  catalog: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  about: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  faq: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  contact: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  crm: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
};

function lines(value?: string[]) {
  return (value || []).join("\n");
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function demoSlug(item?: SiteContentItem) {
  if (item?.slug) return item.slug;
  return item?.href?.match(/^\/i\/([^/?#]+)/)?.[1] || "";
}

function ItemEditor({
  item,
  index,
  sectionId,
  onChange,
  onRemove,
}: {
  item: SiteContentItem;
  index: number;
  sectionId: string;
  onChange: (patch: Partial<SiteContentItem>) => void;
  onRemove: () => void;
}) {
  const isQuestion = sectionId === "questions";
  const usesImage = ["categories", "benefits", "sharing", "visual_gallery", "celebrations", "gallery", "purpose"].includes(sectionId);
  const usesLink = ["categories", "benefits", "visual_gallery", "celebrations", "gallery", "channels"].includes(sectionId);
  const usesDescription = !["categories", "sharing", "visual_gallery", "celebrations", "gallery", "purpose"].includes(sectionId);

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHeader}>
        <span className={styles.itemIndexBadge}>Elemento #{index + 1}</span>
        <button type="button" className={styles.btnRemoveItem} onClick={onRemove}>
          Eliminar
        </button>
      </div>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>{isQuestion ? "Pregunta" : "Nombre / Título"}</span>
        <input
          className={styles.fieldInput}
          value={item.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>
      {usesDescription ? (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{isQuestion ? "Respuesta" : "Descripción"}</span>
          <textarea
            className={styles.fieldTextarea}
            value={item.description || ""}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
      ) : null}
      {usesImage ? (
        <MediaField
          label="Imagen del elemento"
          accept="image/*"
          value={item.image_url}
          onChange={(value) => onChange({ image_url: value })}
        />
      ) : null}
      {usesLink ? (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Enlace opcional</span>
          <input
            className={styles.fieldInput}
            value={item.href || ""}
            onChange={(event) => onChange({ href: event.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}

function SectionCardEditor({
  section,
  pageKey,
  premiumInvitations,
  draft,
  setDraft,
  updatePackage,
  onChange,
}: {
  section: SiteContentSection;
  pageKey: SitePageKey;
  premiumInvitations: InvitationOption[];
  draft: SiteSettingsData;
  setDraft: React.Dispatch<React.SetStateAction<SiteSettingsData>>;
  updatePackage: (index: number, patch: Partial<SiteSettingsData["blocks"]["packages"]["items"][number]>) => void;
  onChange: (next: SiteContentSection) => void;
}) {
  const patch = (value: Partial<SiteContentSection>) => onChange({ ...section, ...value });
  const updateItem = (index: number, value: Partial<SiteContentItem>) =>
    patch({
      items: (section.items || []).map((item, itemIndex) => (itemIndex === index ? { ...item, ...value } : item)),
    });

  const isHomeDemos = pageKey === "home" && section.id === "demos";
  const isHomePricing = pageKey === "home" && (section.id === "pricing" || section.id === "packages");
  const isContactForm = pageKey === "contact" && (section.id === "form" || section.id === "whatsapp");

  const featuredDemos = Array.from({ length: 4 }, (_, index) => section.items?.[index] || { title: "" });
  const selectedDemoSlugs = featuredDemos.map(demoSlug);

  function selectFeaturedDemo(index: number, slug: string) {
    const invitation = premiumInvitations.find((option) => option.slug === slug);
    const nextItems = [...featuredDemos];
    nextItems[index] = invitation
      ? {
          title: invitation.title,
          slug: invitation.slug,
          description: invitation.description,
          image_url: invitation.ogImageUrl,
          href: `/i/${invitation.slug}`,
        }
      : { title: "" };
    patch({ items: nextItems });
  }

  const showText = !["background", "categories", "message", "visual_gallery"].includes(section.id);
  const showCta = ["comparison", "celebrations", "cta", "contact", "form"].includes(section.id);
  const showImage = ["comparison", "behind", "message", "footer", "login"].includes(section.id);
  const showVideo = pageKey === "home" && ["hero", "sharing", "message"].includes(section.id);
  const showBackground = ["background", "hero", "sharing", "form", "login"].includes(section.id);

  return (
    <div className={styles.sectionCard} id={`section-${section.id}`}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <div className={styles.sectionIconBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <h3 className={styles.sectionLabel}>{section.label}</h3>
            <p className={styles.sectionSubtitle}>{section.title || "Configura los textos y medios de esta sección"}</p>
          </div>
        </div>

        <label className={styles.sectionToggleLabel} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className={styles.sectionToggleInput}
            checked={section.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          <span>{section.enabled ? "Visible en Sitio" : "Oculta"}</span>
        </label>
      </div>

      <div className={styles.sectionBody}>
        {showText ? (
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Subtítulo / Eyebrow</span>
              <input
                className={styles.fieldInput}
                value={section.eyebrow || ""}
                onChange={(event) => patch({ eyebrow: event.target.value })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Título Principal</span>
              <input
                className={styles.fieldInput}
                value={section.title || ""}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </div>
            <div className={styles.fieldWide}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Texto Descriptivo</span>
                <textarea
                  className={styles.fieldTextarea}
                  value={section.description || ""}
                  onChange={(event) => patch({ description: event.target.value })}
                />
              </div>
            </div>
          </div>
        ) : null}

        {showCta ? (
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Texto del Botón (CTA)</span>
              <input
                className={styles.fieldInput}
                value={section.cta_text || ""}
                onChange={(event) => patch({ cta_text: event.target.value })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Enlace de Destino</span>
              <input
                className={styles.fieldInput}
                value={section.cta_href || ""}
                onChange={(event) => patch({ cta_href: event.target.value })}
              />
            </div>
          </div>
        ) : null}

        {showImage ? (
          <MediaField
            label={section.id === "footer" ? "Imagen de fondo del Footer" : "Imagen Principal"}
            accept="image/*"
            value={section.image_url}
            onChange={(value) => patch({ image_url: value })}
          />
        ) : null}

        {showVideo ? (
          <MediaField
            label="Video Principal de Fondo / Demostración"
            accept="video/*"
            value={section.video_url}
            onChange={(value) => patch({ video_url: value })}
          />
        ) : null}

        {showBackground ? (
          <div className={styles.fieldsGrid}>
            <MediaField
              label="Fondo para Modo Oscuro"
              accept="image/*"
              value={section.background_dark_url}
              onChange={(value) => patch({ background_dark_url: value })}
            />
            <MediaField
              label="Fondo para Modo Claro"
              accept="image/*"
              value={section.background_light_url}
              onChange={(value) => patch({ background_light_url: value })}
            />
          </div>
        ) : null}

        {/* Home Section 05: Featured Demos Block */}
        {isHomeDemos ? (
          <div className={styles.featuredDemosBox}>
            <div>
              <h4 className={styles.featuredDemosTitle}>Selección de las 4 Demos Destacadas en el Home</h4>
              <p className={styles.featuredDemosDesc}>
                Elige las 4 invitaciones Web Premium publicadas que se mostrarán de portada en tu página principal.
              </p>
            </div>
            <div className={styles.featuredDemosGrid}>
              {featuredDemos.map((item, index) => {
                const currentSlug = demoSlug(item);
                const matchedInv = premiumInvitations.find((inv) => inv.slug === currentSlug);
                return (
                  <div className={styles.featuredDemoCard} key={`featured-demo-${index}`}>
                    <div className={styles.featuredDemoCardTitle}>
                      <span>Demo Destacada #{index + 1}</span>
                      {currentSlug ? (
                        <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>Seleccionada</span>
                      ) : (
                        <span style={{ color: "#f87171", fontSize: "0.75rem" }}>Falta seleccionar</span>
                      )}
                    </div>
                    {matchedInv?.ogImageUrl ? (
                      <img className={styles.demoThumbnail} src={matchedInv.ogImageUrl} alt={matchedInv.title} />
                    ) : null}
                    <select
                      className={styles.fieldSelect}
                      value={currentSlug}
                      onChange={(event) => selectFeaturedDemo(index, event.target.value)}
                    >
                      <option value="">Selecciona una Web Premium</option>
                      {premiumInvitations.map((option) => (
                        <option
                          value={option.slug}
                          key={option.id}
                          disabled={selectedDemoSlugs.some(
                            (slug, selectedIndex) => selectedIndex !== index && slug === option.slug
                          )}
                        >
                          {option.title} ({option.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Home Section 10: Pricing & Packages Block */}
        {isHomePricing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
            <h4 className={styles.featuredDemosTitle}>Configuración de Paquetes de Tarifas e Inclusiones</h4>
            <div className={styles.packagesGrid}>
              {draft.blocks.packages.items.map((item, index) => (
                <div className={styles.packageCard} key={`${item.name}-${index}`}>
                  <div className={styles.packageCardHeader}>
                    <span>{item.name}</span>
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Nombre del Paquete</span>
                    <input
                      className={styles.fieldInput}
                      value={item.name}
                      onChange={(e) => updatePackage(index, { name: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Precio</span>
                    <input
                      className={styles.fieldInput}
                      value={item.price}
                      onChange={(e) => updatePackage(index, { price: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Descripción</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={item.description}
                      onChange={(e) => updatePackage(index, { description: e.target.value })}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Incluye (1 línea por punto)</span>
                    <textarea
                      className={styles.fieldTextarea}
                      value={lines(item.features)}
                      onChange={(e) => updatePackage(index, { features: parseLines(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: 10 }}>
              <span className={styles.fieldLabel}>Extras Generales (1 por línea)</span>
              <textarea
                className={styles.fieldTextarea}
                value={lines(draft.blocks.extras.items)}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    blocks: {
                      ...current.blocks,
                      extras: {
                        ...current.blocks.extras,
                        items: parseLines(e.target.value),
                      },
                    },
                  }))
                }
              />
            </div>
          </div>
        ) : null}

        {/* Contact Page Section 03: WhatsApp Settings Block */}
        {isContactForm ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
            <h4 className={styles.featuredDemosTitle}>Ajustes de WhatsApp de Cotizaciones</h4>
            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Número WhatsApp con lada</span>
                <input
                  className={styles.fieldInput}
                  placeholder="ej. 5215512345678"
                  value={draft.blocks.contact.whatsapp_number}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      blocks: {
                        ...current.blocks,
                        contact: {
                          ...current.blocks.contact,
                          whatsapp_number: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </div>
              <div className={styles.fieldWide}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Mensaje precargado de cotización</span>
                  <textarea
                    className={styles.fieldTextarea}
                    value={draft.blocks.contact.whatsapp_prefill_text}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        blocks: {
                          ...current.blocks,
                          contact: {
                            ...current.blocks.contact,
                            whatsapp_prefill_text: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* General Repeatable Items (Features, FAQs, Gallery items, Process points, etc.) */}
        {section.items && !isHomeDemos ? (
          <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
            <span className={styles.fieldLabel}>Elementos repetibles de esta sección</span>
            <div className={styles.itemsGrid}>
              {section.items.map((item, index) => (
                <ItemEditor
                  key={`${section.id}-${index}`}
                  item={item}
                  index={index}
                  sectionId={section.id}
                  onChange={(value) => updateItem(index, value)}
                  onRemove={() =>
                    patch({ items: section.items?.filter((_, itemIndex) => itemIndex !== index) })
                  }
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.btnAddItem}
              onClick={() =>
                patch({ items: [...(section.items || []), { title: "Nuevo Elemento" }] })
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Agregar Nuevo Elemento</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SiteSettingsForm({ initialData, availableInvitations }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => normalizeSiteSettingsData(initialData));
  const [savedDraft, setSavedDraft] = useState(() => normalizeSiteSettingsData(initialData));
  const [activePage, setActivePage] = useState<SitePageKey>("home");
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(""), 7000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(savedDraft);
  }, [draft, savedDraft]);

  const page = draft.pages[activePage];
  const effectiveActiveSectionId =
    activePage === "catalog" && activeSectionId === "catalog-samples" ? "catalog-samples" :
    activeSectionId && page.sections.some((s) => s.id === activeSectionId)
      ? activeSectionId
      : page.sections[0]?.id || "";

  const publishedInvitations = useMemo(
    () => availableInvitations.filter((item) => item.status === "published"),
    [availableInvitations]
  );
  const premiumInvitations = useMemo(
    () => publishedInvitations.filter((item) => item.invitationTypes.includes("web-premium")),
    [publishedInvitations]
  );

  function updateSection(index: number, section: SiteContentSection) {
    setDraft((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [activePage]: {
          ...current.pages[activePage],
          sections: current.pages[activePage].sections.map((item, itemIndex) =>
            itemIndex === index ? section : item
          ),
        },
      },
    }));
  }

  function updatePackage(
    index: number,
    patch: Partial<SiteSettingsData["blocks"]["packages"]["items"][number]>
  ) {
    setDraft((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        packages: {
          ...current.blocks.packages,
          items: current.blocks.packages.items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, ...patch } : item
          ),
        },
      },
    }));
  }

  async function save() {
    setLoading(true);
    setStatus("");
    setError("");
    try {
      if (activePage === "home") {
        const featuredDemos =
          draft.pages.home.sections.find((section) => section.id === "demos")?.items || [];
        const featuredSlugs = featuredDemos.slice(0, 4).map(demoSlug).filter(Boolean);
        if (featuredSlugs.length !== 4 || new Set(featuredSlugs).size !== 4) {
          throw new Error("Selecciona 4 invitaciones Web Premium diferentes en Demos destacadas.");
        }
        if (featuredSlugs.some((slug) => !premiumInvitations.some((item) => item.slug === slug))) {
          throw new Error(
            "Una demo destacada ya no está publicada como Web Premium. Elige otra antes de guardar."
          );
        }
      }
      const response = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar.");
      const nextNormalized = normalizeSiteSettingsData(draft);
      setDraft(nextNormalized);
      setSavedDraft(nextNormalized);
      setStatus("Sitio web guardado correctamente.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  const visibleSections = useMemo(() => {
    if (activePage === "catalog" && activeSectionId === "catalog-samples") return [];
    const targetId =
      activeSectionId && page.sections.some((s) => s.id === activeSectionId)
        ? activeSectionId
        : page.sections[0]?.id || "";
    const matches = page.sections.filter((s) => s.id === targetId);
    return matches.length > 0 ? matches : page.sections.slice(0, 1);
  }, [page.sections, activeSectionId, activePage]);

  return (
    <div className={styles.editorShell}>
      {/* Top Sticky Toolbar: Page Tabs + Top Save Button */}
      <div className={styles.topToolbar}>
        <nav className={styles.pageTabs} aria-label="Páginas del sitio">
          {PAGE_ORDER.map((key) => (
            <button
              type="button"
              key={key}
              className={`${styles.tabButton} ${activePage === key ? styles.tabButtonActive : ""}`}
              onClick={() => {
                setActivePage(key);
                const firstSec = draft.pages[key].sections[0]?.id || "";
                setActiveSectionId(firstSec);
              }}
            >
              {PAGE_ICONS[key]}
              <span>{draft.pages[key].label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.btnSave} ${isDirty ? styles.btnSaveActive : styles.btnSaveDisabled}`}
            onClick={() => void save()}
            disabled={!isDirty || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>{loading ? "Guardando..." : "Guardar Cambios del Sitio Web"}</span>
          </button>
        </div>
      </div>

      {(status || error) && <div className={`${styles.toast} ${error ? styles.toastError : styles.toastSuccess}`} role="status" aria-live="polite">{error ? `⚠ ${error}` : `✓ ${status}`}</div>}

      {/* Page Meta Header */}
      <div className={styles.pageMetaHeader}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Edición de Contenido Web</p>
          <h2 className={styles.pageMetaTitle}>{page.label}</h2>
          <p className={styles.pageMetaDesc}>{page.description}</p>
        </div>
        <a
          href={page.path}
          target="_blank"
          rel="noreferrer"
          className={styles.btnOpenPage}
          title="Abrir vista previa del sitio web público en una pestaña nueva"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          <span>Abrir Página en Vivo</span>
        </a>
      </div>

      {/* Main Studio Workspace: Sidebar Navigation + Section Cards */}
      <div className={styles.workspaceLayout}>
        <aside className={styles.sectionsSidebar}>
          <p className={styles.sidebarHeading}>Secciones de esta página</p>
          <div className={styles.sidebarNavList}>
            {page.sections.map((section) => (
              <button
                type="button"
                key={section.id}
                className={`${styles.sidebarNavItem} ${
                  effectiveActiveSectionId === section.id ? styles.sidebarNavItemActive : ""
                }`}
                onClick={() => setActiveSectionId(section.id)}
              >
                <span>{section.label}</span>
                <span
                  className={`${styles.sectionStatusDot} ${
                    section.enabled ? styles.sectionStatusDotActive : ""
                  }`}
                />
              </button>
            ))}
            {activePage === "catalog" && <button type="button" className={`${styles.sidebarNavItem} ${effectiveActiveSectionId === "catalog-samples" ? styles.sidebarNavItemActive : ""}`} onClick={() => setActiveSectionId("catalog-samples")}><span>05 · Muestras de archivo</span><span className={`${styles.sectionStatusDot} ${(draft.catalog_samples || []).some((sample) => sample.published) ? styles.sectionStatusDotActive : ""}`} /></button>}
          </div>
        </aside>

        <main className={styles.contentArea}>
          {activePage === "catalog" && effectiveActiveSectionId === "catalog-samples" && <CatalogSamplesEditor samples={draft.catalog_samples || []} onChange={(catalog_samples) => setDraft((current) => ({ ...current, catalog_samples }))} />}
          {visibleSections.map((section) => {
            const index = page.sections.findIndex((s) => s.id === section.id);
            return (
              <SectionCardEditor
                key={section.id}
                section={section}
                pageKey={activePage}
                premiumInvitations={premiumInvitations}
                draft={draft}
                setDraft={setDraft}
                updatePackage={updatePackage}
                onChange={(next) => updateSection(index, next)}
              />
            );
          })}
        </main>
      </div>
    </div>
  );
}
