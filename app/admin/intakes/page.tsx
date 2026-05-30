import { IntakeAdminList } from "@/components/intake/IntakeAdminList";
import { requireAdminSession } from "@/lib/auth";
import { listEventIntakeForms } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminIntakesPage() {
  await requireAdminSession();
  const forms = await listEventIntakeForms();

  return <IntakeAdminList forms={forms} />;
}
