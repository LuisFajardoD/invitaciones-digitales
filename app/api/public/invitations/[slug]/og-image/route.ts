import { getPublicInvitationBySlug } from "@/lib/repository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ slug: string }>;
};

function resolveAbsoluteUrl(input: string, requestUrl: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  try {
    return new URL(trimmed, requestUrl).toString();
  } catch {
    return "";
  }
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const fallbackImage = new URL("/assets/hero-space-backdrop.svg", request.url).toString();
  const selfPath = `/api/public/invitations/${encodeURIComponent(slug)}/og-image`;

  try {
    const invitation = await getPublicInvitationBySlug(slug);
    if (!invitation) {
      return NextResponse.redirect(fallbackImage, { status: 302 });
    }

    const preferredSource =
      invitation.share?.og_image_url ||
      invitation.sections?.hero?.background?.image_url ||
      invitation.sections?.hero?.background_image_url ||
      "";

    const resolvedImageUrl = resolveAbsoluteUrl(preferredSource, request.url) || fallbackImage;
    const parsed = new URL(resolvedImageUrl, request.url);
    const imageUrl = parsed.pathname === selfPath ? fallbackImage : parsed.toString();
    return NextResponse.redirect(imageUrl, { status: 302 });
  } catch {
    return NextResponse.redirect(fallbackImage, { status: 302 });
  }
}
