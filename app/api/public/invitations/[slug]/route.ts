import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { toPublicInvitation } from "@/lib/public-invitation";
import { getInvitationBySlug, getPublicInvitationBySlug } from "@/lib/repository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const isAdminPreview = searchParams.get("admin_preview") === "1";
    const adminSession = isAdminPreview ? await getAdminSession() : null;
    const invitation = adminSession
      ? await getInvitationBySlug(slug)
      : await getPublicInvitationBySlug(slug);

    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ invitation: toPublicInvitation(invitation) });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la invitación." }, { status: 503 });
  }
}
