import { createClerkClient } from "@clerk/backend";

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

export function getClerkServerClient(): ReturnType<typeof createClerkClient> | null {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    return null;
  }

  if (!clerkClient) {
    clerkClient = createClerkClient({ secretKey });
  }

  return clerkClient;
}
