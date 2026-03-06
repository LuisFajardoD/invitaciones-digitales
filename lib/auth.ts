import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { createAnonSupabaseClient } from "@/lib/supabase/server";

export function isDemoAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_AUTH === "true";
}

export function getAllowedAdminEmail() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  return email || null;
}

export function getAdminAuthPolicyError() {
  if (process.env.NODE_ENV === "production" && !getAllowedAdminEmail()) {
    return "ADMIN_EMAIL es obligatorio en producción para habilitar acceso administrativo.";
  }

  return null;
}

export async function getAdminSession() {
  if (getAdminAuthPolicyError()) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  if (token === "demo-session") {
    if (!isDemoAuthEnabled()) {
      return null;
    }

    return { email: "demo@invitaciones.local" };
  }

  const supabase = createAnonSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  const allowedEmail = getAllowedAdminEmail();
  if (allowedEmail && data.user.email?.toLowerCase() !== allowedEmail) {
    return null;
  }

  return {
    email: data.user.email || "",
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
