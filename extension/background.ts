const SESSION_CACHE_KEY = "jobber-hopper:session-cache";
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({
    apiBaseUrl: "https://jobber-hopper.vercel.app",
    profileId: "local-dev-user"
  });
});

type SessionCacheEntry = {
  userId: string;
  email: string | null;
  fetchedAt: number;
};

type SessionQueryResponse = {
  signedIn: boolean;
  userId: string | null;
  email: string | null;
  origin: string | null;
  cached: boolean;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const candidate = message as { type?: string; payload?: unknown };

  switch (candidate.type) {
    case "jobber-hopper:get-settings":
      return handleGetSettings(sendResponse);
    case "jobber-hopper:get-session":
      void handleGetSession(sendResponse);
      return true;
    case "jobber-hopper:sign-out":
      void handleSignOut(sendResponse);
      return true;
    default:
      return false;
  }
});

function handleGetSettings(sendResponse: (response: unknown) => void): boolean {
  void chrome.storage.local
    .get(["apiBaseUrl", "profileId"])
    .then((stored) => {
      sendResponse({
        apiBaseUrl:
          typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim().length > 0
            ? stored.apiBaseUrl.trim()
            : "https://jobber-hopper.vercel.app",
        profileId:
          typeof stored.profileId === "string" && stored.profileId.trim().length > 0
            ? stored.profileId.trim()
            : "local-dev-user"
      });
    });
  return true;
}

async function handleGetSession(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const session = await getClerkSession();
    if (!session) {
      sendResponse({
        signedIn: false,
        userId: null,
        email: null,
        origin: null,
        cached: false
      } satisfies SessionQueryResponse);
      return;
    }

    const cached = await readSessionCache();
    if (cached && Date.now() - cached.fetchedAt < SESSION_CACHE_TTL_MS) {
      sendResponse({
        signedIn: true,
        userId: cached.userId,
        email: cached.email,
        origin: session.origin,
        cached: true
      } satisfies SessionQueryResponse);
      return;
    }

    const settings = await chrome.storage.local.get(["apiBaseUrl"]);
    const apiBaseUrl =
      typeof settings.apiBaseUrl === "string" && settings.apiBaseUrl.trim().length > 0
        ? settings.apiBaseUrl.trim()
        : "https://jobber-hopper.vercel.app";

    const response = await fetch(`${apiBaseUrl}/api/extension/session`, {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}` }
    });

    if (response.status === 401) {
      // Cookie present but stale (e.g. signed out on the web). Drop cache.
      await chrome.storage.local.remove(SESSION_CACHE_KEY);
      sendResponse({
        signedIn: false,
        userId: null,
        email: null,
        origin: session.origin,
        cached: false
      } satisfies SessionQueryResponse);
      return;
    }

    if (!response.ok) {
      sendResponse({
        signedIn: true,
        userId: null,
        email: null,
        origin: session.origin,
        cached: false
      } satisfies SessionQueryResponse);
      return;
    }

    const data = (await response.json()) as { userId?: unknown; email?: unknown };
    const userId = typeof data.userId === "string" ? data.userId : null;
    const email = typeof data.email === "string" ? data.email : null;

    if (userId) {
      await chrome.storage.local.set({
        profileId: userId,
        [SESSION_CACHE_KEY]: { userId, email, fetchedAt: Date.now() } satisfies SessionCacheEntry
      });
    }

    sendResponse({
      signedIn: true,
      userId,
      email,
      origin: session.origin,
      cached: false
    } satisfies SessionQueryResponse);
  } catch (error) {
    console.warn("[Jobber Hopper] session query failed", error);
    sendResponse({
      signedIn: false,
      userId: null,
      email: null,
      origin: null,
      cached: false
    } satisfies SessionQueryResponse);
  }
}

async function handleSignOut(sendResponse: (response: unknown) => void): Promise<void> {
  // The web app's sign-out clears the Clerk session cookie (which is httpOnly
  // and we can't delete it from here). We just clear our own cached state.
  await chrome.storage.local.remove([SESSION_CACHE_KEY, "profileId"]);
  await chrome.storage.local.set({ profileId: "local-dev-user" });
  sendResponse({ ok: true });
}

async function readSessionCache(): Promise<SessionCacheEntry | null> {
  const stored = await chrome.storage.local.get(SESSION_CACHE_KEY);
  const entry = stored[SESSION_CACHE_KEY];
  if (!entry || typeof entry !== "object") return null;
  const row = entry as Partial<SessionCacheEntry>;
  if (typeof row.userId !== "string" || typeof row.fetchedAt !== "number") return null;
  return {
    userId: row.userId,
    email: typeof row.email === "string" ? row.email : null,
    fetchedAt: row.fetchedAt
  };
}
