import { DEFAULT_BLOCK_ORDER } from "@/lib/constants";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
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
      title: "Tipos de invitación y precios",
      service_note: DEFAULT_PACKAGES_SERVICE_NOTE,
      items: RECOMMENDED_SITE_PACKAGES.map((item) => ({
        ...item,
        features: [...item.features],
      })),
    },
    extras: {
      enabled: true,
      title: "Extras",
      items: [
        "Entrega express 24 horas (+$150): prioridad en diseño y entrega antes que trabajos normales.",
        "Cambio de fecha después del cierre (solo invitaciones web, +$80): actualización de fecha/hora sin rediseño completo.",
        "Reporte de asistentes en Excel (solo invitaciones web, +$100): lista editable de confirmaciones para control del evento.",
        "QR listo para imprimir (+$80): archivo limpio para mesa de regalos, recepción o acceso.",
      ],
    },
    how_it_works: {
      enabled: true,
      title: "Secciones disponibles para invitación web",
      items: [
        "Catálogo: Portada, Bitácora de misión, Acciones rápidas, Cuenta regresiva, Ubicación, Checklist, Itinerario, Confirma tu asistencia, Código de vestimenta, Archivo visual, Regalos, Preguntas frecuentes, Canal directo, Transmisión en vivo, Transporte y Hospedaje.",
        "Web Esencial: el cliente elige hasta 4 secciones del catálogo.",
        "Web Premium: incluye todas las secciones que necesite del catálogo.",
        "Las invitaciones web incluyen confirmación de asistencia, panel RSVP y exportación PDF. Excel se ofrece como extra.",
      ],
    },
    faq: {
      enabled: true,
      title: "Políticas y condiciones",
      items: [
        {
          question: "¿Cómo se maneja el anticipo?",
          answer: "Se requiere 50% para iniciar y 50% antes de la entrega final.",
        },
        {
          question: "¿Cuántos cambios incluye cada paquete?",
          answer:
            "Imagen Esencial, Interactiva y Video Invitación incluyen 1 ajuste. Web Esencial incluye 1 ronda de cambios. Web Premium incluye 2 rondas. Cambios adicionales se cotizan por separado.",
        },
        {
          question: "¿Qué se considera un ajuste?",
          answer:
            "Sí cuenta: cambiar textos, mover un detalle, cambiar color o imagen, corregir datos. No cuenta como ajuste menor: cambiar temática completa, estilo completo, tipo de invitación o rehacer desde cero.",
        },
        {
          question: "¿Tienen tiempos de entrega fijos?",
          answer:
            "El tiempo de entrega es aproximado según carga de trabajo y tipo de invitación. Si necesitas prioridad, se puede contratar entrega express.",
        },
        {
          question: "¿Qué pasa si cambian la fecha después del cierre?",
          answer:
            "Una vez entregada y aprobada la invitación final, los cambios posteriores generan costo adicional. En invitaciones web el cambio de fecha posterior al cierre tiene costo de +$80.",
        },
        {
          question: "¿Qué incluye RSVP en paquetes web?",
          answer:
            "Las invitaciones web incluyen confirmación de asistencia, panel RSVP y exportación PDF. El reporte editable en Excel se ofrece como extra.",
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

function shouldUpgradeLegacyPackages(items: SiteSettingsData["blocks"]["packages"]["items"]) {
  if (!Array.isArray(items) || !items.length) {
    return false;
  }

  const normalizeLabel = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedNames = items.map((item) =>
    normalizeLabel(item?.name || ""),
  );

  const isOldTwoPackageSet =
    items.length === 2 && normalizedNames[0] === "esencial" && normalizedNames[1] === "premium astronautas";

  const isOldThreePackageSet =
    items.length === 3 && normalizedNames[0] === "basica" && normalizedNames[1] === "pro" && normalizedNames[2] === "premium";
  const isOldFiveOrSixPackageSet =
    (items.length === 5 || items.length === 6) &&
    normalizedNames.includes("estatica") &&
    normalizedNames.includes("interactiva") &&
    normalizedNames.includes("video") &&
    normalizedNames.some((value) => value.includes("web")) &&
    normalizedNames.some((value) => value.includes("animada web") || value.includes("premium astronautas"));

  if (!isOldTwoPackageSet && !isOldThreePackageSet && !isOldFiveOrSixPackageSet) {
    return false;
  }

  // Migrate the historical Esencial/Premium Astronautas preset unconditionally.
  if (isOldTwoPackageSet) {
    return true;
  }

  const hasPlaceholderPricing = items.every((item) => {
    const price = (item?.price || "").trim().toLowerCase();
    return !price || /cotizar/.test(price);
  });

  const hasPlaceholderDescription = items.every((item) => {
    const description = (item?.description || "").trim().toLowerCase();
    return !description || /servicio personalizado/.test(description);
  });

  const hasPlaceholderFeatures = items.every((item) => {
    const features = Array.isArray(item?.features) ? item.features : [];
    if (!features.length) {
      return true;
    }
    if (features.length > 1) {
      return false;
    }
    return /diseno|diseño/.test(features[0] || "");
  });

  return hasPlaceholderPricing && hasPlaceholderDescription && hasPlaceholderFeatures;
}

function normalizeLegacyText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function shouldUpgradeLegacyMarketingBlocks(source: SiteSettingsData, packageItems: SiteSettingsData["blocks"]["packages"]["items"]) {
  if (!Array.isArray(packageItems) || packageItems.length !== 2) {
    return false;
  }

  const packageNames = packageItems.map((item) => normalizeLegacyText(item?.name || ""));
  const isLegacyTwoPackageSet =
    packageNames[0] === "esencial" && packageNames[1] === "premium astronautas";

  if (!isLegacyTwoPackageSet) {
    return false;
  }

  const extrasItems = Array.isArray(source.blocks?.extras?.items)
    ? source.blocks.extras.items.map((item) => normalizeLegacyText(item || ""))
    : [];
  const howItems = Array.isArray(source.blocks?.how_it_works?.items)
    ? source.blocks.how_it_works.items.map((item) => normalizeLegacyText(item || ""))
    : [];
  const faqItems = Array.isArray(source.blocks?.faq?.items)
    ? source.blocks.faq.items.map((item) =>
        normalizeLegacyText(`${item?.question || ""} ${item?.answer || ""}`),
      )
    : [];

  const hasLegacyExtras =
    extrasItems.length >= 3 &&
    extrasItems.some((item) => item.includes("personalizacion de copy y colores")) &&
    extrasItems.some((item) => item.includes("carga inicial de galeria"));
  const hasLegacyHow =
    howItems.length >= 3 &&
    howItems.some((item) => item.includes("definimos tema, fecha y lugar")) &&
    howItems.some((item) => item.includes("publicas y compartes un link listo para whatsapp"));
  const hasLegacyFaq =
    faqItems.length >= 2 &&
    faqItems.some((item) => item.includes("puedo editar la landing sin redeploy")) &&
    faqItems.some((item) => item.includes("la vista cliente requiere cuenta"));

  return hasLegacyExtras || hasLegacyHow || hasLegacyFaq;
}

export function createDefaultSiteSettings(): SiteSettingsData {
  return cloneSettings(DEFAULT_SITE_SETTINGS);
}

export function normalizeSiteSettingsData(input?: SiteSettingsData | null): SiteSettingsData {
  const defaults = createDefaultSiteSettings();
  const source = input || defaults;
  const sourcePackageItems = Array.isArray(source.blocks?.packages?.items)
    ? source.blocks.packages.items
    : defaults.blocks.packages.items;
  const shouldUpgradeMarketingBlocks = shouldUpgradeLegacyMarketingBlocks(source, sourcePackageItems);
  const packageItems = shouldUpgradeLegacyPackages(sourcePackageItems)
    ? defaults.blocks.packages.items
    : sourcePackageItems;

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
        service_note:
          source.blocks?.packages?.service_note || defaults.blocks.packages.service_note,
        items: packageItems,
      },
      extras: {
        ...defaults.blocks.extras,
        ...source.blocks?.extras,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.extras.title
            : (source.blocks?.extras?.title || defaults.blocks.extras.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.extras.items
            : Array.isArray(source.blocks?.extras?.items)
              ? source.blocks.extras.items
              : defaults.blocks.extras.items,
      },
      how_it_works: {
        ...defaults.blocks.how_it_works,
        ...source.blocks?.how_it_works,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.how_it_works.title
            : (source.blocks?.how_it_works?.title || defaults.blocks.how_it_works.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.how_it_works.items
            : Array.isArray(source.blocks?.how_it_works?.items)
              ? source.blocks.how_it_works.items
              : defaults.blocks.how_it_works.items,
      },
      faq: {
        ...defaults.blocks.faq,
        ...source.blocks?.faq,
        title:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.faq.title
            : (source.blocks?.faq?.title || defaults.blocks.faq.title),
        items:
          shouldUpgradeMarketingBlocks
            ? defaults.blocks.faq.items
            : Array.isArray(source.blocks?.faq?.items)
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
