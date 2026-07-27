import { randomInt } from "node:crypto";
import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { getAuthenticatedUser } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;

export function OPTIONS() {
  return optionsCors();
}

/** Dashboard: create a pairing code while signed in (Clerk session JWT). */
export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return jsonWithCors({ error: "Sign in required" }, { status: 401 });
  }

  const accessToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";

  if (!accessToken) {
    return jsonWithCors({ error: "Missing session token" }, { status: 400 });
  }

  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("extension_pairing_codes").insert({
      code,
      user_id: authUser.userId,
      access_token: accessToken,
      refresh_token: "",
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
