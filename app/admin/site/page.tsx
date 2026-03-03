import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/repository";

export default async function AdminSitePage() {
  await requireAdminSession();
  const siteSettings = await getSiteSettings();

  return (
    <AdminShell
      title="Portada editable"
      description="Administra los bloques de / desde la configuracion del sitio."
    >
      <SiteSettingsForm initialData={siteSettings.data} />
    </AdminShell>
  );
}
