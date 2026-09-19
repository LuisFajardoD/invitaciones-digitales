import { AdminShell } from "@/components/admin/admin-shell";
import { IntakeAdminList } from "@/components/intake/IntakeAdminList";
import { requireAdminSession } from "@/lib/auth";
import { listEventIntakeForms } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminIntakesPage() {
  await requireAdminSession();
  const forms = await listEventIntakeForms();

  return (
    <AdminShell
      title="Formularios de Datos para Clientes"
      description="Crea enlaces de formularios privados para enviarlos a tus clientes por WhatsApp antes de diseñar su invitación. El cliente llena la información del evento (nombres, fechas, horarios, lugar, fotos, canciones, etc.)."
    >
      <IntakeAdminList forms={forms} />
    </AdminShell>
  );
}
