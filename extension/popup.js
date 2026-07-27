"use strict";
const dashboardButton = document.getElementById("open-dashboard");
const reviewButton = document.getElementById("review-fields");
const fillButton = document.getElementById("fill-page");
const statusNode = document.getElementById("status");
const metaNode = document.getElementById("meta");
const fieldsNode = document.getElementById("fields");
const pairingInput = document.getElementById("pairing-code");
const pairingButton = document.getElementById("pair-extension");
const pairingStatus = document.getElementById("pairing-status");
let currentReview = null;
pairingButton?.addEventListener("click", () => {
    void redeemPairingCode();
});
dashboardButton?.addEventListener("click", async () => {
    const settings = await getExtensionSettings();
    void chrome.tabs.create({ url: settings.apiBaseUrl });
});
reviewButton?.addEventListener("click", () => {
    void loadReview();
});
fillButton?.addEventListener("click", () => {
    void applyFill();
});
void loadReview();
async function redeemPairingCode() {
    if (!(pairingInput instanceof HTMLInputElement)) {
        return;
    }
    const code = pairingInput.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
        setPairingStatus("Enter the 6-character code from the dashboard.");
        return;
    }
    setPairingStatus("Linking...");
    try {
        const settings = await getExtensionSettings();
        const response = await fetch(`${settings.apiBaseUrl}/api/extension/pairing/redeem`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error ?? `Link failed (${response.status})`);
        }
        const payload = await response.json();
        await saveExtensionSessionTokens({
            profileId: payload.profileId,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken
        });
        pairingInput.value = "";
        setPairingStatus("Linked. Profile sync uses your account.");
        void loadReview();
    }
    catch (error) {
        setPairingStatus(error instanceof Error ? error.message : "Could not link extension");
    }
}
function setPairingStatus(message) {
    if (pairingStatus) {
        pairingStatus.textContent = message;
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
        fields: Array.from(document.querySelectorAll("[data-field-id]"))
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
    const matchedFields = review.fields.filter((field) => field.profileFieldPath && field.value.trim().length > 0);
    if (fieldsNode) {
        fieldsNode.innerHTML = matchedFields.length === 0
            ? "<p class=\"empty\">No autofill matches found on this page.</p>"
            : matchedFields.map((field, index) => renderField(field, index)).join("");
    }
    setFillEnabled(matchedFields.length > 0);
    setStatus(`${review.fields.length} detected, ${matchedFields.length} ready to review.`);
}
function renderField(field, index) {
    const confidence = `${Math.round(field.confidence * 100)}%`;
    const path = field.profileFieldPath ?? "No match";
    return `
    <article class="field-card">
      <div class="field-top">
        <strong>${escapeHtml(field.labelGuess || field.fieldId)}</strong>
        <span class="confidence">${confidence}</span>
      </div>
      <div class="field-meta">${escapeHtml(field.type)} -> ${escapeHtml(path)}</div>
      <input
        data-field-id="${escapeHtml(field.fieldId)}"
        aria-label="Review value ${index + 1}"
        value="${escapeHtml(field.value)}"
      />
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
