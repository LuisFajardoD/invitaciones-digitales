import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/repository";
import { normalizeSiteSettingsData } from "@/lib/site-settings-defaults";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = normalizeSiteSettingsData((await getSiteSettings()).data);
  return NextResponse.json({ pages: settings.pages, blocks: settings.blocks }, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
