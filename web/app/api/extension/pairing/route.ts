import { randomInt } from "node:crypto";
import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { getAuthenticatedUser } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type PairingCreateBody = {
  refreshToken?: unknown;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;

export function OPTIONS() {
  return optionsCors();
}

/** Dashboard: create a pairing code while signed in (sends current Supabase session). */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return jsonWithCors({ error: "Sign in required" }, { status: 401 });
  }

  let body: PairingCreateBody = {};
  try {
    body = (await request.json()) as PairingCreateBody;
  } catch {
    body = {};
  }

  const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
  const accessToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";

  if (!accessToken || !refreshToken) {
    return jsonWithCors({ error: "Missing session tokens" }, { status: 400 });
  }

  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("extension_pairing_codes").insert({
      code,
      user_id: auth.userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt
    });

    if (error) {
      throw error;
    }

    return jsonWithCors({
      code,
      expiresAt,
      expiresInSeconds: CODE_TTL_MINUTES * 60
    });
  } catch (error) {
    console.error("Pairing code create failed", error);
    return jsonWithCors({ error: "Failed to create pairing code" }, { status: 500 });
  }
}

function generatePairingCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return code;
}
