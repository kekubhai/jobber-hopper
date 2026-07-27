"use strict";
const SKIPPED_INPUT_TYPES = new Set([
    "button",
    "submit",
    "reset",
    "image",
    "hidden"
]);
const LOG_PREFIX = "[Jobber Hopper]";
function collapseWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
function humanizeToken(value) {
    const cleaned = value
        .replace(/[_-]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) {
        return "";
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
function getLabelForId(fieldId) {
    if (!fieldId) {
        return "";
    }
    const label = document.querySelector(`label[for="${CSS.escape(fieldId)}"]`);
    return collapseWhitespace(label?.textContent ?? "");
}
function getAriaLabelledByText(element) {
    const labelledBy = element.getAttribute("aria-labelledby");
    if (!labelledBy) {
        return "";
    }
    const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .map(collapseWhitespace)
        .filter(Boolean)
        .join(" ");
    return collapseWhitespace(text);
}
function getWrappedLabelText(element) {
    const label = element.closest("label");
    if (!label) {
        return "";
    }
    const clone = label.cloneNode(true);
    clone.querySelectorAll("input, textarea, select, button").forEach((child) => child.remove());
    return collapseWhitespace(clone.textContent ?? "");
}
function getFieldsetLegendText(element) {
    const fieldset = element.closest("fieldset");
    if (!fieldset) {
        return "";
    }
    const legend = fieldset.querySelector("legend");
    return collapseWhitespace(legend?.textContent ?? "");
}
function getPreviousHeadingOrLabelText(element) {
    let cursor = element.previousElementSibling;
    while (cursor) {
        const tag = cursor.tagName.toLowerCase();
        if (tag === "label" || /^h[1-6]$/.test(tag)) {
            const text = collapseWhitespace(cursor.textContent ?? "");
            if (text) {
                return text;
            }
        }
        if (tag === "div" || tag === "span" || tag === "p") {
            const text = collapseWhitespace(cursor.textContent ?? "");
            if (text.length > 0 && text.length < 200) {
                return text;
            }
        }
        cursor = cursor.previousElementSibling;
    }
    return "";
}
function getContainerPromptText(element) {
    let container = element.parentElement;
    let depth = 0;
    while (container && depth < 4) {
        const legend = getFieldsetLegendText(container);
        if (legend) {
            return legend;
        }
        const labelled = container.getAttribute("aria-label");
        if (labelled) {
            return collapseWhitespace(labelled);
        }
        const role = container.getAttribute("role");
        if (role === "group" || role === "radiogroup") {
            const groupLabel = getAriaLabelledByText(container);
            if (groupLabel) {
                return groupLabel;
            }
        }
        container = container.parentElement;
        depth += 1;
    }
    return "";
}
function guessLabel(field) {
    const candidates = [];
    const platformLabel = typeof enhancePlatformLabel === "function" ? enhancePlatformLabel(field) : "";
    if (platformLabel) {
        candidates.push(platformLabel);
    }
    const forLabel = getLabelForId(field.id);
    if (forLabel) {
        candidates.push(forLabel);
    }
    const ariaLabel = collapseWhitespace(field.getAttribute("aria-label") ?? "");
    if (ariaLabel) {
        candidates.push(ariaLabel);
    }
    const ariaLabelledBy = getAriaLabelledByText(field);
    if (ariaLabelledBy) {
        candidates.push(ariaLabelledBy);
    }
    const wrapped = getWrappedLabelText(field);
    if (wrapped) {
        candidates.push(wrapped);
    }
    const placeholder = collapseWhitespace(field.getAttribute("placeholder") ?? "");
    if (placeholder) {
        candidates.push(placeholder);
    }
    const fieldsetLegend = getFieldsetLegendText(field);
    if (fieldsetLegend) {
        candidates.push(fieldsetLegend);
    }
    const containerPrompt = getContainerPromptText(field);
    if (containerPrompt) {
        candidates.push(containerPrompt);
    }
    const previous = getPreviousHeadingOrLabelText(field);
    if (previous) {
        candidates.push(previous);
    }
    if (field.name) {
        candidates.push(humanizeToken(field.name));
    }
    if (field.id) {
        candidates.push(humanizeToken(field.id));
    }
    const best = candidates.find((value) => value.length > 0);
    return best ?? "";
}
function resolveFieldType(field) {
    if (field instanceof HTMLTextAreaElement) {
        return "textarea";
    }
    if (field instanceof HTMLSelectElement) {
        return "select";
    }
    const inputType = (field.getAttribute("type") ?? "text").toLowerCase();
    return inputType || "text";
}
function buildFieldId(field, index) {
    if (field.id) {
        return field.id;
    }
    if (field.name) {
        return field.name;
    }
    const type = resolveFieldType(field);
    return `jh-${type}-${index}`;
}
function isScanCandidate(field) {
    if (field instanceof HTMLInputElement && SKIPPED_INPUT_TYPES.has(field.type.toLowerCase())) {
        return false;
    }
    if (field.disabled) {
        return false;
    }
    if (field.getAttribute("aria-hidden") === "true") {
        return false;
    }
    if (field instanceof HTMLInputElement && field.type === "hidden") {
        return false;
    }
    return true;
}
function collectFormControls(root) {
    const scanRoot = root ??
        (typeof getPlatformScanRoot === "function" ? getPlatformScanRoot() : document);
    const nodes = scanRoot.querySelectorAll("input, textarea, select");
    return Array.from(nodes).filter((field) => {
        if (!isScanCandidate(field)) {
            return false;
        }
        if (typeof shouldIncludeControlForPlatform === "function" && !shouldIncludeControlForPlatform(field)) {
            return false;
        }
        return true;
    });
}
function scanFormFields(root = document) {
    return scanFormFieldsWithElements(root).map(({ fieldId, labelGuess, type }) => ({
        fieldId,
        labelGuess,
        type
    }));
}
function scanFormFieldsWithElements(root = document) {
    const controls = collectFormControls(root);
    return controls.map((field, index) => ({
        fieldId: buildFieldId(field, index),
        labelGuess: guessLabel(field),
        type: resolveFieldType(field),
        element: field
    }));
}
function logDetectedFormFields(fields, reason) {
    console.group(`${LOG_PREFIX} Form field scan (${reason})`);
    console.log("count:", fields.length);
    console.log(JSON.stringify(fields, null, 2));
    console.table(fields);
    console.groupEnd();
}
function scanAndLogFormFields(reason = "manual") {
    if (typeof onPlatformScanStart === "function") {
        onPlatformScanStart();
    }
    const platform = typeof detectJobPlatform === "function" ? detectJobPlatform() : "generic";
    const fields = scanFormFields();
    logDetectedFormFields(fields, `${reason} [${platform}]`);
    return fields;
}
let scanScheduled = false;
function scheduleFormFieldScan(reason) {
    if (scanScheduled) {
        return;
    }
    scanScheduled = true;
    window.setTimeout(() => {
        scanScheduled = false;
        scanAndLogFormFields(reason);
    }, 500);
}
function startFormFieldDetection() {
    scanAndLogFormFields("initial");
    const observer = new MutationObserver(() => {
        scheduleFormFieldScan("dom-update");
    });
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style", "hidden", "disabled", "aria-hidden"]
        });
    }
    window.addEventListener("jobber-hopper-scan-fields", () => {
        scanAndLogFormFields("event");
    });
}
window.jobberHopperScanFormFields = () => scanAndLogFormFields("window-api");
