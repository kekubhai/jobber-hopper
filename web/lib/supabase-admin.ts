import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getMissingSupabaseAdminEnv, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase-env";

export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const missing = getMissingSupabaseAdminEnv();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      `Supabase admin env is not configured. Missing: ${missing.join(", ")}. ` +
        "Add them to web/.env.local and restart `pnpm dev:web`."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
