import {
  isProfileFieldPath,
  PROFILE_FIELD_PATHS,
  type FormFieldLabelPayload,
  type FormFieldSchemaMapping
} from "@jobber-hopper/shared";
import { completeOpenRouterJson } from "@/lib/openrouter-client";

type LlmMappingResponse = {
  mappings?: Array<{
    fieldId?: unknown;
    profileFieldPath?: unknown;
    confidence?: unknown;
  }>;
};

export async function inferFormFieldMappingsWithLlm(
  fields: FormFieldLabelPayload[]
): Promise<FormFieldSchemaMapping[]> {
  const system = [
    "You map job application form fields to a fixed profile schema.",
    "Return only JSON: {\"mappings\":[{\"fieldId\":\"...\",\"profileFieldPath\":\"personal.email\"|null,\"confidence\":0.0-1.0}]}",
    `Allowed profileFieldPath values: ${PROFILE_FIELD_PATHS.join(", ")}`,
    "Use null profileFieldPath when no good match (file uploads, captcha, arbitrary essay questions).",
    "Prefer exact semantic matches. Do not invent field ids."
  ].join(" ");

  const user = JSON.stringify({
    fields: fields.map((field) => ({
      fieldId: field.fieldId,
      label: field.labelGuess,
      type: field.type
    }))
  });

  const content = await completeOpenRouterJson(system, user);
  const parsed = JSON.parse(content) as LlmMappingResponse;
  const rows = Array.isArray(parsed.mappings) ? parsed.mappings : [];

  const byFieldId = new Map<string, FormFieldSchemaMapping>();

  for (const row of rows) {
    if (typeof row.fieldId !== "string" || row.fieldId.trim().length === 0) {
      continue;
    }

    const fieldId = row.fieldId.trim();
    let profileFieldPath: FormFieldSchemaMapping["profileFieldPath"] = null;

    if (typeof row.profileFieldPath === "string" && isProfileFieldPath(row.profileFieldPath)) {
      profileFieldPath = row.profileFieldPath;
    }

    const confidence =
      typeof row.confidence === "number" && Number.isFinite(row.confidence)
        ? Math.min(1, Math.max(0, row.confidence))
        : profileFieldPath
          ? 0.85
          : 0;

    byFieldId.set(fieldId, { fieldId, profileFieldPath, confidence });
  }

  return fields.map((field) => {
    return (
      byFieldId.get(field.fieldId) ?? {
        fieldId: field.fieldId,
        profileFieldPath: null,
        confidence: 0
      }
    );
  });
}
