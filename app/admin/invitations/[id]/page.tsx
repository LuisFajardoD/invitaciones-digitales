import { notFound, redirect } from "next/navigation";
import { InvitationEditorForm } from "@/components/admin/invitation-editor-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById, isDemoInvitation } from "@/lib/repository";
import styles from "@/components/admin/invitation-editor-form.module.css";

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
  if (isDemoInvitation(invitation)) redirect(`/admin/demos/${id}`);

  return (
    <AdminShell>
      <section className={styles["inv-editor-route"]}>
        <InvitationEditorForm invitation={invitation} />
      </section>
    </AdminShell>
  );
}
