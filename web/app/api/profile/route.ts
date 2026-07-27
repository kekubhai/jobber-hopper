import { NextResponse } from "next/server";
import {
  createEmptyMasterProfile,
  isMasterProfileReady,
  normalizeMasterProfile,
  type MasterProfile
} from "@jobber-hopper/shared";
import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { syncClerkUserToSupabase } from "@/lib/clerk-user-sync";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  isMasterProfile,
  mapRowToMasterProfile,
  upsertMasterProfile,
  upsertMasterProfileForUser
} from "@/lib/master-profile-persistence";

type ProfileRequestBody = {
  profileId?: unknown;
  profile?: unknown;
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

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

export function OPTIONS() {
  return optionsCors();
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (auth) {
    try {
      await syncClerkUserToSupabase(auth.userId);
    } catch (error) {
      console.warn("Clerk sync on profile GET skipped", error);
    }
  }

  const profileId = auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("master_profiles")
      .select("profile_id, personal, address, education, work_history, custom_qa_pairs, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle<MasterProfileRow>();

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonWithCors({
        exists: false,
        profileId,
        profile: createEmptyMasterProfile(),
        ready: false,
        authenticated: Boolean(auth)
      });
    }

    const profile = mapRowToMasterProfile(data);

    return jsonWithCors({
      exists: true,
      profileId: data.profile_id,
      profile,
      ready: isMasterProfileReady(profile),
      updatedAt: data.updated_at,
      authenticated: Boolean(auth)
    });
  } catch (error) {
    console.error("Profile GET failed", error);
    return jsonWithCors({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);

  let body: ProfileRequestBody;

  try {
    body = await request.json() as ProfileRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profileId = auth?.userId ??
    (typeof body.profileId === "string" && body.profileId.trim().length > 0
      ? body.profileId.trim()
      : defaultProfileId);

  if (!isMasterProfile(body.profile)) {
    return NextResponse.json({ error: "profile is required and must match MasterProfile shape" }, { status: 400 });
  }

  const profile = normalizeMasterProfile(body.profile);

  try {
    const supabase = getSupabaseAdminClient();
    if (auth) {
      await syncClerkUserToSupabase(auth.userId);
    }
    const data = auth
      ? await upsertMasterProfileForUser(supabase, auth.userId, profile)
      : await upsertMasterProfile(supabase, profileId, profile);

    return NextResponse.json({
      exists: true,
      profileId: data.profile_id,
      profile: mapRowToMasterProfile(data),
      ready: isMasterProfileReady(mapRowToMasterProfile(data)),
      updatedAt: data.updated_at,
      authenticated: Boolean(auth)
    });
  } catch (error) {
    console.error("Profile POST failed", error);
    const message = error instanceof Error ? error.message : "Failed to save profile";
    const isConfig = message.includes("Supabase admin env");
    return NextResponse.json(
      { error: isConfig ? message : "Failed to save profile" },
      { status: isConfig ? 503 : 500 }
    );
  }
}