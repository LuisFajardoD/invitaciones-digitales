import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { InvitationEditorForm } from "@/components/admin/invitation-editor-form";
import { ReactViewerBridge } from "@/components/invitation/react-viewer-bridge";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById } from "@/lib/repository";

type AdminInvitationEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInvitationEditorPage({
  params,
}: AdminInvitationEditorPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const invitation = await getInvitationById(id);

  if (!invitation) {
    notFound();
  }

  return (
    <ReactViewerBridge
      path={`/admin/invitations/${encodeURIComponent(invitation.id)}`}
      title="CRM React de editor de invitacion"
    >
      <AdminShell
        title="Editor de invitacion"
        description="Edita datos del evento, secciones, OG, expiracion y vista previa movil."
      >
        <InvitationEditorForm invitation={invitation} />
      </AdminShell>
    </ReactViewerBridge>
  );
}
