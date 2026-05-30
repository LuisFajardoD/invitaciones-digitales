import { NextResponse } from "next/server";
import { getEventIntakeFormByToken, saveEventIntakeFormByToken } from "@/lib/repository";
import type { EventIntakeData } from "@/types/intake";

type Params = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const form = await getEventIntakeFormByToken(token);
  if (!form) {
    return NextResponse.json({ error: "Formulario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ form });
}

export async function PATCH(request: Request, { params }: Params) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<EventIntakeData>;

  try {
    const form = await saveEventIntakeFormByToken(token, body);
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar el formulario." },
      { status: 400 },
    );
  }
}
