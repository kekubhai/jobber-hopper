import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { getAuthenticatedUser } from "@/lib/request-auth";

export function OPTIONS() {
  return optionsCors();
}

/**
 * Extension whoami endpoint. The extension reads the Clerk session cookie
 * silently and sends it as a Bearer token; this route returns the resolved
 * user id and (best-effort) email. The extension caches the result so this
 * is called rarely.
 */
export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);

  if (!auth) {
    return jsonWithCors({ error: "Not signed in" }, { status: 401 });
  }

  return jsonWithCors({
    userId: auth.userId,
    email: auth.email
  });
}
