import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createEventIntakeForm, listEventIntakeForms } from "@/lib/repository";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const forms = await listEventIntakeForms();
  return NextResponse.json({ forms });
}

export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const form = await createEventIntakeForm();
    return NextResponse.json({ form });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el formulario." },
      { status: 400 },
    );
  }
}
