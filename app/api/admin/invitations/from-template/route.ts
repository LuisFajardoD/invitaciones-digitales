import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createInvitationFromTemplate } from "@/lib/repository";

type CreateFromTemplateBody = {
  template_id?: string;
  slug?: string;
  theme_id?: string;
  event_start_at?: string;
  venue_name?: string;
  address_text?: string;
  lat?: number;
  lng?: number;
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as CreateFromTemplateBody;

  if (
    !body.template_id?.trim() ||
    !body.slug?.trim() ||
    !body.event_start_at?.trim() ||
    !body.venue_name?.trim() ||
    !body.address_text?.trim()
  ) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  try {
    const invitation = await createInvitationFromTemplate({
      template_id: body.template_id,
      slug: body.slug,
      theme_id: body.theme_id,
      event_start_at: new Date(body.event_start_at).toISOString(),
      venue_name: body.venue_name,
      address_text: body.address_text,
      lat: Number(body.lat) || 0,
      lng: Number(body.lng) || 0,
    });
    return NextResponse.json({ id: invitation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear desde plantilla." },
      { status: 400 },
    );
  }
}
