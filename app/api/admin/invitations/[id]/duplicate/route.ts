import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { duplicateInvitation } from "@/lib/repository";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const asDemo = new URL(request.url).searchParams.get("as") === "demo";

  try {
    const duplicated = await duplicateInvitation(id, asDemo);
    return NextResponse.json({ id: duplicated.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo duplicar." },
      { status: 400 },
    );
  }
}
