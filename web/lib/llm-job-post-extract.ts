import {
  emptyJobPostExtraction,
  type JobPostApplicationMethod,
  type JobPostExtraction,
  type JobPostTone,
  type JobPostUrgency,
  type SocialJobPlatform
} from "@jobber-hopper/shared";
import { completeOpenRouterJson } from "@/lib/openrouter-client";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LINKEDIN_PROFILE_RE = /https?:\/\/(?:[\w-]+\.)?linkedin\.com\/(?:in|company)\/[^\s|,;)]+/gi;

export const JOB_POST_EXTRACT_SYSTEM_PROMPT = [
  "We are building a browser extension called Jobber Hopper that helps job seekers apply to jobs faster.",
  "One feature is: when a user sees a job post on LinkedIn or Twitter/X and clicks our extension button,",
  "we scan that post and extract all relevant job information from it.",
  "This prompt is used in the first step of that pipeline — detecting whether the post is a job post",
  "and extracting structured data from it.",
  "The post body text has already been scraped from the DOM by our extension using these selectors:",
  '- LinkedIn: post container `[data-view-name="feed-full-update"]`, `[data-urn^="urn:li:activity:"]`, or `.feed-shared-update-v2`; text from `[data-testid="expandable-text-box"]`, `.update-components-text`, or legacy `.feed-shared-text`',
  '- Twitter/X: `[data-testid="tweetText"]`',
  "We have also detected which platform the user is on from the URL.",
  "Now you will receive the raw post text and platform name. Your job is to analyze it and return",
  "structured JSON that the rest of our pipeline will use.",
  "INPUT YOU WILL RECEIVE:",
  '- POST_BODY: raw text of the social media post',
  '- PLATFORM: "linkedin" | "twitter"',
  "YOUR TASK:",
  "Analyze the post and extract every piece of useful information for a job application.",
  "Be thorough — pick up emails, names, role titles, requirements, tone, and anything the poster specifically asked for.",
  "RULES:",
  "- If it is not a job post, still return the full JSON with null values",
  "- Email addresses must be extracted exactly as written",
  "- If hiring manager name is mentioned anywhere in post, capture it",
  "- Requirements = must haves, niceToHave = mentioned but not required",
  "- Tone detection will be used to match the email we write later",
  "- keyDetails should be one specific thing that makes this role/company unique",
  "- confidence should reflect how sure you are this is actually a job post",
  "RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION. NO EXTRA TEXT.",
  JSON.stringify({
    isJobPost: true,
    confidence: 0.0,
    role: "exact role title or null",
    company: "company name or null",
    hiringManager: {
      name: "full name or null",
      email: "email address or null",
      linkedin: "linkedin profile url or null"
    },
    applicationMethod: "email | link | dm | unknown",
    emailAddress: "email to apply to or null",
    requirements: ["must have skill or requirement 1", "must have skill or requirement 2"],
    niceToHave: ["good to have skill 1"],
    tone: "formal | casual | startup | corporate",
    specificAsks: ["portfolio | resume | github | cover letter | work samples"],
    keyDetails: "one specific line about what makes this role or company unique",
    urgency: "urgent | normal | passive",
    rawEmail: "exact email string found in post or null",
    postSummary: "2 line plain english summary of the post for internal use"
  })
].join(" ");

export async function extractJobPostFromSocialText(
  postBody: string,
  platform: SocialJobPlatform
): Promise<JobPostExtraction> {
  const user = `POST_BODY: ${postBody}\nPLATFORM: ${platform}`;
  const content = await completeOpenRouterJson(JOB_POST_EXTRACT_SYSTEM_PROMPT, user);
  return parseJobPostExtraction(content, postBody);
}

export function parseJobPostExtraction(content: string, postBody: string): JobPostExtraction {
  const fallback = emptyJobPostExtraction();
  const parsed = parseJsonObject(content);
  if (!parsed) {
    return applyPostBodyFallbacks(fallback, postBody);
  }

  const hiring = isRecord(parsed.hiringManager) ? parsed.hiringManager : {};
  const emailsFromPost = uniqueEmails(postBody);
  const linkedinFromPost = firstMatch(postBody, LINKEDIN_PROFILE_RE);

  const rawEmail =
    nullableString(parsed.rawEmail) ??
    nullableString(parsed.emailAddress) ??
    emailsFromPost[0] ??
    null;

  const emailAddress =
    nullableString(parsed.emailAddress) ??
    nullableString(parsed.rawEmail) ??
    emailsFromPost[0] ??
    null;

  const hiringEmail =
    nullableString(hiring.email) ??
    (emailAddress && hiringLooksLikePerson(hiring) ? emailAddress : null);

  const result: JobPostExtraction = {
    isJobPost: parsed.isJobPost === true,
    confidence: clamp01(parsed.confidence),
    role: nullableString(parsed.role),
    company: nullableString(parsed.company),
    hiringManager: {
      name: nullableString(hiring.name),
      email: hiringEmail,
      linkedin: nullableString(hiring.linkedin) ?? linkedinFromPost
    },
    applicationMethod: parseApplicationMethod(parsed.applicationMethod, emailAddress),
    emailAddress,
    requirements: stringList(parsed.requirements),
    niceToHave: stringList(parsed.niceToHave),
    tone: parseTone(parsed.tone),
    specificAsks: stringList(parsed.specificAsks),
    keyDetails: nullableString(parsed.keyDetails),
    urgency: parseUrgency(parsed.urgency),
    rawEmail,
    postSummary: nullableString(parsed.postSummary)
  };

  return applyPostBodyFallbacks(result, postBody);
}

function applyPostBodyFallbacks(result: JobPostExtraction, postBody: string): JobPostExtraction {
  const emails = uniqueEmails(postBody);
  if (!result.rawEmail && emails[0]) {
    result.rawEmail = emails[0];
  }
  if (!result.emailAddress && emails[0]) {
    result.emailAddress = emails[0];
  }
  if (result.emailAddress && result.applicationMethod === "unknown") {
    result.applicationMethod = "email";
  }
  if (!result.hiringManager.linkedin) {
    result.hiringManager.linkedin = firstMatch(postBody, LINKEDIN_PROFILE_RE);
  }
  return result;
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

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0 && !/^null$/i.test(entry));
}

function clamp01(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function parseApplicationMethod(value: unknown, emailAddress: string | null): JobPostApplicationMethod {
  if (value === "email" || value === "link" || value === "dm" || value === "unknown") {
    return value;
  }
  return emailAddress ? "email" : "unknown";
}

function parseTone(value: unknown): JobPostTone {
  if (value === "formal" || value === "casual" || value === "startup" || value === "corporate") {
    return value;
  }
  return "formal";
}

function parseUrgency(value: unknown): JobPostUrgency {
  if (value === "urgent" || value === "normal" || value === "passive") {
    return value;
  }
  return "normal";
}

function uniqueEmails(text: string): string[] {
  const matches = text.match(EMAIL_RE) ?? [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const match of matches) {
    const key = match.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    emails.push(match);
  }
  return emails;
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[0] ?? null;
}

function hiringLooksLikePerson(hiring: Record<string, unknown>): boolean {
  return typeof hiring.name === "string" && hiring.name.trim().length > 0;
}
