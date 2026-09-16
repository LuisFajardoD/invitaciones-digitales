import { demoCategoryExampleItems } from "@/lib/demo-data";
import { getPublicInvitationBySlug, getSiteSettings } from "@/lib/repository";
import type { SectionKey } from "@/types/invitations";
import { DEFAULT_INVITATION_TYPE, type InvitationTypeSlug } from "@/lib/catalog-taxonomy";

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
  "demo-princesas": { category: "infantiles", subcategory: "Princesas / fantasía", styles: ["Fantasía", "Elegante"] },
  "cumple-7-luis-arturo-astronautas": { category: "infantiles", subcategory: "Espacio", styles: ["Temático", "Colorido"] },
  "cumple-5-julieta-mabell": { category: "infantiles", subcategory: "Sirenas", styles: ["Fantasía", "Colorido"] },
};
export function getInvitationTypesForSlug(slug: string): InvitationTypeSlug[] {
  return metadata[slug]?.invitationTypes || defaultInvitationTypes;
}
const featureSections: [SectionKey, string][] = [["map", "Mapa GPS"], ["rsvp", "Confirmación RSVP"], ["countdown", "Cuenta regresiva"], ["gallery", "Galería de fotos"], ["gifts", "Mesa de regalos"], ["itinerary", "Itinerario / programa"], ["dress_code", "Código de vestimenta"]];
export interface CatalogItem { id: string; slug: string; title: string; description: string; category: string; subcategory: string; styles: string[]; invitationTypes: InvitationTypeSlug[]; features: string[]; thumbnail: string; demoUrl: string; createdAt: string; featuredOrder: number }
function safeUrl(value: string) { return /^(\/[^/]|https?:\/\/)/i.test(value) ? value : ""; }
export async function getCatalogItems(): Promise<CatalogItem[]> {
  const settings = await getSiteSettings();
  const unique = [...new Map([...demoCategoryExampleItems, ...settings.data.blocks.examples.items].map(item => [item.slug, item])).values()];
  const items = await Promise.all(unique.map(async (item, index) => {
    const invitation = await getPublicInvitationBySlug(item.slug);
    if (!invitation) return null;
    const meta = metadata[item.slug];
    return { id: invitation.id, slug: invitation.slug, title: meta?.title || item.title, description: item.description,
      category: meta?.category || "", subcategory: meta?.subcategory || "", styles: meta?.styles || [], invitationTypes: getInvitationTypesForSlug(item.slug),
      features: featureSections.filter(([key]) => invitation.sections_order.includes(key) && invitation.sections[key]?.enabled).map(([,label]) => label),
      thumbnail: safeUrl(item.cover_url), demoUrl: safeUrl(item.demo_url || "") || `/i/${encodeURIComponent(invitation.slug)}`,
      createdAt: invitation.created_at, featuredOrder: index } satisfies CatalogItem;
  }));
  return items.filter((item): item is CatalogItem => item !== null);
}
