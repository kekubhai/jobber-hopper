// Generated from shared/profile-match.ts — do not edit by hand.
// Run: pnpm --dir extension build

type ProfileFieldPath =
  | "personal.firstName"
  | "personal.middleName"
  | "personal.lastName"
  | "personal.preferredName"
  | "personal.namePrefix"
  | "personal.nameSuffix"
  | "personal.pronouns"
  | "personal.email"
  | "personal.phone"
  | "personal.linkedinUrl"
  | "personal.githubUrl"
  | "personal.portfolioUrl"
  | "personal.headline"
  | "personal.summary"
  | "personal.authorizedToWork"
  | "personal.requiresSponsorship"
  | "personal.workAuthCountry"
  | "personal.visaStatus"
  | "personal.noticePeriodDays"
  | "personal.earliestStartDate"
  | "personal.expectedSalary"
  | "personal.salaryCurrency"
  | "personal.salaryPeriod"
  | "personal.willingToRelocate"
  | "personal.workModePreference"
  | "address.line1"
  | "address.line2"
  | "address.city"
  | "address.region"
  | "address.postalCode"
  | "address.country";

type MasterProfileLike = {
  personal: Record<string, string>;
  address: Record<string, string>;
};

type ProfileMatchRule = {
  path: ProfileFieldPath;
  patterns: RegExp[];
  /** If set, only match these control types (e.g. email, tel, text). */
  inputTypes?: string[];
};

type MatchedFormField = {
  fieldId: string;
  labelGuess: string;
  type: string;
  profileFieldPath: ProfileFieldPath | null;
  value: string | null;
};

/**
 * Order is significant: `matchProfileFieldPath` returns the first rule whose
 * pattern hits, so narrower rules must precede broader ones that share a word.
 * The pairings that matter are called out inline. Patterns are tested against
 * `normalizeTextForMatching` output, so they must never contain punctuation or
 * underscores — those are collapsed to spaces before matching.
 */
