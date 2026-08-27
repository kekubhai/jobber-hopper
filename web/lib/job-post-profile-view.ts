import type { MasterProfile, WorkHistoryEntry } from "@jobber-hopper/shared";

/** Compact profile shape fed to the job-post match LLM (Prompt 2). */
export type JobPostMatchProfileView = {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  professional: {
    currentTitle: string;
    currentCompany: string;
    yearsOfExperience: number | null;
    skills: string[];
    summary: string;
    achievements: string[];
  };
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  documents: {
    resumeUrl: string | null;
    portfolioUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
  };
  preferences: {
    tonePreference: "formal" | "casual" | "conversational" | null;
  };
};

export function masterProfileToMatchView(profile: MasterProfile): JobPostMatchProfileView {
  const personal = profile.personal;
  const address = profile.address;
  const current = pickCurrentRole(profile.workHistory);
  const name = [personal.firstName, personal.lastName].filter(Boolean).join(" ").trim()
    || personal.preferredName.trim();

  const location = [address.city, address.region, address.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  const experience = profile.workHistory.map((entry) => ({
    role: entry.title.trim(),
    company: entry.company.trim(),
    duration: formatDuration(entry),
    highlights: splitHighlights(entry.highlights)
  }));

  const achievements = experience.flatMap((entry) => entry.highlights).slice(0, 8);

  return {
    personal: {
      name,
      email: personal.email.trim(),
      phone: personal.phone.trim(),
      location
    },
    professional: {
      currentTitle: current?.title.trim() || personal.headline.trim(),
      currentCompany: current?.company.trim() || "",
      yearsOfExperience: estimateYearsOfExperience(profile.workHistory),
      skills: [],
      summary: personal.summary.trim(),
      achievements
    },
    experience,
    documents: {
      resumeUrl: null,
      portfolioUrl: nullableUrl(personal.portfolioUrl),
      githubUrl: nullableUrl(personal.githubUrl),
      linkedinUrl: nullableUrl(personal.linkedinUrl),
      websiteUrl: nullableUrl(personal.portfolioUrl)
    },
    preferences: {
      tonePreference: null
    }
  };
}

function pickCurrentRole(history: WorkHistoryEntry[]): WorkHistoryEntry | null {
  return history.find((entry) => entry.current) ?? history[0] ?? null;
}

function formatDuration(entry: WorkHistoryEntry): string {
  const start = entry.startDate.trim();
  const end = entry.current ? "Present" : entry.endDate.trim();
  if (!start && !end) {
    return "";
  }
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start || end;
}

function splitHighlights(value: string): string[] {
  return value
    .split(/\n+|•|;|\u2022/)
    .map((part) => part.replace(/^[-–—\s]+/, "").trim())
    .filter((part) => part.length > 0)
    .slice(0, 6);
}

function estimateYearsOfExperience(history: WorkHistoryEntry[]): number | null {
  const starts = history
    .map((entry) => parseYear(entry.startDate))
    .filter((year): year is number => year !== null);
  if (starts.length === 0) {
    return null;
  }

  const earliest = Math.min(...starts);
  const years = new Date().getFullYear() - earliest;
  return years >= 0 && years <= 60 ? years : null;
}

function parseYear(value: string): number | null {
  const match = value.trim().match(/(\d{4})/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function nullableUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
