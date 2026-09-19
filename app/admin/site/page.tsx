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
    invitationTypes: invitation.slug.startsWith("demo-") && invitation.status === "published" ? [invitation.catalog?.invitation_type || "web-premium"] : [],
    description: invitation.share?.og_description || invitation.sections?.hero?.subtitle || "",
    ogImageUrl:
      invitation.share?.og_image_url ||
      `/api/public/invitations/${encodeURIComponent(invitation.slug)}/og-image`,
  }));

  return (
    <AdminShell>
      <SiteSettingsForm
        initialData={safeSiteSettingsData}
        availableInvitations={availableInvitations}
      />
    </AdminShell>
  );
}
