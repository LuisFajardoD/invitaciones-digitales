import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ViewerReactApp } from "@/app/i/viewer-react-app";
import { getPublicInvitationBySlug } from "@/lib/repository";

export const dynamic = "force-dynamic";

type InvitationPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveRequestOrigin() {
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto") || "https";
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host") || "";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function appendVersionParam(url: string, version: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function buildVersionToken(version: string) {
  const time = Number.isNaN(Date.parse(version)) ? NaN : Date.parse(version);
  if (Number.isFinite(time) && time > 0) {
    return String(time);
  }
  return version.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "1";
}

function resolveOgImageUrl({
  origin,
  rawUrl,
  fallbackSlug,
  version,
}: {
  origin: string;
  rawUrl: string;
  fallbackSlug: string;
  version: string;
}) {
  const versionToken = buildVersionToken(version);
  const trimmed = rawUrl.trim();
  if (trimmed) {
    if (/^https?:\/\//i.test(trimmed)) {
      return appendVersionParam(trimmed, versionToken);
    }

    if (trimmed.startsWith("/")) {
      return appendVersionParam(`${origin}${trimmed}`, versionToken);
    }

    return appendVersionParam(`${origin}/${trimmed.replace(/^\/+/, "")}`, versionToken);
  }

  return `${origin}/api/public/invitations/${encodeURIComponent(fallbackSlug)}/og-image?v=${encodeURIComponent(versionToken)}`;
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const origin = await resolveRequestOrigin();
  let invitation = null;

  try {
    invitation = await getPublicInvitationBySlug(slug);
  } catch {
    invitation = null;
  }

  if (!invitation) {
    return {
      title: "Invitación no disponible",
      description: "Este enlace no está activo.",
    };
  }

  const ogImageSource =
    invitation.share.og_image_url ||
    invitation.sections.hero.background?.image_url ||
    invitation.sections.hero.background_image_url ||
    "";
  const ogImageUrl = resolveOgImageUrl({
    origin,
    rawUrl: ogImageSource,
    fallbackSlug: invitation.slug,
    version: invitation.updated_at,
  });

  return {
    title: invitation.share.og_title,
    description: invitation.share.og_description,
    alternates: {
      canonical: `${origin}/i/${invitation.slug}`,
    },
    openGraph: {
      title: invitation.share.og_title,
      description: invitation.share.og_description,
      url: `${origin}/i/${invitation.slug}`,
      images: [
        {
          url: ogImageUrl,
          alt: invitation.share.og_title,
        },
      ],
      type: invitation.share.og_type as "website",
    },
    twitter: {
      card: "summary_large_image",
      title: invitation.share.og_title,
      description: invitation.share.og_description,
      images: [ogImageUrl],
    },
  };
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { slug } = await params;
  let invitation = null;

  try {
    invitation = await getPublicInvitationBySlug(slug);
  } catch {
    invitation = null;
  }

  if (!invitation) {
    return (
      <div className="app-viewer public-viewer">
        <div className="theme-viewer">
          <div className="public-viewer__frame">
            <section className="empty-state">
              <p className="eyebrow">Estado</p>
              <h1>Invitación no disponible</h1>
              <p className="muted">Este enlace no está activo.</p>
              <Link href="/" className="button-primary">
                Ver invitaciones
              </Link>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date().getTime() > new Date(invitation.active_until).getTime();
  if (isExpired) {
    return (
      <div className="app-viewer public-viewer">
        <div className="theme-viewer">
          <div className="public-viewer__frame">
            <section className="status-card">
              <p className="eyebrow">Evento finalizado</p>
              <h1>{invitation.expired_page.title}</h1>
              <p className="muted">{invitation.expired_page.message}</p>
              <div className="action-row" style={{ justifyContent: "center" }}>
                <Link href={invitation.expired_page.primary_cta.href} className="button-primary">
                  {invitation.expired_page.primary_cta.text}
                </Link>
                <a href={invitation.expired_page.secondary_cta.href} className="button-secondary">
                  {invitation.expired_page.secondary_cta.text}
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return <ViewerReactApp initialInvitationThemeId={invitation.theme_id} />;
}
