import Link from "next/link";
import { ViewerReactApp } from "@/app/i/viewer-react-app";
import { getClientRsvpView } from "@/lib/repository";

export const dynamic = "force-dynamic";

type ClientRsvpPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ClientRsvpPage({ params, searchParams }: ClientRsvpPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const result = token ? await getClientRsvpView(slug, token) : null;

  if (!result) {
    return (
      <section className="empty-state">
        <p className="eyebrow">Seguridad</p>
        <h1>Acceso no autorizado</h1>
        <p className="muted">El token no es valido para esta vista.</p>
        <Link href="/" className="button-primary">
          Ir al inicio
        </Link>
      </section>
    );
  }

  return <ViewerReactApp />;
}
