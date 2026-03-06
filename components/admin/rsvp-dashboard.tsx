import { formatDateTimeLabel } from "@/lib/utils";
import type { InvitationRecord, RsvpSummary } from "@/types/invitations";

type RsvpDashboardProps = {
  invitation: InvitationRecord;
  summary: RsvpSummary;
  isClientView?: boolean;
};

export function RsvpDashboard({ invitation, summary, isClientView = false }: RsvpDashboardProps) {
  return (
    <section className="admin-panel">
      <p className="eyebrow">{isClientView ? "Cliente" : "Panel RSVP"}</p>
      <h2>{invitation.sections.hero.title}</h2>
      <div className="metric-grid" style={{ marginTop: 18 }}>
        <div className="metric-card">
          <span className="muted">Asisten</span>
          <strong>{summary.attendingCount}</strong>
        </div>
        <div className="metric-card">
          <span className="muted">No asisten</span>
          <strong>{summary.notAttendingCount}</strong>
        </div>
        <div className="metric-card">
          <span className="muted">Total</span>
          <strong>{summary.totalCount}</strong>
        </div>
      </div>
      {!isClientView ? (
        <div className="inline-actions" style={{ marginTop: 18 }}>
          <a href={`/api/admin/rsvp/${invitation.id}/export`} className="button-primary">
            Exportar CSV
          </a>
          <a
            href={`/i/${invitation.slug}/rsvp?token=${invitation.client_view_token}`}
            className="button-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Vista cliente
          </a>
        </div>
      ) : null}
      <div className="response-table">
        {summary.responses.map((response) => (
          <div key={response.id} className="response-row">
            <strong>{response.name}</strong>
            <div className="response-meta">
              <span>{formatDateTimeLabel(response.created_at)}</span>
              <span>{response.attending ? "Asiste" : "No asiste"}</span>
              <span>{response.guests_count ? `${response.guests_count} acompañantes` : "Sin dato"}</span>
            </div>
            {response.message ? <p className="muted">{response.message}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
