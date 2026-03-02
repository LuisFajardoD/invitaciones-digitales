import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { duplicateInvitation } from "@/lib/repository";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const duplicated = await duplicateInvitation(id);
    return NextResponse.redirect(new URL(`/admin/invitations/${duplicated.id}`, request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo duplicar." },
      { status: 400 },
    );
  }
}
