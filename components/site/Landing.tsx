"use client";

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
  const demos = buildDemos(settings);
  const packages = buildPackages(settings);
  const featured = resolveFeatured(demos);
  const whatsappHref = resolveWhatsAppHref(settings);
  const heroSubtitle =
    settings?.blocks?.hero?.subtitle ||
    "Diseno limpio, performance alto y flujo directo para convertir por WhatsApp.";

  return (
    <main className={`${styles["landing-root"]} ${variant === "examples" ? styles["landing-root--examples"] : ""}`}>
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

        <Link href="/admin" className={styles["landing-crm"]}>
          Acceso CRM
        </Link>
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
          {demos.map((item) => (
            <article key={`${item.slug}-${item.title}`} className={styles["landing-demo-card"]}>
              <div
                className={styles["landing-demo-media"]}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(8, 8, 12, 0.05), rgba(8, 8, 12, 0.55)), url(${item.cover_url})`,
                }}
                aria-hidden="true"
              />
              <div className={styles["landing-demo-copy"]}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link href={`/i/${item.slug}`}>Ver invitacion</Link>
              </div>
            </article>
          ))}
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
