import { NextResponse } from "next/server";
import { toPublicClientRsvpView } from "@/lib/public-invitation";
import { deleteClientRsvpResponse, getClientRsvpView } from "@/lib/repository";

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
      return NextResponse.json({ error: "Token inválido o acceso no autorizado." }, { status: 403 });
    }

    return NextResponse.json({ result: toPublicClientRsvpView(result) });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la vista RSVP." }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const { slug } = await params;
  const token = resolveClientRsvpToken(request);

  if (!token) {
    return NextResponse.json({ error: "Token requerido." }, { status: 401 });
  }

  let responseId = "";
  try {
    const payload = (await request.json()) as { responseId?: unknown };
    responseId = typeof payload.responseId === "string" ? payload.responseId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!responseId) {
    return NextResponse.json({ error: "responseId es obligatorio." }, { status: 400 });
  }

  try {
    const result = await deleteClientRsvpResponse({ slug, token, responseId });

    if (result === null) {
      return NextResponse.json({ error: "Token inválido o acceso no autorizado." }, { status: 403 });
    }

    if (result === "not_found") {
      return NextResponse.json({ error: "La respuesta ya no existe." }, { status: 404 });
    }

    return NextResponse.json({ result: toPublicClientRsvpView(result) });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar la respuesta RSVP." }, { status: 503 });
  }
}
