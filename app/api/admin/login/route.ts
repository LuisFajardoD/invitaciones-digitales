import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/constants";
import { getAdminAuthPolicyError, getAllowedAdminEmail, isDemoAuthEnabled } from "@/lib/auth";
import { createAnonSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son obligatorios." }, { status: 400 });
  }

  const authPolicyError = getAdminAuthPolicyError();
  if (authPolicyError) {
    return NextResponse.json({ error: authPolicyError }, { status: 503 });
  }

  const cookieStore = await cookies();

  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    if (!isDemoAuthEnabled()) {
      return NextResponse.json(
        {
          error:
            "No hay proveedor de autenticacion configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503 },
      );
    }

    if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
    }

    cookieStore.set(ADMIN_COOKIE_NAME, "demo-session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    return NextResponse.json({ error: "No se pudo iniciar sesion." }, { status: 401 });
  }

  const allowedEmail = getAllowedAdminEmail();
  if (allowedEmail && data.user?.email?.toLowerCase() !== allowedEmail) {
    return NextResponse.json({ error: "Acceso denegado para este usuario." }, { status: 403 });
  }

  cookieStore.set(ADMIN_COOKIE_NAME, data.session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: data.session.expires_in || 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
