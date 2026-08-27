const LAST_JOB_POST_STORAGE_KEY = "jobber-hopper:last-job-post";
const SOCIAL_POST_MAX_LENGTH = 8000;

const LINKEDIN_TEXT_SELECTORS = [
  ".feed-shared-text",
  ".feed-shared-update-v2__description"
];

const TWITTER_TEXT_SELECTORS = ['[data-testid="tweetText"]'];

function detectSocialJobPlatform(url = window.location.href): SocialJobPlatform | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
      return "linkedin";
    }
    if (host === "twitter.com" || host === "x.com" || host.endsWith(".x.com")) {
      return "twitter";
    }
  } catch {
    return null;
  }

  return null;
}

async function scrapeSocialPostBody(): Promise<ScrapedSocialPost | null> {
  const platform = detectSocialJobPlatform();
  if (!platform) {
    return null;
  }

  const root = pickSocialPostRoot(platform);
  if (!root) {
    return null;
  }

  const expanded = expandTruncatedSocialPost(root);
  if (expanded) {
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }

  const text = normalizePostText(root.textContent ?? "");
  if (text.length < 12) {
    return null;
  }

  return {
    platform,
    postBody: text.slice(0, SOCIAL_POST_MAX_LENGTH)
  };
}

function pickSocialPostRoot(platform: SocialJobPlatform): Element | null {
  const selectors = platform === "linkedin" ? LINKEDIN_TEXT_SELECTORS : TWITTER_TEXT_SELECTORS;
  const nodes = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  if (nodes.length === 0) {
    return null;
  }

  const singlePost = isSingleSocialPostUrl(platform, window.location.href);
  if (singlePost) {
    return nodes[0] ?? null;
  }

  let best: Element | null = null;
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

function isSingleSocialPostUrl(platform: SocialJobPlatform, url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (platform === "linkedin") {
      return /\/(?:feed\/update|posts|activity)\//.test(path);
    }
    return /\/status\/\d+/.test(path);
  } catch {
    return false;
  }
}

function socialPostVisibilityScore(element: Element): number {
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

function expandTruncatedSocialPost(root: Element): boolean {
  let clicked = false;
  const controls = root.querySelectorAll("button, [role='button'], .see-more");
  for (const control of controls) {
    const label = (control.textContent ?? "").replace(/\s+/g, " ").trim();
    if (/^(see more|show more|…more|\.\.\.more)$/i.test(label) || /see more|show more/i.test(label)) {
      if (control instanceof HTMLElement) {
        control.click();
        clicked = true;
      }
    }
  }
  return clicked;
}

function normalizePostText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function persistLastJobPost(
  extraction: JobPostExtraction,
  platform: SocialJobPlatform,
  match: JobPostMatchGuidance | null = null
): Promise<void> {
  window.jobberHopperLastJobPost = extraction;
  window.jobberHopperLastJobPostMatch = match;
  try {
    await chrome.storage.local.set({
      [LAST_JOB_POST_STORAGE_KEY]: {
        platform,
        pageUrl: window.location.href,
        extractedAt: Date.now(),
        extraction,
        match
      }
    });
  } catch {
    // Storage is optional — the in-page handle is enough for the next pipeline step.
  }
}

window.jobberHopperScrapeSocialPost = () => scrapeSocialPostBody();
