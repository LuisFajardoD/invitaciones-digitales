import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  return NextResponse.json(
    {
      error: "Endpoint obsoleto. Usa /api/public/invitations/:slug/rsvp.",
      replacement: `${requestUrl.origin}/api/public/invitations/:slug/rsvp`,
    },
    { status: 410 },
  );
}
