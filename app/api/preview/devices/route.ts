import { NextResponse } from "next/server";
import { previewDeviceProfiles, serializePreviewDeviceProfile } from "@/lib/preview/devices";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    devices: previewDeviceProfiles
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((device) => serializePreviewDeviceProfile(device)),
  });
}
