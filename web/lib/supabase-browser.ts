import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublishableConfig } from "@/lib/supabase-env";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = requireSupabasePublishableConfig();
  browserClient = createClient(url, publishableKey);
  return browserClient;
}
