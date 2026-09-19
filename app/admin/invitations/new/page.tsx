import { AdminShell } from "@/components/admin/admin-shell";
import { NewInvitationForm } from "@/components/admin/new-invitation-form";
import { requireAdminSession } from "@/lib/auth";
import { getDemoDisplayName } from "@/lib/catalog-metadata";
import { listDemoInvitations, listThemes } from "@/lib/repository";
import { redirect } from "next/navigation";

export default async function NewInvitationPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  await requireAdminSession();
  if ((await searchParams).mode === "demo") redirect("/admin/demos/new");
  const [themes, demos] = await Promise.all([listThemes(), listDemoInvitations()]);

  return (
    <AdminShell
      title="Crear invitación"
      description="Paso 1 del flujo: crea un borrador y redirecciona al editor."
    >
      <NewInvitationForm themes={themes} templates={demos.map((demo) => ({
        id: demo.id, name: getDemoDisplayName(demo), description: "", source_invitation_id: demo.id,
        slug: demo.slug, theme_id: demo.theme_id, created_at: demo.created_at, updated_at: demo.updated_at,
      }))} />
    </AdminShell>
  );
}
