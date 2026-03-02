import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { saveSiteSettings } from "@/lib/repository";
import type { SiteSettingsData } from "@/types/invitations";

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as SiteSettingsData;

  try {
    await saveSiteSettings(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar." },
      { status: 400 },
    );
  }
}
