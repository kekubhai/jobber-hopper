"use strict";
const DEFAULT_API_BASE_URL = "https://jobber-hopper.vercel.app";
const DEFAULT_PROFILE_ID = "local-dev-user";
/**
 * Origins the extension checks for the Clerk session cookie. Order matters:
 * the first match wins. `localhost:3000` is for dev; the production origin
 * goes in the manifest's host_permissions. Add more entries here if you
 * stand up another environment.
 */
const CLERK_SESSION_COOKIE_ORIGINS = [
    "http://localhost:3000",
    "https://jobber-hopper.vercel.app",
    "https://app.jobber-hopper.com"
];
/** Clerk's default session cookie name. Configurable in case the web app
 *  uses a non-default Clerk instance. */
const CLERK_SESSION_COOKIE_NAME = "__session";
const STORAGE_KEYS = ["apiBaseUrl", "profileId"];
function defaultExtensionSettings() {
    return {
        apiBaseUrl: DEFAULT_API_BASE_URL,
        profileId: DEFAULT_PROFILE_ID
    };
}
function normalizeStoredSettings(stored) {
    const defaults = defaultExtensionSettings();
    const apiBaseUrl = typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim().length > 0
        ? stored.apiBaseUrl.trim()
        : defaults.apiBaseUrl;
    const profileId = typeof stored.profileId === "string" && stored.profileId.trim().length > 0
        ? stored.profileId.trim()
        : defaults.profileId;
    return { apiBaseUrl, profileId };
}
async function readExtensionSettingsFromStorage() {
    const local = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
        ? chrome.storage.local
        : null;
    if (!local) {
        return null;
    }
    const stored = await local.get(STORAGE_KEYS);
    return normalizeStoredSettings(stored);
}
async function readExtensionSettingsViaBackground() {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        return defaultExtensionSettings();
    }
    try {
        const response = await chrome.runtime.sendMessage({ type: "jobber-hopper:get-settings" });
        if (response && typeof response === "object") {
            return normalizeStoredSettings(response);
        }
    }
    catch (error) {
        console.warn("[Jobber Hopper] Could not load settings from background", error);
    }
    return defaultExtensionSettings();
}
async function getExtensionSettings() {
    try {
        const fromStorage = await readExtensionSettingsFromStorage();
        if (fromStorage) {
            return fromStorage;
        }
    }
    catch (error) {
        console.warn("[Jobber Hopper] chrome.storage.local read failed", error);
    }
    return readExtensionSettingsViaBackground();
}
async function saveExtensionApiBaseUrl(apiBaseUrl) {
    const local = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
        ? chrome.storage.local
        : null;
    if (!local)
        return;
    await local.set({ apiBaseUrl: apiBaseUrl.trim() });
}
async function saveExtensionProfileId(profileId) {
    const local = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
        ? chrome.storage.local
        : null;
    if (!local)
        return;
    await local.set({ profileId: profileId.trim() });
}
async function clearExtensionProfileId() {
    const local = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
        ? chrome.storage.local
        : null;
    if (!local)
        return;
    await local.set({ profileId: DEFAULT_PROFILE_ID });
}
function clerkCookieOrigins() {
    // Always include the dev origin first. Append any custom apiBaseUrl so
    // pointing the extension at a different web origin still works.
    const origins = [...CLERK_SESSION_COOKIE_ORIGINS];
    // We only need the synchronous apiBaseUrl here for the origin list. Settings
    // are loaded async elsewhere; for the cookie probe we hardcode the dev one
    // and add the configured one below.
    return origins;
}
async function readClerkSessionFromOrigins(origins, cookieName) {
    if (typeof chrome === "undefined" || !chrome.cookies?.get) {
        return null;
    }
    for (const origin of origins) {
        try {
            const cookie = await chrome.cookies.get({ url: origin, name: cookieName });
            if (cookie?.value && cookie.value.length > 0) {
                return { token: cookie.value, origin };
            }
        }
        catch (error) {
            // Origin may be unreachable in this browser session (different
            // profile, offline, etc). Skip and try the next.
            console.debug(`[Jobber Hopper] cookie probe failed for ${origin}`, error);
        }
    }
    return null;
}
/** Probe the Clerk session cookie across known web origins. */
async function getClerkSession() {
    const settings = await getExtensionSettings();
    const origins = new Set(clerkCookieOrigins());
    // Add the configured apiBaseUrl so a customized dev/staging origin works.
    try {
        origins.add(new URL(settings.apiBaseUrl).origin);
    }
    catch {
        // apiBaseUrl is malformed; ignore.
    }
    return readClerkSessionFromOrigins(Array.from(origins), CLERK_SESSION_COOKIE_NAME);
}
/** Bearer header built from the Clerk session cookie. Returns {} when no
 *  cookie is present (e.g. user has not signed in on the web app yet). */
async function getExtensionAuthHeaders() {
    const session = await getClerkSession();
    if (session) {
        return { Authorization: `Bearer ${session.token}` };
    }
    return {};
}
async function hasClerkSession() {
    return (await getClerkSession()) !== null;
}
