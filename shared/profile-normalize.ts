import type {
  CustomQaPair,
  EducationEntry,
  MasterProfile,
  PersonalInfo,
  WorkHistoryEntry
} from "./index";
import {
  createEmptyAddressInfo,
  createEmptyCustomQaPair,
  createEmptyEducationEntry,
  createEmptyMasterProfile,
  createEmptyPersonalInfo,
  createEmptyWorkHistoryEntry
} from "./index";

function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

export function normalizePersonalInfo(input: unknown): PersonalInfo {
  const base = createEmptyPersonalInfo();

  if (!input || typeof input !== "object") {
    return base;
  }

  const source = input as Record<string, unknown>;

  return {
    firstName: pickString(source, ["firstName", "first_name", "first", "givenName", "given_name"]),
    lastName: pickString(source, ["lastName", "last_name", "last", "surname", "familyName", "family_name"]),
    preferredName: pickString(source, ["preferredName", "preferred_name", "displayName", "display_name", "nickname"]),
    email: pickString(source, ["email", "emailAddress", "email_address"]),
    phone: pickString(source, ["phone", "phoneNumber", "phone_number", "mobile", "tel"]),
    linkedinUrl: pickString(source, ["linkedinUrl", "linkedin_url", "linkedin"]),
    portfolioUrl: pickString(source, ["portfolioUrl", "portfolio_url", "website", "portfolio"]),
    headline: pickString(source, ["headline", "title", "jobTitle", "job_title"]),
    summary: pickString(source, ["summary", "bio", "about", "aboutMe", "about_me"])
  };
}

/** Stored in `master_profiles.personal` — includes `fullName` / `name` for easy viewing in Supabase. */
export function personalForDb(personal: PersonalInfo): PersonalInfo & { fullName: string; name: string } {
  const normalized = normalizePersonalInfo(personal);
  const fromParts = `${normalized.firstName} ${normalized.lastName}`.trim();
  const fullName = fromParts || normalized.preferredName.trim();

  return {
    ...normalized,
    fullName,
    name: fullName
  };
}

function normalizeEducationEntry(entry: Partial<EducationEntry> | undefined): EducationEntry {
  const base = createEmptyEducationEntry();
  if (!entry || typeof entry !== "object") {
    return base;
  }

  return {
    school: typeof entry.school === "string" ? entry.school : base.school,
    degree: typeof entry.degree === "string" ? entry.degree : base.degree,
    fieldOfStudy: typeof entry.fieldOfStudy === "string" ? entry.fieldOfStudy : base.fieldOfStudy,
    startDate: typeof entry.startDate === "string" ? entry.startDate : base.startDate,
    endDate: typeof entry.endDate === "string" ? entry.endDate : base.endDate,
    notes: typeof entry.notes === "string" ? entry.notes : base.notes
  };
}

function normalizeWorkHistoryEntry(entry: Partial<WorkHistoryEntry> | undefined): WorkHistoryEntry {
  const base = createEmptyWorkHistoryEntry();
  if (!entry || typeof entry !== "object") {
    return base;
  }

  return {
    company: typeof entry.company === "string" ? entry.company : base.company,
    title: typeof entry.title === "string" ? entry.title : base.title,
    location: typeof entry.location === "string" ? entry.location : base.location,
    startDate: typeof entry.startDate === "string" ? entry.startDate : base.startDate,
    endDate: typeof entry.endDate === "string" ? entry.endDate : base.endDate,
    current: typeof entry.current === "boolean" ? entry.current : base.current,
    highlights: typeof entry.highlights === "string" ? entry.highlights : base.highlights
  };
}

function normalizeCustomQaPair(entry: Partial<CustomQaPair> | undefined): CustomQaPair {
  const base = createEmptyCustomQaPair();
  if (!entry || typeof entry !== "object") {
    return base;
  }

  return {
    question: typeof entry.question === "string" ? entry.question : base.question,
    answer: typeof entry.answer === "string" ? entry.answer : base.answer
  };
}

export function normalizeMasterProfile(input: unknown): MasterProfile {
  const empty = createEmptyMasterProfile();

  if (!input || typeof input !== "object") {
    return empty;
  }

  const candidate = input as Record<string, unknown>;
  const personal = normalizePersonalInfo(candidate.personal);
  const address = candidate.address && typeof candidate.address === "object"
    ? { ...createEmptyAddressInfo(), ...(candidate.address as object) }
    : createEmptyAddressInfo();

  const educationRaw = candidate.education;
  const workHistoryRaw = candidate.workHistory ?? candidate.work_history;
  const customQaRaw = candidate.customQaPairs ?? candidate.custom_qa_pairs;

  const education = Array.isArray(educationRaw)
    ? educationRaw.map((entry) => normalizeEducationEntry(entry as Partial<EducationEntry>))
    : [];

  const workHistory = Array.isArray(workHistoryRaw)
    ? workHistoryRaw.map((entry) => normalizeWorkHistoryEntry(entry as Partial<WorkHistoryEntry>))
    : [];

  const customQaPairs = Array.isArray(customQaRaw)
    ? customQaRaw.map((entry) => normalizeCustomQaPair(entry as Partial<CustomQaPair>))
    : [];

  return {
    personal,
    address,
    education,
    workHistory,
    customQaPairs
  };
}

export function masterProfileToDbPayload(profileId: string, profile: MasterProfile) {
  const normalized = normalizeMasterProfile(profile);

  return {
    profile_id: profileId,
    personal: personalForDb(normalized.personal),
    address: normalized.address,
    education: normalized.education,
    work_history: normalized.workHistory,
    custom_qa_pairs: normalized.customQaPairs
  };
}
