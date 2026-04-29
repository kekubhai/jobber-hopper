"use strict";
chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({ apiBaseUrl: "http://localhost:3000" });
});
