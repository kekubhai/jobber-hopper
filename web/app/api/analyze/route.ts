import { NextResponse } from "next/server";
import type { ActionResponse } from "../../../types/actions";

type AnalyzeRequest = {
  text?: unknown;
};

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
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

  try {
    const action = await analyzeWithOpenAI(body.text.slice(0, 3000), apiKey);
    return NextResponse.json(action);
  } catch (error) {
    console.error("Analyze API error", error);
    return NextResponse.json({ error: "Failed to analyze page" }, { status: 502 });
  }
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

async function analyzeWithOpenAI(text: string, apiKey: string): Promise<ActionResponse> {
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = await response.json() as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned no content");
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

  throw new Error("OpenAI returned an invalid action shape");
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string");
}
