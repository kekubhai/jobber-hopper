const LAST_JOB_POST_STORAGE_KEY = "jobber-hopper:last-job-post";
const SOCIAL_POST_MAX_LENGTH = 8000;
const LINKEDIN_POST_CONTAINER_SELECTORS = [
    '[data-view-name="feed-full-update"]',
    "div.feed-shared-update-v2",
    'div[data-urn^="urn:li:activity:"]',
    'div[data-id^="urn:li:activity:"]',
    'div[data-urn^="urn:li:aggregatedShare:"]'
];
const LINKEDIN_TEXT_SELECTORS = [
    '[data-testid="expandable-text-box"]',
    '[componentkey^="feed-commentary"]',
    ".update-components-text",
    ".feed-shared-update-v2__commentary",
    ".feed-shared-inline-show-more-text",
    ".feed-shared-text-view",
    ".feed-shared-text",
    ".feed-shared-update-v2__description"
];
const TWITTER_TEXT_SELECTORS = ['[data-testid="tweetText"]'];
function detectSocialJobPlatform(url = window.location.href) {
    try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
            return "linkedin";
        }
        if (host === "twitter.com" || host === "x.com" || host.endsWith(".x.com")) {
            return "twitter";
        }
    }
    catch {
        return null;
    }
    return null;
}
function scrapeSocialPostBody() {
    const platform = detectSocialJobPlatform();
    if (!platform) {
        return Promise.resolve(null);
    }
    const root = pickSocialPostRoot(platform);
    if (!root) {
        return Promise.resolve(null);
    }
    const expanded = expandTruncatedSocialPost(root);
    const wait = expanded
        ? new Promise((resolve) => window.setTimeout(resolve, 200))
        : Promise.resolve();
    return wait.then(() => {
        const text = platform === "linkedin"
            ? extractLinkedInPostText(root)
            : normalizePostText(root.textContent ?? "");
        if (text.length < 12) {
            return null;
        }
        return {
            platform,
            postBody: text.slice(0, SOCIAL_POST_MAX_LENGTH)
        };
    });
}
function pickSocialPostRoot(platform) {
    if (platform === "linkedin") {
        return pickLinkedInPostRoot();
    }
    const nodes = TWITTER_TEXT_SELECTORS.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    if (nodes.length === 0) {
        return null;
    }
    const singlePost = isSingleSocialPostUrl(platform, window.location.href);
    if (singlePost) {
        return nodes[0] ?? null;
    }
    return pickBestVisibleElement(nodes);
}
function pickLinkedInPostRoot() {
    const containers = findLinkedInPostContainers();
    if (containers.length > 0) {
        const bestContainer = pickBestVisibleElement(containers);
        if (bestContainer) {
            const textEl = findLinkedInTextElement(bestContainer);
            if (textEl) {
                return textEl;
            }
            return bestContainer;
        }
    }
    const legacyNodes = LINKEDIN_TEXT_SELECTORS.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    if (legacyNodes.length > 0) {
        return pickBestVisibleElement(legacyNodes);
    }
    return null;
}
function findLinkedInPostContainers() {
    const seen = new Set();
    const containers = [];
    for (const selector of LINKEDIN_POST_CONTAINER_SELECTORS) {
        for (const el of document.querySelectorAll(selector)) {
            if (seen.has(el)) {
                continue;
            }
            if (!isLikelyLinkedInPostContainer(el)) {
                continue;
            }
            seen.add(el);
            containers.push(el);
        }
    }
    return dedupeNestedContainers(containers);
}
function dedupeNestedContainers(containers) {
    return containers.filter((candidate) => !containers.some((other) => other !== candidate && other.contains(candidate)));
}
function isLikelyLinkedInPostContainer(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 40) {
        return false;
    }
    const haystack = (el.className?.toString() ?? "").toLowerCase();
    if (haystack.includes("comment") && !haystack.includes("commentary")) {
        return false;
    }
    const text = extractLinkedInPostText(el);
    return text.length >= 8;
}
function findLinkedInTextElement(container) {
    for (const selector of LINKEDIN_TEXT_SELECTORS) {
        const match = container.querySelector(selector);
        if (match && normalizePostText(match.textContent ?? "").length >= 8) {
            return match;
        }
    }
    return longestLtrTextElement(container);
}
function extractLinkedInPostText(container) {
    const textEl = findLinkedInTextElement(container);
    if (textEl) {
        return normalizePostText(collectVisibleText(textEl));
    }
    return normalizePostText(collectVisibleText(container));
}
function longestLtrTextElement(container) {
    let best = null;
    let bestLen = 0;
    for (const candidate of container.querySelectorAll('[dir="ltr"], span[lang]')) {
        const len = normalizePostText(candidate.textContent ?? "").length;
        if (len > bestLen) {
            best = candidate;
            bestLen = len;
        }
    }
    return bestLen >= 12 ? best : null;
}
function collectVisibleText(element) {
    const clone = element.cloneNode(true);
    for (const hidden of clone.querySelectorAll('[aria-hidden="true"], .visually-hidden, .screen-reader-text')) {
        hidden.remove();
    }
    return clone.textContent ?? "";
}
function pickBestVisibleElement(nodes) {
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const node of nodes) {
        const score = socialPostVisibilityScore(node);
        if (score > bestScore) {
            best = node;
            bestScore = score;
        }
    }
    return bestScore >= 0 ? best : nodes[0] ?? null;
}
function isSingleSocialPostUrl(platform, url) {
    try {
        const path = new URL(url).pathname.toLowerCase();
        if (platform === "linkedin") {
            return /\/(?:feed\/update|posts|activity)\//.test(path);
        }
        return /\/status\/\d+/.test(path);
    }
    catch {
        return false;
    }
}
function socialPostVisibilityScore(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) {
        return Number.NEGATIVE_INFINITY;
    }
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    if (visibleHeight <= 0 || visibleWidth <= 0) {
        return -1;
    }
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(centerX - viewportWidth / 2, centerY - viewportHeight / 2);
    const lengthBonus = Math.min(normalizePostText(element.textContent ?? "").length, 400);
    return visibleHeight * visibleWidth + lengthBonus - distance;
}
function expandTruncatedSocialPost(root) {
    let clicked = false;
    const scope = root.closest('[data-view-name="feed-full-update"], div.feed-shared-update-v2, [data-urn^="urn:li:activity:"]') ?? root;
    const controls = scope.querySelectorAll('button, [role="button"], .see-more, [data-testid="expandable-text-button"]');
    for (const control of controls) {
        const label = (control.textContent ?? "").replace(/\s+/g, " ").trim();
        const aria = (control.getAttribute("aria-label") ?? "").replace(/\s+/g, " ").trim();
        const combined = `${label} ${aria}`.trim();
        if (/^(see more|show more|…more|\.\.\.more|more)$/i.test(label) ||
            /see more|show more|expand/i.test(combined)) {
            if (control instanceof HTMLElement) {
                control.click();
                clicked = true;
            }
        }
    }
    return clicked;
}
function normalizePostText(value) {
    return value.replace(/\s+/g, " ").trim();
}
async function persistLastJobPost(extraction, platform, match = null, email = null) {
    window.jobberHopperLastJobPost = extraction;
    window.jobberHopperLastJobPostMatch = match;
    window.jobberHopperLastJobPostEmail = email;
    try {
        await chrome.storage.local.set({
            [LAST_JOB_POST_STORAGE_KEY]: {
                platform,
                pageUrl: window.location.href,
                extractedAt: Date.now(),
                extraction,
                match,
                email
            }
        });
    }
    catch {
        // Storage is optional — the in-page handle is enough for the next pipeline step.
    }
}
window.jobberHopperScrapeSocialPost = () => scrapeSocialPostBody();
