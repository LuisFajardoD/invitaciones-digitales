"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import type { SiteContentItem, SiteContentSection, SitePageKey, SiteSettingsData } from "@/types/invitations";
import { MediaField } from "@/components/admin/media-field";

type InvitationOption = { id: string; slug: string; title: string; description: string; status: string; invitationTypes: string[]; ogImageUrl: string };
type Props = { initialData: SiteSettingsData; availableInvitations: InvitationOption[] };
const PAGE_ORDER: SitePageKey[] = ["home", "catalog", "about", "faq", "contact", "crm"];

function lines(value?: string[]) { return (value || []).join("\n"); }
function parseLines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }

function ItemEditor({ item, index, sectionId, onChange, onRemove }: { item: SiteContentItem; index: number; sectionId: string; onChange: (patch: Partial<SiteContentItem>) => void; onRemove: () => void }) {
  const isQuestion = sectionId === "questions";
  const usesImage = ["categories", "benefits", "sharing", "visual_gallery", "celebrations", "gallery", "purpose"].includes(sectionId);
  const usesLink = ["categories", "benefits", "visual_gallery", "celebrations", "gallery", "channels"].includes(sectionId);
  const usesDescription = !["categories", "sharing", "visual_gallery", "celebrations", "gallery", "purpose"].includes(sectionId);
  return <div className="admin-subpanel site-item-editor">
    <div className="site-item-editor__heading"><strong>Elemento {index + 1}</strong><button type="button" className="button-ghost" onClick={onRemove}>Quitar</button></div>
    <div className="form-grid">
      <label className="field-wide"><span>{isQuestion ? "Pregunta" : "Nombre o título"}</span><input value={item.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
      {usesDescription ? <label className="field-wide"><span>{isQuestion ? "Respuesta" : "Descripción"}</span><textarea value={item.description || ""} onChange={(event) => onChange({ description: event.target.value })} /></label> : null}
      {usesImage ? <MediaField label="Imagen" accept="image/*" value={item.image_url} onChange={(value) => onChange({ image_url: value })} /> : null}
      {usesLink ? <label className="field-wide"><span>Enlace opcional</span><input value={item.href || ""} onChange={(event) => onChange({ href: event.target.value })} /></label> : null}
    </div>
  </div>;
}

function demoSlug(item?: SiteContentItem) {
  if (item?.slug) return item.slug;
  return item?.href?.match(/^\/i\/([^/?#]+)/)?.[1] || "";
}

function SectionEditor({ section, pageKey, premiumInvitations, onChange }: { section: SiteContentSection; pageKey: SitePageKey; premiumInvitations: InvitationOption[]; onChange: (next: SiteContentSection) => void }) {
  const patch = (value: Partial<SiteContentSection>) => onChange({ ...section, ...value });
  const updateItem = (index: number, value: Partial<SiteContentItem>) => patch({ items: (section.items || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });
  const isHomeDemos = pageKey === "home" && section.id === "demos";
  const featuredDemos = Array.from({ length: 4 }, (_, index) => section.items?.[index] || { title: "" });
  const selectedDemoSlugs = featuredDemos.map(demoSlug);
  function selectFeaturedDemo(index: number, slug: string) {
    const invitation = premiumInvitations.find((option) => option.slug === slug);
    const nextItems = [...featuredDemos];
    nextItems[index] = invitation ? {
      title: invitation.title,
      slug: invitation.slug,
      description: invitation.description,
      image_url: invitation.ogImageUrl,
      href: `/i/${invitation.slug}`,
    } : { title: "" };
    patch({ items: nextItems });
  }
  const showText = !["background", "categories", "message", "visual_gallery"].includes(section.id);
  const showCta = ["comparison", "celebrations", "cta", "contact", "form"].includes(section.id);
  const showImage = ["comparison", "behind", "message", "footer", "login"].includes(section.id);
  const showVideo = pageKey === "home" && ["hero", "sharing", "message"].includes(section.id);
  const showBackground = ["background", "hero", "sharing", "form", "login"].includes(section.id);
  return <details className="site-section-card" open={section.id === "hero"}>
    <summary><span><strong>{section.label}</strong><small>{section.title || "Configura esta sección"}</small></span><label className="site-section-toggle" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={section.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />Visible</label></summary>
    <div className="site-section-card__body form-grid">
      {showText ? <><label className="field"><span>Texto pequeño superior</span><input value={section.eyebrow || ""} onChange={(event) => patch({ eyebrow: event.target.value })} /></label><label className="field-wide"><span>Título de la sección</span><input value={section.title || ""} onChange={(event) => patch({ title: event.target.value })} /></label><label className="field-wide"><span>Texto descriptivo</span><textarea value={section.description || ""} onChange={(event) => patch({ description: event.target.value })} /></label></> : null}
      {showCta ? <><label className="field"><span>Texto del botón</span><input value={section.cta_text || ""} onChange={(event) => patch({ cta_text: event.target.value })} /></label><label className="field"><span>Destino del botón</span><input value={section.cta_href || ""} onChange={(event) => patch({ cta_href: event.target.value })} /></label></> : null}
      {showImage ? <MediaField label={section.id === "footer" ? "Imagen de fondo del footer" : "Imagen principal"} accept="image/*" value={section.image_url} onChange={(value) => patch({ image_url: value })} /> : null}
      {showVideo ? <MediaField label="Video principal" accept="video/*" value={section.video_url} onChange={(value) => patch({ video_url: value })} /> : null}
      {showBackground ? <><MediaField label="Fondo para modo oscuro" accept="image/*" value={section.background_dark_url} onChange={(value) => patch({ background_dark_url: value })} /><MediaField label="Fondo para modo claro" accept="image/*" value={section.background_light_url} onChange={(value) => patch({ background_light_url: value })} /></> : null}
      {isHomeDemos ? <div className="field-wide site-featured-demos"><div className="site-featured-demos__intro"><strong>Elige las 4 invitaciones Web Premium del Home</strong><small>Sólo aparecen invitaciones publicadas del tipo Web Premium. Las nuevas estarán disponibles aquí cuando se agreguen al catálogo.</small></div><div className="site-featured-demos__grid">{featuredDemos.map((item, index) => { const currentSlug = demoSlug(item); return <label className="admin-subpanel site-featured-demo" key={`featured-demo-${index}`}><span>Demo destacado {index + 1}</span><select value={currentSlug} onChange={(event) => selectFeaturedDemo(index, event.target.value)}><option value="">Selecciona una Web Premium</option>{premiumInvitations.map((option) => <option value={option.slug} key={option.id} disabled={selectedDemoSlugs.some((slug, selectedIndex) => selectedIndex !== index && slug === option.slug)}>{option.title} — {option.slug}</option>)}</select>{currentSlug ? <small>{currentSlug}</small> : <small className="error-text">Falta seleccionar esta demo</small>}</label>; })}</div>{premiumInvitations.length < 4 ? <p className="error-text">Se necesitan al menos 4 invitaciones Web Premium publicadas para completar esta sección.</p> : null}</div> : null}
      {section.items && !isHomeDemos ? <div className="field-wide site-items-list"><span>Contenido repetible de esta sección</span>{section.items.map((item, index) => <ItemEditor key={`${section.id}-${index}`} item={item} index={index} sectionId={section.id} onChange={(value) => updateItem(index, value)} onRemove={() => patch({ items: section.items?.filter((_, itemIndex) => itemIndex !== index) })} />)}<button type="button" className="button-secondary" onClick={() => patch({ items: [...(section.items || []), { title: "Nuevo elemento" }] })}>Agregar elemento</button></div> : null}
    </div>
  </details>;
}

export function SiteSettingsForm({ initialData, availableInvitations }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => normalizeSiteSettingsData(initialData));
  const [activePage, setActivePage] = useState<SitePageKey>("home");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const page = draft.pages[activePage];
  const publishedInvitations = useMemo(() => availableInvitations.filter((item) => item.status === "published"), [availableInvitations]);
  const premiumInvitations = useMemo(() => publishedInvitations.filter((item) => item.invitationTypes.includes("web-premium")), [publishedInvitations]);

  function updateSection(index: number, section: SiteContentSection) {
    setDraft((current) => ({ ...current, pages: { ...current.pages, [activePage]: { ...current.pages[activePage], sections: current.pages[activePage].sections.map((item, itemIndex) => itemIndex === index ? section : item) } } }));
  }
  function updateExample(index: number, patch: Partial<SiteSettingsData["blocks"]["examples"]["items"][number]>) {
    setDraft((current) => ({ ...current, blocks: { ...current.blocks, examples: { ...current.blocks.examples, items: current.blocks.examples.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } } }));
  }
  function updatePackage(index: number, patch: Partial<SiteSettingsData["blocks"]["packages"]["items"][number]>) {
    setDraft((current) => ({ ...current, blocks: { ...current.blocks, packages: { ...current.blocks.packages, items: current.blocks.packages.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } } }));
  }
  async function save() {
    setLoading(true); setStatus(""); setError("");
    try {
      const featuredDemos = draft.pages.home.sections.find((section) => section.id === "demos")?.items || [];
      const featuredSlugs = featuredDemos.slice(0, 4).map(demoSlug).filter(Boolean);
      if (featuredSlugs.length !== 4 || new Set(featuredSlugs).size !== 4) {
        throw new Error("Selecciona 4 invitaciones Web Premium diferentes en Demos destacadas.");
      }
      if (featuredSlugs.some((slug) => !premiumInvitations.some((item) => item.slug === slug))) {
        throw new Error("Una demo destacada ya no está publicada como Web Premium. Elige otra antes de guardar.");
      }
      const response = await fetch("/api/admin/site", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar.");
      setDraft(normalizeSiteSettingsData(draft)); setStatus("Sitio guardado correctamente."); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar."); }
    finally { setLoading(false); }
  }

  return <div className="site-editor">
    <nav className="site-editor-tabs" aria-label="Páginas del sitio">{PAGE_ORDER.map((key) => <button type="button" key={key} className={activePage === key ? "is-active" : ""} onClick={() => setActivePage(key)}><span>{draft.pages[key].label}</span><small>{draft.pages[key].path}</small></button>)}</nav>
    <div className="site-editor-layout">
      <section className="admin-panel site-editor-main">
        <div className="site-editor-heading"><div><p className="eyebrow">Editar página</p><h2>{page.label}</h2><p className="muted">{page.description}</p></div><a className="button-secondary" href={page.path} target="_blank" rel="noreferrer">Abrir página</a></div>
        <div className="site-editor-sections">{page.sections.map((section, index) => <SectionEditor key={section.id} section={section} pageKey={activePage} premiumInvitations={premiumInvitations} onChange={(next) => updateSection(index, next)} />)}</div>

        {activePage === "catalog" ? <details className="site-section-card" open><summary><span><strong>Demos publicados y tarjetas del catálogo</strong><small>Selecciona invitaciones publicadas y define su portada.</small></span></summary><div className="site-section-card__body"><div className="site-items-list">{draft.blocks.examples.items.map((item, index) => <div className="admin-subpanel" key={`${item.slug}-${index}`}><div className="form-grid"><label className="field-wide"><span>Vincular invitación publicada</span><select value={item.slug} onChange={(event) => { const invitation = publishedInvitations.find((option) => option.slug === event.target.value); if (invitation) updateExample(index, { slug: invitation.slug, title: invitation.title, cover_url: invitation.ogImageUrl }); }}><option value="">Selecciona una invitación</option>{publishedInvitations.map((option) => <option value={option.slug} key={option.id}>{option.title} — {option.slug}</option>)}</select></label><label className="field"><span>Título visible</span><input value={item.title} onChange={(event) => updateExample(index, { title: event.target.value })} /></label><label className="field"><span>Slug</span><input value={item.slug} onChange={(event) => updateExample(index, { slug: event.target.value })} /></label><label className="field-wide"><span>Descripción</span><textarea value={item.description} onChange={(event) => updateExample(index, { description: event.target.value })} /></label><MediaField label="Portada de la tarjeta" accept="image/*" value={item.cover_url} onChange={(value) => updateExample(index, { cover_url: value })} /></div><button type="button" className="button-ghost" onClick={() => setDraft((current) => ({ ...current, blocks: { ...current.blocks, examples: { ...current.blocks.examples, items: current.blocks.examples.items.filter((_, itemIndex) => itemIndex !== index) } } }))}>Quitar demo</button></div>)}<button type="button" className="button-secondary" onClick={() => setDraft((current) => ({ ...current, blocks: { ...current.blocks, examples: { ...current.blocks.examples, items: [...current.blocks.examples.items, { title: "Nuevo demo", description: "", slug: "", cover_url: "" }] } } }))}>Agregar demo</button></div></div></details> : null}

        {activePage === "home" ? <details className="site-section-card" open><summary><span><strong>Tipos de invitación, precios y extras</strong><small>Estas tarjetas aparecen en “Elige tu tipo de invitación”.</small></span></summary><div className="site-section-card__body"><div className="site-items-list">{draft.blocks.packages.items.map((item, index) => <div className="admin-subpanel" key={`${item.name}-${index}`}><div className="form-grid"><label className="field"><span>Nombre</span><input value={item.name} onChange={(event) => updatePackage(index, { name: event.target.value })} /></label><label className="field"><span>Precio</span><input value={item.price} onChange={(event) => updatePackage(index, { price: event.target.value })} /></label><label className="field-wide"><span>Descripción</span><textarea value={item.description} onChange={(event) => updatePackage(index, { description: event.target.value })} /></label><label className="field-wide"><span>Incluye, una característica por línea</span><textarea value={lines(item.features)} onChange={(event) => updatePackage(index, { features: parseLines(event.target.value) })} /></label></div></div>)}</div><label className="field-wide"><span>Extras, uno por línea</span><textarea value={lines(draft.blocks.extras.items)} onChange={(event) => setDraft((current) => ({ ...current, blocks: { ...current.blocks, extras: { ...current.blocks.extras, items: parseLines(event.target.value) } } }))} /></label></div></details> : null}

        {false ? <details className="site-section-card" open><summary><span><strong>Preguntas y respuestas</strong><small>Edita, agrega o elimina preguntas frecuentes.</small></span></summary><div className="site-section-card__body site-items-list">{draft.blocks.faq.items.map((item, index) => <div className="admin-subpanel" key={`faq-${index}`}><div className="form-grid"><label className="field-wide"><span>Pregunta {index + 1}</span><input value={item.question} onChange={(event) => setDraft((current) => ({ ...current, blocks: { ...current.blocks, faq: { ...current.blocks.faq, items: current.blocks.faq.items.map((faq, faqIndex) => faqIndex === index ? { ...faq, question: event.target.value } : faq) } } }))} /></label><label className="field-wide"><span>Respuesta</span><textarea value={item.answer} onChange={(event) => setDraft((current) => ({ ...current, blocks: { ...current.blocks, faq: { ...current.blocks.faq, items: current.blocks.faq.items.map((faq, faqIndex) => faqIndex === index ? { ...faq, answer: event.target.value } : faq) } } }))} /></label></div><button type="button" className="button-ghost" onClick={() => setDraft((current) => ({ ...current, blocks: { ...current.blocks, faq: { ...current.blocks.faq, items: current.blocks.faq.items.filter((_, faqIndex) => faqIndex !== index) } } }))}>Quitar pregunta</button></div>)}<button type="button" className="button-secondary" onClick={() => setDraft((current) => ({ ...current, blocks: { ...current.blocks, faq: { ...current.blocks.faq, items: [...current.blocks.faq.items, { question: "Nueva pregunta", answer: "" }] } } }))}>Agregar pregunta</button></div></details> : null}

        {activePage === "contact" ? <details className="site-section-card" open><summary><span><strong>WhatsApp de cotización</strong><small>Número y mensaje que recibe el cliente al enviar.</small></span></summary><div className="site-section-card__body form-grid"><label className="field"><span>Número con lada</span><input value={draft.blocks.contact.whatsapp_number} onChange={(event) => setDraft((current) => ({ ...current, blocks: { ...current.blocks, contact: { ...current.blocks.contact, whatsapp_number: event.target.value } } }))} /></label><label className="field-wide"><span>Mensaje precargado</span><textarea value={draft.blocks.contact.whatsapp_prefill_text} onChange={(event) => setDraft((current) => ({ ...current, blocks: { ...current.blocks, contact: { ...current.blocks.contact, whatsapp_prefill_text: event.target.value } } }))} /></label></div></details> : null}
      </section>
      <aside className="admin-panel site-editor-help"><p className="eyebrow">Página seleccionada</p><h3>{page.label}</h3><code>{page.path}</code><p>{page.description}</p><hr /><strong>Cómo editar</strong><ol><li>Abre una sección.</li><li>Cambia textos o medios.</li><li>Revisa la vista previa del archivo.</li><li>Guarda todos los cambios.</li></ol><p className="muted">Las rutas internas empiezan con <code>/</code>. También puedes pegar una URL completa.</p></aside>
    </div>
    <div className="site-editor-savebar"><div>{status ? <span className="success-text">{status}</span> : null}{error ? <span className="error-text">{error}</span> : null}</div><button type="button" className="button-primary" onClick={() => void save()} disabled={loading}>{loading ? "Guardando…" : "Guardar cambios del sitio"}</button></div>
  </div>;
}
