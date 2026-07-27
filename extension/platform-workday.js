"use strict";
/** Workday apply flows: multi-step wizard, generated ids, and open shadow roots. */
function isWorkdayApplicationPage() {
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) {
        return path.includes("/job/") || path.includes("/candidate/") || path.includes("/apply");
    }
    return Boolean(document.querySelector("[data-automation-id='jobApplication'], [data-automation-id='jobPostingHeader'], [data-automation-id='applyButton']"));
}
function getWorkdayApplyRoot() {
    const selectors = [
        "[data-automation-id='jobApplication']",
        "[data-automation-id='jobApplicationForm']",
        "[data-automation-id='applicationForm']",
        "main form",
        "form"
    ];
    for (const selector of selectors) {
        const root = document.querySelector(selector);
        if (root) {
            return root;
        }
    }
    return document;
}
function collectOpenShadowRoots(root, roots = []) {
    roots.push(root);
    for (const element of Array.from(root.querySelectorAll("*"))) {
        if (element.shadowRoot) {
            collectOpenShadowRoots(element.shadowRoot, roots);
        }
    }
    return roots;
}
function getWorkdayFormControls() {
    const controls = [];
    const seen = new Set();
    for (const root of collectOpenShadowRoots(getWorkdayApplyRoot())) {
        for (const field of Array.from(root.querySelectorAll("input, textarea, select"))) {
            if (!seen.has(field)) {
                seen.add(field);
                controls.push(field);
            }
        }
    }
    return controls;
}
function getWorkdayText(element) {
    if (!element) {
        return "";
    }
    const clone = element.cloneNode(true);
    clone
        .querySelectorAll("input, textarea, select, button, svg, [aria-hidden='true'], .css-1g0s6h2")
        .forEach((node) => node.remove());
    return collapseWhitespace(clone.textContent ?? "");
}
function getWorkdayAriaLabelledByText(field) {
    const ids = field.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
    const root = field.getRootNode();
    return collapseWhitespace(ids
        .map((id) => root.getElementById(id)?.textContent ?? document.getElementById(id)?.textContent ?? "")
        .join(" "));
}
function guessWorkdayLabel(field) {
    const ariaLabel = collapseWhitespace(field.getAttribute("aria-label") ?? "");
    if (ariaLabel) {
        return ariaLabel;
    }
    const labelledBy = getWorkdayAriaLabelledByText(field);
    if (labelledBy) {
        return labelledBy;
    }
    const root = field.getRootNode();
    if (field.id) {
        const explicit = root.querySelector(`label[for="${CSS.escape(field.id)}"]`);
        const text = getWorkdayText(explicit);
        if (text) {
            return text;
        }
    }
    const container = field.closest("[data-automation-id='formField'], [data-automation-id='question'], [data-automation-id='formFieldContainer'], [role='group'], .WDFormField");
    if (container) {
        const label = container.querySelector("label") ??
            container.querySelector("[data-automation-id='formLabel']") ??
            container.querySelector("[data-automation-id='questionLabel']") ??
            container.querySelector("[data-automation-id='label']");
        const text = getWorkdayText(label);
        if (text) {
            return text;
        }
    }
    const wrapped = field.closest("label");
    const wrappedText = getWorkdayText(wrapped);
    if (wrappedText) {
        return wrappedText;
    }
    return "";
}
function isWorkdayVisibleControl(field) {
    if (field.disabled || field.getAttribute("aria-hidden") === "true") {
        return false;
    }
    let element = field;
    while (element) {
        const style = window.getComputedStyle(element);
        if (element.hidden ||
            element.getAttribute("aria-hidden") === "true" ||
            style.display === "none" ||
            style.visibility === "hidden") {
            return false;
        }
        element = element.parentElement;
    }
    return field.getClientRects().length > 0;
}
function normalizeWorkdayFieldKey(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);
}
/**
 * Workday regenerates DOM `id`s each wizard render. Use the visible semantic
 * label instead; this keeps popup review and cached LLM mappings stable.
 */
function getWorkdayStableFieldId(field, index, labelGuess) {
    const label = normalizeWorkdayFieldKey(labelGuess);
    if (label) {
        return `workday-${resolveFieldType(field)}-${label}`;
    }
    const automationId = field
        .closest("[data-automation-id]")
        ?.getAttribute("data-automation-id");
    if (automationId) {
        return `workday-${resolveFieldType(field)}-${normalizeWorkdayFieldKey(automationId)}`;
    }
    return `workday-${resolveFieldType(field)}-${index}`;
}
function logWorkdayScanHint() {
    console.info("[Jobber Hopper] Workday: scanning the visible wizard step (including open shadow roots). Click Next, then Refresh Review before filling the next step.");
}
