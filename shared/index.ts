export type ActionResponse = FillFormAction | SendEmailAction;

export type FillFormAction = {
  type: "fill_form";
  fields: Record<string, string>;
};

export type SendEmailAction = {
  type: "send_email";
  to: string;
  subject: string;
  body: string;
};

/** Phase 2: one detected form control on the active page. */
export type DetectedFormField = {
  fieldId: string;
  labelGuess: string;
  type: string;
};

export type MasterProfile = {
  personal: PersonalInfo;
  address: AddressInfo;
  education: EducationEntry[];
  workHistory: WorkHistoryEntry[];
  customQaPairs: CustomQaPair[];
};

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  headline: string;
  summary: string;
};

export type AddressInfo = {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type EducationEntry = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  notes: string;
};

export type WorkHistoryEntry = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string;
};

export type CustomQaPair = {
  question: string;
  answer: string;
};

/** One row per Supabase Auth user (account metadata). */
export type UserProfile = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  masterProfileId: string | null;
};

export const PROFILE_STORAGE_KEY = "jobber-hopper.master-profile";

export function createEmptyMasterProfile(): MasterProfile {
  return {
    personal: createEmptyPersonalInfo(),
    address: createEmptyAddressInfo(),
    education: [],
    workHistory: [],
    customQaPairs: []
  };
}

export function createEmptyPersonalInfo(): PersonalInfo {
  return {
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    portfolioUrl: "",
    headline: "",
    summary: ""
  };
}

export function createEmptyAddressInfo(): AddressInfo {
  return {
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: ""
  };
}

export function createEmptyEducationEntry(): EducationEntry {
  return {
    school: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    notes: ""
  };
}

export function createEmptyWorkHistoryEntry(): WorkHistoryEntry {
  return {
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    highlights: ""
  };
}

export function createEmptyCustomQaPair(): CustomQaPair {
  return {
    question: "",
    answer: ""
  };
}

export function createEmptyUserProfile(userId = ""): UserProfile {
  return {
    userId,
    email: "",
    displayName: "",
    avatarUrl: "",
    masterProfileId: null
  };
}

export function isMasterProfileReady(profile: MasterProfile): boolean {
  return profile.personal.firstName.trim().length > 0 &&
    profile.personal.lastName.trim().length > 0 &&
    profile.personal.email.trim().length > 0;
}

export {
  normalizeMasterProfile,
  masterProfileToDbPayload,
  normalizePersonalInfo,
  personalForDb
} from "./profile-normalize";
export type { JobPlatformId } from "./platforms";
export { JOB_PLATFORM_LABELS } from "./platforms";
export {
  LOW_CONFIDENCE_THRESHOLD,
  PROFILE_FIELD_PATHS,
  isProfileFieldPath,
  canonicalFormFieldsForHash
} from "./form-mapping";
export type { FormFieldLabelPayload, FormFieldSchemaMapping } from "./form-mapping";
export {
  PROFILE_MATCH_RULES,
  normalizeTextForMatching,
  buildMatchHaystack,
  matchProfileFieldPath,
  getProfileFieldValue,
  resolveAutofillValue,
  matchDetectedFields
} from "./profile-match";