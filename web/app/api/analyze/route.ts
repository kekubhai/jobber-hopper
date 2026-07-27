import { NextResponse } from "next/server";
import type { ActionResponse } from "@jobber-hopper/shared";
import { isMasterProfileReady, type MasterProfile } from "@jobber-hopper/shared";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type AnalyzeRequest = {
  text?: unknown;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";
const defaultProfileId = process.env.DEFAULT_PROFILE_ID ?? "local-dev-user";
const defaultModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
  }

  let body: AnalyzeRequest;

  try {
    body = await request.json() as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    return NextResponse.json({ error: "Request body must include text" }, { status: 400 });
  }

  const profileId = getProfileIdFromUrl(request.url);
  const profileReady = await checkProfileReady(profileId);

  if (!profileReady) {
    return NextResponse.json(
      {
        error: "Master profile is missing or incomplete. Save your profile first.",
        profileId
      },
      { status: 412 }
    );
  }

  try {
    const action = await analyzeWithOpenRouter(body.text.slice(0, 3000), apiKey);
    return NextResponse.json(action);
  } catch (error) {
    console.error("Analyze API error", error);
    return NextResponse.json({ error: "Failed to analyze page" }, { status: 502 });
  }
}

async function checkProfileReady(profileId: string): Promise<boolean> {
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

function getProfileIdFromUrl(url: string): string {
  const parsed = new URL(url);
  const candidate = parsed.searchParams.get("profileId");
  if (candidate && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return defaultProfileId;
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

async function analyzeWithOpenRouter(text: string, apiKey: string): Promise<ActionResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const appName = process.env.OPENROUTER_APP_NAME ?? "Jobber Hopper";
  if (siteUrl) {
    headers["HTTP-Referer"] = siteUrl;
  }
  headers["X-Title"] = appName;

  const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Return only valid JSON matching exactly one of these shapes:",
            "{\"type\":\"fill_form\",\"fields\":{\"name\":\"\",\"email\":\"\"}}",
            "{\"type\":\"send_email\",\"to\":\"\",\"subject\":\"\",\"body\":\"\"}",
            "Use fill_form for job application forms.",
            "Use send_email for explicit email requests.",
            "For fill_form, include only fields that are visible or strongly implied by the page.",
            "If neither applies, return a fill_form action with an empty fields object."
          ].join(" ")
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter request failed with status ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`);
  }

  const data = await response.json() as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned no content");
  }

  return parseActionResponse(content);
}

function parseActionResponse(content: string): ActionResponse {
  const parsed = JSON.parse(content) as Partial<ActionResponse>;

  if (parsed.type === "fill_form" && isStringRecord(parsed.fields)) {
    return { type: "fill_form", fields: parsed.fields };
  }

  if (
    parsed.type === "send_email" &&
    typeof parsed.to === "string" &&
    typeof parsed.subject === "string" &&
    typeof parsed.body === "string"
  ) {
    return {
      type: "send_email",
      to: parsed.to,
      subject: parsed.subject,
      body: parsed.body
    };
  }

  throw new Error("Model returned an invalid action shape");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string");
}
