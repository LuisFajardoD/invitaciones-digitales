import { InvitationsDashboard } from "@/components/admin/invitations-dashboard";
import { requireAdminSession } from "@/lib/auth";
import { listInvitations } from "@/lib/repository";

export default async function AdminInvitationsPage() {
  await requireAdminSession();
  const invitations = await listInvitations();

  return (
    <InvitationsDashboard
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        slug: invitation.slug,
        title: invitation.sections.hero.title,
        status: invitation.status,
        event_start_at: invitation.event_start_at,
        timezone: invitation.timezone,
        client_view_token: invitation.client_view_token,
      }))}
    />
  );
}
