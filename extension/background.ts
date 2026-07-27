chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({
    apiBaseUrl: "http://localhost:3000",
    profileId: "local-dev-user"
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const candidate = message as { type?: string };

  if (candidate.type !== "jobber-hopper:get-settings") {
    return;
  }

  void chrome.storage.local.get(["apiBaseUrl", "profileId", "accessToken", "refreshToken"]).then((stored) => {
    sendResponse({
      apiBaseUrl:
        typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim().length > 0
          ? stored.apiBaseUrl
          : "http://localhost:3000",
      profileId:
        typeof stored.profileId === "string" && stored.profileId.trim().length > 0
          ? stored.profileId
          : "local-dev-user",
      accessToken: typeof stored.accessToken === "string" ? stored.accessToken : "",
      refreshToken: typeof stored.refreshToken === "string" ? stored.refreshToken : ""
    });
  });

  return true;
});
