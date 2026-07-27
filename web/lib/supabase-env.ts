/**
 * Supabase public client config. Accepts either publishable or legacy anon env names.
 */
export function getSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    undefined
  );
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    undefined
  );
}

export function getMissingSupabaseAdminEnv(): string[] {
  const missing: string[] = [];
  if (!getSupabaseUrl()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!getSupabaseServiceRoleKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

export function getSupabasePublishableKey(): string | undefined {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) {
    return publishable;
  }

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return anon || undefined;
}

export function requireSupabasePublishableConfig(): { url: string; publishableKey: string } {
  const url = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase client env is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return { url, publishableKey };
}

export function isSupabaseClientConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}
