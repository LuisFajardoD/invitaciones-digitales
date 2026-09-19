import { notFound } from "next/navigation";
import { InvitationEditorForm } from "@/components/admin/invitation-editor-form";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById, isDemoInvitation } from "@/lib/repository";
import styles from "@/components/admin/invitation-editor-form.module.css";

export default async function DemoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const demo = await getInvitationById(id);
  if (!demo || !isDemoInvitation(demo)) notFound();

  return (
    <AdminShell>
      <section className={styles["inv-editor-route"]}>
        <InvitationEditorForm invitation={demo} />
      </section>
    </AdminShell>
  );
}
