const BUTTON_ID = "ai-browser-agent-assist";
const AUTOFILL_BUTTON_ID = "jobber-hopper-autofill";
const MAX_TEXT_LENGTH = 3000;
const CONTENT_LOG_PREFIX = "[Jobber Hopper]";
const FUNNEL_SESSION_ID =
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `jh-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function injectAssistButton(): void {
  if (document.getElementById(BUTTON_ID) || !document.body) return;

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

function injectAutofillButton(): void {
  if (document.getElementById(AUTOFILL_BUTTON_ID) || !document.body) return;

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

function floatingButtonStyle(bottomOffset: string): string {
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

async function runRuleBasedAutofill(button: HTMLButtonElement): Promise<void> {
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
  } catch (error) {
    console.error(`${CONTENT_LOG_PREFIX} Autofill failed`, error);
    setButtonState(button, "Error", false);
  } finally {
    window.setTimeout(() => setButtonState(button, "Fill profile", false), 2000);
  }
}

async function fetchMasterProfile(settings: ExtensionSettings): Promise<MasterProfilePayload | null> {
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

  const data = await response.json() as {
    exists: boolean;
    ready: boolean;
    profile: MasterProfilePayload;
  };

  if (!data.exists || !data.ready) {
    return null;
  }

  return data.profile;
}

function applicationText(selector: string): string {
  return (document.querySelector(selector)?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
}

function contentMeta(nameOrProperty: string): string {
  const meta = document.querySelector<HTMLMetaElement>(
    `meta[name="${CSS.escape(nameOrProperty)}"], meta[property="${CSS.escape(nameOrProperty)}"]`
  );
  return meta?.content.replace(/\s+/g, " ").trim().slice(0, 300) ?? "";
}

function getApplicationTrackingMetadata(): {
  jobUrl: string;
  domain: string;
  platform: string;
  company: string;
  role: string;
} | null {
  const platform = typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
  const path = window.location.pathname.toLowerCase();
  const likelyApplication =
    platform !== "generic" || /\/(?:job|jobs|career|careers|apply|application)(?:\/|$)/.test(path);
  if (!likelyApplication) {
    return null;
  }

  const role =
    applicationText(
      "[data-automation-id='jobPostingTitle'], [data-automation-id='jobTitle'], .app-title, h1"
    ) || contentMeta("og:title") || document.title;
  const company =
    applicationText(
      "[data-automation-id='company'], [data-automation-id='companyName'], .company-name"
    ) || contentMeta("og:site_name");

  return {
    jobUrl: window.location.href,
    domain: window.location.hostname.toLowerCase(),
    platform,
    company,
    role
  };
}

async function trackApplicationFill(): Promise<void> {
  const metadata = getApplicationTrackingMetadata();
  if (!metadata) {
    return;
  }

  try {
    const settings = await getExtensionSettings();
    const headers: Record<string, string> = {
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
  } catch (error) {
    // Tracking must never block or undo a user-approved fill.
    console.warn(`${CONTENT_LOG_PREFIX} Application tracking skipped`, error);
  }
}

function trackFormDetected(fields: DetectedFormField[]): void {
  void trackFunnelEvent("form_detected", {
    fieldsDetected: fields.length
  });
}

async function trackFunnelEvent(
  eventName: "form_detected" | "fields_reviewed" | "autofill_accepted" | "application_submitted",
  counts: {
    fieldsDetected?: number;
    fieldsMatched?: number;
    fieldsSafe?: number;
    fieldsFilled?: number;
  }
): Promise<void> {
  const metadata = getApplicationTrackingMetadata();
  if (!metadata) {
    return;
  }

  try {
    const settings = await getExtensionSettings();
    const response = await fetch(
      `${settings.apiBaseUrl}/api/analytics/events?profileId=${encodeURIComponent(settings.profileId)}`,
      {
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
      }
    );

    if (!response.ok) {
      throw new Error(`Funnel tracker responded ${response.status}`);
    }
  } catch (error) {
    // Observability must never interrupt a user-facing fill or form review.
    console.warn(`${CONTENT_LOG_PREFIX} Funnel tracking skipped`, error);
  }
}

function estimateConfidence(field: {
  labelGuess: string;
  fieldId: string;
  type: string;
  profileFieldPath: string | null;
  value: string | null;
}): number {
  if (!field.profileFieldPath || !field.value) {
    return 0;
  }

  const haystack = buildMatchHaystack(field.labelGuess, field.fieldId);

  if (
    /\bemail\b/.test(haystack) ||
    /\bfirst name\b/.test(haystack) ||
    /\blast name\b/.test(haystack) ||
    /\bphone\b/.test(haystack) ||
    /\blinkedin\b/.test(haystack)
  ) {
    return 0.96;
  }

  if (
    /\bfull name\b/.test(haystack) ||
    /\byour name\b/.test(haystack) ||
    /\baddress\b/.test(haystack) ||
    /\bcity\b/.test(haystack) ||
    /\bcountry\b/.test(haystack)
  ) {
    return 0.82;
  }

  if (field.type === "textarea") {
    return 0.72;
  }

  return 0.68;
}

function reviewConfidence(match: {
  labelGuess: string;
  fieldId: string;
  type: string;
  profileFieldPath: string | null;
  value: string | null;
  mappingSource?: "rule" | "llm";
  mappingConfidence?: number;
}): number {
  if (match.mappingSource === "llm" && typeof match.mappingConfidence === "number") {
    return match.mappingConfidence;
  }

  return estimateConfidence(match);
}

function getManualReviewReason(match: {
  profileFieldPath: string | null;
  value: string | null;
  confidence: number;
}): string | null {
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

async function buildPopupReviewData(): Promise<PopupReviewResponse> {
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
    mappingSource: "rule" as const
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

function applyReviewedAutofill(request: PopupFillRequest): AutofillRunResult {
  const fieldMap = new Map(
    scanFormFieldsWithElements().map((field) => [field.fieldId, field.element] as const)
  );

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
    } else {
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

async function analyzeCurrentPage(button: HTMLButtonElement): Promise<void> {
  setButtonState(button, "Thinking...", true);

  try {
    if (typeof window.jobberHopperScanFormFields === "function") {
      window.jobberHopperScanFormFields();
    }

    const text = extractPageText();
    const settings = await getExtensionSettings();
    const action = await requestAction(text, settings);
    executeAction(action);
    setButtonState(button, "Done", false);
  } catch (error) {
    console.error("AI Browser Agent failed", error);
    setButtonState(button, "Error", false);
  } finally {
    window.setTimeout(() => setButtonState(button, "AI Assist", false), 1800);
  }
}

function extractPageText(): string {
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

async function requestAction(text: string, settings: ExtensionSettings): Promise<ActionResponse> {
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

    return response.json() as Promise<ActionResponse>;
  } catch (err) {
    console.error("AI Browser Agent fetch failed for", url, err);
    throw err;
  }
}

function executeAction(action: ActionResponse): void {
  if (action.type === "fill_form") {
    fillForm(action);
    return;
  }

  if (action.type === "send_email") {
    openMailTo(action);
  }
}

function fillForm(action: FillFormAction): void {
  for (const [fieldName, value] of Object.entries(action.fields)) {
    const field = findField(fieldName);
    if (!field) continue;

    setFormControlValue(field, value);
  }
}

function findField(fieldName: string): HTMLInputElement | HTMLTextAreaElement | null {
  const normalizedName = normalize(fieldName);
  const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));

  return fields.find((field) => {
    const candidates = [
      field.name,
      field.id,
      field.placeholder,
      field.ariaLabel,
      getFieldLabel(field)
    ].map(normalize);

    return candidates.some((candidate) =>
      candidate.length > 0 && (candidate.includes(normalizedName) || normalizedName.includes(candidate))
    );
  }) ?? null;
}

function getFieldLabel(field: HTMLInputElement | HTMLTextAreaElement): string {
  if (field.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(field.id)}"]`);
    if (label?.textContent) return label.textContent;
  }

  return field.closest("label")?.textContent ?? "";
}

function openMailTo(action: SendEmailAction): void {
  const params = new URLSearchParams({
    subject: action.subject,
    body: action.body
  });

  window.location.href = `mailto:${encodeURIComponent(action.to)}?${params.toString()}`;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function setButtonState(button: HTMLButtonElement, label: string, disabled: boolean): void {
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
  const candidate = message as { type?: string; payload?: PopupFillRequest };

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
        } satisfies PopupReviewResponse);
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

document.addEventListener(
  "submit",
  () => {
    void trackFunnelEvent("application_submitted", {});
  },
  true
);

injectAssistButton();
injectAutofillButton();
startFormFieldDetection();
