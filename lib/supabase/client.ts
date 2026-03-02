"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env.url || !env.anonKey) {
    return null;
  }

  return createClient(env.url, env.anonKey);
}
