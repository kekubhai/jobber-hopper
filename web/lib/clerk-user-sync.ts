import { createEmptyMasterProfile, normalizeMasterProfile, type MasterProfile } from "@jobber-hopper/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClerkServerClient } from "@/lib/clerk-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { masterProfileToDbPayload } from "@jobber-hopper/shared";

export type ClerkUserSyncResult = {
  clerkUserId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  masterProfileId: string | null;
  createdMasterProfile: boolean;
};

function primaryEmail(user: {
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
}): string | null {
  if (!user.primaryEmailAddressId) {
    return user.emailAddresses[0]?.emailAddress ?? null;
  }

  return (
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}

function displayNameFromClerk(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
}): string {
  const fromName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fromName) {
    return fromName;
  }

  return user.username?.trim() ?? "";
}

function mergePersonalFromClerk(
  personal: MasterProfile["personal"],
  clerk: { firstName: string | null; lastName: string | null; email: string | null }
): MasterProfile["personal"] {
  return {
    ...personal,
    firstName: personal.firstName.trim() || clerk.firstName?.trim() || "",
    lastName: personal.lastName.trim() || clerk.lastName?.trim() || "",
    email: personal.email.trim() || clerk.email?.trim() || ""
  };
}

function personalNeedsClerkMerge(
  personal: MasterProfile["personal"],
  clerk: { firstName: string | null; lastName: string | null; email: string | null }
): boolean {
  const merged = mergePersonalFromClerk(personal, clerk);
  return (
    merged.firstName !== personal.firstName ||
    merged.lastName !== personal.lastName ||
    merged.email !== personal.email
  );
}

async function ensureMasterProfileForClerkUser(
  supabase: SupabaseClient,
  clerkUserId: string,
  clerk: { firstName: string | null; lastName: string | null; email: string | null }
): Promise<{ id: string; created: boolean }> {
  const { data: existing, error: loadError } = await supabase
    .from("master_profiles")
    .select("id, personal, address, education, work_history, custom_qa_pairs")
    .eq("profile_id", clerkUserId)
    .maybeSingle<{
      id: string;
      personal: MasterProfile["personal"];
      address: MasterProfile["address"];
      education: MasterProfile["education"];
      work_history: MasterProfile["workHistory"];
      custom_qa_pairs: MasterProfile["customQaPairs"];
    }>();

  if (loadError) {
    throw loadError;
  }

  if (!existing) {
    const shell = createEmptyMasterProfile();
    shell.personal = mergePersonalFromClerk(shell.personal, clerk);
    const payload = {
      ...masterProfileToDbPayload(clerkUserId, normalizeMasterProfile(shell)),
      clerk_user_id: clerkUserId
    };

    const { data: inserted, error: insertError } = await supabase
      .from("master_profiles")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (insertError) {
      throw insertError;
    }

    return { id: inserted.id, created: true };
  }

  const profile = normalizeMasterProfile({
    personal: existing.personal,
    address: existing.address,
    education: existing.education,
    workHistory: existing.work_history,
    customQaPairs: existing.custom_qa_pairs
  });

  if (personalNeedsClerkMerge(profile.personal, clerk)) {
    profile.personal = mergePersonalFromClerk(profile.personal, clerk);
    const { error: updateError } = await supabase
      .from("master_profiles")
      .update({
        personal: profile.personal,
        clerk_user_id: clerkUserId
      })
      .eq("profile_id", clerkUserId);

    if (updateError) {
      throw updateError;
    }
  } else {
    await supabase
      .from("master_profiles")
      .update({ clerk_user_id: clerkUserId })
      .eq("profile_id", clerkUserId)
      .is("clerk_user_id", null);
  }

  return { id: existing.id, created: false };
}

/** Upsert `clerk_user_profiles` and ensure linked `master_profiles` row for this Clerk user. */
export async function syncClerkUserToSupabase(clerkUserId: string): Promise<ClerkUserSyncResult> {
  const clerk = getClerkServerClient();
  if (!clerk) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  const user = await clerk.users.getUser(clerkUserId);
  const email = primaryEmail(user);
  const displayName = displayNameFromClerk(user);
  const avatarUrl = user.imageUrl ?? null;

  const supabase = getSupabaseAdminClient();
  const { id: masterProfileId, created } = await ensureMasterProfileForClerkUser(supabase, clerkUserId, {
    firstName: user.firstName,
    lastName: user.lastName,
    email
  });

  const { error: accountError } = await supabase.from("clerk_user_profiles").upsert(
    {
      clerk_user_id: clerkUserId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      master_profile_id: masterProfileId
    },
    { onConflict: "clerk_user_id" }
  );

  if (accountError) {
    throw accountError;
  }

  return {
    clerkUserId,
    email,
    displayName,
    avatarUrl,
    masterProfileId,
    createdMasterProfile: created
  };
}

export async function updateClerkUserProfileFromMaster(
  supabase: SupabaseClient,
  clerkUserId: string,
  masterProfileRowId: string,
  personal: MasterProfile["personal"] & { fullName?: string; name?: string }
): Promise<void> {
  const displayName =
    personal.fullName?.trim() ||
    personal.name?.trim() ||
    `${personal.firstName ?? ""} ${personal.lastName ?? ""}`.trim() ||
    personal.preferredName?.trim() ||
    "";

  await supabase
    .from("clerk_user_profiles")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        email: personal.email?.trim() || null,
        display_name: displayName,
        master_profile_id: masterProfileRowId
      },
      { onConflict: "clerk_user_id" }
    );
}

export function isClerkUserId(profileId: string): boolean {
  return profileId.startsWith("user_");
}
