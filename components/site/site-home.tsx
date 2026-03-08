"use client";

import Link from "next/link";
import { DEFAULT_PACKAGES_SERVICE_NOTE } from "@/lib/site-packages";
import { createWhatsAppUrl, isWithinRange } from "@/lib/utils";
import type { SiteSettingsData, SiteBlockKey } from "@/types/invitations";

type SiteHomeProps = {
  settings: SiteSettingsData;
};

export function SiteHome({ settings }: SiteHomeProps) {
  const now = new Date();
  const blockOrder = Array.isArray(settings?.blocks_order) ? settings.blocks_order : [];

  return (
    <main className="app-admin site-shell">
      <header className="site-topbar">
        <span>Invitaciones Digitales</span>
        <Link href="/admin" className="ghost-link">
          Acceso CRM
        </Link>
      </header>
      {blockOrder.map((key) => renderBlock(key, settings, now))}
    </main>
  );
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

function renderBlock(key: SiteBlockKey, settings: SiteSettingsData, now: Date) {
  switch (key) {
    case "hero": {
      const block = settings.blocks.hero;
      if (!block.enabled) {
        return null;
      }
      return (
        <section key={key} className="site-hero">
          <p className="eyebrow">{block.badge}</p>
          <h1>{block.title}</h1>
          <p className="lede">{block.subtitle}</p>
          <div className="action-row">
            <a href={block.primary_cta_href} className="button-primary">
              {block.primary_cta_text}
            </a>
            <a href={block.secondary_cta_href} className="button-secondary">
              {block.secondary_cta_text}
            </a>
          </div>
        </section>
      );
    }
    case "examples": {
      const block = settings.blocks.examples;
      if (!block.enabled) {
        return null;
      }

      const items = (Array.isArray(block.items) ? block.items : []).map((rawItem, index) => {
        const item = rawItem as typeof rawItem & { demo_url?: string };
        const slug = item.slug || extractDemoSlug(item.demo_url || "");
        const ogCoverUrl = slug
          ? `/api/public/invitations/${encodeURIComponent(slug)}/og-image`
          : "";
        const coverUrl = item.cover_url || ogCoverUrl || "/assets/hero-space-backdrop.svg";

        return {
          key: `${slug || "demo"}-${index}`,
          slug,
          title: item.title || `Demo ${index + 1}`,
          description: item.description || "Modelo listo para publicar.",
          coverUrl,
          ogCoverUrl,
        };
      });

      return (
        <section key={key} id="examples" className="content-panel">
          <div className="section-head">
            <p className="eyebrow">Demos</p>
            <h2>{block.title}</h2>
          </div>
          <div className="card-grid">
            {items.map((item) => (
              <Link key={item.key} href={item.slug ? `/i/${item.slug}` : "#"} className="preview-card">
                <div
                  className="preview-media"
                  style={{
                    backgroundImage: `linear-gradient(180deg, transparent, rgba(3, 17, 42, 0.8)), url(${item.coverUrl}), url(${item.ogCoverUrl || "/assets/hero-space-backdrop.svg"}), url(/assets/hero-space-backdrop.svg)`,
                  }}
                />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      );
    }
    case "promo": {
      const block = settings.blocks.promo;
      if (!block.enabled || !isWithinRange(now, block.valid_from, block.valid_to)) {
        return null;
      }
      return (
        <section key={key} className="promo-strip">
          <p className="eyebrow">Promo</p>
          <strong>{block.title}</strong>
          <span>{block.text}</span>
        </section>
      );
    }
    case "packages": {
      const block = settings.blocks.packages;
      if (!block.enabled) {
        return null;
      }
      const serviceNote = block.service_note || DEFAULT_PACKAGES_SERVICE_NOTE;
      return (
        <section key={key} className="content-panel">
          <div className="section-head">
            <p className="eyebrow">Paquetes</p>
            <h2>{block.title}</h2>
          </div>
          <p className="lede">{serviceNote}</p>
          <div className="card-grid">
            {(Array.isArray(block.items) ? block.items : []).map((item) => (
              <article key={item.name} className="package-card">
                <p className="package-price">{item.price}</p>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <ul>
                  {(Array.isArray(item.features) ? item.features : []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      );
    }
    case "extras": {
      const block = settings.blocks.extras;
      if (!block.enabled) {
        return null;
      }
      return (
        <section key={key} className="content-panel">
          <div className="section-head">
            <p className="eyebrow">Extras</p>
            <h2>{block.title}</h2>
          </div>
          <div className="stack-list">
            {(Array.isArray(block.items) ? block.items : []).map((item) => (
              <div key={item} className="list-row">
                {item}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "how_it_works": {
      const block = settings.blocks.how_it_works;
      if (!block.enabled) {
        return null;
      }
      return (
        <section key={key} className="content-panel">
          <div className="section-head">
            <p className="eyebrow">Proceso</p>
            <h2>{block.title}</h2>
          </div>
          <div className="stack-list">
            {(Array.isArray(block.items) ? block.items : []).map((item) => (
              <div key={item} className="list-row">
                {item}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case "faq": {
      const block = settings.blocks.faq;
      if (!block.enabled) {
        return null;
      }
      return (
        <section key={key} className="content-panel">
          <div className="section-head">
            <p className="eyebrow">Preguntas</p>
            <h2>{block.title}</h2>
          </div>
          <div className="faq-grid">
            {(Array.isArray(block.items) ? block.items : []).map((item) => (
              <article key={item.question} className="faq-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }
    case "contact": {
      const block = settings.blocks.contact;
      if (!block.enabled) {
        return null;
      }
      return (
        <section key={key} className="contact-panel">
          <div>
            <p className="eyebrow">Contacto</p>
            <h2>{block.title}</h2>
            <p>{block.text}</p>
          </div>
          <a
            href={createWhatsAppUrl(block.whatsapp_number, block.whatsapp_prefill_text)}
            className="button-primary"
          >
            Cotizar por WhatsApp
          </a>
        </section>
      );
    }
    default:
      return null;
  }
}
