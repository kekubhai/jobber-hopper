import type { SocialJobPlatform } from "@jobber-hopper/shared";
import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { extractJobPostFromSocialText } from "@/lib/llm-job-post-extract";

const MAX_POST_BODY_LENGTH = 8000;

type ExtractRequest = {
  postBody?: unknown;
  platform?: unknown;
};

export function OPTIONS() {
  return optionsCors();
}

export async function POST(request: Request) {
  let body: ExtractRequest;

  try {
    body = (await request.json()) as ExtractRequest;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.postBody !== "string" || body.postBody.trim().length === 0) {
    return jsonWithCors({ error: "Request body must include postBody" }, { status: 400 });
  }

  const platform = parsePlatform(body.platform);
  if (!platform) {
    return jsonWithCors({ error: 'platform must be "linkedin" or "twitter"' }, { status: 400 });
  }

  try {
    const extraction = await extractJobPostFromSocialText(
      body.postBody.trim().slice(0, MAX_POST_BODY_LENGTH),
      platform
    );
    return jsonWithCors({
      platform,
      extraction
    });
  } catch (error) {
    console.error("Job post extract failed", error);
    return jsonWithCors({ error: "Failed to extract job post" }, { status: 502 });
  }
}

function parsePlatform(value: unknown): SocialJobPlatform | null {
  if (value === "linkedin" || value === "twitter") {
    return value;
  }
  return null;
}
