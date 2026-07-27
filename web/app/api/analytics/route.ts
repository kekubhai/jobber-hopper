import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

type FunnelEventRow = {
  event_name: "form_detected" | "fields_reviewed" | "autofill_accepted" | "application_submitted";
  domain: string;
  platform: string;
  fields_detected: number;
  fields_matched: number;
  fields_safe: number;
  fields_filled: number;
};

export function OPTIONS() {
  return optionsCors();
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  const profileId = auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("extension_funnel_events")
      .select("event_name, domain, platform, fields_detected, fields_matched, fields_safe, fields_filled")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5_000)
      .returns<FunnelEventRow[]>();

    if (error) throw error;

    const events = data ?? [];
    const detected = events.filter((event) => event.event_name === "form_detected");
    const reviewed = events.filter((event) => event.event_name === "fields_reviewed");
    const accepted = events.filter((event) => event.event_name === "autofill_accepted");
    const submitted = events.filter((event) => event.event_name === "application_submitted");

    const fieldsDetected = reviewed.reduce((sum, event) => sum + event.fields_detected, 0);
    const fieldsMatched = reviewed.reduce((sum, event) => sum + event.fields_matched, 0);
    const platformUsage = summarize(events, (event) => event.platform);
    const domainUsage = summarize(events, (event) => event.domain);

    return jsonWithCors({
      funnel: {
        formsDetected: detected.length,
        reviewedForms: reviewed.length,
        fieldsDetected,
        fieldsMatched,
        fieldMatchRate: fieldsDetected === 0 ? 0 : fieldsMatched / fieldsDetected,
        autofillAccepted: accepted.length,
        autofillAcceptanceRate: reviewed.length === 0 ? 0 : accepted.length / reviewed.length,
        submitted: submitted.length
      },
      platformUsage,
      domainUsage
    });
  } catch (error) {
    console.error("Analytics GET failed", error);
    return jsonWithCors({ error: "Failed to load analytics" }, { status: 500 });
  }
}

function summarize(events: FunnelEventRow[], key: (event: FunnelEventRow) => string) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.event_name !== "form_detected") continue;
    const value = key(event) || "generic";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts, ([name, formsDetected]) => ({ name, formsDetected }))
    .sort((left, right) => right.formsDetected - left.formsDetected)
    .slice(0, 10);
}
