import { NextResponse } from "next/server";
import { toPublicInvitation } from "@/lib/public-invitation";
import { getPublicInvitationBySlug } from "@/lib/repository";
import { getInvitationBySlug } from "@/lib/repository";
import { getAdminSession } from "@/lib/auth";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const adminPreview = new URL(request.url).searchParams.get("admin_preview") === "1" && Boolean(await getAdminSession());
    const invitation = adminPreview ? await getInvitationBySlug(slug) : await getPublicInvitationBySlug(slug);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ invitation: toPublicInvitation(invitation) });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la invitación." }, { status: 503 });
  }
}
