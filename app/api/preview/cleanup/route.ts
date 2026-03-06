import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { cleanupExpiredPreviewFiles } from "@/lib/preview/screenshots";

export const dynamic = "force-dynamic";

export async function POST() {
  const adminToken = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!adminToken) {
    return NextResponse.json({ error: "Sesión administrativa requerida." }, { status: 401 });
  }

  try {
    await cleanupExpiredPreviewFiles();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo limpiar el caché.",
      },
      { status: 500 },
    );
  }
}
