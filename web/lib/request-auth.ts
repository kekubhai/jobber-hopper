import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublishableConfig } from "@/lib/supabase-env";

export type AuthenticatedRequestContext = {
  userId: string;
  email: string | null;
};

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedRequestContext | null> {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  const { url, publishableKey } = requireSupabasePublishableConfig();
  const supabase = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null
  };
}

export function getProfileIdFromUrl(url: string, fallback: string): string {
  const parsed = new URL(url);
  const candidate = parsed.searchParams.get("profileId");
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return fallback;
}
