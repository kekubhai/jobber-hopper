import {
  isMasterProfileReady,
  type JobPostExtraction,
  type JobPostMatchGuidance,
  type MasterProfile,
  type SocialJobPlatform
} from "@jobber-hopper/shared";
import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import {
  buildJobPostEmailWriteInput,
  writeJobPostEmail
} from "@/lib/llm-job-post-email";
import { mapRowToMasterProfile } from "@/lib/master-profile-persistence";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

type EmailRequest = {
  jobPost?: unknown;
  match?: unknown;
  platform?: unknown;
};

type MasterProfileRow = {
  profile_id: string;
  personal: MasterProfile["personal"];
  address: MasterProfile["address"];
  education: MasterProfile["education"];
  work_history: MasterProfile["workHistory"];
  custom_qa_pairs: MasterProfile["customQaPairs"];
  updated_at: string;
};

export function OPTIONS() {
  return optionsCors();
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  const profileId = auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);

  let body: EmailRequest;
  try {
    body = (await request.json()) as EmailRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobPost = parseJobPost(body.jobPost);
  if (!jobPost?.isJobPost) {
    return jsonWithCors({ error: "jobPost must be a valid job extraction with isJobPost=true" }, { status: 400 });
  }

  const match = parseMatch(body.match);
  if (!match) {
    return jsonWithCors({ error: "match must be a valid Prompt 2 guidance object" }, { status: 400 });
  }

  const platform = parsePlatform(body.platform);
  if (!platform) {
    return jsonWithCors({ error: 'platform must be "linkedin" or "twitter"' }, { status: 400 });
  }

  const profile = await loadMasterProfile(profileId);
  if (!profile || !isMasterProfileReady(profile)) {
    return jsonWithCors(
      {
        error: "Master profile is missing or incomplete. Save your profile first.",
        profileId
      },
      { status: 412 }
    );
  }

  const userName =
    profile.personal.preferredName.trim() ||
    profile.personal.firstName.trim() ||
    "there";

  try {
    const input = buildJobPostEmailWriteInput(jobPost, match, platform, userName);
    const email = await writeJobPostEmail(input);
    return jsonWithCors({
      profileId,
      platform,
      email
    });
  } catch (error) {
    console.error("Job post email write failed", error);
    return jsonWithCors({ error: "Failed to write application email" }, { status: 502 });
  }
}

async function loadMasterProfile(profileId: string): Promise<MasterProfile | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("master_profiles")
      .select("profile_id, personal, address, education, work_history, custom_qa_pairs, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle<MasterProfileRow>();

    if (error || !data) {
      return null;
    }

    return mapRowToMasterProfile(data);
  } catch {
    return null;
  }
}

function parseJobPost(value: unknown): JobPostExtraction | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.isJobPost !== "boolean") {
    return null;
  }
  return value as JobPostExtraction;
}

function parseMatch(value: unknown): JobPostMatchGuidance | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.topHighlights) || typeof row.matchScore !== "number") {
    return null;
  }
  return value as JobPostMatchGuidance;
}

function parsePlatform(value: unknown): SocialJobPlatform | null {
  if (value === "linkedin" || value === "twitter") {
    return value;
  }
  return null;
}
