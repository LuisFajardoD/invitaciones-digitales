import { NextResponse } from "next/server";
import { getClientRsvpView } from "@/lib/repository";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ error: "Token requerido." }, { status: 400 });
  }

  const result = await getClientRsvpView(slug, token);

  if (!result) {
    return NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 });
  }

  return NextResponse.json({ result });
}
