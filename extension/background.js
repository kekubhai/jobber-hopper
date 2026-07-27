"use strict";
chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({
        apiBaseUrl: "http://localhost:3000",
        profileId: "local-dev-user"
    });
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const candidate = message;
    if (candidate.type !== "jobber-hopper:get-settings") {
        return;
    }
    void chrome.storage.local.get(["apiBaseUrl", "profileId"]).then((stored) => {
        sendResponse({
            apiBaseUrl: typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim().length > 0
                ? stored.apiBaseUrl
                : "http://localhost:3000",
            profileId: typeof stored.profileId === "string" && stored.profileId.trim().length > 0
                ? stored.profileId
                : "local-dev-user"
        });
    });
    return true;
});
