import { createClerkClient } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { getClerkServerConfigError } from "@/lib/clerk-env";
import { getClerkServerClient } from "@/lib/clerk-server";

export type AuthenticatedRequestContext = {
  userId: string;
  email: string | null;
};

function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** Cookie session (dashboard) or Bearer JWT (extension after pairing). */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedRequestContext | null> {
  const configError = getClerkServerConfigError();
  if (configError) {
    return null;
  }

  const session = await auth();
  if (session.userId) {
    return {
      userId: session.userId,
      email: typeof session.sessionClaims?.email === "string" ? session.sessionClaims.email : null
    };
  }

  const clerk = getClerkServerClient();
  if (!clerk) {
    return null;
  }

  try {
    const requestState = await clerk.authenticateRequest(request, {
      acceptsToken: "session_token"
    });

    if (!requestState.isSignedIn) {
      return null;
    }

    const authState = requestState.toAuth();
    if (!authState.userId) {
      return null;
    }

    return {
      userId: authState.userId,
      email: null
    };
  } catch (error) {
    console.error("Clerk authenticateRequest failed", error);
    return null;
  }
}

export function getProfileIdFromUrl(url: string, fallback: string): string {
  const parsed = new URL(url);
  const candidate = parsed.searchParams.get("profileId");
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return fallback;
}
