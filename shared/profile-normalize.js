"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePersonalInfo = normalizePersonalInfo;
exports.personalForDb = personalForDb;
exports.normalizeMasterProfile = normalizeMasterProfile;
exports.masterProfileToDbPayload = masterProfileToDbPayload;
const index_1 = require("./index");
function pickString(source, keys) {
    for (const key of keys) {
        const value = source[key];
        if (typeof value === "string") {
            return value;
        }
    }
    return "";
}
function normalizePersonalInfo(input) {
    const base = (0, index_1.createEmptyPersonalInfo)();
    if (!input || typeof input !== "object") {
        return base;
    }
    const source = input;
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
function personalForDb(personal) {
    const normalized = normalizePersonalInfo(personal);
    const fromParts = `${normalized.firstName} ${normalized.lastName}`.trim();
    const fullName = fromParts || normalized.preferredName.trim();
    return {
        ...normalized,
        fullName,
        name: fullName
    };
}
function normalizeEducationEntry(entry) {
    const base = (0, index_1.createEmptyEducationEntry)();
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
function normalizeWorkHistoryEntry(entry) {
    const base = (0, index_1.createEmptyWorkHistoryEntry)();
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
function normalizeCustomQaPair(entry) {
    const base = (0, index_1.createEmptyCustomQaPair)();
    if (!entry || typeof entry !== "object") {
        return base;
    }
    return {
        question: typeof entry.question === "string" ? entry.question : base.question,
        answer: typeof entry.answer === "string" ? entry.answer : base.answer
    };
}
function normalizeMasterProfile(input) {
    const empty = (0, index_1.createEmptyMasterProfile)();
    if (!input || typeof input !== "object") {
        return empty;
    }
    const candidate = input;
    const personal = normalizePersonalInfo(candidate.personal);
    const address = candidate.address && typeof candidate.address === "object"
        ? { ...(0, index_1.createEmptyAddressInfo)(), ...candidate.address }
        : (0, index_1.createEmptyAddressInfo)();
    const educationRaw = candidate.education;
    const workHistoryRaw = candidate.workHistory ?? candidate.work_history;
    const customQaRaw = candidate.customQaPairs ?? candidate.custom_qa_pairs;
    const education = Array.isArray(educationRaw)
        ? educationRaw.map((entry) => normalizeEducationEntry(entry))
        : [];
    const workHistory = Array.isArray(workHistoryRaw)
        ? workHistoryRaw.map((entry) => normalizeWorkHistoryEntry(entry))
        : [];
    const customQaPairs = Array.isArray(customQaRaw)
        ? customQaRaw.map((entry) => normalizeCustomQaPair(entry))
        : [];
    return {
        personal,
        address,
        education,
        workHistory,
        customQaPairs
    };
}
function masterProfileToDbPayload(profileId, profile) {
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
