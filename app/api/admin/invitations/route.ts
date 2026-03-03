import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createInvitation, listInvitations } from "@/lib/repository";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const invitations = await listInvitations();
  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    slug?: string;
    theme_id?: string;
    event_start_at?: string;
    venue_name?: string;
    address_text?: string;
    lat?: number;
    lng?: number;
  };

  if (!body.slug || !body.event_start_at || !body.venue_name || !body.address_text) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  try {
    const invitation = await createInvitation({
      slug: body.slug,
      theme_id: body.theme_id || "astronautas",
      event_start_at: new Date(body.event_start_at).toISOString(),
      venue_name: body.venue_name,
      address_text: body.address_text,
      lat: body.lat || 0,
      lng: body.lng || 0,
    });
    return NextResponse.json({ id: invitation.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear." },
      { status: 400 },
    );
  }
}
