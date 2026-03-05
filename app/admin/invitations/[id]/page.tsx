import { notFound } from "next/navigation";
import { InvitationEditorForm } from "@/components/admin/invitation-editor-form";
import { PublicShell } from "@/components/site/PublicShell";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById } from "@/lib/repository";
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

  return (
    <PublicShell showSiteLink>
      <section className={styles["inv-editor-route"]}>
        <InvitationEditorForm invitation={invitation} />
      </section>
    </PublicShell>
  );
}
