"use strict";
const dashboardButton = document.getElementById("open-dashboard");
const signOutButton = document.getElementById("sign-out");
const reviewButton = document.getElementById("review-fields");
const fillButton = document.getElementById("fill-page");
const statusNode = document.getElementById("status");
const metaNode = document.getElementById("meta");
const fieldsNode = document.getElementById("fields");
const authNode = document.getElementById("auth-state");
let currentReview = null;
let currentSession = null;
dashboardButton?.addEventListener("click", async () => {
    const settings = await getExtensionSettings();
    void chrome.tabs.create({ url: `${settings.apiBaseUrl}/dashboard` });
});
signOutButton?.addEventListener("click", () => {
    void signOutFromExtension();
});
reviewButton?.addEventListener("click", () => {
    void loadReview();
});
fillButton?.addEventListener("click", () => {
    void applyFill();
});
void refreshSession();
void loadReview();
async function refreshSession() {
    try {
        const response = await chrome.runtime.sendMessage({ type: "jobber-hopper:get-session" });
        if (response && typeof response === "object") {
            currentSession = response;
        }
        else {
            currentSession = { signedIn: false, userId: null, email: null, origin: null, cached: false };
        }
    }
    catch {
        currentSession = { signedIn: false, userId: null, email: null, origin: null, cached: false };
    }
    renderAuthState();
}
function renderAuthState() {
    if (!authNode)
        return;
    if (!currentSession) {
        authNode.textContent = "Checking sign-in...";
        return;
    }
    if (!currentSession.signedIn) {
        authNode.textContent = "Not signed in. Open the dashboard to sign in.";
        signOutButton?.classList.add("hidden");
        return;
    }
    const label = currentSession.email ?? currentSession.userId ?? "unknown account";
    const suffix = currentSession.cached ? " (cached)" : "";
    authNode.textContent = `Signed in as ${label}${suffix}`;
    signOutButton?.classList.remove("hidden");
}
async function signOutFromExtension() {
    await chrome.runtime.sendMessage({ type: "jobber-hopper:sign-out" });
    const settings = await getExtensionSettings();
    // Clerk's hosted sign-out is at /sign-out by default; the web app may
    // override with `clerkMiddleware` or a custom route. Either way, opening
    // it is what clears the httpOnly session cookie.
    void chrome.tabs.create({ url: `${settings.apiBaseUrl}/sign-out` });
    currentSession = { signedIn: false, userId: null, email: null, origin: null, cached: false };
    renderAuthState();
    if (statusNode) {
        statusNode.textContent = "Signed out. Sign in again on the dashboard to use the extension.";
    }
}
async function loadReview() {
    setStatus("Inspecting active page...");
    setFillEnabled(false);
    try {
        const tab = await getActiveTab();
        if (!tab.id) {
            throw new Error("No active tab found.");
        }
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: "jobber-hopper:get-popup-review"
        });
        currentReview = response;
        renderReview(response);
    }
    catch (error) {
        currentReview = null;
        renderError(error instanceof Error ? error.message : "Could not inspect the active page.");
    }
}
async function applyFill() {
    if (!currentReview) {
        return;
    }
    const tab = await getActiveTab();
    if (!tab.id) {
        renderError("No active tab found.");
        return;
    }
    const payload = {
        fields: Array.from(document.querySelectorAll("[data-field-id][data-safe-to-fill='true']"))
            .map((input) => ({
            fieldId: input.dataset.fieldId ?? "",
            value: input.value
        }))
            .filter((field) => field.fieldId.length > 0 && field.value.trim().length > 0)
    };
    setStatus("Filling visible fields...");
    const result = await chrome.tabs.sendMessage(tab.id, {
        type: "jobber-hopper:apply-popup-review",
        payload
    });
    setStatus(`Filled ${result.filled} fields. Skipped ${result.skipped}.`);
}
async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? {};
}
function renderReview(review) {
    if (metaNode) {
        metaNode.textContent = review.pageTitle || review.pageUrl;
    }
    if (!review.ready) {
        if (fieldsNode) {
            fieldsNode.innerHTML = "";
        }
        setStatus(review.error ?? "Profile is not ready yet.");
        return;
    }
    const safeFields = review.fields.filter((field) => field.isSafeToFill);
    const manualFields = review.fields.filter((field) => !field.isSafeToFill);
    if (fieldsNode) {
        fieldsNode.innerHTML = review.fields.length === 0
            ? "<p class=\"empty\">No form fields found on this page.</p>"
            : review.fields.map((field, index) => renderField(field, index)).join("");
    }
    setFillEnabled(safeFields.length > 0);
    setStatus(manualFields.length > 0
        ? `${safeFields.length} safe to fill. ${manualFields.length} need manual entry.`
        : `${safeFields.length} fields ready to review.`);
}
function renderField(field, index) {
    const confidence = `${Math.round(field.confidence * 100)}%`;
    const path = field.profileFieldPath ?? "No safe match";
    const stateClass = field.isSafeToFill ? "field-card-safe" : "field-card-manual";
    const content = field.isSafeToFill
        ? `
      <input
        data-field-id="${escapeHtml(field.fieldId)}"
        data-safe-to-fill="true"
        aria-label="Review value ${index + 1}"
        value="${escapeHtml(field.value)}"
      />`
        : `<p class="manual-warning">${escapeHtml(field.manualReason ?? "Couldn't detect this field confidently — fill manually.")}</p>`;
    return `
    <article class="field-card ${stateClass}">
      <div class="field-top">
        <strong>${escapeHtml(field.labelGuess || field.fieldId)}</strong>
        <span class="confidence">${confidence}</span>
      </div>
      <div class="field-meta">${escapeHtml(field.type)} -> ${escapeHtml(path)}</div>
      ${content}
    </article>
  `;
}
function renderError(message) {
    if (metaNode) {
        metaNode.textContent = "No review data";
    }
    if (fieldsNode) {
        fieldsNode.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
    }
    setStatus(message);
    setFillEnabled(false);
}
function setStatus(message) {
    if (statusNode) {
        statusNode.textContent = message;
    }
}
function setFillEnabled(enabled) {
    if (fillButton instanceof HTMLButtonElement) {
        fillButton.disabled = !enabled;
    }
}
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
