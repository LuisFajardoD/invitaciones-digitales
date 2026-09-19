import { categories, catalogStyles, DEFAULT_INVITATION_TYPE, invitationTypes } from "@/lib/catalog-taxonomy";
import type { InvitationRecord } from "@/types/invitations";

type Catalog = NonNullable<InvitationRecord["catalog"]>;

const legacy: Record<string, Pick<Catalog, "category" | "subcategory" | "styles">> = {
  "demo-espacio": { category: "infantiles", subcategory: "Espacio", styles: ["Temático", "Colorido", "Divertido"] },
  "demo-dinosaurios": { category: "infantiles", subcategory: "Dinosaurios", styles: ["Temático", "Divertido"] },
  "demo-futbol": { category: "infantiles", subcategory: "Deportes", styles: ["Temático", "Moderno"] },
  "demo-carreras": { category: "infantiles", subcategory: "Carreras", styles: ["Temático", "Neón"] },
  "demo-fantasia": { category: "infantiles", subcategory: "Princesas / fantasía", styles: ["Fantasía", "Colorido"] },
  "demo-animales": { category: "infantiles", subcategory: "Animales", styles: ["Temático", "Divertido"] },
  "demo-videojuegos": { category: "infantiles", subcategory: "Videojuegos", styles: ["Moderno", "Neón"] },
  "demo-princesas": { category: "infantiles", subcategory: "Princesas / fantasía", styles: ["Fantasía", "Elegante"] },
};

export function normalizeCatalogMetadata(value: InvitationRecord["catalog"], slug: string): Catalog {
  const fallback = legacy[slug];
  const type = invitationTypes.find((item) => item.slug === value?.invitation_type)?.slug || DEFAULT_INVITATION_TYPE;
  const category = value ? (categories.find((item) => item.id === value.category)?.id || "") : (fallback?.category || "");
  const subcategory = categories.find((item) => item.id === category)?.subcategories.find((item) => item === value?.subcategory)
    || (value ? "" : fallback?.subcategory || "");
  const styles = Array.isArray(value?.styles)
    ? value.styles.filter((item) => catalogStyles.includes(item))
    : fallback?.styles || [];
  return { invitation_type: type, category, subcategory, styles, asset_url: value?.asset_url || "",
    card_title: value?.card_title || "", card_description: value?.card_description || "",
    preview_url: value?.preview_url || "", feature_tags: Array.isArray(value?.feature_tags) ? value.feature_tags : [] };
}

export function getDemoDisplayName(demo: InvitationRecord): string {
  return demo.catalog?.card_title?.trim()
    || demo.share.og_title?.trim()
    || demo.sections.hero.title?.trim()
    || demo.slug;
}

export function validateCatalogMetadata(catalog: Catalog, isDemo: boolean, status: InvitationRecord["status"], slug = "") {
  if (!isDemo || status !== "published") return;
  if (!catalog.invitation_type.startsWith("web-")) {
    throw new Error("Los formatos de archivo se administran en Sitio Web Público → Muestras.");
  }
  const category = categories.find((item) => item.id === catalog.category);
  if (!category || !category.subcategories.includes(catalog.subcategory)) {
    throw new Error("Selecciona una categoría y subcategoría válidas antes de publicar el demo.");
  }
  if (!(catalog.card_title?.trim() || legacy[slug])) throw new Error("Escribe el título de la tarjeta del demo.");
  if (!catalog.preview_url && !legacy[slug]) throw new Error("Carga la imagen estática de vista previa antes de publicar el demo.");
}
