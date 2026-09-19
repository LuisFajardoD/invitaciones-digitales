import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createInvitation } from "@/lib/repository";

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json() as { title?: string; slug?: string };
  if (!body.title?.trim() || !body.slug?.trim()) return NextResponse.json({ error: "Título y slug son obligatorios." }, { status: 400 });
  try {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const demo = await createInvitation({
      slug: body.slug, theme_id: "astronautas", demo_title: body.title,
      event_start_at: future.toISOString(), venue_name: "Por definir", address_text: "Por definir", lat: 0, lng: 0,
    }, true);
    return NextResponse.json({ id: demo.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el demo." }, { status: 400 });
  }
}
