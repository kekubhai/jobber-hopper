import { jsonWithCors, optionsCors } from "@/lib/api-cors";
import { getAuthenticatedUser } from "@/lib/request-auth";
import { extractProfileFromResumeText, extractResumeText } from "@/lib/resume-import";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsCors();
}

/**
 * Review-first resume import. The returned fields are not persisted until the
 * user reviews them in the profile form and explicitly clicks Save.
 */
export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (!auth && process.env.NODE_ENV === "production") {
    return jsonWithCors({ error: "Sign in is required to import a resume." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonWithCors({ error: "Expected a multipart resume upload." }, { status: 400 });
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File)) {
    return jsonWithCors({ error: "Choose a PDF, DOCX, or TXT resume first." }, { status: 400 });
  }

  try {
    const text = await extractResumeText(resume);
    const result = await extractProfileFromResumeText(text);
    return jsonWithCors({
      profile: result.profile,
      extractedCharacters: result.sourceTextLength,
      persisted: false
    });
  } catch (error) {
    console.error("Resume import failed", error);
    const message = error instanceof Error ? error.message : "Could not import this resume.";
    const isConfigurationError = message.includes("OPENROUTER_API_KEY is not configured");
    return jsonWithCors({ error: message }, { status: isConfigurationError ? 503 : 422 });
  }
}
