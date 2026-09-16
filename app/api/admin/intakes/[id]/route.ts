import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getEventIntakeFormById, updateEventIntakeStatus } from "@/lib/repository";
import type { EventIntakeStatus } from "@/types/intake";

type Params = {
  params: Promise<{ id: string }>;
};

const statusValues = new Set(["new", "reviewed", "in_progress", "done"]);

export async function GET(_request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const form = await getEventIntakeFormById(id);
  if (!form) {
    return NextResponse.json({ error: "Formulario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ form });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (!body.status || !statusValues.has(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const form = await updateEventIntakeStatus(id, body.status as EventIntakeStatus);
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar." },
      { status: 400 },
    );
  }
}
