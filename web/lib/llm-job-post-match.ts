import {
  emptyJobPostMatchGuidance,
  type JobPostExtraction,
  type JobPostMatchGuidance,
  type JobPostMatchTone,
  type JobPostTone
} from "@jobber-hopper/shared";
import { completeOpenRouterJson } from "@/lib/openrouter-client";
import type { JobPostMatchProfileView } from "@/lib/job-post-profile-view";

export const JOB_POST_MATCH_SYSTEM_PROMPT = [
  "We are building a browser extension that helps job seekers apply to jobs faster.",
  "After scanning a job post from LinkedIn or Twitter, we match the job requirements",
  "against the user's stored profile to figure out what to highlight in the email.",
  "This is step 2 of our pipeline. We already have:",
  "- The structured job post data from our scanner (Prompt 1 output)",
  "- The user's full profile stored in our database",
  "The goal of this step is NOT to write the email yet. The goal is to intelligently",
  "decide WHAT to include — which highlights, which links, what tone, what to lead",
  "with. We want quality over quantity. A focused email beats a comprehensive one.",
  "The output of this prompt feeds directly into our email writer (Prompt 3).",
  "USER PROFILE SCHEMA:",
  "The user profile contains:",
  "- personal: name, email, phone, location",
  "- professional: currentTitle, currentCompany, yearsOfExperience, skills[],",
  "  summary, achievements[]",
  "- experience: array of { role, company, duration, highlights[] }",
  "- documents: resumeUrl, portfolioUrl, githubUrl, linkedinUrl, websiteUrl",
  "- preferences: tonePreference (formal | casual | conversational)",
  "INPUT YOU WILL RECEIVE:",
  "- JOB_POST_JSON: the full output from our post scanner (Prompt 1)",
  "- USER_PROFILE_JSON: the user's full stored profile",
  "YOUR TASK:",
  "Compare the job requirements against the user profile. Pick the most relevant",
  "2-3 things to highlight. Do not include everything — only what matters most for",
  "THIS specific role. Be selective. Be honest about gaps.",
  "RULES:",
  "- topHighlights: max 3 items, each one specific and relevant to this exact role",
  "- mostRelevantRole: pick ONE past experience that is closest to what they want",
  "- Only include links that make sense for this role",
  "  (e.g. github for engineering, portfolio for design)",
  "- thingToLeadWith: find something specific from the post the email can open with",
  "  — a detail, a problem they mentioned, something they said about the team",
  '  — this must NOT be generic like "I saw your post about X role"',
  "- toneToUse: match the tone from the job post scan unless user preference overrides",
  "- redFlags: be honest — if there are obvious mismatches, flag them",
  "RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION. NO EXTRA TEXT.",
  JSON.stringify({
    matchScore: 0,
    topHighlights: [
      "specific relevant achievement or skill written in one punchy line — max 3"
    ],
    mostRelevantRole: {
      role: "job title",
      company: "company name",
      whyRelevant: "one line explaining why this is the most relevant experience"
    },
    linksToInclude: {
      portfolio: "url or null",
      github: "url or null",
      linkedin: "url or null",
      resume: "url or null"
    },
    toneToUse: "formal | casual | conversational",
    thingToLeadWith: "specific detail from the post the email should open with",
    suggestedWordCount: 100,
    redFlags: ["honest mismatch or gap — leave array empty if none"]
  })
].join(" ");

export async function matchJobPostToProfile(
  jobPost: JobPostExtraction,
  profileView: JobPostMatchProfileView
): Promise<JobPostMatchGuidance> {
  const user = [
    `JOB_POST_JSON: ${JSON.stringify(jobPost)}`,
    `USER_PROFILE_JSON: ${JSON.stringify(profileView)}`
  ].join("\n");

  const content = await completeOpenRouterJson(JOB_POST_MATCH_SYSTEM_PROMPT, user);
  return parseJobPostMatchGuidance(content, jobPost, profileView);
}