const PROFILE_MATCH_RULES: ProfileMatchRule[] = [
  {
    path: "personal.email",
    patterns: [/\be[-\s]?mail\b/, /\bemail address\b/, /\bcorreo\b/],
    inputTypes: ["email", "text"]
  },
  {
    path: "personal.firstName",
    patterns: [/\bfirst name\b/, /\bfirst_name\b/, /\bgiven name\b/, /\bfname\b/, /\bforename\b/]
  },
  {
    path: "personal.middleName",
    patterns: [/\bmiddle name\b/, /\bmiddle initial\b/, /\bmname\b/]
  },
  {
    path: "personal.lastName",
    patterns: [/\blast name\b/, /\blast_name\b/, /\bsurname\b/, /\bfamily name\b/, /\blname\b/]
  },
  {
    path: "personal.preferredName",
    patterns: [/\bpreferred name\b/, /\bdisplay name\b/, /\bnickname\b/]
  },
  {
    path: "personal.pronouns",
    patterns: [/\bpronouns?\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.namePrefix",
    patterns: [/\bname prefix\b/, /\btitle prefix\b/, /\bsalutation\b/, /\bhonorific\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.nameSuffix",
    patterns: [/\bname suffix\b/, /\bsuffix\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.phone",
    patterns: [/\bphone\b/, /\bmobile\b/, /\bcell\b/, /\btel\b/, /\bcontact number\b/],
    inputTypes: ["tel", "text", "number"]
  },
  {
    path: "personal.linkedinUrl",
    patterns: [/\blinkedin\b/, /\blinked in\b/]
  },
  {
    // Before portfolio: a form with separate GitHub and website fields would
    // otherwise send both to portfolioUrl and lose the second to `usedPaths`.
    path: "personal.githubUrl",
    patterns: [/\bgithub\b/, /\bgit hub\b/],
    inputTypes: ["url", "text"]
  },
  {
    path: "personal.portfolioUrl",
    patterns: [/\bportfolio\b/, /\bwebsite\b/, /\bpersonal site\b/],
    inputTypes: ["url", "text"]
  },
  {
    path: "personal.headline",
    patterns: [/\bheadline\b/, /\bprofessional title\b/, /\bcurrent role\b/]
  },
  {
    // Before authorizedToWork and visaStatus: the standard Workday phrasing is
    // "will you now or in the future require sponsorship for employment visa
    // status", which contains both "visa status" and "work".
    path: "personal.requiresSponsorship",
    patterns: [
      /\bsponsorship\b/,
      /\bsponsor\b/,
      /\brequire sponsorship\b/,
      /\bvisa sponsorship\b/,
      /\bneed sponsorship\b/
    ],
    inputTypes: ["select", "text"]
  },
  {
    // Before authorizedToWork ("work authorization") and address.country.
    path: "personal.workAuthCountry",
    patterns: [/\bcountry of (work )?authorization\b/, /\bwork authorization country\b/, /\bauthorized to work in which\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.authorizedToWork",
    patterns: [
      /\blegally authorized to work\b/,
      /\bauthorized to work\b/,
      /\bauthorised to work\b/,
      /\bwork authorization\b/,
      /\bwork authorisation\b/,
      /\beligible to work\b/,
      /\bright to work\b/,
      /\blegally eligible\b/
    ],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.visaStatus",
    patterns: [/\bvisa status\b/, /\bvisa type\b/, /\bcurrent visa\b/, /\bimmigration status\b/, /\bwork permit\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.noticePeriodDays",
    patterns: [/\bnotice period\b/, /\bhow (much|long) notice\b/, /\bserving notice\b/],
    inputTypes: ["select", "text", "number"]
  },
  {
    // Deliberately no bare "start date" pattern — education and work-history
    // sections on Greenhouse and Lever use that exact label, and filling them
    // with an availability date is a wrong fill rather than a missed one.
    path: "personal.earliestStartDate",
    patterns: [
      /\bearliest (possible )?start\b/,
      /\bavailable start date\b/,
      /\bpreferred start date\b/,
      /\bstart date available\b/,
      /\bdate available\b/,
      /\bavailability date\b/,
      /\bavailable to start\b/,
      /\bwhen can you start\b/,
      /\bjoining date\b/,
      /\bdate of joining\b/
    ],
    inputTypes: ["date", "month", "text"]
  },
  {
    // Currency and period precede expectedSalary: "expected salary currency"
    // would otherwise match the salary rule and fill an amount into a picker.
    path: "personal.salaryCurrency",
    patterns: [/\bsalary currency\b/, /\bpay currency\b/, /\bcompensation currency\b/, /\bcurrency\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.salaryPeriod",
    patterns: [/\bsalary period\b/, /\bpay period\b/, /\bpay frequency\b/, /\bcompensation period\b/, /\bsalary frequency\b/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.expectedSalary",
    patterns: [
      /\bexpected (salary|compensation|pay|ctc)\b/,
      /\bdesired (salary|compensation|pay)\b/,
      /\bsalary expectation/,
      /\bcompensation expectation/,
      /\bsalary requirement/,
      /\bexpected ctc\b/
    ],
    inputTypes: ["text", "number"]
  },
  {
    path: "personal.willingToRelocate",
    patterns: [/\bwilling to relocate\b/, /\bopen to relocat/, /\bwould you relocate\b/, /\brelocat/],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.workModePreference",
    patterns: [
      /\bwork (mode|arrangement|setting|preference)\b/,
      /\bworkplace type\b/,
      /\bremote preference\b/,
      /\bremote or (onsite|on site|hybrid)\b/,
      /\bonsite or remote\b/
    ],
    inputTypes: ["select", "text"]
  },
  {
    path: "personal.summary",
    patterns: [/\bsummary\b/, /\bcover letter\b/, /\babout you\b/, /\btell us about\b/, /\bwhy.*role\b/],
    inputTypes: ["textarea", "text"]
  },
  {
    path: "address.line1",
    patterns: [/\baddress line 1\b/, /\bstreet address\b/, /\baddress\b/, /\bstreet\b/]
  },
  {
    path: "address.line2",
    patterns: [/\baddress line 2\b/, /\bapt\b/, /\bunit\b/, /\bsuite\b/]
  },
  {
    path: "address.city",
    patterns: [/\bcity\b/, /\btown\b/, /\blocality\b/]
  },
  {
    path: "address.region",
    patterns: [/\bstate\b/, /\bprovince\b/, /\bregion\b/, /\bcounty\b/]
  },
  {
    path: "address.postalCode",
    patterns: [/\bzip\b/, /\bpostal\b/, /\bpostcode\b/, /\bpin code\b/]
  },
  {
    path: "address.country",
    patterns: [/\bcountry\b/, /\bnation\b/]
  },
  {
    path: "personal.firstName",
    patterns: [/\bfull name\b/, /\bfull legal name\b/, /\blegal name\b/, /\byour name\b/, /\bapplicant name\b/, /\bapplicant full name\b/, /\bname\b/],
    inputTypes: ["text"]
  }
];

function normalizeTextForMatching(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildMatchHaystack(labelGuess: string, fieldId: string): string {
  const humanizedId = fieldId
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  return normalizeTextForMatching(`${labelGuess} ${fieldId} ${humanizedId}`);
}

function matchProfileFieldPath(
  labelGuess: string,
  fieldId: string,
  controlType: string
): ProfileFieldPath | null {
  const haystack = buildMatchHaystack(labelGuess, fieldId);
  const normalizedControlType = controlType.toLowerCase();

  for (const rule of PROFILE_MATCH_RULES) {
    if (rule.inputTypes && !rule.inputTypes.includes(normalizedControlType)) {
      continue;
    }

    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.path;
    }
  }

  return null;
}

function getProfileFieldValue(profile: MasterProfileLike, path: ProfileFieldPath): string {
  const [section, key] = path.split(".") as ["personal" | "address", string];

  if (section === "personal" && key in profile.personal) {
    const value = profile.personal[key];
    return typeof value === "string" ? value.trim() : "";
  }

  if (section === "address" && key in profile.address) {
    const value = profile.address[key];
    return typeof value === "string" ? value.trim() : "";
  }

  return "";
}

/** Value for a matched path; handles synthetic full-name fields. */
function resolveAutofillValue(
  profile: MasterProfileLike,
  path: ProfileFieldPath,
  labelGuess: string,
  fieldId: string
): string {
  const haystack = buildMatchHaystack(labelGuess, fieldId);

  if (
    path === "personal.firstName" &&
    (/\bfull name\b/.test(haystack) ||
      /\byour name\b/.test(haystack) ||
      /\bname\b/.test(haystack) ||
      /\bfull_name\b/.test(haystack)) &&
    !/\bfirst name\b/.test(haystack) &&
    !/\blast name\b/.test(haystack) &&
    !/\bfirst_name\b/.test(haystack) &&
    !/\blast_name\b/.test(haystack)
  ) {
    const fromParts = `${profile.personal.firstName ?? ""} ${profile.personal.lastName ?? ""}`.trim();
    const fromDb =
      (typeof profile.personal.fullName === "string" ? profile.personal.fullName.trim() : "") ||
      (typeof profile.personal.name === "string" ? profile.personal.name.trim() : "");

    if (fromParts) {
      return fromParts;
    }

    if (fromDb) {
      return fromDb;
    }
  }

  if (path === "personal.firstName" && /\bfirst_name\b/.test(haystack)) {
    const first = getProfileFieldValue(profile, "personal.firstName");
    if (first) {
      return first;
    }
  }

  if (path === "personal.lastName" && /\blast_name\b/.test(haystack)) {
    const last = getProfileFieldValue(profile, "personal.lastName");
    if (last) {
      return last;
    }
  }

  return getProfileFieldValue(profile, path);
}

function matchDetectedFields(
  profile: MasterProfileLike,
  fields: Array<{ fieldId: string; labelGuess: string; type: string }>
): MatchedFormField[] {
  // Dedupe by (path, value), not by path alone. A "Name" field resolves
  // personal.firstName to "<first> <last>" while a "First name" field resolves
  // it to "<first>" -- both should fill, since the values differ.
  const usedValues = new Map<ProfileFieldPath, string>();

  return fields.map((field) => {
    const profileFieldPath = matchProfileFieldPath(field.labelGuess, field.fieldId, field.type);

    if (!profileFieldPath) {
      return { ...field, profileFieldPath: null, value: null };
    }

    const value = resolveAutofillValue(profile, profileFieldPath, field.labelGuess, field.fieldId);
    if (!value) {
      return { ...field, profileFieldPath, value: null };
    }

    const previouslyUsed = usedValues.get(profileFieldPath);
    if (previouslyUsed !== undefined && previouslyUsed === value) {
      // Same path AND same value -- another field already took this fill.
      return { ...field, profileFieldPath, value: null };
    }

    usedValues.set(profileFieldPath, value);
    return { ...field, profileFieldPath, value };
  });
}
