import Link from "next/link";
import type { Metadata } from "next";
import { ViewerReactApp } from "@/app/i/viewer-react-app";
import { getPublicInvitationBySlug } from "@/lib/repository";

export const dynamic = "force-dynamic";

type InvitationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
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

  return {
    title: invitation.share.og_title,
    description: invitation.share.og_description,
    openGraph: {
      title: invitation.share.og_title,
      description: invitation.share.og_description,
      url: `/i/${invitation.slug}`,
      images: [invitation.share.og_image_url],
      type: invitation.share.og_type as "website",
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

  return (
    <ViewerReactApp />
  );
}
