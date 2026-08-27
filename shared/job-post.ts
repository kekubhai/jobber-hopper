export type SocialJobPlatform = "linkedin" | "twitter";

export type JobPostApplicationMethod = "email" | "link" | "dm" | "unknown";

export type JobPostTone = "formal" | "casual" | "startup" | "corporate";

export type JobPostUrgency = "urgent" | "normal" | "passive";

export type JobPostHiringManager = {
  name: string | null;
  email: string | null;
  linkedin: string | null;
};

export type JobPostExtraction = {
  isJobPost: boolean;
  confidence: number;
  role: string | null;
  company: string | null;
  hiringManager: JobPostHiringManager;
  applicationMethod: JobPostApplicationMethod;
  emailAddress: string | null;
  requirements: string[];
  niceToHave: string[];
  tone: JobPostTone;
  specificAsks: string[];
  keyDetails: string | null;
  urgency: JobPostUrgency;
  rawEmail: string | null;
  postSummary: string | null;
};

export function emptyJobPostExtraction(): JobPostExtraction {
  return {
    isJobPost: false,
    confidence: 0,
    role: null,
    company: null,
    hiringManager: {
      name: null,
      email: null,
      linkedin: null
    },
    applicationMethod: "unknown",
    emailAddress: null,
    requirements: [],
    niceToHave: [],
    tone: "formal",
    specificAsks: [],
    keyDetails: null,
    urgency: "passive",
    rawEmail: null,
    postSummary: null
  };
}
