import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/repository";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";

export default async function AdminSitePage() {
  await requireAdminSession();
  const siteSettings = await getSiteSettings();
  const safeSiteSettingsData = normalizeSiteSettingsData(siteSettings.data);

  return (
    <AdminShell
      title="Portada editable"
      description="Administra los bloques de / desde la configuración del sitio."
    >
      <SiteSettingsForm initialData={safeSiteSettingsData} />
    </AdminShell>
  );
}
