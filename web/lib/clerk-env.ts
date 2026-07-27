export function isClerkClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}

export function isClerkServerConfigured(): boolean {
  return isClerkClientConfigured() && Boolean(process.env.CLERK_SECRET_KEY?.trim());
}

/** @deprecated Use isClerkServerConfigured for API routes. */
export function isClerkConfigured(): boolean {
  return isClerkServerConfigured();
}

export function getClerkServerConfigError(): string | null {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    missing.push("CLERK_SECRET_KEY");
  }

  if (missing.length === 0) {
    return null;
  }

  return `Add ${missing.join(" and ")} to web/.env.local, then restart the dev server.`;
}

export function getClerkClientConfigError(): string | null {
  if (isClerkClientConfigured()) {
    return null;
  }

  return "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to web/.env.local, then restart the dev server.";
}
