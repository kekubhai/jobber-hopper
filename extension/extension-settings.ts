const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_PROFILE_ID = "local-dev-user";

type ExtensionSettings = {
  apiBaseUrl: string;
  profileId: string;
};

function defaultExtensionSettings(): ExtensionSettings {
  return {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    profileId: DEFAULT_PROFILE_ID
  };
}

function normalizeStoredSettings(stored: Record<string, unknown>): ExtensionSettings {
  const defaults = defaultExtensionSettings();
  const apiBaseUrl =
    typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim().length > 0
      ? stored.apiBaseUrl.trim()
      : defaults.apiBaseUrl;
  const profileId =
    typeof stored.profileId === "string" && stored.profileId.trim().length > 0
      ? stored.profileId.trim()
      : defaults.profileId;

  return { apiBaseUrl, profileId };
}

async function readExtensionSettingsFromStorage(): Promise<ExtensionSettings | null> {
  const local =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
      ? chrome.storage.local
      : null;

  if (!local) {
    return null;
  }

  const stored = await local.get(["apiBaseUrl", "profileId"]);
  return normalizeStoredSettings(stored as Record<string, unknown>);
}

async function readExtensionSettingsViaBackground(): Promise<ExtensionSettings> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return defaultExtensionSettings();
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: "jobber-hopper:get-settings" });
    if (response && typeof response === "object") {
      return normalizeStoredSettings(response as Record<string, unknown>);
    }
  } catch (error) {
    console.warn("[Jobber Hopper] Could not load settings from background", error);
  }

  return defaultExtensionSettings();
}

async function getExtensionSettings(): Promise<ExtensionSettings> {
  try {
    const fromStorage = await readExtensionSettingsFromStorage();
    if (fromStorage) {
      return fromStorage;
    }
  } catch (error) {
    console.warn("[Jobber Hopper] chrome.storage.local read failed", error);
  }

  return readExtensionSettingsViaBackground();
}
