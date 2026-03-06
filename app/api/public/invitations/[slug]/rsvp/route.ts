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
};

export async function POST(request: Request, { params }: Params) {
  const { slug } = await params;
  const body = (await request.json()) as RsvpBody;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  if (typeof body.attending !== "boolean") {
    return NextResponse.json({ error: "Debes indicar si asistes." }, { status: 400 });
  }

  try {
    await createPublicRsvpResponse({
      slug,
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
