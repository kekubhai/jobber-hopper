"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_FIELD_PATHS = exports.LOW_CONFIDENCE_THRESHOLD = void 0;
exports.isProfileFieldPath = isProfileFieldPath;
exports.canonicalFormFieldsForHash = canonicalFormFieldsForHash;
/** Rule-based match below this → request LLM schema mapping (labels only). */
exports.LOW_CONFIDENCE_THRESHOLD = 0.75;
exports.PROFILE_FIELD_PATHS = [
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
const PATH_SET = new Set(exports.PROFILE_FIELD_PATHS);
function isProfileFieldPath(value) {
    return PATH_SET.has(value);
}
/** Stable JSON string for hashing — same on web and extension. */
function canonicalFormFieldsForHash(fields) {
    const normalized = fields.map((field) => ({
        id: field.fieldId,
        l: field.labelGuess.trim().toLowerCase(),
        t: field.type.trim().toLowerCase()
    }));
    normalized.sort((a, b) => a.id.localeCompare(b.id));
    return JSON.stringify(normalized);
}
