import {
  countEmailWords,
  emptyJobPostEmailDraft,
  type JobPostEmailDraft,
  type JobPostExtraction,
  type JobPostMatchGuidance,
  type SocialJobPlatform
} from "@jobber-hopper/shared";
import { completeOpenRouterJson } from "@/lib/openrouter-client";

const BANNED_WORDS = [
  "leverage",
  "utilize",
  "passionate",
  "excited",
  "thrilled",
  "synergy",
  "rockstar",
  "ninja",
  "guru",
  "innovative",
  "dynamic",
  "detail-oriented"
] as const;

const BANNED_OPENERS = [
  /^i hope\b/i,
  /^i am writing to\b/i,
  /^i'm writing to\b/i,
  /^my name is\b/i,
  /^i wanted to reach out\b/i
];

const MAX_BODY_WORDS = 120;
const MAX_SUBJECT_CHARS = 50;

export type JobPostEmailWriteInput = {
  role: string | null;
  company: string | null;
  hiringManagerName: string | null;
  email: string | null;
  thingToLeadWith: string | null;
  tone: string;
  userName: string;
  topHighlights: string[];
  mostRelevantRole: JobPostMatchGuidance["mostRelevantRole"];
  linksToInclude: JobPostMatchGuidance["linksToInclude"];
  platform: SocialJobPlatform;
};

export const JOB_POST_EMAIL_SYSTEM_PROMPT = [
  "We are building a browser extension that helps job seekers apply to jobs faster.",
  "After scanning a job post and matching it against the user profile, we now write",
  "a cold job application email on behalf of the user.",
  "This is step 3 of our pipeline. We have already:",
  "- Scanned the post and extracted job data (Prompt 1)",
  "- Matched the job against user profile and selected what to highlight (Prompt 2)",
  "Now we write the actual email. This email will be shown to the user in the",
  "extension UI and they can copy, edit, or send it directly.",
  "The most important thing: this email must sound like a real human wrote it.",
  "Not a bot. Not a template. A real person who actually read the post and took",
  "5 minutes to write a thoughtful note.",
  "INPUT YOU WILL RECEIVE:",
  "- ROLE: job role title",
  "- COMPANY: company name",
  "- HIRING_MANAGER_NAME: name or null (use \"Hi there\" if null)",
  "- EMAIL: email address to send to",
  "- THING_TO_LEAD_WITH: specific detail from the post to open with (from Prompt 2)",
  "- TONE: tone of the original post",
  "- USER_NAME: applicant's first name",
  "- TOP_HIGHLIGHTS: array of 2-3 relevant highlights (from Prompt 2)",
  "- MOST_RELEVANT_ROLE: most relevant past experience object (from Prompt 2)",
  "- LINKS_TO_INCLUDE: object with relevant urls (from Prompt 2)",
  "- PLATFORM: linkedin | twitter",
  "HARD RULES — NEVER BREAK THESE:",
  "- Body must be under 120 words. Count them. Not a word more.",
  "- First line must reference THING_TO_LEAD_WITH specifically. Not generically.",
  '- Never open with: "I hope", "I am writing to", "My name is", "I wanted to reach out"',
  "- Never use these words: leverage, utilize, passionate, excited, thrilled,",
  "  synergy, rockstar, ninja, guru, innovative, dynamic, detail-oriented",
  "- Mention maximum 2 highlights from TOP_HIGHLIGHTS. Not all 3.",
  "- Links go at the bottom in a clean format with → arrows",
  '- End with ONE soft question or CTA. Not "please consider me" or "I look forward"',
  "- Subject line must be specific and under 50 characters",
  "- If PLATFORM is twitter, tone can be more casual and punchy",
  "- If PLATFORM is linkedin, slightly more professional but still human",
  "EMAIL STRUCTURE TO FOLLOW:",
  "Line 1: Hook — specific reference to their post (not generic)",
  "Line 2-3: One relevant thing about the applicant that connects to their need",
  "Line 4: Second highlight or specific result/number if available",
  "Line 5: Links naturally placed",
  "Line 6: Soft CTA",
  "RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION. NO EXTRA TEXT.",
  JSON.stringify({
    subject: "email subject line under 50 characters",
    body: "full email body as a single string with \\n for line breaks",
    wordCount: 0,
    toEmail: "email address",
    hiringManagerName: "name used in greeting or null"
  })
].join(" ");

