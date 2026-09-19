import { InvitationsDashboard } from "@/components/admin/invitations-dashboard";
import { requireAdminSession } from "@/lib/auth";
import { listClientInvitations, listDemoInvitations } from "@/lib/repository";

export const revalidate = 0;

export default async function AdminInvitationsPage() {
  await requireAdminSession();
  const clientInvitations = await listClientInvitations();
  const demos = await listDemoInvitations();

  return (
    <InvitationsDashboard
      invitations={clientInvitations.map((invitation) => ({
        id: invitation.id,
        slug: invitation.slug,
        title: invitation.sections.hero.title,
        status: invitation.status,
        event_start_at: invitation.event_start_at,
        timezone: invitation.timezone,
        client_view_token: invitation.client_view_token,
      }))}
      demos={demos}
    />
  );
}
