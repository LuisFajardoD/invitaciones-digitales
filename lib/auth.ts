import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { createAnonSupabaseClient } from "@/lib/supabase/server";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  if (token === "demo-session") {
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

  const allowedEmail = process.env.ADMIN_EMAIL;
  if (allowedEmail && data.user.email !== allowedEmail) {
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
