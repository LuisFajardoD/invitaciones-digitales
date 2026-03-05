import { DEFAULT_BLOCK_ORDER } from "@/lib/constants";
import type { SiteSettingsData } from "@/types/invitations";

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  blocks_order: DEFAULT_BLOCK_ORDER,
  blocks: {
    hero: {
      enabled: true,
      badge: "",
      title: "",
      subtitle: "",
      primary_cta_text: "",
      primary_cta_href: "",
      secondary_cta_text: "",
      secondary_cta_href: "",
    },
    examples: {
      enabled: true,
      title: "",
      items: [],
    },
    promo: {
      enabled: false,
      title: "",
      text: "",
      valid_from: "",
      valid_to: "",
    },
    packages: {
      enabled: true,
      title: "",
      items: [],
    },
    extras: {
      enabled: true,
      title: "",
      items: [],
    },
    how_it_works: {
      enabled: true,
      title: "",
      items: [],
    },
    faq: {
      enabled: true,
      title: "",
      items: [],
    },
    contact: {
      enabled: true,
      title: "",
      text: "",
      whatsapp_number: "",
      whatsapp_prefill_text: "",
    },
  },
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
  };
}
