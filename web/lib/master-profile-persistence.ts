import type { SupabaseClient } from "@supabase/supabase-js";
import type { MasterProfile, PersonalInfo } from "@jobber-hopper/shared";
import { masterProfileToDbPayload, normalizeMasterProfile } from "@jobber-hopper/shared";

type MasterProfileRow = {
  profile_id: string;
  personal: MasterProfile["personal"];
  address: MasterProfile["address"];
  education: MasterProfile["education"];
  work_history: MasterProfile["workHistory"];
  custom_qa_pairs: MasterProfile["customQaPairs"];
  updated_at: string;
};

export function mapRowToMasterProfile(row: MasterProfileRow): MasterProfile {
  const profile = normalizeMasterProfile({
    personal: row.personal,
    address: row.address,
    education: row.education,
    workHistory: row.work_history,
    customQaPairs: row.custom_qa_pairs
  });

  // Drop DB-only keys fullName/name from API responses (still stored in Supabase JSON).
  return profile;
}

/** Single table: all form data lives in master_profiles JSON columns. */
export async function upsertMasterProfile(
  supabase: SupabaseClient,
  profileId: string,
  profile: MasterProfile
): Promise<MasterProfileRow> {
  const normalized = normalizeMasterProfile(profile);
  const payload = masterProfileToDbPayload(profileId, normalized);

  const { data, error } = await supabase
    .from("master_profiles")
    .upsert(payload, { onConflict: "profile_id" })
    .select("profile_id, personal, address, education, work_history, custom_qa_pairs, updated_at")
    .single<MasterProfileRow>();

  if (error) {
    throw error;
  }

  await syncLinkedUserDisplayName(supabase, data);

  return data;
}

export async function upsertMasterProfileForUser(
  supabase: SupabaseClient,
  userId: string,
  profile: MasterProfile
): Promise<MasterProfileRow> {
  const normalized = normalizeMasterProfile(profile);
  const profileId = userId;
  const payload = {
    ...masterProfileToDbPayload(profileId, normalized),
    user_id: userId
  };

  const { data, error } = await supabase
    .from("master_profiles")
    .upsert(payload, { onConflict: "profile_id" })
    .select("profile_id, personal, address, education, work_history, custom_qa_pairs, updated_at")
    .single<MasterProfileRow>();

  if (error) {
    throw error;
  }

  await syncLinkedUserDisplayName(supabase, data);

  return data;
}

async function syncLinkedUserDisplayName(
  supabase: SupabaseClient,
  row: MasterProfileRow & { user_id?: string | null; id?: string }
): Promise<void> {
  const personal = row.personal as PersonalInfo & { fullName?: string; name?: string };
  const displayName =
    personal.fullName?.trim() ||
    personal.name?.trim() ||
    `${personal.firstName ?? ""} ${personal.lastName ?? ""}`.trim() ||
    personal.preferredName?.trim() ||
    "";

  if (!displayName) {
    return;
  }

  const { data: masterRow } = await supabase
    .from("master_profiles")
    .select("id, user_id")
    .eq("profile_id", row.profile_id)
    .maybeSingle<{ id: string; user_id: string | null }>();

  if (!masterRow?.user_id) {
    return;
  }

  await supabase
    .from("user_profiles")
    .update({
      display_name: displayName,
      email: personal.email || undefined,
      master_profile_id: masterRow.id
    })
    .eq("user_id", masterRow.user_id);
}

export function isMasterProfile(value: unknown): value is MasterProfile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasPersonal = Boolean(candidate.personal);
  const hasAddress = Boolean(candidate.address);
  const education = candidate.education;
  const workHistory = candidate.workHistory ?? candidate.work_history;
  const customQa = candidate.customQaPairs ?? candidate.custom_qa_pairs;

  return hasPersonal &&
    hasAddress &&
    Array.isArray(education) &&
    Array.isArray(workHistory) &&
    Array.isArray(customQa);
}
