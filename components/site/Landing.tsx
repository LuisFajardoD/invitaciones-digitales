"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_PACKAGES_SERVICE_NOTE, RECOMMENDED_SITE_PACKAGES } from "@/lib/site-packages";
import { createWhatsAppUrl } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/invitations";
import styles from "./Landing.module.css";

type LandingProps = {
  settings: SiteSettingsData;
  variant?: "home" | "examples";
};

type DemoItem = {
  title: string;
  description: string;
  slug: string;
  cover_url: string;
};

type RawDemoItem = Partial<DemoItem> & {
  demo_url?: string;
};

type PackageItem = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "site-theme-mode";

const FALLBACK_DEMOS: DemoItem[] = [
  {
    title: "Cumple 7 de Luis Arturo",
    description: "Tema astronautas con experiencia inmersiva, mapa y RSVP.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Boda Minimal",
    description: "Estilo editorial con confirmación por WhatsApp y agenda.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "XV Nocturno",
    description: "Visual premium con secciones dinámicas y branding.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  },
];

const FALLBACK_PACKAGES: PackageItem[] = [
  ...RECOMMENDED_SITE_PACKAGES.map((item) => ({
    name: item.name,
    price: item.price,
    description: item.description,
    features: [...item.features],
  })),
];

function buildDemos(settings: SiteSettingsData): DemoItem[] {
  const items = settings?.blocks?.examples?.items;
  if (Array.isArray(items) && items.length) {
    const normalizedItems = items
      .slice(0, 6)
      .map((item, index) => {
        const source = item as RawDemoItem;
        const slugFromUrl = source.demo_url ? extractDemoSlug(source.demo_url) : "";
        const slug = (source.slug || slugFromUrl || "").trim();
        const coverFromSlug = slug ? `/api/public/invitations/${encodeURIComponent(slug)}/og-image` : "";

        if (!slug) {
          return null;
        }

        return {
          title: (source.title || `Demo ${index + 1}`).trim(),
          description: (source.description || "Modelo listo para publicar.").trim(),
          slug,
          cover_url: (source.cover_url || coverFromSlug).trim(),
        } as DemoItem;
      })
      .filter((item): item is DemoItem => Boolean(item));

    if (normalizedItems.length) {
      return normalizedItems;
    }
  }
  return FALLBACK_DEMOS;
}

function extractDemoSlug(value: string) {
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

function buildPackages(settings: SiteSettingsData): PackageItem[] {
  const items = settings?.blocks?.packages?.items;
  const normalizedItems = Array.isArray(items)
    ? items
        .map((item) => ({
          name: (item?.name || "").trim(),
          price: (item?.price || "").trim(),
          description: (item?.description || "").trim(),
          features: Array.isArray(item?.features)
            ? item.features.map((feature) => feature.trim()).filter(Boolean)
            : [],
        }))
        .filter((item) => Boolean(item.name || item.price || item.description || item.features.length))
    : [];

  if (!normalizedItems.length) {
    return FALLBACK_PACKAGES;
  }

  return normalizedItems.slice(0, 8).map((item) => ({
    name: item.name || "Servicio",
    price: item.price || "Precio a cotizar",
    description: item.description || "Servicio personalizado para tu evento.",
    features: item.features.length ? item.features : ["Diseño personalizado"],
  }));
}

function resolveWhatsAppHref(settings: SiteSettingsData): string {
  const number = settings?.blocks?.contact?.whatsapp_number || "5527225459";
    const prefill =
      settings?.blocks?.contact?.whatsapp_prefill_text ||
    "Hola, quiero cotizar una invitación digital premium.";
  return createWhatsAppUrl(number, prefill);
}

function resolveFeatured(demos: DemoItem[]): DemoItem {
  return (
    demos.find((item) => item.slug === "cumple-7-luis-arturo-astronautas") ||
    demos[0] ||
    FALLBACK_DEMOS[0]
  );
}

export function Landing({ settings, variant = "home" }: LandingProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [coverStatus, setCoverStatus] = useState<Record<string, "loaded" | "error">>({});
  const [coverSourceIndex, setCoverSourceIndex] = useState<Record<string, number>>({});
  const demos = buildDemos(settings);
  const packages = buildPackages(settings);
  const packageServiceNote =
    settings?.blocks?.packages?.service_note?.trim() || DEFAULT_PACKAGES_SERVICE_NOTE;
  const extrasItems =
    settings?.blocks?.extras?.enabled && Array.isArray(settings?.blocks?.extras?.items)
      ? settings.blocks.extras.items.map((item) => item.trim()).filter(Boolean)
      : [];
  const extrasTitle = settings?.blocks?.extras?.title?.trim() || "Extras";
  const howItems =
    settings?.blocks?.how_it_works?.enabled && Array.isArray(settings?.blocks?.how_it_works?.items)
      ? settings.blocks.how_it_works.items.map((item) => item.trim()).filter(Boolean)
      : [];
  const howTitle = settings?.blocks?.how_it_works?.title?.trim() || "Cómo funciona";
  const faqItems =
    settings?.blocks?.faq?.enabled && Array.isArray(settings?.blocks?.faq?.items)
      ? settings.blocks.faq.items.filter((item) => (item?.question || item?.answer || "").trim())
      : [];
  const faqTitle = settings?.blocks?.faq?.title?.trim() || "Preguntas frecuentes";
  const featured = resolveFeatured(demos);
  const whatsappHref = resolveWhatsAppHref(settings);
  const heroSubtitle =
    settings?.blocks?.hero?.subtitle ||
    "Diseño limpio, performance alto y flujo directo para convertir por WhatsApp.";
  const rootThemeClass =
    themeMode === "light" ? styles["landing-root--light"] : styles["landing-root--dark"];

  useEffect(() => {
    const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedMode === "light" || savedMode === "dark") {
      setThemeMode(savedMode);
      return;
    }

    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    setThemeMode(prefersLight ? "light" : "dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return (
    <main
      className={`${styles["landing-root"]} ${rootThemeClass} ${
        variant === "examples" ? styles["landing-root--examples"] : ""
      }`}
    >
      <div className={styles["landing-backdrop"]} aria-hidden="true" />

      <header className={styles["landing-header"]}>
        <Link href="/" className={styles["landing-brand"]}>
          Invitaciones Digitales
        </Link>

        <nav className={styles["landing-nav"]} aria-label="Navegación pública">
          <a href="#demos">Demos</a>
          <a href="#paquetes">Paquetes</a>
          <a href="#extras">Extras</a>
          <a href="#politicas">Políticas</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <div className={styles["landing-header-actions"]}>
          <button
            type="button"
            className={styles["landing-theme-toggle"]}
            onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
            aria-label={`Cambiar a tema ${themeMode === "dark" ? "claro" : "oscuro"}`}
          >
            {themeMode === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>

          <Link href="/admin/login" className={styles["landing-crm"]}>
            Acceso CRM
          </Link>
        </div>
      </header>

      <section className={styles["landing-hero"]}>
        <div className={styles["landing-copy"]}>
          <p className={styles["landing-kicker"]}>Estudio digital</p>
          <h1>Invitaciones digitales animadas</h1>
          <p>{heroSubtitle}</p>

          <div className={styles["landing-actions"]}>
            <Link href="/examples#demos" className={styles["landing-cta-primary"]}>
              Ver demos
            </Link>
            <a href={whatsappHref} className={styles["landing-cta-secondary"]}>
              Cotizar por WhatsApp
            </a>
          </div>
        </div>

        <article className={styles["landing-preview"]}>
          <p className={styles["landing-preview-label"]}>Demo destacada</p>
          <h2>Astronautas</h2>
          <p>{featured.title}</p>
          <Link href={`/i/${featured.slug}`}>Abrir invitación</Link>
        </article>
      </section>

      <section id="demos" className={styles["landing-section"]}>
        <div className={styles["landing-section-head"]}>
          <p>Demos</p>
          <h2>{settings?.blocks?.examples?.title || "Modelos listos para publicar"}</h2>
        </div>

        <div className={styles["landing-demos-grid"]}>
          {demos.map((item) => {
            const demoKey = `${item.slug}-${item.title}`;
            const coverUrl = item.cover_url?.trim() || "";
            const ogCoverUrl = item.slug
              ? `/api/public/invitations/${encodeURIComponent(item.slug)}/og-image`
              : "";
            const coverCandidates = Array.from(
              new Set([coverUrl, ogCoverUrl, "/assets/hero-space-backdrop.svg"].filter(Boolean)),
            );
            const activeIndex = coverSourceIndex[demoKey] ?? 0;
            const activeCoverUrl = coverCandidates[activeIndex] || "";
            const hasCover = activeCoverUrl.length > 0;
            const status = coverStatus[demoKey];
            const showPlaceholder = !hasCover || status === "error" || status !== "loaded";

            return (
              <article key={demoKey} className={styles["landing-demo-card"]}>
                <div
                  className={`${styles["landing-demo-media"]} ${
                    showPlaceholder ? styles["landing-demo-media--placeholder"] : ""
                  }`}
                  aria-hidden="true"
                >
                  {hasCover ? (
                    <img
                      src={activeCoverUrl}
                      alt=""
                      loading="lazy"
                      className={`${styles["landing-demo-image"]} ${
                        status === "loaded" ? styles["landing-demo-image--ready"] : ""
                      }`}
                      onLoad={() => {
                        setCoverStatus((prev) => ({ ...prev, [demoKey]: "loaded" }));
                      }}
                      onError={() => {
                        if (activeIndex < coverCandidates.length - 1) {
                          setCoverSourceIndex((prev) => ({
                            ...prev,
                            [demoKey]: activeIndex + 1,
                          }));
                          setCoverStatus((prev) => ({ ...prev, [demoKey]: "error" }));
                          return;
                        }
                        setCoverStatus((prev) => ({ ...prev, [demoKey]: "error" }));
                      }}
                    />
                  ) : null}

                  {showPlaceholder ? (
                    <span className={styles["landing-demo-fallback-label"]}>Vista previa</span>
                  ) : null}
                </div>

                <div className={styles["landing-demo-copy"]}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link href={`/i/${item.slug}`}>Ver invitación</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="paquetes" className={styles["landing-section"]}>
        <div className={styles["landing-section-head"]}>
          <p>Paquetes</p>
          <h2>{settings?.blocks?.packages?.title || "Opciones claras para cada etapa"}</h2>
        </div>
        <p className={styles["landing-packages-note"]}>{packageServiceNote}</p>

        <div className={styles["landing-packages-grid"]}>
          {packages.map((item) => {
            const isPremium = /animada web/i.test(item.name);

            return (
              <article
                key={item.name}
                className={`${styles["landing-package-card"]} ${isPremium ? styles["landing-package-card--premium"] : ""}`}
              >
                <p className={styles["landing-package-name"]}>{item.name}</p>
                <p className={styles["landing-package-price"]}>{item.price}</p>
                <p className={styles["landing-package-description"]}>{item.description}</p>
                <ul>
                  {item.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {howItems.length ? (
        <section className={styles["landing-section"]}>
          <div className={styles["landing-section-head"]}>
            <p>Web</p>
            <h2>{howTitle}</h2>
          </div>

          <div className={styles["landing-list"]}>
            {howItems.map((item) => (
              <article key={item} className={styles["landing-list-card"]}>
                {item}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {extrasItems.length ? (
        <section id="extras" className={styles["landing-section"]}>
          <div className={styles["landing-section-head"]}>
            <p>Servicios extra</p>
            <h2>{extrasTitle}</h2>
          </div>

          <div className={styles["landing-list"]}>
            {extrasItems.map((item) => (
              <article key={item} className={styles["landing-list-card"]}>
                {item}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {faqItems.length ? (
        <section id="politicas" className={styles["landing-section"]}>
          <div className={styles["landing-section-head"]}>
            <p>Condiciones</p>
            <h2>{faqTitle}</h2>
          </div>

          <div className={styles["landing-faq-grid"]}>
            {faqItems.map((item, index) => (
              <article
                key={`${item.question}-${index}`}
                className={styles["landing-faq-card"]}
              >
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="contacto" className={styles["landing-contact"]}>
        <div>
          <p>Contacto</p>
          <h2>{settings?.blocks?.contact?.title || "Listo para cotizar tu evento"}</h2>
          <p>{settings?.blocks?.contact?.text || "Comparte fecha, tema y número de invitados para preparar propuesta."}</p>
        </div>
        <a href={whatsappHref} className={styles["landing-cta-primary"]}>
          Cotizar por WhatsApp
        </a>
      </section>
    </main>
  );
}
