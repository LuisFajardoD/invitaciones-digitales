import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { InvitationEditorForm } from "@/components/admin/invitation-editor-form";
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
    <AdminShell
      title="Editor de invitacion"
      description="Edita datos del evento, secciones, OG, expiracion y vista previa movil."
    >
      <InvitationEditorForm invitation={invitation} />
    </AdminShell>
  );
}
