import type { ClientRsvpView, InvitationRecord } from "@/types/invitations";

export type PublicInvitation = Omit<
  InvitationRecord,
  "id" | "client_view_token" | "created_at" | "updated_at"
>;

export function toPublicInvitation(invitation: InvitationRecord): PublicInvitation {
  const {
    id: _id,
    client_view_token: _clientViewToken,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...safeInvitation
  } = invitation;
  return safeInvitation;
}

export function toPublicClientRsvpView(view: ClientRsvpView) {
  return {
    ...view,
    invitation: toPublicInvitation(view.invitation),
  };
}