export function buildJobPostEmailWriteInput(
  jobPost: JobPostExtraction,
  match: JobPostMatchGuidance,
  platform: SocialJobPlatform,
  userName: string
): JobPostEmailWriteInput {
  return {
    role: jobPost.role,
    company: jobPost.company,
    hiringManagerName: jobPost.hiringManager.name,
    email: jobPost.emailAddress ?? jobPost.rawEmail ?? jobPost.hiringManager.email,
    thingToLeadWith: match.thingToLeadWith ?? jobPost.keyDetails,
    tone: match.toneToUse || jobPost.tone,
    userName: userName.trim() || "there",
    topHighlights: match.topHighlights.slice(0, 3),
    mostRelevantRole: match.mostRelevantRole,
    linksToInclude: match.linksToInclude,
    platform
  };
}

export async function writeJobPostEmail(input: JobPostEmailWriteInput): Promise<JobPostEmailDraft> {
  const user = [
    `ROLE: ${input.role ?? "null"}`,
    `COMPANY: ${input.company ?? "null"}`,
    `HIRING_MANAGER_NAME: ${input.hiringManagerName ?? "null"}`,
    `EMAIL: ${input.email ?? "null"}`,
    `THING_TO_LEAD_WITH: ${input.thingToLeadWith ?? "null"}`,
    `TONE: ${input.tone}`,
    `USER_NAME: ${input.userName}`,
    `TOP_HIGHLIGHTS: ${JSON.stringify(input.topHighlights)}`,
    `MOST_RELEVANT_ROLE: ${JSON.stringify(input.mostRelevantRole)}`,
    `LINKS_TO_INCLUDE: ${JSON.stringify(input.linksToInclude)}`,
    `PLATFORM: ${input.platform}`
  ].join("\n");

  const content = await completeOpenRouterJson(JOB_POST_EMAIL_SYSTEM_PROMPT, user);
  return parseJobPostEmailDraft(content, input);
}

export function parseJobPostEmailDraft(
  content: string,
  input: JobPostEmailWriteInput
): JobPostEmailDraft {
  const fallback = emptyJobPostEmailDraft();
  fallback.toEmail = input.email;
  fallback.hiringManagerName = input.hiringManagerName;

  const parsed = parseJsonObject(content);
  if (!parsed) {
    return finalizeDraft(fallback, input);
  }

  const draft: JobPostEmailDraft = {
    subject: clampSubject(nullableString(parsed.subject) ?? ""),
    body: nullableString(parsed.body) ?? "",
    wordCount: 0,
    toEmail: nullableString(parsed.toEmail) ?? input.email,
    hiringManagerName: nullableString(parsed.hiringManagerName) ?? input.hiringManagerName
  };

  return finalizeDraft(draft, input);
}

function finalizeDraft(draft: JobPostEmailDraft, input: JobPostEmailWriteInput): JobPostEmailDraft {
  let body = normalizeBody(draft.body);
  body = stripBannedWords(body);
  body = ensureGreeting(body, input.hiringManagerName);
  body = ensureHookMentionsLead(body, input.thingToLeadWith);
  body = ensureLinksBlock(body, input.linksToInclude);
  body = ensureSignOff(body, input.userName);
  body = truncateToWordLimit(body, MAX_BODY_WORDS);

  if (isBannedOpener(body)) {
    body = rewriteOpener(body, input);
  }

  const subject =
    clampSubject(draft.subject) ||
    clampSubject(
      [input.role, input.company].filter(Boolean).join(" at ") || "Quick note on your post"
    );

  return {
    subject,
    body,
    wordCount: countEmailWords(body),
    toEmail: draft.toEmail ?? input.email,
    hiringManagerName: draft.hiringManagerName ?? input.hiringManagerName
  };
}