export function parseJobPostMatchGuidance(
  content: string,
  jobPost: JobPostExtraction,
  profileView: JobPostMatchProfileView
): JobPostMatchGuidance {
  const fallback = emptyJobPostMatchGuidance();
  fallback.toneToUse = resolveTone(null, jobPost.tone, profileView.preferences.tonePreference);
  fallback.linksToInclude = sanitizeLinks(
    {
      portfolio: profileView.documents.portfolioUrl,
      github: profileView.documents.githubUrl,
      linkedin: profileView.documents.linkedinUrl,
      resume: profileView.documents.resumeUrl
    },
    jobPost,
    profileView
  );

  const parsed = parseJsonObject(content);
  if (!parsed) {
    return fallback;
  }

  const role = isRecord(parsed.mostRelevantRole) ? parsed.mostRelevantRole : null;
  const links = isRecord(parsed.linksToInclude) ? parsed.linksToInclude : {};

  return {
    matchScore: clampScore(parsed.matchScore),
    topHighlights: stringList(parsed.topHighlights).slice(0, 3),
    mostRelevantRole:
      role && nullableString(role.role) && nullableString(role.company)
        ? {
            role: nullableString(role.role)!,
            company: nullableString(role.company)!,
            whyRelevant: nullableString(role.whyRelevant) ?? ""
          }
        : null,
    linksToInclude: sanitizeLinks(
      {
        portfolio: nullableString(links.portfolio) ?? profileView.documents.portfolioUrl,
        github: nullableString(links.github) ?? profileView.documents.githubUrl,
        linkedin: nullableString(links.linkedin) ?? profileView.documents.linkedinUrl,
        resume: nullableString(links.resume) ?? profileView.documents.resumeUrl
      },
      jobPost,
      profileView
    ),
    toneToUse: resolveTone(
      nullableString(parsed.toneToUse),
      jobPost.tone,
      profileView.preferences.tonePreference
    ),
    thingToLeadWith: nullableString(parsed.thingToLeadWith),
    suggestedWordCount: clampWordCount(parsed.suggestedWordCount),
    redFlags: stringList(parsed.redFlags)
  };
}

function sanitizeLinks(
  links: JobPostMatchGuidance["linksToInclude"],
  jobPost: JobPostExtraction,
  profileView: JobPostMatchProfileView
): JobPostMatchGuidance["linksToInclude"] {
  const asks = jobPost.specificAsks.map((ask) => ask.toLowerCase()).join(" ");
  const reqText = [...jobPost.requirements, ...jobPost.niceToHave, jobPost.role ?? ""]
    .join(" ")
    .toLowerCase();
  const haystack = `${asks} ${reqText}`;

  const wantsGithub =
    /\bgithub\b/.test(haystack) ||
    /\b(engineer|developer|software|backend|frontend|fullstack|full-stack)\b/.test(haystack);
  const wantsPortfolio =
    /\bportfolio\b/.test(haystack) ||
    /\b(design|designer|product design|ux|ui|creative)\b/.test(haystack);
  const wantsResume = /\bresume\b|\bcv\b/.test(haystack);
  const wantsLinkedin = /\blinkedin\b/.test(haystack) || true;

  return {
    portfolio: wantsPortfolio ? pickKnownUrl(links.portfolio, profileView.documents.portfolioUrl) : null,
    github: wantsGithub ? pickKnownUrl(links.github, profileView.documents.githubUrl) : null,
    linkedin: wantsLinkedin ? pickKnownUrl(links.linkedin, profileView.documents.linkedinUrl) : null,
    resume: wantsResume ? pickKnownUrl(links.resume, profileView.documents.resumeUrl) : null
  };
}

function pickKnownUrl(candidate: string | null, allowed: string | null): string | null {
  if (!candidate) {
    return allowed;
  }
  if (!allowed) {
    return null;
  }
  return candidate.trim() === allowed.trim() ? allowed : allowed;
}

function resolveTone(
  modelTone: string | null,
  jobTone: JobPostTone,
  preference: JobPostMatchProfileView["preferences"]["tonePreference"]
): JobPostMatchTone {
  if (preference) {
    return preference;
  }
  if (modelTone === "formal" || modelTone === "casual" || modelTone === "conversational") {
    return modelTone;
  }
  if (jobTone === "casual" || jobTone === "startup") {
    return jobTone === "startup" ? "conversational" : "casual";
  }
  return "formal";
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

function clampScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampWordCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 120;
  }
  return Math.min(150, Math.max(100, Math.round(value)));
}
