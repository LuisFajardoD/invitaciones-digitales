import { getSiteSettings, listDemoInvitations } from "@/lib/repository";
import type { SectionKey } from "@/types/invitations";
import { DEFAULT_INVITATION_TYPE, type InvitationTypeSlug } from "@/lib/catalog-taxonomy";
import { getDemoDisplayName } from "@/lib/catalog-metadata";

// Único mapa temporal por slug: el CRM todavía no almacena taxonomía editorial.
const defaultInvitationTypes: InvitationTypeSlug[] = [DEFAULT_INVITATION_TYPE];
const metadata: Record<string, { title?: string; category: string; subcategory: string; styles: string[]; invitationTypes?: InvitationTypeSlug[] }> = {
  "demo-espacio": { title: "Misión espacial", category: "infantiles", subcategory: "Espacio", styles: ["Temático", "Colorido", "Divertido"] },
  "demo-dinosaurios": { title: "Aventura jurásica", category: "infantiles", subcategory: "Dinosaurios", styles: ["Temático", "Divertido"] },
  "demo-futbol": { title: "Final de campeones", category: "infantiles", subcategory: "Deportes", styles: ["Temático", "Moderno"] },
  "demo-carreras": { title: "Pista veloz", category: "infantiles", subcategory: "Carreras", styles: ["Temático", "Neón"] },
  "demo-fantasia": { category: "infantiles", subcategory: "Princesas / fantasía", styles: ["Fantasía", "Colorido"] },
  "demo-animales": { category: "infantiles", subcategory: "Animales", styles: ["Temático", "Divertido"] },
  "demo-videojuegos": { category: "infantiles", subcategory: "Videojuegos", styles: ["Moderno", "Neón"] },
  "demo-princesas": { title: "Aventura de sirenas", category: "infantiles", subcategory: "Princesas / fantasía", styles: ["Fantasía", "Elegante"] },
  "cumple-7-luis-arturo-astronautas": { category: "infantiles", subcategory: "Espacio", styles: ["Temático", "Colorido"] },
  "cumple-5-julieta-mabell": { category: "infantiles", subcategory: "Sirenas", styles: ["Fantasía", "Colorido"] },
};
export function getInvitationTypesForSlug(slug: string): InvitationTypeSlug[] {
  return metadata[slug]?.invitationTypes || defaultInvitationTypes;
}
const featureSections: [SectionKey, string][] = [["map", "Mapa GPS"], ["rsvp", "Confirmación RSVP"], ["countdown", "Cuenta regresiva"], ["gallery", "Galería de fotos"], ["gifts", "Mesa de regalos"], ["itinerary", "Itinerario / programa"], ["dress_code", "Código de vestimenta"]];
export interface CatalogItem { id: string; slug: string; title: string; description: string; category: string; subcategory: string; styles: string[]; invitationTypes: InvitationTypeSlug[]; features: string[]; thumbnail: string; demoUrl: string; showDemo: boolean; createdAt: string; featuredOrder: number }
function safeUrl(value: string) { return /^(\/[^/]|https?:\/\/)/i.test(value) ? value : ""; }
export async function getCatalogItems(): Promise<CatalogItem[]> {
  const [settings, demos] = await Promise.all([getSiteSettings(), listDemoInvitations()]);
  const fileItems: CatalogItem[] = (settings.data.catalog_samples || [])
    .filter((sample) => sample.published && (sample.invitation_type === "imagen-esencial" || sample.preview_url) && sample.asset_url && sample.card_title && sample.category && sample.subcategory)
    .map((sample, index) => ({
      id: `sample:${sample.id}`, slug: sample.id, title: sample.card_title, description: sample.card_description,
      category: sample.category, subcategory: sample.subcategory, styles: sample.styles,
      invitationTypes: [sample.invitation_type], features: sample.feature_tags,
      thumbnail: safeUrl(sample.invitation_type === "imagen-esencial" ? sample.asset_url : sample.preview_url), demoUrl: safeUrl(sample.asset_url),
      showDemo: sample.invitation_type !== "imagen-esencial", createdAt: sample.created_at, featuredOrder: index,
    }));
  const webItems: CatalogItem[] = demos
    .filter((demo) => demo.status === "published" && demo.catalog?.invitation_type.startsWith("web-") && demo.catalog.category && demo.catalog.subcategory)
    .map((demo, index) => {
      const catalog = demo.catalog!;
      return {
        id: demo.id, slug: demo.slug, title: getDemoDisplayName(demo),
        description: catalog.card_description || demo.sections.hero.subtitle || "",
        category: catalog.category, subcategory: catalog.subcategory, styles: catalog.styles,
        invitationTypes: [catalog.invitation_type],
        features: catalog.feature_tags?.length ? catalog.feature_tags : featureSections.filter(([key]) => demo.sections_order.includes(key) && demo.sections[key]?.enabled).map(([, label]) => label),
        thumbnail: safeUrl(catalog.preview_url || demo.share.og_image_url || demo.sections.hero.background_image_url || ""),
        demoUrl: `/i/${encodeURIComponent(demo.slug)}`, showDemo: true,
        createdAt: demo.created_at, featuredOrder: fileItems.length + index,
      };
    });
  return [...webItems, ...fileItems];
}
