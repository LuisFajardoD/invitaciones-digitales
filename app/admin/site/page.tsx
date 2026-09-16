import { AdminShell } from "@/components/admin/admin-shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { requireAdminSession } from "@/lib/auth";
import { getSiteSettings, listInvitations } from "@/lib/repository";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";
import { getInvitationTypesForSlug } from "@/lib/invitation-catalog";
import { demoCategoryExampleItems } from "@/lib/demo-data";

export default async function AdminSitePage() {
  await requireAdminSession();
  const [siteSettings, invitations] = await Promise.all([getSiteSettings(), listInvitations()]);
  const safeSiteSettingsData = normalizeSiteSettingsData(siteSettings.data);
  const catalogSlugs = new Set([
    ...demoCategoryExampleItems,
    ...safeSiteSettingsData.blocks.examples.items,
  ].map((item) => item.slug));
  const availableInvitations = invitations.map((invitation) => ({
    id: invitation.id,
    slug: invitation.slug,
    title: invitation.sections?.hero?.title || invitation.share?.og_title || invitation.slug,
    status: invitation.status,
    invitationTypes: catalogSlugs.has(invitation.slug) ? getInvitationTypesForSlug(invitation.slug) : [],
    description: invitation.share?.og_description || invitation.sections?.hero?.subtitle || "",
    ogImageUrl:
      invitation.share?.og_image_url ||
      `/api/public/invitations/${encodeURIComponent(invitation.slug)}/og-image`,
  }));

  return (
    <AdminShell
      title="Editar sitio público"
      description="Administra cada página y sección del sitio actual desde un solo lugar."
    >
      <SiteSettingsForm
        initialData={safeSiteSettingsData}
        availableInvitations={availableInvitations}
      />
    </AdminShell>
  );
}
