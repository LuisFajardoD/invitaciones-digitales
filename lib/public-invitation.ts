import type { ClientRsvpView, InvitationRecord } from "@/types/invitations";

export type PublicInvitation = Omit<InvitationRecord, "client_view_token">;

export function toPublicInvitation(invitation: InvitationRecord): PublicInvitation {
  const { client_view_token: _clientViewToken, ...safeInvitation } = invitation;
  return safeInvitation;
}

export function toPublicClientRsvpView(view: ClientRsvpView) {
  return {
    ...view,
    invitation: toPublicInvitation(view.invitation),
  };
}
