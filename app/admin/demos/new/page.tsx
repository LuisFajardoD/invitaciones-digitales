import { AdminShell } from "@/components/admin/admin-shell";
import { NewDemoForm } from "@/components/admin/new-demo-form";
import { requireAdminSession } from "@/lib/auth";

export default async function NewDemoPage() {
  await requireAdminSession();
  return (
    <AdminShell>
      <NewDemoForm />
    </AdminShell>
  );
}
