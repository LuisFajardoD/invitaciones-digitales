import { NextResponse } from "next/server";
import { createPublicRsvpResponse } from "@/lib/repository";

type Params = {
  params: Promise<{ slug: string }>;
};

type RsvpBody = {
  name?: string;
  attending?: boolean;
  guestsCount?: number | null;
  message?: string | null;
  mode?: "submit" | "cancel";
};

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await request.json()) as RsvpBody;
  const mode = body.mode === "cancel" ? "cancel" : "submit";

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  if (mode !== "cancel" && typeof body.attending !== "boolean") {
    return NextResponse.json({ error: "Debes indicar si asistes." }, { status: 400 });
  }

  try {
    await createPublicRsvpResponse({
      slug,
      name: body.name,
      attending: mode === "cancel" ? false : (body.attending as boolean),
      guestsCount: body.guestsCount ?? null,
      message: body.message ?? null,
      mode,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "No se pudo guardar el RSVP.";
    const friendlyMessage =
      /violates check constraint|guests_count_check|rsvp_responses_guests_count_check/i.test(rawMessage)
        ? "Verifica el número de asistentes antes de enviar."
        : rawMessage;

    return NextResponse.json(
      {
        error: friendlyMessage,
      },
      { status: 400 },
    );
  }
}