function normalizeBody(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripBannedWords(body: string): string {
  let result = body;
  for (const word of BANNED_WORDS) {
    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
    result = result.replace(pattern, "");
  }
  return result.replace(/[ \t]{2,}/g, " ").replace(/\n[ \t]+/g, "\n").trim();
}

function isBannedOpener(body: string): boolean {
  const firstLine = body.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  // Skip greeting line if present
  const contentLine = /^hi\b|^hello\b|^hey\b/i.test(firstLine)
    ? body
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(1)
        .find(Boolean) ?? ""
    : firstLine;
  return BANNED_OPENERS.some((pattern) => pattern.test(contentLine));
}

function rewriteOpener(body: string, input: JobPostEmailWriteInput): string {
  const lines = body.split("\n");
  const greetingIndex = lines.findIndex((line) => /^(hi|hello|hey)\b/i.test(line.trim()));
  const hook =
    input.thingToLeadWith?.trim() ||
    `Your note about ${input.role ?? "the role"} stood out.`;
  const hookLine = hook.endsWith(".") ? hook : `${hook}.`;

  if (greetingIndex >= 0) {
    const nextContent = lines.findIndex(
      (line, index) => index > greetingIndex && line.trim().length > 0
    );
    if (nextContent >= 0) {
      lines[nextContent] = hookLine;
      return lines.join("\n");
    }
    lines.splice(greetingIndex + 1, 0, "", hookLine);
    return lines.join("\n");
  }

  return `${hookLine}\n\n${body}`.trim();
}

function ensureGreeting(body: string, hiringManagerName: string | null): string {
  if (/^(hi|hello|hey)\b/i.test(body.trim())) {
    return body;
  }
  const greeting = hiringManagerName?.trim()
    ? `Hi ${hiringManagerName.trim().split(/\s+/)[0]},`
    : "Hi there,";
  return `${greeting}\n\n${body}`.trim();
}

function ensureHookMentionsLead(body: string, thingToLeadWith: string | null): string {
  if (!thingToLeadWith?.trim()) {
    return body;
  }
  const lead = thingToLeadWith.trim();
  const lowerBody = body.toLowerCase();
  const leadTokens = lead
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 4)
    .slice(0, 4);
  const mentioned = leadTokens.some((token) => lowerBody.includes(token));
  if (mentioned) {
    return body;
  }

  const lines = body.split("\n");
  const greetingIndex = lines.findIndex((line) => /^(hi|hello|hey)\b/i.test(line.trim()));
  const insertAt = greetingIndex >= 0 ? greetingIndex + 1 : 0;
  const hook = lead.endsWith(".") ? lead : `${lead}.`;
  lines.splice(insertAt, 0, "", hook);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function ensureLinksBlock(
  body: string,
  links: JobPostMatchGuidance["linksToInclude"]
): string {
  const entries: Array<[string, string]> = [];
  if (links.portfolio) entries.push(["Portfolio", links.portfolio]);
  if (links.github) entries.push(["GitHub", links.github]);
  if (links.linkedin) entries.push(["LinkedIn", links.linkedin]);
  if (links.resume) entries.push(["Resume", links.resume]);
  if (entries.length === 0) {
    return body;
  }

  const missing = entries.filter(([, url]) => !body.includes(url));
  if (missing.length === 0) {
    return body;
  }

  const block = missing.map(([label, url]) => `${label} → ${url}`).join("\n");
  // Place before final soft CTA if the last paragraph looks like a question
  const parts = body.trim().split(/\n\n+/);
  if (parts.length >= 2 && /\?\s*$/.test(parts[parts.length - 1] ?? "")) {
    const cta = parts.pop()!;
    return [...parts, block, cta].join("\n\n").trim();
  }
  return `${body.trim()}\n\n${block}`.trim();
}

function ensureSignOff(body: string, userName: string): string {
  if (new RegExp(`\\b${escapeRegExp(userName)}\\s*$`, "i").test(body.trim())) {
    return body;
  }
  if (/\b(best|thanks|cheers|regards)\b[\s\S]{0,40}$/i.test(body.trim())) {
    return body;
  }
  return `${body.trim()}\n\nBest,\n${userName}`.trim();
}

function truncateToWordLimit(body: string, maxWords: number): string {
  const words = body.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return body.trim();
  }
  return words.slice(0, maxWords).join(" ").trim();
}

function clampSubject(subject: string): string {
  const cleaned = subject.replace(/\s+/g, " ").trim();
  if (cleaned.length <= MAX_SUBJECT_CHARS) {
    return cleaned;
  }
  return `${cleaned.slice(0, MAX_SUBJECT_CHARS - 1).trimEnd()}…`;
}

function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;

  try {
    const value = JSON.parse(raw) as unknown;
    return isRecord(value) ? value : null;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return null;
    }
    try {
      const value = JSON.parse(raw.slice(start, end + 1)) as unknown;
      return isRecord(value) ? value : null;
    } catch {
      return null;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || /^null$/i.test(trimmed) || trimmed === "undefined") {
    return null;
  }
  return trimmed;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
