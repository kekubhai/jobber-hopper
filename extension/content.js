"use strict";
const API_BASE_URL = "http://localhost:3000";
const BUTTON_ID = "ai-browser-agent-assist";
const MAX_TEXT_LENGTH = 3000;
function injectAssistButton() {
    if (document.getElementById(BUTTON_ID) || !document.body)
        return;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "AI Assist";
    button.style.cssText = [
        "position:fixed",
        "right:20px",
        "bottom:20px",
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
    button.addEventListener("click", () => {
        void analyzeCurrentPage(button);
    });
    document.body.appendChild(button);
}
async function analyzeCurrentPage(button) {
    setButtonState(button, "Thinking...", true);
    try {
        const text = extractPageText();
        const action = await requestAction(text);
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
async function requestAction(text) {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });
    if (!response.ok) {
        throw new Error(`Analyze API failed with status ${response.status}`);
    }
    return response.json();
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
        field.focus();
        field.value = value;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
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
injectAssistButton();
