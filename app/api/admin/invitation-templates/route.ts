import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { listInvitationTemplates, listInvitations, saveInvitationAsTemplate } from "@/lib/repository";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const templates = await listInvitationTemplates();
  const invitations = await listInvitations();
  const titleById = new Map(
    invitations.map((invitation) => [invitation.id, invitation.sections.hero.title]),
  );

  return NextResponse.json({
    templates: templates.map((template) => ({
      ...template,
      source_invitation_title:
        titleById.get(template.source_invitation_id) || "Invitación no disponible",
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    invitation_id?: string;
    name?: string;
    description?: string;
  };

  if (!body.invitation_id?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: "invitation_id y name son obligatorios." }, { status: 400 });
  }

  try {
    const template = await saveInvitationAsTemplate({
      invitationId: body.invitation_id,
      name: body.name,
      description: body.description,
    });
    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la plantilla." },
      { status: 400 },
    );
  }
}
