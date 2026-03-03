import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReactViewerBridge } from "@/components/invitation/react-viewer-bridge";
import { requireAdminSession } from "@/lib/auth";
import { listInvitations } from "@/lib/repository";
import { formatDateTimeLabel } from "@/lib/utils";

function getStatusLabel(status: "draft" | "published") {
  return status === "published" ? "Publicada" : "Borrador";
}

export default async function AdminInvitationsPage() {
  await requireAdminSession();
  const invitations = await listInvitations();

  return (
    <ReactViewerBridge path="/admin/invitations" title="CRM React de invitaciones">
      <AdminShell
        title="Invitaciones"
        description="Lista maestra con accesos rapidos, estado y acceso al editor/RSVP."
      >
        <div className="nav-row">
          <Link href="/admin/invitations/new" className="button-primary">
            Nueva invitacion
          </Link>
        </div>
        <section className="admin-panel">
          <div className="admin-table">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="admin-row">
                <div className="inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{invitation.sections.hero.title}</strong>
                    <p className="helper-text">{formatDateTimeLabel(invitation.event_start_at, invitation.timezone)}</p>
                  </div>
                  <span className={`status-pill ${invitation.status}`}>{getStatusLabel(invitation.status)}</span>
                </div>
                <div className="inline-actions">
                  <a href={`/i/${invitation.slug}`} className="button-secondary" target="_blank" rel="noreferrer">
                    Abrir publica
                  </a>
                  <Link href={`/admin/invitations/${invitation.id}`} className="button-secondary">
                    Editar
                  </Link>
                  <Link href={`/admin/rsvp/${invitation.id}`} className="button-secondary">
                    RSVP
                  </Link>
                  <form action={`/api/admin/invitations/${invitation.id}/duplicate`} method="post">
                    <button type="submit" className="button-secondary">
                      Duplicar
                    </button>
                  </form>
                  <a
                    href={`/i/${invitation.slug}/rsvp?token=${invitation.client_view_token}`}
                    className="button-secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Link cliente
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AdminShell>
    </ReactViewerBridge>
  );
}
