import { NextResponse } from "next/server";
import { isMasterProfileReady, type MasterProfile } from "@jobber-hopper/shared";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type MasterProfileRow = {
  profile_id: string;
  personal: MasterProfile["personal"];
  address: MasterProfile["address"];
  education: MasterProfile["education"];
  work_history: MasterProfile["workHistory"];
  custom_qa_pairs: MasterProfile["customQaPairs"];
};

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

export async function GET(request: Request) {
  const profileId = getProfileIdFromUrl(request.url);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("master_profiles")
      .select("profile_id, personal, address, education, work_history, custom_qa_pairs")
      .eq("profile_id", profileId)
      .maybeSingle<MasterProfileRow>();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ exists: false, ready: false, profileId });
    }

    const profile = {
      personal: data.personal,
      address: data.address,
      education: data.education,
      workHistory: data.work_history,
      customQaPairs: data.custom_qa_pairs
    } satisfies MasterProfile;

    return NextResponse.json({
      exists: true,
      ready: isMasterProfileReady(profile),
      profileId: data.profile_id
    });
  } catch (error) {
    console.error("Profile exists check failed", error);
    return NextResponse.json({ error: "Failed to check profile" }, { status: 500 });
  }
}

function getProfileIdFromUrl(url: string): string {
  const parsed = new URL(url);
  const candidate = parsed.searchParams.get("profileId");
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return defaultProfileId;
}
