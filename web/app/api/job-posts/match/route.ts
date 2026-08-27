import {
  isMasterProfileReady,
  type JobPostExtraction,
  type MasterProfile
} from "@jobber-hopper/shared";
import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { masterProfileToMatchView } from "@/lib/job-post-profile-view";
import { matchJobPostToProfile } from "@/lib/llm-job-post-match";
import { mapRowToMasterProfile } from "@/lib/master-profile-persistence";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

type MatchRequest = {
  jobPost?: unknown;
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

  let body: MatchRequest;
  try {
    body = (await request.json()) as MatchRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobPost = parseJobPost(body.jobPost);
  if (!jobPost) {
    return jsonWithCors({ error: "jobPost must be a valid Prompt 1 extraction object" }, { status: 400 });
  }

  if (!jobPost.isJobPost) {
    return jsonWithCors({ error: "jobPost.isJobPost must be true before matching" }, { status: 400 });
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

  try {
    const profileView = masterProfileToMatchView(profile);
    const match = await matchJobPostToProfile(jobPost, profileView);
    return jsonWithCors({
      profileId,
      match
    });
  } catch (error) {
    console.error("Job post match failed", error);
    return jsonWithCors({ error: "Failed to match job post to profile" }, { status: 502 });
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
