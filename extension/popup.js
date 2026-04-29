"use strict";
const dashboardButton = document.getElementById("open-dashboard");
dashboardButton?.addEventListener("click", () => {
    void chrome.tabs.create({ url: "http://localhost:3000" });
});
