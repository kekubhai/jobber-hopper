import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";
const EVENT_NAMES = ["form_detected", "fields_reviewed", "autofill_accepted", "application_submitted"] as const;

type FunnelEventName = typeof EVENT_NAMES[number];
type FunnelEventRequest = {
  sessionId?: unknown;
  eventName?: unknown;
  pageUrl?: unknown;
  domain?: unknown;
  platform?: unknown;
  fieldsDetected?: unknown;
  fieldsMatched?: unknown;
  fieldsSafe?: unknown;
  fieldsFilled?: unknown;
};

export function OPTIONS() {
  return optionsCors();
}

/** Extension-only event collector. It receives counts and page metadata, never profile values or DOM HTML. */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  const profileId = auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);
  let body: FunnelEventRequest;

  try {
    body = await request.json() as FunnelEventRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = text(body.sessionId, 100);
  const eventName = text(body.eventName, 50);
  const pageUrl = httpUrl(body.pageUrl);
  if (!sessionId || !isEventName(eventName) || !pageUrl) {
    return jsonWithCors({ error: "sessionId, eventName, and pageUrl are required" }, { status: 400 });
  }

  const domain = text(body.domain, 200) || new URL(pageUrl).hostname.toLowerCase();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("extension_funnel_events").upsert(
      {
        profile_id: profileId,
        session_id: sessionId,
        event_name: eventName,
        page_url: pageUrl,
        domain,
        platform: text(body.platform, 50) || "generic",
        fields_detected: count(body.fieldsDetected),
        fields_matched: count(body.fieldsMatched),
        fields_safe: count(body.fieldsSafe),
        fields_filled: count(body.fieldsFilled)
      },
      { onConflict: "session_id,page_url,event_name", ignoreDuplicates: true }
    );

    if (error) {
      throw error;
    }

    return jsonWithCors({ tracked: true }, { status: 201 });
  } catch (error) {
    console.error("Funnel event tracking failed", error);
    return jsonWithCors({ error: "Failed to track analytics event" }, { status: 500 });
  }
}

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function httpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isEventName(value: string): value is FunnelEventName {
  return (EVENT_NAMES as readonly string[]).includes(value);
}
