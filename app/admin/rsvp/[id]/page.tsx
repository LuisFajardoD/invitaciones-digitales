import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { getInvitationById } from "@/lib/repository";

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

  redirect(`/i/${invitation.slug}/rsvp?token=${invitation.client_view_token}`);
}
