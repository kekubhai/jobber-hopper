"use strict";
const BUTTON_ID = "ai-browser-agent-assist";
const AUTOFILL_BUTTON_ID = "jobber-hopper-autofill";
const MAX_TEXT_LENGTH = 3000;
const CONTENT_LOG_PREFIX = "[Jobber Hopper]";
const FUNNEL_SESSION_ID = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `jh-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function injectAssistButton() {
    if (document.getElementById(BUTTON_ID) || !document.body)
        return;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "AI Assist";
    button.style.cssText = floatingButtonStyle("bottom:20px");
    button.addEventListener("click", () => {
        void analyzeCurrentPage(button);
    });
    document.body.appendChild(button);
}
function injectAutofillButton() {
    if (document.getElementById(AUTOFILL_BUTTON_ID) || !document.body)
        return;
    const button = document.createElement("button");
    button.id = AUTOFILL_BUTTON_ID;
    button.type = "button";
    button.textContent = "Fill profile";
    button.style.cssText = floatingButtonStyle("bottom:64px");
    button.addEventListener("click", () => {
        void runRuleBasedAutofill(button);
    });
    document.body.appendChild(button);
}
function floatingButtonStyle(bottomOffset) {
    return [
        "position:fixed",
        "right:20px",
        bottomOffset,
        "z-index:2147483647",
        "padding:10px 14px",
        "border:0",
        "border-radius:8px",
        "background:#111827",
        "color:#ffffff",
        "font:600 14px system-ui,-apple-system,Segoe UI,sans-serif",
        "box-shadow:0 8px 24px rgba(0,0,0,0.2)",
        "cursor:pointer"
    ].join(";");
}
async function runRuleBasedAutofill(button) {
    setButtonState(button, "Filling...", true);
    try {
        const review = await buildPopupReviewData();
        if (!review.ready) {
            console.warn(`${CONTENT_LOG_PREFIX} No ready master profile. Save your profile in the dashboard first.`);
            setButtonState(button, "No profile", false);
            return;
        }
        const result = applyReviewedAutofill({
            fields: review.fields
                .filter((field) => field.isSafeToFill && field.value.trim().length > 0)
                .map((field) => ({ fieldId: field.fieldId, value: field.value }))
        });
        if (result.filled > 0) {
            void trackApplicationFill();
            void trackFunnelEvent("autofill_accepted", {
                fieldsFilled: result.filled
            });
        }
        setButtonState(button, result.filled > 0 ? `Filled ${result.filled}` : "No matches", false);
    }
    catch (error) {
        console.error(`${CONTENT_LOG_PREFIX} Autofill failed`, error);
        setButtonState(button, "Error", false);
    }
    finally {
        window.setTimeout(() => setButtonState(button, "Fill profile", false), 2000);
    }
}
async function fetchMasterProfile(settings) {
    const baseUrl = settings.apiBaseUrl;
    const profileId = settings.profileId;
    const url = `${baseUrl}/api/profile?profileId=${encodeURIComponent(profileId)}`;
    const response = await fetch(url, {
        method: "GET",
        headers: await getExtensionAuthHeaders()
    });
    if (!response.ok) {
        throw new Error(`Profile API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.exists || !data.ready) {
        return null;
    }
    return data.profile;
}
function applicationText(selector) {
    return (document.querySelector(selector)?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
}
function contentMeta(nameOrProperty) {
    const meta = document.querySelector(`meta[name="${CSS.escape(nameOrProperty)}"], meta[property="${CSS.escape(nameOrProperty)}"]`);
    return meta?.content.replace(/\s+/g, " ").trim().slice(0, 300) ?? "";
}
function getApplicationTrackingMetadata() {
    const platform = typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
    const path = window.location.pathname.toLowerCase();
    const likelyApplication = platform !== "generic" || /\/(?:job|jobs|career|careers|apply|application)(?:\/|$)/.test(path);
    if (!likelyApplication) {
        return null;
    }
    const role = applicationText("[data-automation-id='jobPostingTitle'], [data-automation-id='jobTitle'], .app-title, h1") || contentMeta("og:title") || document.title;
    const company = applicationText("[data-automation-id='company'], [data-automation-id='companyName'], .company-name") || contentMeta("og:site_name");
    return {
        jobUrl: window.location.href,
        domain: window.location.hostname.toLowerCase(),
        platform,
        company,
        role
    };
}
async function trackApplicationFill() {
    const metadata = getApplicationTrackingMetadata();
    if (!metadata) {
        return;
    }
    try {
        const settings = await getExtensionSettings();
        const headers = {
            "Content-Type": "application/json",
            ...(await getExtensionAuthHeaders())
        };
        const url = `${settings.apiBaseUrl}/api/applications?profileId=${encodeURIComponent(settings.profileId)}`;
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(metadata)
        });
        if (!response.ok) {
            throw new Error(`Application tracker responded ${response.status}`);
        }
        console.info(`${CONTENT_LOG_PREFIX} Application tracked`, metadata);
    }
    catch (error) {
        // Tracking must never block or undo a user-approved fill.
        console.warn(`${CONTENT_LOG_PREFIX} Application tracking skipped`, error);
    }
}
function trackFormDetected(fields) {
    void trackFunnelEvent("form_detected", {
        fieldsDetected: fields.length
    });
}
async function trackFunnelEvent(eventName, counts) {
    const metadata = getApplicationTrackingMetadata();
    if (!metadata) {
        return;
    }
    try {
        const settings = await getExtensionSettings();
        const response = await fetch(`${settings.apiBaseUrl}/api/analytics/events?profileId=${encodeURIComponent(settings.profileId)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(await getExtensionAuthHeaders())
            },
            body: JSON.stringify({
                sessionId: FUNNEL_SESSION_ID,
                eventName,
                pageUrl: metadata.jobUrl,
                domain: metadata.domain,
                platform: metadata.platform,
                ...counts
            })
        });
        if (!response.ok) {
            throw new Error(`Funnel tracker responded ${response.status}`);
        }
    }
    catch (error) {
        // Observability must never interrupt a user-facing fill or form review.
        console.warn(`${CONTENT_LOG_PREFIX} Funnel tracking skipped`, error);
    }
}
function estimateConfidence(field) {
    if (!field.profileFieldPath || !field.value) {
        return 0;
    }
    const haystack = buildMatchHaystack(field.labelGuess, field.fieldId);
    if (/\bemail\b/.test(haystack) ||
        /\bfirst name\b/.test(haystack) ||
        /\blast name\b/.test(haystack) ||
        /\bphone\b/.test(haystack) ||
        /\blinkedin\b/.test(haystack)) {
        return 0.96;
    }
    // Work eligibility, availability, and compensation labels are long and
    // unambiguous when they match at all, so they clear LOW_CONFIDENCE_THRESHOLD.
    // Without this bucket they would fall to the 0.68 default and every one of
    // them would be flagged for manual review.
    if (/\bsponsorship\b/.test(haystack) ||
        /\bauthorized to work\b/.test(haystack) ||
        /\bauthorised to work\b/.test(haystack) ||
        /\bwork authorisation\b/.test(haystack) ||
        /\bwork authorization\b/.test(haystack) ||
        /\bvisa status\b/.test(haystack) ||
        /\bnotice period\b/.test(haystack) ||
        /\bgithub\b/.test(haystack) ||
        /\bpronouns?\b/.test(haystack) ||
        /\bmiddle name\b/.test(haystack) ||
        /\brelocat/.test(haystack) ||
        /\b(expected|desired) (salary|compensation|pay|ctc)\b/.test(haystack) ||
        /\bsalary expectation/.test(haystack) ||
        /\bearliest (possible )?start\b/.test(haystack)) {
        return 0.92;
    }
    if (/\bfull name\b/.test(haystack) ||
        /\byour name\b/.test(haystack) ||
        /\baddress\b/.test(haystack) ||
        /\bcity\b/.test(haystack) ||
        /\bcountry\b/.test(haystack)) {
        return 0.82;
    }
    if (field.type === "textarea") {
        return 0.72;
    }
    return 0.68;
}
function reviewConfidence(match) {
    if (match.mappingSource === "llm" && typeof match.mappingConfidence === "number") {
        return match.mappingConfidence;
    }
    return estimateConfidence(match);
}
function getManualReviewReason(match) {
    if (!match.profileFieldPath) {
        return "Couldn't detect a safe profile match — fill manually.";
    }
    if (!match.value) {
        return "No saved value is available for this field — fill manually.";
    }
    if (match.confidence < LOW_CONFIDENCE_THRESHOLD) {
        return "Couldn't detect this field confidently — fill manually.";
    }
    return null;
}
async function buildPopupReviewData() {
    const settings = await getExtensionSettings();
    const profile = await fetchMasterProfile(settings);
    if (!profile) {
        return {
            pageTitle: document.title,
            pageUrl: window.location.href,
            ready: false,
            fields: [],
            error: "No ready master profile. Save your profile in the dashboard first."
        };
    }
    const scanned = scanFormFieldsWithElements();
    const ruleMatches = matchDetectedFields(profile, scanned).map((match) => ({
        ...match,
        mappingSource: "rule"
    }));
    const enriched = await enrichMatchesWithLlmWhenNeeded(profile, scanned, ruleMatches, settings);
    const fields = enriched.map((match) => {
        const confidence = reviewConfidence(match);
        const manualReason = getManualReviewReason({
            profileFieldPath: match.profileFieldPath,
            value: match.value ?? null,
            confidence
        });
        return {
            fieldId: match.fieldId,
            labelGuess: match.labelGuess,
            type: match.type,
            profileFieldPath: match.profileFieldPath,
            value: match.value ?? "",
            confidence,
            isSafeToFill: !manualReason,
            manualReason
        };
    });
    void trackFunnelEvent("fields_reviewed", {
        fieldsDetected: fields.length,
        fieldsMatched: fields.filter((field) => field.profileFieldPath !== null).length,
        fieldsSafe: fields.filter((field) => field.isSafeToFill).length
    });
    console.group(`${CONTENT_LOG_PREFIX} Popup review data`);
    console.table(fields);
    console.groupEnd();
    return {
        pageTitle: document.title,
        pageUrl: window.location.href,
        ready: true,
        fields
    };
}
function applyReviewedAutofill(request) {
    const fieldMap = new Map(scanFormFieldsWithElements().map((field) => [field.fieldId, field.element]));
    let filled = 0;
    let skipped = 0;
    for (const field of request.fields) {
        const element = fieldMap.get(field.fieldId);
        if (!element || !field.value.trim()) {
            skipped += 1;
            continue;
        }
        if (setFormControlValue(element, field.value)) {
            filled += 1;
        }
        else {
            skipped += 1;
        }
    }
    return {
        filled,
        skipped,
        matches: request.fields.map((field) => ({
            fieldId: field.fieldId,
            labelGuess: "",
            type: "",
            profileFieldPath: null,
            value: field.value
        }))
    };
}
async function analyzeCurrentPage(button) {
    setButtonState(button, "Thinking...", true);
    try {
        const socialPost = typeof scrapeSocialPostBody === "function" ? await scrapeSocialPostBody() : null;
        if (socialPost) {
            const extraction = await requestJobPostExtraction(socialPost);
            let match = null;
            let email = null;
            if (extraction.isJobPost) {
                try {
                    match = await requestJobPostMatch(extraction);
                }
                catch (matchError) {
                    console.warn(`${CONTENT_LOG_PREFIX} Profile match skipped`, matchError);
                }
                if (match) {
                    try {
                        email = await requestJobPostEmail(extraction, match, socialPost.platform);
                    }
                    catch (emailError) {
                        console.warn(`${CONTENT_LOG_PREFIX} Email draft skipped`, emailError);
                    }
                }
            }
            if (typeof persistLastJobPost === "function") {
                await persistLastJobPost(extraction, socialPost.platform, match, email);
            }
            else {
                window.jobberHopperLastJobPost = extraction;
                window.jobberHopperLastJobPostMatch = match;
                window.jobberHopperLastJobPostEmail = email;
            }
            console.info(`${CONTENT_LOG_PREFIX} Social job post pipeline`, {
                platform: socialPost.platform,
                extraction,
                match,
                email
            });
            if (!extraction.isJobPost) {
                setButtonState(button, "Not a job", false);
            }
            else if (email) {
                setButtonState(button, "Email ready", false);
                showEmailDraftOverlay(email);
            }
            else if (match) {
                setButtonState(button, `Match ${match.matchScore}%`, false);
            }
            else {
                const label = extraction.role?.trim() || "Job found";
                setButtonState(button, label.length > 22 ? `${label.slice(0, 20)}…` : label, false);
            }
            return;
        }
        if (typeof window.jobberHopperScanFormFields === "function") {
            window.jobberHopperScanFormFields();
        }
        const text = extractPageText();
        const settings = await getExtensionSettings();
        const action = await requestAction(text, settings);
        executeAction(action);
        setButtonState(button, "Done", false);
    }
    catch (error) {
        console.error("AI Browser Agent failed", error);
        setButtonState(button, "Error", false);
    }
    finally {
        window.setTimeout(() => setButtonState(button, "AI Assist", false), 1800);
    }
}
async function requestJobPostExtraction(socialPost) {
    const settings = await getExtensionSettings();
    const url = `${settings.apiBaseUrl}/api/job-posts/extract`;
    console.debug(`${CONTENT_LOG_PREFIX} job post extract URL:`, url);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getExtensionAuthHeaders())
        },
        body: JSON.stringify({
            postBody: socialPost.postBody,
            platform: socialPost.platform
        })
    });
    if (!response.ok) {
        throw new Error(`Job post extract API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.extraction) {
        throw new Error("Job post extract API returned no extraction");
    }
    return data.extraction;
}
async function requestJobPostMatch(jobPost) {
    const settings = await getExtensionSettings();
    const url = `${settings.apiBaseUrl}/api/job-posts/match?profileId=${encodeURIComponent(settings.profileId)}`;
    console.debug(`${CONTENT_LOG_PREFIX} job post match URL:`, url);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getExtensionAuthHeaders())
        },
        body: JSON.stringify({ jobPost })
    });
    if (!response.ok) {
        throw new Error(`Job post match API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.match) {
        throw new Error("Job post match API returned no match");
    }
    return data.match;
}
async function requestJobPostEmail(jobPost, match, platform) {
    const settings = await getExtensionSettings();
    const url = `${settings.apiBaseUrl}/api/job-posts/email?profileId=${encodeURIComponent(settings.profileId)}`;
    console.debug(`${CONTENT_LOG_PREFIX} job post email URL:`, url);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getExtensionAuthHeaders())
        },
        body: JSON.stringify({ jobPost, match, platform })
    });
    if (!response.ok) {
        throw new Error(`Job post email API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data.email) {
        throw new Error("Job post email API returned no email");
    }
    return data.email;
}
function showEmailDraftOverlay(email) {
    const existing = document.getElementById("jobber-hopper-email-draft");
    existing?.remove();
    const panel = document.createElement("div");
    panel.id = "jobber-hopper-email-draft";
    panel.style.cssText = [
        "position:fixed",
        "right:20px",
        "bottom:108px",
        "z-index:2147483647",
        "width:min(420px,calc(100vw - 40px))",
        "max-height:min(520px,calc(100vh - 140px))",
        "overflow:auto",
        "padding:14px",
        "border-radius:12px",
        "background:#0f172a",
        "color:#f8fafc",
        "font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif",
        "box-shadow:0 16px 40px rgba(0,0,0,0.35)"
    ].join(";");
    const title = document.createElement("div");
    title.textContent = "Application email";
    title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:8px";
    const subject = document.createElement("div");
    subject.textContent = `Subject: ${email.subject}`;
    subject.style.cssText = "margin-bottom:8px;opacity:0.9";
    const body = document.createElement("pre");
    body.textContent = email.body;
    body.style.cssText =
        "white-space:pre-wrap;margin:0 0 12px;font:inherit;background:#1e293b;padding:10px;border-radius:8px";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.style.cssText = overlayButtonStyle();
    copyBtn.addEventListener("click", () => {
        void navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
        copyBtn.textContent = "Copied";
        window.setTimeout(() => {
            copyBtn.textContent = "Copy";
        }, 1200);
    });
    const mailBtn = document.createElement("button");
    mailBtn.type = "button";
    mailBtn.textContent = email.toEmail ? "Open mail" : "No email";
    mailBtn.disabled = !email.toEmail;
    mailBtn.style.cssText = overlayButtonStyle();
    mailBtn.addEventListener("click", () => {
        if (!email.toEmail)
            return;
        const params = new URLSearchParams({
            subject: email.subject,
            body: email.body
        });
        window.location.href = `mailto:${encodeURIComponent(email.toEmail)}?${params.toString()}`;
    });
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.style.cssText = overlayButtonStyle("#334155");
    closeBtn.addEventListener("click", () => panel.remove());
    actions.append(copyBtn, mailBtn, closeBtn);
    panel.append(title, subject, body, actions);
    document.body.appendChild(panel);
}
function overlayButtonStyle(background = "#2563eb") {
    return [
        "border:0",
        "border-radius:8px",
        `background:${background}`,
        "color:#fff",
        "padding:8px 12px",
        "font:600 12px system-ui,-apple-system,Segoe UI,sans-serif",
        "cursor:pointer"
    ].join(";");
}
function extractPageText() {
    const formText = Array.from(document.querySelectorAll("input, textarea, select, label, button"))
        .map((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            return [
                element.name,
                element.id,
                element.placeholder,
                element.ariaLabel,
                element.value
            ].filter(Boolean).join(" ");
        }
        if (element instanceof HTMLSelectElement) {
            return [element.name, element.id, element.ariaLabel].filter(Boolean).join(" ");
        }
        return element.textContent?.trim() ?? "";
    })
        .filter(Boolean)
        .join("\n");
    const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
    return `${formText}\n\n${bodyText}`.slice(0, MAX_TEXT_LENGTH);
}
async function requestAction(text, settings) {
    const baseUrl = settings.apiBaseUrl;
    const profileId = settings.profileId;
    const url = `${baseUrl}/api/analyze?profileId=${encodeURIComponent(profileId)}`;
    console.debug("AI Browser Agent - requestAction URL:", url);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        if (!response.ok) {
            throw new Error(`Analyze API failed with status ${response.status}`);
        }
        return response.json();
    }
    catch (err) {
        console.error("AI Browser Agent fetch failed for", url, err);
        throw err;
    }
}
function executeAction(action) {
    if (action.type === "fill_form") {
        fillForm(action);
        return;
    }
    if (action.type === "send_email") {
        openMailTo(action);
    }
}
function fillForm(action) {
    for (const [fieldName, value] of Object.entries(action.fields)) {
        const field = findField(fieldName);
        if (!field)
            continue;
        setFormControlValue(field, value);
    }
}
function findField(fieldName) {
    const normalizedName = normalize(fieldName);
    const fields = Array.from(document.querySelectorAll("input, textarea"));
    return fields.find((field) => {
        const candidates = [
            field.name,
            field.id,
            field.placeholder,
            field.ariaLabel,
            getFieldLabel(field)
        ].map(normalize);
        return candidates.some((candidate) => candidate.length > 0 && (candidate.includes(normalizedName) || normalizedName.includes(candidate)));
    }) ?? null;
}
function getFieldLabel(field) {
    if (field.id) {
        const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
        if (label?.textContent)
            return label.textContent;
    }
    return field.closest("label")?.textContent ?? "";
}
function openMailTo(action) {
    const params = new URLSearchParams({
        subject: action.subject,
        body: action.body
    });
    window.location.href = `mailto:${encodeURIComponent(action.to)}?${params.toString()}`;
}
function normalize(value) {
    return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function setButtonState(button, label, disabled) {
    button.textContent = label;
    button.disabled = disabled;
    button.style.opacity = disabled ? "0.75" : "1";
}
window.jobberHopperAutofillProfile = async () => {
    const review = await buildPopupReviewData();
    if (!review.ready) {
        return { filled: 0, skipped: 0, matches: [] };
    }
    const result = applyReviewedAutofill({
        fields: review.fields
            .filter((field) => field.isSafeToFill && field.value.trim().length > 0)
            .map((field) => ({ fieldId: field.fieldId, value: field.value }))
    });
    return { filled: result.filled, skipped: result.skipped, matches: review.fields };
};
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const candidate = message;
    if (candidate.type === "jobber-hopper:get-popup-review") {
        void buildPopupReviewData()
            .then((data) => sendResponse(data))
            .catch((error) => {
            sendResponse({
                pageTitle: document.title,
                pageUrl: window.location.href,
                ready: false,
                fields: [],
                error: error instanceof Error ? error.message : "Failed to inspect page"
            });
        });
        return true;
    }
    if (candidate.type === "jobber-hopper:apply-popup-review") {
        const result = applyReviewedAutofill(candidate.payload ?? { fields: [] });
        if (result.filled > 0) {
            void trackApplicationFill();
            void trackFunnelEvent("autofill_accepted", {
                fieldsFilled: result.filled
            });
        }
        sendResponse(result);
        return;
    }
});
document.addEventListener("submit", () => {
    void trackFunnelEvent("application_submitted", {});
}, true);
injectAssistButton();
injectAutofillButton();
startFormFieldDetection();
