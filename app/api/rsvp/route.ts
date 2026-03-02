import { NextResponse } from "next/server";
import { createRsvpResponse } from "@/lib/repository";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    invitationId?: string;
    name?: string;
    attending?: boolean;
    guestsCount?: number | null;
    message?: string | null;
  };

  if (!body.invitationId) {
    return NextResponse.json({ error: "Invitacion invalida." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  if (typeof body.attending !== "boolean") {
    return NextResponse.json({ error: "Debes indicar si asistes." }, { status: 400 });
  }

  try {
    await createRsvpResponse({
      invitationId: body.invitationId,
      name: body.name,
      attending: body.attending,
      guestsCount: body.guestsCount ?? null,
      message: body.message ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo guardar el RSVP.",
      },
      { status: 400 },
    );
  }
}
