import { AdminShell } from "@/components/admin/admin-shell";
import { NewInvitationForm } from "@/components/admin/new-invitation-form";
import { requireAdminSession } from "@/lib/auth";
import { listThemes } from "@/lib/repository";

export default async function NewInvitationPage() {
  await requireAdminSession();
  const themes = await listThemes();

  return (
    <AdminShell
      title="Crear invitacion"
      description="Paso 1 del flujo: crea un borrador y redirecciona al editor."
    >
      <NewInvitationForm themes={themes} />
    </AdminShell>
  );
}
