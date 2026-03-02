import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, hasConfiguredSupabase } from "@/lib/supabase/env";

export function createServiceSupabaseClient() {
  if (!hasConfiguredSupabase()) {
    return null;
  }

  const env = getSupabaseEnv();
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env.url || !env.anonKey) {
    return null;
  }

  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
