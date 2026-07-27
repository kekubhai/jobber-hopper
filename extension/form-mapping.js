"use strict";
// Generated from shared/form-mapping.ts — do not edit by hand.
// Run: pnpm --dir extension build
/** Rule-based match below this → request LLM schema mapping (labels only). */
const LOW_CONFIDENCE_THRESHOLD = 0.75;
const PROFILE_FIELD_PATHS = [
    "personal.firstName",
    "personal.lastName",
    "personal.preferredName",
    "personal.email",
    "personal.phone",
    "personal.linkedinUrl",
    "personal.portfolioUrl",
    "personal.headline",
    "personal.summary",
    "address.line1",
    "address.line2",
    "address.city",
    "address.region",
    "address.postalCode",
    "address.country"
];
const PATH_SET = new Set(PROFILE_FIELD_PATHS);
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
