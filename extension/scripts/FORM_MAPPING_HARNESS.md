# Form-Mapping Test Harness

End-to-end smoke test for the LLM that backs the extension's form autofill.
Given a form (URL or local HTML) plus a `MasterProfile`, the harness:

1. Scrapes `DetectedFormField[]` (same shape as `extension/field-detection.ts`).
2. Assembles the system prompt from `form-mapping-prompt.cjs`.
3. Calls an OpenAI-compatible chat-completions endpoint (or the production
   `/api/form-mapping` API) with the form fields, profile, and job context.
4. Parses, validates, and prints (or writes) the resulting mapping array.

## Why

The production `form-mapping-client.ts` only knows about `profileFieldPath` and
`confidence`. The richer LLM contract — `{ fieldId, selector, value, action,
confidence, generated }` with `type | select | check | upload | click` actions —
is a Phase 4 design and the prompt needs to be exercised independently of the
running extension. This harness is the fastest way to iterate on the prompt.

## Files

| File | Purpose |
| --- | --- |
| `form-mapping-prompt.cjs` | The system prompt, exported as a string. |
| `form-mapping-scraper.cjs` | Regex-based HTML scraper -> `DetectedFormField[]`. |
| `form-mapping-harness.cjs` | CLI: arg parsing, fetch, LLM call, validation. |
| `sample-profile.json` | Example `MasterProfile` payload. |
| `sample-form.html` | Synthetic Greenhouse-style form for offline runs. |

## Install

The harness has zero npm dependencies. It runs on Node 18+ (uses the built-in
`fetch`). No `pnpm install` is required to use the harness.

For the LLM call you need one of:

- `--mode direct` (default) with `--api-key $OPENAI_API_KEY` (or set `OPENAI_API_KEY`)
- `--mode api` against the running `JOBBER_HOPPER_API_BASE_URL` (default
  `http://localhost:3000`) with optional `JOBBER_HOPPER_API_KEY`

## Run

Scrape a local HTML file, send it to the LLM, print the result:

```bash
node scripts/form-mapping-harness.cjs \
  --html scripts/sample-form.html \
  --profile scripts/sample-profile.json \
  --platform greenhouse \
  --company "Acme Corp" \
  --job "Senior Frontend Engineer, React/TypeScript, $180k-$220k" \
  --out ./out/mappings.json
```

Scrape a live page:

```bash
node scripts/form-mapping-harness.cjs \
  --url "https://boards.greenhouse.io/<company>/jobs/<id>" \
  --profile scripts/sample-profile.json \
  --platform greenhouse \
  --company "<Company>" \
  --out ./out/mappings.json
```

Skip scraping -- feed pre-built `DetectedFormField[]` (useful for replaying a
captured scan):

```bash
node scripts/form-mapping-harness.cjs \
  --fields ./captured-scan.json \
  --profile scripts/sample-profile.json
```

Dry-run (print the assembled prompt and exit before the LLM call):

```bash
node scripts/form-mapping-harness.cjs \
  --html scripts/sample-form.html \
  --profile scripts/sample-profile.json \
  --dry-run
```

## Output shape

```json
{
  "generatedAt": "2026-04-29T12:00:00.000Z",
  "url": null,
  "platform": "greenhouse",
  "scrapedFieldCount": 19,
  "mappingCount": 17,
  "validationIssues": [],
  "mappings": [
    { "fieldId": "first_name", "selector": "#first_name", "value": "Avery",     "action": "type",   "confidence": 0.98, "generated": false },
    { "fieldId": "email",      "selector": "#email",      "value": "avery.okafor@example.com", "action": "type", "confidence": 0.99, "generated": false },
    { "fieldId": "q_why",      "selector": "#q_why",      "value": "Your team's recent writeup on...", "action": "type", "confidence": 0.86, "generated": true }
  ]
}
```

Exit code is `3` if any mapping failed validation (caller can branch on it in
CI).

## Caveats

- The scraper is regex-based and will miss form fields rendered by client-side
  JS after the initial HTML. For Workday/iCIMS use a headless scraper
  (Playwright/Puppeteer) and pass the result with `--fields`. The production
  extension handles this because it runs in a real browser with `MutationObserver`.
- File inputs are always returned as `action: "upload"` with the user-profile
  key (e.g. `"resume"`) in `value`. The actual file is attached by the caller
  (extension or downstream test).
- The prompt intentionally nudges the LLM toward conservative confidence
  scores; tune `--max-retries` and inspect `validationIssues` to find weak
  spots.
