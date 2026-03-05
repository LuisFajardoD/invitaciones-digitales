"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    description: "Estilo editorial con confirmacion por WhatsApp y agenda.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "XV Nocturno",
    description: "Visual premium con secciones dinamicas y branding.",
    slug: "cumple-7-luis-arturo-astronautas",
    cover_url:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  },
];

const FALLBACK_PACKAGES: PackageItem[] = [
  {
    name: "Basica",
    price: "$1,490 MXN",
    description: "Ideal para eventos pequenos con salida rapida.",
    features: ["Invitacion responsive", "Mapa y RSVP", "Entrega en 48h"],
  },
  {
    name: "Pro",
    price: "$2,490 MXN",
    description: "Mas personalizacion y narrativa visual.",
    features: ["Animaciones suaves", "Galeria y secciones extra", "Soporte prioritario"],
  },
  {
    name: "Premium",
    price: "$3,490 MXN",
    description: "Experiencia completa tipo app con look cinematografico.",
    features: ["Direccion creativa", "Optimizada para WhatsApp", "Acompanamiento de lanzamiento"],
  },
];

function buildDemos(settings: SiteSettingsData): DemoItem[] {
  const items = settings?.blocks?.examples?.items;
  if (Array.isArray(items) && items.length) {
    return items.slice(0, 6);
  }
  return FALLBACK_DEMOS;
}

function buildPackages(settings: SiteSettingsData): PackageItem[] {
  const items = settings?.blocks?.packages?.items;
  if (!Array.isArray(items) || !items.length) {
    return FALLBACK_PACKAGES;
  }

  return FALLBACK_PACKAGES.map((fallback, index) => {
    const source = items[index];
    if (!source) {
      return fallback;
    }

    return {
      name: fallback.name,
      price: source.price || fallback.price,
      description: source.description || fallback.description,
      features:
        Array.isArray(source.features) && source.features.length
          ? source.features.slice(0, 4)
          : fallback.features,
    };
  });
}

function resolveWhatsAppHref(settings: SiteSettingsData): string {
  const number = settings?.blocks?.contact?.whatsapp_number || "5527225459";
  const prefill =
    settings?.blocks?.contact?.whatsapp_prefill_text ||
    "Hola, quiero cotizar una invitacion digital premium.";
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
  const demos = buildDemos(settings);
  const packages = buildPackages(settings);
  const featured = resolveFeatured(demos);
  const whatsappHref = resolveWhatsAppHref(settings);
  const heroSubtitle =
    settings?.blocks?.hero?.subtitle ||
    "Diseno limpio, performance alto y flujo directo para convertir por WhatsApp.";
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

        <nav className={styles["landing-nav"]} aria-label="Navegacion publica">
          <a href="#demos">Demos</a>
          <a href="#paquetes">Paquetes</a>
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

          <Link href="/admin" className={styles["landing-crm"]}>
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
          <Link href={`/i/${featured.slug}`}>Abrir invitacion</Link>
        </article>
      </section>

      <section id="demos" className={styles["landing-section"]}>
        <div className={styles["landing-section-head"]}>
          <p>Demos</p>
          <h2>Modelos listos para publicar</h2>
        </div>

        <div className={styles["landing-demos-grid"]}>
          {demos.map((item) => {
            const demoKey = `${item.slug}-${item.title}`;
            const coverUrl = item.cover_url?.trim() || "";
            const hasCover = coverUrl.length > 0;
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
                      src={coverUrl}
                      alt=""
                      loading="lazy"
                      className={`${styles["landing-demo-image"]} ${
                        status === "loaded" ? styles["landing-demo-image--ready"] : ""
                      }`}
                      onLoad={() => {
                        setCoverStatus((prev) => ({ ...prev, [demoKey]: "loaded" }));
                      }}
                      onError={() => {
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
                  <Link href={`/i/${item.slug}`}>Ver invitacion</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="paquetes" className={styles["landing-section"]}>
        <div className={styles["landing-section-head"]}>
          <p>Paquetes</p>
          <h2>Opciones claras para cada etapa</h2>
        </div>

        <div className={styles["landing-packages-grid"]}>
          {packages.map((item) => {
            const isPremium = item.name === "Premium";

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

      <section id="contacto" className={styles["landing-contact"]}>
        <div>
          <p>Contacto</p>
          <h2>{settings?.blocks?.contact?.title || "Listo para cotizar tu evento"}</h2>
          <p>{settings?.blocks?.contact?.text || "Comparte fecha, tema y numero de invitados para preparar propuesta."}</p>
        </div>
        <a href={whatsappHref} className={styles["landing-cta-primary"]}>
          Cotizar por WhatsApp
        </a>
      </section>
    </main>
  );
}
