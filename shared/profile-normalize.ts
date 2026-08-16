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

/**
 * Accepts booleans and numbers as well as strings, so a profile that was saved
 * with `requiresSponsorship: false` or `noticePeriodDays: 30` still normalizes
 * into the string form the autofill layer expects.
 */
function pickYesNo(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const lowered = trimmed.toLowerCase();
    if (lowered === "true" || lowered === "yes" || lowered === "y") {
      return "Yes";
    }

    if (lowered === "false" || lowered === "no" || lowered === "n") {
      return "No";
    }

    return trimmed;
  }

  return "";
}

function pickNumericString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
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
    middleName: pickString(source, ["middleName", "middle_name", "middleInitial", "middle_initial"]),
    lastName: pickString(source, ["lastName", "last_name", "last", "surname", "familyName", "family_name"]),
    preferredName: pickString(source, ["preferredName", "preferred_name", "displayName", "display_name", "nickname"]),
    namePrefix: pickString(source, ["namePrefix", "name_prefix", "prefix", "salutation", "honorific"]),
    nameSuffix: pickString(source, ["nameSuffix", "name_suffix", "suffix"]),
    pronouns: pickString(source, ["pronouns", "preferredPronouns", "preferred_pronouns"]),
    email: pickString(source, ["email", "emailAddress", "email_address"]),
    phone: pickString(source, ["phone", "phoneNumber", "phone_number", "mobile", "tel"]),
    linkedinUrl: pickString(source, ["linkedinUrl", "linkedin_url", "linkedin"]),
    githubUrl: pickString(source, ["githubUrl", "github_url", "github"]),
    portfolioUrl: pickString(source, ["portfolioUrl", "portfolio_url", "website", "portfolio"]),
    headline: pickString(source, ["headline", "title", "jobTitle", "job_title"]),
    summary: pickString(source, ["summary", "bio", "about", "aboutMe", "about_me"]),
    authorizedToWork: pickYesNo(source, [
      "authorizedToWork",
      "authorized_to_work",
      "workAuthorization",
      "work_authorization",
      "legallyAuthorized"
    ]),
    requiresSponsorship: pickYesNo(source, [
      "requiresSponsorship",
      "requires_sponsorship",
      "needsSponsorship",
      "needs_sponsorship",
      "visaSponsorship"
    ]),
    workAuthCountry: pickString(source, [
      "workAuthCountry",
      "work_auth_country",
      "workAuthorizationCountry",
      "work_authorization_country"
    ]),
    visaStatus: pickString(source, ["visaStatus", "visa_status", "immigrationStatus", "immigration_status", "visa"]),
    noticePeriodDays: pickNumericString(source, [
      "noticePeriodDays",
      "notice_period_days",
      "noticePeriod",
      "notice_period"
    ]),
    earliestStartDate: pickString(source, [
      "earliestStartDate",
      "earliest_start_date",
      "availableFrom",
      "available_from",
      "startDate",
      "start_date"
    ]),
    expectedSalary: pickNumericString(source, [
      "expectedSalary",
      "expected_salary",
      "desiredSalary",
      "desired_salary",
      "expectedCtc",
      "expected_ctc"
    ]),
    salaryCurrency: pickString(source, ["salaryCurrency", "salary_currency", "currency"]),
    salaryPeriod: pickString(source, ["salaryPeriod", "salary_period", "payPeriod", "pay_period"]),
    willingToRelocate: pickYesNo(source, [
      "willingToRelocate",
      "willing_to_relocate",
      "openToRelocation",
      "open_to_relocation",
      "relocate"
    ]),
    workModePreference: pickString(source, [
      "workModePreference",
      "work_mode_preference",
      "workMode",
      "work_mode",
      "remotePreference",
      "remote_preference"
    ])
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
