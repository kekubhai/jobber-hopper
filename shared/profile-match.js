"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_MATCH_RULES = void 0;
exports.normalizeTextForMatching = normalizeTextForMatching;
exports.buildMatchHaystack = buildMatchHaystack;
exports.matchProfileFieldPath = matchProfileFieldPath;
exports.getProfileFieldValue = getProfileFieldValue;
exports.resolveAutofillValue = resolveAutofillValue;
exports.matchDetectedFields = matchDetectedFields;
exports.PROFILE_MATCH_RULES = [
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
        path: "personal.lastName",
        patterns: [/\blast name\b/, /\blast_name\b/, /\bsurname\b/, /\bfamily name\b/, /\blname\b/]
    },
    {
        path: "personal.preferredName",
        patterns: [/\bpreferred name\b/, /\bdisplay name\b/, /\bnickname\b/]
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
        path: "personal.portfolioUrl",
        patterns: [/\bportfolio\b/, /\bwebsite\b/, /\bpersonal site\b/, /\bgithub\b/],
        inputTypes: ["url", "text"]
    },
    {
        path: "personal.headline",
        patterns: [/\bheadline\b/, /\bprofessional title\b/, /\bcurrent role\b/]
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
function normalizeTextForMatching(value) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}
function buildMatchHaystack(labelGuess, fieldId) {
    const humanizedId = fieldId
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();
    return normalizeTextForMatching(`${labelGuess} ${fieldId} ${humanizedId}`);
}
function matchProfileFieldPath(labelGuess, fieldId, controlType) {
    const haystack = buildMatchHaystack(labelGuess, fieldId);
    const normalizedControlType = controlType.toLowerCase();
    for (const rule of exports.PROFILE_MATCH_RULES) {
        if (rule.inputTypes && !rule.inputTypes.includes(normalizedControlType)) {
            continue;
        }
        if (rule.patterns.some((pattern) => pattern.test(haystack))) {
            return rule.path;
        }
    }
    return null;
}
function getProfileFieldValue(profile, path) {
    const [section, key] = path.split(".");
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
function resolveAutofillValue(profile, path, labelGuess, fieldId) {
    const haystack = buildMatchHaystack(labelGuess, fieldId);
    if (path === "personal.firstName" &&
        (/\bfull name\b/.test(haystack) ||
            /\byour name\b/.test(haystack) ||
            /\bname\b/.test(haystack) ||
            /\bfull_name\b/.test(haystack)) &&
        !/\bfirst name\b/.test(haystack) &&
        !/\blast name\b/.test(haystack) &&
        !/\bfirst_name\b/.test(haystack) &&
        !/\blast_name\b/.test(haystack)) {
        const fromParts = `${profile.personal.firstName ?? ""} ${profile.personal.lastName ?? ""}`.trim();
        const fromDb = (typeof profile.personal.fullName === "string" ? profile.personal.fullName.trim() : "") ||
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
function matchDetectedFields(profile, fields) {
    const usedPaths = new Set();
    return fields.map((field) => {
        const profileFieldPath = matchProfileFieldPath(field.labelGuess, field.fieldId, field.type);
        if (!profileFieldPath) {
            return { ...field, profileFieldPath: null, value: null };
        }
        if (usedPaths.has(profileFieldPath)) {
            return { ...field, profileFieldPath, value: null };
        }
        const value = resolveAutofillValue(profile, profileFieldPath, field.labelGuess, field.fieldId);
        if (!value) {
            return { ...field, profileFieldPath, value: null };
        }
        usedPaths.add(profileFieldPath);
        return { ...field, profileFieldPath, value };
    });
}
