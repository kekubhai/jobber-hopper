"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_MATCH_RULES = exports.PROFILE_FIELD_PATHS = exports.LOW_CONFIDENCE_THRESHOLD = exports.JOB_PLATFORM_LABELS = exports.personalForDb = exports.normalizePersonalInfo = exports.masterProfileToDbPayload = exports.normalizeMasterProfile = exports.PROFILE_STORAGE_KEY = void 0;
exports.createEmptyMasterProfile = createEmptyMasterProfile;
exports.createEmptyPersonalInfo = createEmptyPersonalInfo;
exports.createEmptyAddressInfo = createEmptyAddressInfo;
exports.createEmptyEducationEntry = createEmptyEducationEntry;
exports.createEmptyWorkHistoryEntry = createEmptyWorkHistoryEntry;
exports.createEmptyCustomQaPair = createEmptyCustomQaPair;
exports.createEmptyUserProfile = createEmptyUserProfile;
exports.isMasterProfileReady = isMasterProfileReady;
exports.PROFILE_STORAGE_KEY = "jobber-hopper.master-profile";
function createEmptyMasterProfile() {
    return {
        personal: createEmptyPersonalInfo(),
        address: createEmptyAddressInfo(),
        education: [],
        workHistory: [],
        customQaPairs: []
    };
}
function createEmptyPersonalInfo() {
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
function createEmptyAddressInfo() {
    return {
        line1: "",
        line2: "",
        city: "",
        region: "",
        postalCode: "",
        country: ""
    };
}
function createEmptyEducationEntry() {
    return {
        school: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        notes: ""
    };
}
function createEmptyWorkHistoryEntry() {
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
function createEmptyCustomQaPair() {
    return {
        question: "",
        answer: ""
    };
}
function createEmptyUserProfile(userId = "") {
    return {
        userId,
        email: "",
        displayName: "",
        avatarUrl: "",
        masterProfileId: null
    };
}
function isMasterProfileReady(profile) {
    return profile.personal.firstName.trim().length > 0 &&
        profile.personal.lastName.trim().length > 0 &&
        profile.personal.email.trim().length > 0;
}
var profile_normalize_1 = require("./profile-normalize");
Object.defineProperty(exports, "normalizeMasterProfile", { enumerable: true, get: function () { return profile_normalize_1.normalizeMasterProfile; } });
Object.defineProperty(exports, "masterProfileToDbPayload", { enumerable: true, get: function () { return profile_normalize_1.masterProfileToDbPayload; } });
Object.defineProperty(exports, "normalizePersonalInfo", { enumerable: true, get: function () { return profile_normalize_1.normalizePersonalInfo; } });
Object.defineProperty(exports, "personalForDb", { enumerable: true, get: function () { return profile_normalize_1.personalForDb; } });
var platforms_1 = require("./platforms");
Object.defineProperty(exports, "JOB_PLATFORM_LABELS", { enumerable: true, get: function () { return platforms_1.JOB_PLATFORM_LABELS; } });
var form_mapping_1 = require("./form-mapping");
Object.defineProperty(exports, "LOW_CONFIDENCE_THRESHOLD", { enumerable: true, get: function () { return form_mapping_1.LOW_CONFIDENCE_THRESHOLD; } });
Object.defineProperty(exports, "PROFILE_FIELD_PATHS", { enumerable: true, get: function () { return form_mapping_1.PROFILE_FIELD_PATHS; } });
Object.defineProperty(exports, "isProfileFieldPath", { enumerable: true, get: function () { return form_mapping_1.isProfileFieldPath; } });
Object.defineProperty(exports, "canonicalFormFieldsForHash", { enumerable: true, get: function () { return form_mapping_1.canonicalFormFieldsForHash; } });
var profile_match_1 = require("./profile-match");
Object.defineProperty(exports, "PROFILE_MATCH_RULES", { enumerable: true, get: function () { return profile_match_1.PROFILE_MATCH_RULES; } });
Object.defineProperty(exports, "normalizeTextForMatching", { enumerable: true, get: function () { return profile_match_1.normalizeTextForMatching; } });
Object.defineProperty(exports, "buildMatchHaystack", { enumerable: true, get: function () { return profile_match_1.buildMatchHaystack; } });
Object.defineProperty(exports, "matchProfileFieldPath", { enumerable: true, get: function () { return profile_match_1.matchProfileFieldPath; } });
Object.defineProperty(exports, "getProfileFieldValue", { enumerable: true, get: function () { return profile_match_1.getProfileFieldValue; } });
Object.defineProperty(exports, "resolveAutofillValue", { enumerable: true, get: function () { return profile_match_1.resolveAutofillValue; } });
Object.defineProperty(exports, "matchDetectedFields", { enumerable: true, get: function () { return profile_match_1.matchDetectedFields; } });
