"use strict";

/**
 * Lightweight HTML scraper that mirrors the output shape of
 * extension/field-detection.ts:scanFormFields() -- a DetectedFormField[] of
 *   { fieldId, labelGuess, type }
 *
 * This is intentionally a regex-based parser (no jsdom, no DOM lib) so the
 * test harness can run with only Node 18+'s built-in fetch. It handles the
 * common cases the production scanner handles:
 *
 *   - <input>, <select>, <textarea> discovery
 *   - id / name / type / aria-label / placeholder / className extraction
 *   - <label for="id"> text lookup
 *   - aria-labelledby text aggregation
 *   - <label> wrapping the control
 *   - <legend> for a wrapping <fieldset>
 *   - previous-heading-or-label text near the control
 *   - skip hidden/button/submit/reset types
 *
 * For green DOM-rendered forms (Workday, iCIMS), use a headless scraper
 * (Playwright/Puppeteer) instead. This scraper is best-effort.
 */

const SKIPPED_INPUT_TYPES = new Set([
  "button",
  "submit",
  "reset",
  "image",
  "hidden",
  "file" // file inputs are surfaced separately; the harness handles uploads
]);

const CONTROL_RE = /<(input|select|textarea)([^>]*)>/gi;
const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g;

function parseAttrs(tagInner) {
  const attrs = {};
  let match;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(tagInner)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[key] = value;
  }
  return attrs;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, "");
}

function collapseWhitespace(value) {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return collapseWhitespace(value.replace(/<[^>]+>/g, " "));
}

function getLabelForId(html, id) {
  if (!id) return "";
  // <label for="id"> ... </label>  -- non-greedy, allow nested but stop at first </label>
  const re = new RegExp(
    `<label[^>]*\\bfor\\s*=\\s*(?:"${escapeRegex(id)}"|'${escapeRegex(id)}')[^>]*>([\\s\\S]*?)</label>`,
    "i"
  );
  const m = html.match(re);
  return m ? stripTags(m[1]) : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAriaLabelledByText(html, labelledBy) {
  if (!labelledBy) return "";
  const parts = labelledBy
    .split(/\s+/)
    .map((id) => {
      const re = new RegExp(
        `<[^>]+\\bid\\s*=\\s*(?:"${escapeRegex(id)}"|'${escapeRegex(id)}')[^>]*>([\\s\\S]*?)</[^>]+>`,
        "i"
      );
      const m = html.match(re);
      return m ? stripTags(m[1]) : "";
    })
    .filter(Boolean);
  return parts.join(" ");
}

function getWrappedLabelText(html, tagStart) {
  // Find the enclosing <label>...</label> by searching backward from tagStart
  const before = html.slice(0, tagStart);
  const openIdx = before.lastIndexOf("<label");
  if (openIdx === -1) return "";
  const closeIdx = html.indexOf("</label>", openIdx);
  if (closeIdx === -1 || closeIdx < tagStart) return "";
  const labelHtml = html.slice(openIdx, closeIdx);
  // Strip nested controls
  const cleaned = labelHtml.replace(/<(input|textarea|select|button)[^>]*>[\s\S]*?<\/\1>|<(input|textarea|select|button)[^>]*\/?>/gi, " ");
  return stripTags(cleaned);
}

function getFieldsetLegendText(html, tagStart) {
  const before = html.slice(0, tagStart);
  const openFieldset = before.lastIndexOf("<fieldset");
  if (openFieldset === -1) return "";
  const openLegend = html.indexOf("<legend", openFieldset);
  const closeFieldset = html.indexOf("</fieldset>", openFieldset);
  if (openLegend === -1 || openLegend > closeFieldset) return "";
  const closeLegend = html.indexOf("</legend>", openLegend);
  if (closeLegend === -1) return "";
  return stripTags(html.slice(openLegend, closeLegend));
}

function getPreviousHeadingOrLabelText(html, tagStart) {
  // Walk backwards looking for a label/heading/div/span/p sibling text block.
  const before = html.slice(0, tagStart);
  // The closest enclosing tag's prior siblings live in the chunk just before
  // the most recent <div ...> or <section ...> open. Easier heuristic: find
  // the nearest preceding </h1|</h2|</h3|</h4|</h5|</h6|</label|</p|</div|</span
  const candidates = [
    ...before.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    ...before.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi),
    ...before.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
  ];
  if (candidates.length === 0) return "";
  const last = candidates[candidates.length - 1];
  const text = stripTags(last[1]);
  if (text.length === 0 || text.length > 200) return "";
  return text;
}

function guessLabel(html, tagStart, attrs) {
  const candidates = [
    getLabelForId(html, attrs.id),
    collapseWhitespace(attrs["aria-label"] || ""),
    getAriaLabelledByText(html, attrs["aria-labelledby"] || ""),
    getWrappedLabelText(html, tagStart),
    collapseWhitespace(attrs.placeholder || ""),
    getFieldsetLegendText(html, tagStart),
    getPreviousHeadingOrLabelText(html, tagStart),
    humanizeToken(attrs.name || ""),
    humanizeToken(attrs.id || ""),
    collapseWhitespace(attrs["data-qa"] || attrs["data-test"] || attrs["data-field"] || "")
  ];
  for (const value of candidates) {
    if (value && value.length > 0) return value;
  }
  return "";
}

function humanizeToken(value) {
  if (!value) return "";
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function resolveFieldType(tagName, attrs) {
  if (tagName === "textarea") return "textarea";
  if (tagName === "select") return "select";
  const t = (attrs.type || "text").toLowerCase();
  return t || "text";
}

function buildFieldId(tagName, attrs, index, type) {
  if (attrs.id) return attrs.id;
  if (attrs.name) return attrs.name;
  return `jh-${type}-${index}`;
}

function isScanCandidate(tagName, attrs) {
  if (tagName === "input" && SKIPPED_INPUT_TYPES.has((attrs.type || "").toLowerCase())) {
    return false;
  }
  if (attrs.disabled !== undefined) return false;
  if (attrs["aria-hidden"] === "true") return false;
  return true;
}

/**
 * Scrape a raw HTML string and return DetectedFormField[] in the same shape
 * the production content script emits.
 *
 * @param {string} html
 * @returns {Array<{fieldId: string, labelGuess: string, type: string}>}
 */
function scrapeHtml(html) {
  const found = [];
  let match;
  CONTROL_RE.lastIndex = 0;
  while ((match = CONTROL_RE.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const tagInner = match[2];
    const tagStart = match.index;
    const attrs = parseAttrs(tagInner);

    if (!isScanCandidate(tagName, attrs)) continue;

    const type = resolveFieldType(tagName, attrs);
    const index = found.length;
    const fieldId = buildFieldId(tagName, attrs, index, type);
    const labelGuess = guessLabel(html, tagStart, attrs);

    found.push({ fieldId, labelGuess, type });
  }

  // Disambiguate duplicates (same as field-detection.ts)
  const occurrences = new Map();
  return found.map((field) => {
    const n = (occurrences.get(field.fieldId) ?? 0) + 1;
    occurrences.set(field.fieldId, n);
    return n === 1 ? field : { ...field, fieldId: `${field.fieldId}-${n}` };
  });
}

module.exports = { scrapeHtml, SKIPPED_INPUT_TYPES };
