import {
  type FormFieldLabelPayload,
  type FormFieldSchemaMapping,
  isProfileFieldPath
} from "@jobber-hopper/shared";
import { optionsCors, jsonWithCors } from "@/lib/api-cors";
import { sha256FormHash } from "@/lib/form-hash";
import { inferFormFieldMappingsWithLlm } from "@/lib/llm-form-mapping";
import { getAuthenticatedUser, getProfileIdFromUrl } from "@/lib/request-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isMasterProfileReady, type MasterProfile } from "@jobber-hopper/shared";

type FormMappingRequestBody = {
  domain?: unknown;
  formHash?: unknown;
  platform?: unknown;
  fields?: unknown;
};

type CacheRow = {
  mappings: FormFieldSchemaMapping[];
};

const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";

export function OPTIONS() {
  return optionsCors();
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  const profileId = auth?.userId ?? getProfileIdFromUrl(request.url, defaultProfileId);

  if (!(await isProfileReady(profileId))) {
    return jsonWithCors(
      {
        error: "Master profile is missing or incomplete. Save your profile first.",
        profileId
      },
      { status: 412 }
    );
  }

  let body: FormMappingRequestBody;

  try {
    body = (await request.json()) as FormMappingRequestBody;
  } catch {
    return jsonWithCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = parseFields(body.fields);
  if (fields.length === 0) {
    return jsonWithCors({ error: "fields must be a non-empty array of { fieldId, labelGuess, type }" }, { status: 400 });
  }

  const domain = typeof body.domain === "string" ? body.domain.trim().toLowerCase() : "";
  if (!domain) {
    return jsonWithCors({ error: "domain is required" }, { status: 400 });
  }

  const clientHash = typeof body.formHash === "string" ? body.formHash.trim() : "";
  const formHash = clientHash.length > 0 ? clientHash : sha256FormHash(fields);

  if (clientHash && clientHash !== sha256FormHash(fields)) {
    return jsonWithCors({ error: "formHash does not match fields payload" }, { status: 400 });
  }

  const platform = typeof body.platform === "string" ? body.platform.trim() : null;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: cached, error: cacheError } = await supabase
      .from("form_field_mapping_cache")
      .select("mappings")
      .eq("domain", domain)
      .eq("form_hash", formHash)
      .maybeSingle<CacheRow>();

    if (cacheError) {
      throw cacheError;
    }

    if (cached?.mappings) {
      return jsonWithCors({
        domain,
        formHash,
        cached: true,
        mappings: sanitizeMappings(cached.mappings, fields)
      });
    }

    const mappings = await inferFormFieldMappingsWithLlm(fields);

    const { error: insertError } = await supabase.from("form_field_mapping_cache").upsert(
      {
        domain,
        form_hash: formHash,
        platform,
        mappings
      },
      { onConflict: "domain,form_hash" }
    );

    if (insertError) {
      throw insertError;
    }

    return jsonWithCors({
      domain,
      formHash,
      cached: false,
      mappings
    });
  } catch (error) {
    console.error("Form mapping failed", error);
    return jsonWithCors({ error: "Failed to resolve form mapping" }, { status: 502 });
  }
}

function parseFields(value: unknown): FormFieldLabelPayload[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fields: FormFieldLabelPayload[] = [];

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const row = entry as Record<string, unknown>;
    const fieldId = typeof row.fieldId === "string" ? row.fieldId.trim() : "";
    const labelGuess = typeof row.labelGuess === "string" ? row.labelGuess.trim() : "";
    const type = typeof row.type === "string" ? row.type.trim() : "text";

    if (!fieldId) {
      continue;
    }

    fields.push({ fieldId, labelGuess, type });
  }

  return fields;
}

function sanitizeMappings(
  mappings: FormFieldSchemaMapping[],
  fields: FormFieldLabelPayload[]
): FormFieldSchemaMapping[] {
  const allowedIds = new Set(fields.map((field) => field.fieldId));
  const byId = new Map<string, FormFieldSchemaMapping>();

  for (const mapping of mappings) {
    if (!allowedIds.has(mapping.fieldId)) {
      continue;
    }

    const path =
      mapping.profileFieldPath && isProfileFieldPath(mapping.profileFieldPath)
        ? mapping.profileFieldPath
        : null;

    byId.set(mapping.fieldId, {
      fieldId: mapping.fieldId,
      profileFieldPath: path,
      confidence: typeof mapping.confidence === "number" ? mapping.confidence : path ? 0.85 : 0
    });
  }

  return fields.map(
    (field) =>
      byId.get(field.fieldId) ?? {
        fieldId: field.fieldId,
        profileFieldPath: null,
        confidence: 0
      }
  );
}

async function isProfileReady(profileId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("master_profiles")
      .select("personal, address, education, work_history, custom_qa_pairs")
      .eq("profile_id", profileId)
      .maybeSingle<{
        personal: MasterProfile["personal"];
        address: MasterProfile["address"];
        education: MasterProfile["education"];
        work_history: MasterProfile["workHistory"];
        custom_qa_pairs: MasterProfile["customQaPairs"];
      }>();

    if (error || !data) {
      return false;
    }

    return isMasterProfileReady({
      personal: data.personal,
      address: data.address,
      education: data.education,
      workHistory: data.work_history,
      customQaPairs: data.custom_qa_pairs
    });
  } catch {
    return false;
  }
}
