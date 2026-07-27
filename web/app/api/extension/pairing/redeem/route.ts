import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RedeemBody = {
  code?: unknown;
};

export function OPTIONS() {
  return optionsCors();
}

/** Extension popup: exchange pairing code for Supabase session tokens. */
export async function POST(request: Request) {
  let body: RedeemBody;

  try {
    body = (await request.json()) as RedeemBody;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return jsonWithCors({ error: "Invalid pairing code" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: row, error } = await supabase
      .from("extension_pairing_codes")
      .select("code, user_id, access_token, refresh_token, expires_at, used_at")
      .eq("code", code)
      .maybeSingle<{
        code: string;
        user_id: string;
        access_token: string;
        refresh_token: string;
        expires_at: string;
        used_at: string | null;
      }>();

    if (error) {
      throw error;
    }

    if (!row) {
      return jsonWithCors({ error: "Pairing code not found" }, { status: 404 });
    }

    if (row.used_at) {
      return jsonWithCors({ error: "Pairing code already used" }, { status: 410 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return jsonWithCors({ error: "Pairing code expired" }, { status: 410 });
    }

    await supabase
      .from("extension_pairing_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("code", code);

    return jsonWithCors({
      profileId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at
    });
  } catch (error) {
    console.error("Pairing redeem failed", error);
    return jsonWithCors({ error: "Failed to redeem pairing code" }, { status: 500 });
  }
}
