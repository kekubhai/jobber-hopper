// Generated from shared/form-mapping.ts — do not edit by hand.
// Run: pnpm --dir extension build



/** Rule-based match below this → request LLM schema mapping (labels only). */
const LOW_CONFIDENCE_THRESHOLD = 0.75;

type FormFieldLabelPayload = {
  fieldId: string;
  labelGuess: string;
  type: string;
};

type FormFieldSchemaMapping = {
  fieldId: string;
  profileFieldPath: ProfileFieldPath | null;
  confidence: number;
};

const PROFILE_FIELD_PATHS: ProfileFieldPath[] = [
  "personal.firstName",
  "personal.middleName",
  "personal.lastName",
  "personal.preferredName",
  "personal.namePrefix",
  "personal.nameSuffix",
  "personal.pronouns",
  "personal.email",
  "personal.phone",
  "personal.linkedinUrl",
  "personal.githubUrl",
  "personal.portfolioUrl",
  "personal.headline",
  "personal.summary",
  "personal.authorizedToWork",
  "personal.requiresSponsorship",
  "personal.workAuthCountry",
  "personal.visaStatus",
  "personal.noticePeriodDays",
  "personal.earliestStartDate",
  "personal.expectedSalary",
  "personal.salaryCurrency",
  "personal.salaryPeriod",
  "personal.willingToRelocate",
  "personal.workModePreference",
  "address.line1",
  "address.line2",
  "address.city",
  "address.region",
  "address.postalCode",
  "address.country"
];

const PATH_SET = new Set<string>(PROFILE_FIELD_PATHS);

function isProfileFieldPath(value: string): value is ProfileFieldPath {
  return PATH_SET.has(value);
}

/** Stable JSON string for hashing — same on web and extension. */
function canonicalFormFieldsForHash(fields: FormFieldLabelPayload[]): string {
  const normalized = fields.map((field) => ({
    id: field.fieldId,
    l: field.labelGuess.trim().toLowerCase(),
    t: field.type.trim().toLowerCase()
  }));

  normalized.sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(normalized);
}
