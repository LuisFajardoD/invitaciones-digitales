import { NextResponse } from "next/server";
import { toPublicClientRsvpView } from "@/lib/public-invitation";
import { getClientRsvpView } from "@/lib/repository";

type Params = {
  params: Promise<{ slug: string }>;
};

function resolveClientRsvpToken(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenFromQuery = requestUrl.searchParams.get("token")?.trim();
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  const tokenFromHeader = request.headers.get("x-client-token")?.trim();
  if (tokenFromHeader) {
    return tokenFromHeader;
  }

  const authHeader = request.headers.get("authorization")?.trim() || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const token = resolveClientRsvpToken(request);

  if (!token) {
    return NextResponse.json({ error: "Token requerido." }, { status: 401 });
  }

  try {
    const result = await getClientRsvpView(slug, token);

    if (!result) {
      return NextResponse.json({ error: "Token invalido o acceso no autorizado." }, { status: 403 });
    }

    return NextResponse.json({ result: toPublicClientRsvpView(result) });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la vista RSVP." }, { status: 503 });
  }
}
