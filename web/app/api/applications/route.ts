import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";
const ALLOWED_STATUSES = ["draft", "applied", "interview", "offer", "rejected", "withdrawn"] as const;

type ApplicationStatus = typeof ALLOWED_STATUSES[number];

type ApplicationRow = {
  id: string;
  profile_id: string;
  job_url: string;
  domain: string;
  platform: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  first_filled_at: string;
  last_filled_at: string;
  created_at: string;
  updated_at: string;
};

type TrackApplicationRequest = {
  jobUrl?: unknown;
  domain?: unknown;
  platform?: unknown;
  company?: unknown;
  role?: unknown;
};

type UpdateApplicationRequest = {
  id?: unknown;
  status?: unknown;
};

export function OPTIONS() {
  return optionsCors();
}

export async function GET(request: Request) {
  const profileId = await profileIdForRequest(request);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, profile_id, job_url, domain, platform, company, role, status, first_filled_at, last_filled_at, created_at, updated_at")
      .eq("profile_id", profileId)
      .order("last_filled_at", { ascending: false })
      .limit(100)
      .returns<ApplicationRow[]>();

    if (error) {
      throw error;
    }

    return jsonWithCors({ applications: data ?? [] });
  } catch (error) {
    console.error("Application tracker GET failed", error);
    const message = error instanceof Error ? error.message : "Failed to load applications";
    const isConfig = message.includes("Supabase admin env");
    return jsonWithCors({ error: isConfig ? message : "Failed to load applications" }, { status: isConfig ? 503 : 500 });
  }
}

export async function POST(request: Request) {
  const profileId = await profileIdForRequest(request);
  let body: TrackApplicationRequest;

  try {
    body = await request.json() as TrackApplicationRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobUrl = safeUrl(body.jobUrl);
  if (!jobUrl) {
    return jsonWithCors({ error: "jobUrl must be a valid HTTP(S) URL" }, { status: 400 });
  }

  const domain = normalizeText(body.domain, 200) || new URL(jobUrl).hostname.toLowerCase();
  const platform = normalizeText(body.platform, 50) || "generic";
  const company = normalizeText(body.company, 300);
  const role = normalizeText(body.role, 300);
  const now = new Date().toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("job_applications")
      .upsert(
        {
          profile_id: profileId,
          job_url: jobUrl,
          domain,
          platform,
          company,
          role,
          last_filled_at: now
        },
        { onConflict: "profile_id,job_url" }
      )
      .select("id, profile_id, job_url, domain, platform, company, role, status, first_filled_at, last_filled_at, created_at, updated_at")
      .single<ApplicationRow>();

    if (error) {
      throw error;
    }

    return jsonWithCors({ application: data, tracked: true }, { status: 201 });
  } catch (error) {
    console.error("Application tracker POST failed", error);
    const message = error instanceof Error ? error.message : "Failed to track application";
    const isConfig = message.includes("Supabase admin env");
    return jsonWithCors({ error: isConfig ? message : "Failed to track application" }, { status: isConfig ? 503 : 500 });
  }
}

export async function PATCH(request: Request) {
  const profileId = await profileIdForRequest(request);
  let body: UpdateApplicationRequest;

  try {
    body = await request.json() as UpdateApplicationRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !isApplicationStatus(status)) {
    return jsonWithCors({ error: "id and a valid status are required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", id)
      .eq("profile_id", profileId)
      .select("id, profile_id, job_url, domain, platform, company, role, status, first_filled_at, last_filled_at, created_at, updated_at")
      .maybeSingle<ApplicationRow>();

    if (error) {
      throw error;
    }
    if (!data) {
      return jsonWithCors({ error: "Application not found" }, { status: 404 });
    }

    return jsonWithCors({ application: data });
  } catch (error) {
    console.error("Application tracker PATCH failed", error);
    const message = error instanceof Error ? error.message : "Failed to update application";
    const isConfig = message.includes("Supabase admin env");
    return jsonWithCors({ error: isConfig ? message : "Failed to update application" }, { status: isConfig ? 503 : 500 });
  }
}

async function profileIdForRequest(request: Request): Promise<string> {
  const auth = await getAuthenticatedUser(request);
  return auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (ALLOWED_STATUSES as readonly string[]).includes(value);
}
