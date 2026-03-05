import { NextResponse } from "next/server";
import { toPublicInvitation } from "@/lib/public-invitation";
import { getPublicInvitationBySlug } from "@/lib/repository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const invitation = await getPublicInvitationBySlug(slug);

  if (!invitation) {
    return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ invitation: toPublicInvitation(invitation) });
}
