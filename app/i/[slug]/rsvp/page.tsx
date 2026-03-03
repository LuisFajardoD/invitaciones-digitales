import Link from "next/link";
import { ReactViewerBridge } from "@/components/invitation/react-viewer-bridge";
import { getClientRsvpView } from "@/lib/repository";
import { formatDateTimeLabel } from "@/lib/utils";

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

  return (
    <ReactViewerBridge
      path={`/i/${encodeURIComponent(result.invitation.slug)}/rsvp?token=${encodeURIComponent(token!)}`}
      title="Viewer React de vista cliente RSVP"
    >
      <main className="page-shell" style={{ padding: "32px 0 60px" }}>
        <section className="admin-panel">
          <p className="eyebrow">Vista cliente RSVP</p>
          <h1>{result.invitation.sections.hero.title}</h1>
          <div className="metric-grid" style={{ marginTop: 18 }}>
            <div className="metric-card">
              <span className="muted">Asisten</span>
              <strong>{result.summary.attendingCount}</strong>
            </div>
            <div className="metric-card">
              <span className="muted">No asisten</span>
              <strong>{result.summary.notAttendingCount}</strong>
            </div>
            <div className="metric-card">
              <span className="muted">Total</span>
              <strong>{result.summary.totalCount}</strong>
            </div>
          </div>
          <div className="response-table">
            {result.summary.responses.map((response) => (
              <div key={response.id} className="response-row">
                <strong>{response.name}</strong>
                <div className="response-meta">
                  <span>{formatDateTimeLabel(response.created_at)}</span>
                  <span>{response.attending ? "Asiste" : "No asiste"}</span>
                  <span>{response.guests_count ? `${response.guests_count} acompanantes` : "Sin dato"}</span>
                </div>
                {response.message ? <p className="muted">{response.message}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </main>
    </ReactViewerBridge>
  );
}
