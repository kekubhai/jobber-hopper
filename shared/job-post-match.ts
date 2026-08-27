export type JobPostMatchTone = "formal" | "casual" | "conversational";

export type JobPostMatchRelevantRole = {
  role: string;
  company: string;
  whyRelevant: string;
};

export type JobPostMatchLinks = {
  portfolio: string | null;
  github: string | null;
  linkedin: string | null;
  resume: string | null;
};

export type JobPostMatchGuidance = {
  matchScore: number;
  topHighlights: string[];
  mostRelevantRole: JobPostMatchRelevantRole | null;
  linksToInclude: JobPostMatchLinks;
  toneToUse: JobPostMatchTone;
  thingToLeadWith: string | null;
  suggestedWordCount: number;
  redFlags: string[];
};

export function emptyJobPostMatchGuidance(): JobPostMatchGuidance {
  return {
    matchScore: 0,
    topHighlights: [],
    mostRelevantRole: null,
    linksToInclude: {
      portfolio: null,
      github: null,
      linkedin: null,
      resume: null
    },
    toneToUse: "formal",
    thingToLeadWith: null,
    suggestedWordCount: 120,
    redFlags: []
  };
}
