import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { syncClerkUserToSupabase } from "@/lib/clerk-user-sync";
import { getAuthenticatedUser } from "@/lib/request-auth";

export function OPTIONS() {
  return optionsCors();
}

/** Called after Clerk sign-in/sign-up to mirror account + master profile shell in Supabase. */
export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return jsonWithCors({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const result = await syncClerkUserToSupabase(authUser.userId);
    return jsonWithCors({ ok: true, ...result });
  } catch (error) {
    console.error("Clerk user sync failed", error);
    return jsonWithCors({ error: "Failed to sync user to Supabase" }, { status: 500 });
  }
}
