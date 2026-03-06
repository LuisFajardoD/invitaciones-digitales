import { AdminShell } from "@/components/admin/admin-shell";
import { NewInvitationForm } from "@/components/admin/new-invitation-form";
import { requireAdminSession } from "@/lib/auth";
import { listInvitationTemplates, listThemes } from "@/lib/repository";

export default async function NewInvitationPage() {
  await requireAdminSession();
  const [themes, templates] = await Promise.all([listThemes(), listInvitationTemplates()]);

  return (
    <AdminShell
      title="Crear invitación"
      description="Paso 1 del flujo: crea un borrador y redirecciona al editor."
    >
      <NewInvitationForm themes={themes} templates={templates} />
    </AdminShell>
  );
}
