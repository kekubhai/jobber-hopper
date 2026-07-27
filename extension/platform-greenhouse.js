"use strict";
/** Greenhouse apply flows: boards.greenhouse.io, embeds, and company-hosted GH forms. */
function isGreenhouseApplicationPage() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("greenhouse.io") || host.endsWith("grnh.se")) {
        return true;
    }
    if (document.querySelector("#application_form, form#application_form, .application--form")) {
        return true;
    }
    if (document.querySelector("script[src*='greenhouse'], iframe[src*='greenhouse']")) {
        return true;
    }
    return false;
}
function getGreenhouseApplyRoot() {
    const selectors = [
        "#application_form",
        "form#application_form",
        ".application--form",
        "#main_fields",
        "form[action*='greenhouse']"
    ];
    for (const selector of selectors) {
        const node = document.querySelector(selector);
        if (node) {
            return node;
        }
    }
    return document;
}
function guessGreenhouseLabel(field) {
    const wrap = field.closest(".field, .question, .demographic_question, .custom-question, [data-field-type]");
    if (!wrap) {
        return "";
    }
    const labelEl = wrap.querySelector("label[for]") ??
        wrap.querySelector("label") ??
        wrap.querySelector(".label") ??
        wrap.querySelector("legend");
    if (!labelEl) {
        return "";
    }
    const clone = labelEl.cloneNode(true);
    clone.querySelectorAll("input, textarea, select, button, .asterisk").forEach((node) => node.remove());
    return collapseWhitespace(clone.textContent ?? "");
}
function isGreenhouseVisibleControl(field) {
    if (!(field instanceof HTMLElement)) {
        return true;
    }
    if (field.getAttribute("aria-hidden") === "true") {
        return false;
    }
    let parent = field;
    while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden") {
            return false;
        }
        if (parent.getAttribute("aria-hidden") === "true") {
            return false;
        }
        if (parent.classList.contains("hidden") || parent.hasAttribute("hidden")) {
            return false;
        }
        parent = parent.parentElement;
    }
    const rects = field.getClientRects();
    return rects.length > 0;
}
function logGreenhouseScanHint() {
    console.info("[Jobber Hopper] Greenhouse: scanning visible step only. After clicking Next, use popup Refresh Review or Fill again.");
}
