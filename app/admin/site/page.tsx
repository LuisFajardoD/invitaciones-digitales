import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings, listInvitations } from "@/lib/repository";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";

export default async function AdminSitePage() {
  await requireAdminSession();
  const [siteSettings, invitations] = await Promise.all([getSiteSettings(), listInvitations()]);
  const safeSiteSettingsData = normalizeSiteSettingsData(siteSettings.data);
  const availableInvitations = invitations.map((invitation) => ({
    id: invitation.id,
    slug: invitation.slug,
    title: invitation.sections?.hero?.title || invitation.share?.og_title || invitation.slug,
    status: invitation.status,
    ogImageUrl:
      invitation.share?.og_image_url ||
      `/api/public/invitations/${encodeURIComponent(invitation.slug)}/og-image`,
  }));

  return (
    <AdminShell
      title="Portada editable"
      description="Administra los bloques de / desde la configuración del sitio."
    >
      <SiteSettingsForm
        initialData={safeSiteSettingsData}
        availableInvitations={availableInvitations}
      />
    </AdminShell>
  );
}
