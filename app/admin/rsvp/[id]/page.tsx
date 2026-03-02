import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { RsvpDashboard } from "@/components/admin/rsvp-dashboard";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById, getRsvpSummary } from "@/lib/repository";

type AdminRsvpPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRsvpPage({ params }: AdminRsvpPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const invitation = await getInvitationById(id);

  if (!invitation) {
    notFound();
  }

  const summary = await getRsvpSummary(id);

  return (
    <AdminShell
      title="Dashboard RSVP"
      description="Totales, tabla de respuestas y exportacion CSV."
    >
      <RsvpDashboard invitation={invitation} summary={summary} />
    </AdminShell>
  );
}
