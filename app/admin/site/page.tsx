import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/repository";

export default async function AdminSitePage() {
  await requireAdminSession();
  const siteSettings = await getSiteSettings();

  return (
    <AdminShell
      title="Landing editable"
      description="Administra bloques de / usando site_settings."
    >
      <SiteSettingsForm initialData={siteSettings.data} />
    </AdminShell>
  );
}
