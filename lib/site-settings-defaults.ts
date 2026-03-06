import { DEFAULT_BLOCK_ORDER } from "@/lib/constants";
import type { SiteSettingsData } from "@/types/invitations";

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  blocks_order: DEFAULT_BLOCK_ORDER,
  blocks: {
    hero: {
      enabled: true,
      badge: "Invitaciones premium v1",
      title: "Invitaciones digitales que se sienten como una app.",
      subtitle:
        "Landing editable, CRM con RSVP y experiencias premium listas para compartir por WhatsApp.",
      primary_cta_text: "Cotizar por WhatsApp",
      primary_cta_href: "https://wa.me/5527225459?text=Hola%2C%20quiero%20cotizar%20una%20invitaci%C3%B3n%20digital%20premium.",
      secondary_cta_text: "Ver ejemplos",
      secondary_cta_href: "#examples",
    },
    examples: {
      enabled: true,
      title: "Ejemplos destacados",
      items: [
        {
          title: "Cumple 7 de Luis Arturo",
          description: "Tema astronautas con animación premium, mapa y RSVP.",
          slug: "cumple-7-luis-arturo-astronautas",
          cover_url:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    promo: {
      enabled: true,
      title: "Promo de lanzamiento",
      text: "Incluye configuración inicial del CRM y landing editable en cada paquete premium.",
      valid_from: "2026-02-01T00:00:00.000Z",
      valid_to: "2026-12-31T23:59:59.000Z",
    },
    packages: {
      enabled: true,
      title: "Paquetes",
      items: [
        {
          name: "Esencial",
          price: "$1,490 MXN",
          description: "Invitación pensada para móvil con RSVP y secciones clave.",
          features: ["1 tema", "Mapa embebido", "RSVP básico"],
        },
        {
          name: "Premium Astronautas",
          price: "$2,990 MXN",
          description: "Experiencia premium con animaciones wow y panel admin.",
          features: ["Layout v1 premium", "Open Graph listo para WhatsApp", "Export CSV"],
        },
      ],
    },
    extras: {
      enabled: true,
      title: "Extras",
      items: [
        "Personalización de copy y colores",
        "Carga inicial de galería",
        "Ajuste de assets para OG",
      ],
    },
    how_it_works: {
      enabled: true,
      title: "Cómo funciona",
      items: [
        "Definimos tema, fecha y lugar.",
        "Configuramos secciones activas en el CRM.",
        "Publicas y compartes un enlace listo para WhatsApp.",
      ],
    },
    faq: {
      enabled: true,
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Puedo editar la landing sin redeploy?",
          answer: "Sí. Todo se guarda en site_settings y se refleja en /.",
        },
        {
          question: "¿La vista cliente requiere cuenta?",
          answer: "No. Se comparte un link privado con token de solo lectura.",
        },
      ],
    },
    contact: {
      enabled: true,
      title: "Cotiza tu invitación",
      text: "Cuéntanos fecha, tema y tipo de evento para preparar una propuesta.",
      whatsapp_number: "5527225459",
      whatsapp_prefill_text: "Hola, quiero cotizar una invitación digital premium.",
    },
  },
  invitation_templates: [],
};

function cloneSettings(value: SiteSettingsData): SiteSettingsData {
  return JSON.parse(JSON.stringify(value)) as SiteSettingsData;
}

export function createDefaultSiteSettings(): SiteSettingsData {
  return cloneSettings(DEFAULT_SITE_SETTINGS);
}

export function normalizeSiteSettingsData(input?: SiteSettingsData | null): SiteSettingsData {
  const defaults = createDefaultSiteSettings();
  const source = input || defaults;

  return {
    ...defaults,
    ...source,
    blocks_order:
      Array.isArray(source.blocks_order) && source.blocks_order.length
        ? source.blocks_order
        : defaults.blocks_order,
    blocks: {
      ...defaults.blocks,
      ...source.blocks,
      hero: {
        ...defaults.blocks.hero,
        ...source.blocks?.hero,
      },
      examples: {
        ...defaults.blocks.examples,
        ...source.blocks?.examples,
        items: Array.isArray(source.blocks?.examples?.items)
          ? source.blocks.examples.items
          : defaults.blocks.examples.items,
      },
      promo: {
        ...defaults.blocks.promo,
        ...source.blocks?.promo,
      },
      packages: {
        ...defaults.blocks.packages,
        ...source.blocks?.packages,
        items: Array.isArray(source.blocks?.packages?.items)
          ? source.blocks.packages.items
          : defaults.blocks.packages.items,
      },
      extras: {
        ...defaults.blocks.extras,
        ...source.blocks?.extras,
        items: Array.isArray(source.blocks?.extras?.items)
          ? source.blocks.extras.items
          : defaults.blocks.extras.items,
      },
      how_it_works: {
        ...defaults.blocks.how_it_works,
        ...source.blocks?.how_it_works,
        items: Array.isArray(source.blocks?.how_it_works?.items)
          ? source.blocks.how_it_works.items
          : defaults.blocks.how_it_works.items,
      },
      faq: {
        ...defaults.blocks.faq,
        ...source.blocks?.faq,
        items: Array.isArray(source.blocks?.faq?.items)
          ? source.blocks.faq.items
          : defaults.blocks.faq.items,
      },
      contact: {
        ...defaults.blocks.contact,
        ...source.blocks?.contact,
      },
    },
    invitation_templates: Array.isArray(source.invitation_templates)
      ? source.invitation_templates
          .filter((template): template is NonNullable<SiteSettingsData["invitation_templates"]>[number] =>
            Boolean(
              template &&
                typeof template.id === "string" &&
                typeof template.name === "string" &&
                typeof template.source_invitation_id === "string",
            ),
          )
          .map((template) => ({
            ...template,
            description: template.description || "",
            created_at: template.created_at || "",
            updated_at: template.updated_at || "",
          }))
      : defaults.invitation_templates,
  };
}
