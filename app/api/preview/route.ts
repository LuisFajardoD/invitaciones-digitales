import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { getPreviewDeviceProfile, serializePreviewDeviceProfile } from "@/lib/preview/devices";
import { renderInvitationPreviewScreenshot } from "@/lib/preview/screenshots";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitationId") || undefined;
  const slug = searchParams.get("slug") || undefined;
  const deviceId = searchParams.get("deviceId") || "iphone-pro-max";
  const force = searchParams.get("force") === "1";
  const mode = searchParams.get("mode") === "fullpage" || searchParams.get("fullPage") === "1" ? "fullpage" : "viewport";
  const device = getPreviewDeviceProfile(deviceId);

  if (!invitationId && !slug) {
    return NextResponse.json({ error: "Debes enviar invitationId o slug." }, { status: 400 });
  }

  if (!device) {
    return NextResponse.json({ error: "deviceId no valido." }, { status: 400 });
  }

  if (invitationId) {
    const adminToken = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
    if (!adminToken) {
      return NextResponse.json({ error: "Sesion administrativa requerida para preview por ID." }, { status: 401 });
    }
  }

  try {
    const result = await renderInvitationPreviewScreenshot({
      request,
      invitationId,
      slug,
      deviceId: device.id,
      force,
      mode,
    });

    return NextResponse.json({
      previewUrl: result.previewUrl,
      cached: result.cached,
      generatedAt: result.generatedAt,
      mode: result.mode,
      device: serializePreviewDeviceProfile(result.device),
      invitation: {
        id: result.invitation.id,
        slug: result.invitation.slug,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No se pudo generar la captura.",
      },
      { status: 500 },
    );
  }
}
