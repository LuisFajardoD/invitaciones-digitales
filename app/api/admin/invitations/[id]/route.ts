import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getInvitationById, updateInvitation } from "@/lib/repository";
import type { InvitationRecord } from "@/types/invitations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const invitation = await getInvitationById(id);

  if (!invitation) {
    return NextResponse.json({ error: "Invitacion no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ invitation });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as InvitationRecord;

  if (body.id !== id) {
    return NextResponse.json({ error: "ID inconsistente." }, { status: 400 });
  }

  try {
    const updated = await updateInvitation(body);
    return NextResponse.json({ id: updated.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar." },
      { status: 400 },
    );
  }
}
