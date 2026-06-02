import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { ViewerReactApp } from "@/app/i/viewer-react-app";
import { buildVersionedOgImagePath, getRsvpOgImageOverride } from "@/lib/invitation-og-overrides";
import { getClientRsvpView } from "@/lib/repository";

export const dynamic = "force-dynamic";

type ClientRsvpPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
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

function resolveAbsoluteUrl(input: string, origin: string) {
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  return `${origin}${input.startsWith("/") ? input : `/${input}`}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: ClientRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { token } = await searchParams;
  const origin = await resolveRequestOrigin();
  const result = token ? await getClientRsvpView(slug, token) : null;
  const invitation = result?.invitation;

  if (!invitation) {
    return {
      title: "RSVP no disponible",
      description: "Este enlace de confirmación no está activo.",
      robots: { index: false, follow: false },
    };
  }

  const override = getRsvpOgImageOverride(invitation.slug);
  const imageUrl = override
    ? resolveAbsoluteUrl(buildVersionedOgImagePath(override), origin)
    : `${origin}/api/public/invitations/${encodeURIComponent(invitation.slug)}/og-image`;
  const pageUrl = `${origin}/i/${invitation.slug}/rsvp${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const title = `Confirma tu asistencia | ${invitation.share.og_title}`;
  const description = "Responde si podrás acompañarnos y revisa los detalles de la invitación.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: override?.width ?? 1200,
          height: override?.height ?? 630,
          type: override?.type ?? "image/jpeg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ClientRsvpPage({ params, searchParams }: ClientRsvpPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const result = token ? await getClientRsvpView(slug, token) : null;

  if (!result) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Seguridad</p>
        <h1>Acceso no autorizado</h1>
        <p className="muted">El token no es válido para esta vista.</p>
        <Link href="/" className="button-primary">
          Ir al inicio
        </Link>
      </section>
    );
  }

  return <ViewerReactApp initialInvitationThemeId={result.invitation.theme_id} />;
}
