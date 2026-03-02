import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getInvitationById, getRsvpSummary } from "@/lib/repository";
import { serializeCsv } from "@/lib/utils";

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

  const summary = await getRsvpSummary(id);
  const csv = serializeCsv(summary);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"rsvp-${invitation.slug}.csv\"`,
    },
  });
}
