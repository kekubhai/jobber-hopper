import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * CORS for the extension's cross-origin requests. The extension runs as a
 * content script on third-party job-application pages (e.g. tier3.college,
 * greenhouse.io, linkedin.com) and calls back to the dev/prod API at
 * localhost:3000 or app.jobber-hopper.com. Browsers enforce CORS, so every
 * /api/* response must include these headers AND the OPTIONS preflight must
 * short-circuit BEFORE Clerk's middleware (Clerk rejects OPTIONS with 400).
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
} as const;

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/trpc/");
}

function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function applyCorsHeaders<T extends Response>(response: T): T {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

const clerk = clerkMiddleware();

function clerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const sk = process.env.CLERK_SECRET_KEY?.trim();
  if (!pk || !sk) return false;
  const isProd = process.env.VERCEL_ENV === "production";
  if (isProd && pk.startsWith("pk_test_")) return false;
  return true;
}

export default function middleware(request: NextRequest, event: unknown) {
  if (isApiPath(request.nextUrl.pathname)) {
    if (request.method === "OPTIONS") {
      return corsPreflightResponse();
    }
    if (!clerkConfigured()) {
      const res = NextResponse.next();
      return applyCorsHeaders(res);
    }
    const result = (clerk as unknown as (req: NextRequest, ev: unknown) => Response | Promise<Response> | undefined)(
      request,
      event
    );
    if (result instanceof Promise) {
      return result.then((res) => (res ? applyCorsHeaders(res) : NextResponse.next()));
    }
    if (result) return applyCorsHeaders(result);
    return NextResponse.next();
  }

  if (!clerkConfigured()) {
    return NextResponse.next();
  }

  return (clerk as unknown as (req: NextRequest, ev: unknown) => Response | Promise<Response> | undefined)(
    request,
    event
  );
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*"
  ]
};
