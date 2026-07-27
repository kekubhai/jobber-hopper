# AI Browser Agent Extension

## Build

```bash
pnpm install
pnpm --dir extension build
```

The build emits:

```txt
background.js
content.js
field-detection.js
popup.js
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension` folder
5. Start the web app at `http://localhost:3000`
6. Save your master profile once in the dashboard (Phase 1 requirement)
7. Open a job form or email request page
8. Click the floating `AI Assist` button

If no ready profile exists in Supabase, analyze requests are blocked until the profile is saved.

## Phase 2 — Field detection

On any page with form controls, the content script logs a JSON list of detected fields:

```json
[
  { "fieldId": "email", "labelGuess": "Email address", "type": "email" },
  { "fieldId": "jh-text-3", "labelGuess": "Why do you want this role?", "type": "textarea" }
]
```

- Runs once on load, again after DOM updates (debounced), and when you click **AI Assist**
- Open DevTools → Console and filter for `Jobber Hopper`
- Re-run manually: `window.jobberHopperScanFormFields()` in the page console

Try a few Google Forms and confirm labels look reasonable before Phase 3 matching.

## Phase 3 — Rule-based autofill

1. Save a **ready** master profile at `http://localhost:3000` (first name, last name, email required).
2. Run `pnpm dev:web` so `GET /api/profile` is available to the extension.
3. Open a Google Form, reload the extension, click **Fill profile** (above **AI Assist**).
4. DevTools → Console: `[Jobber Hopper] Rule-based autofill` table shows `labelGuess` → `profileFieldPath` → `value`.
5. Re-run without clicking: `await window.jobberHopperAutofillProfile()`

Matching lives in `shared/profile-match.ts` (synced into the extension on build). Values are written with the native `value` setter plus `input` / `change` / `blur` events so React-controlled fields update.

## Phase 5 — Platform coverage (ongoing)

**Order:** Greenhouse first, then Workday, then Lever. Finish one host before starting the next.

### Greenhouse (implemented)

Detected on `*.greenhouse.io`, `grnh.se`, and embedded `#application_form` / `.application--form`.

- Scans only the **apply form root** (not the whole careers site chrome).
- Reads labels from Greenhouse `.field` / `.question` wrappers.
- **Visible step only** — fields on hidden multi-step sections are skipped until you click **Next** and **Refresh Review** in the popup.
- Native ids like `first_name`, `last_name`, and `email` map to your profile.

**Workflow on multi-step Greenhouse applications**

1. Open the apply form → extension popup → **Refresh Review** → edit values → **Fill Reviewed Fields**.
2. Click Greenhouse **Next** for the next section.
3. Popup → **Refresh Review** again → fill that step. Never auto-submit.

Workday and Lever: not implemented yet (placeholders in `shared/platforms.ts`).

## Phase 6 — LLM field mapping (labels only)

When rule-based confidence is below **0.75** (or a field has no match), the extension POSTs **field ids + labels + types** to `POST /api/form-mapping` — no DOM HTML.

- Cache key: `domain` + SHA-256 hash of the canonical field list (`form_field_mapping_cache` in Supabase).
- First visit to a unique form may call OpenRouter; repeat visits use the cache.
- Requires a ready master profile (same as autofill).

## Phase 7 — Auth, sync, Chrome Web Store

1. Sign in on the dashboard (Supabase email/password).
2. Click **Generate extension code**, enter the 6-character code in the extension popup **Link** field.
3. Extension stores your session and uses `profileId = your user id` for `/api/profile` and form mapping.

Local dev without sign-in still uses `local-dev-user` when no bearer token is set.

See `CHROME_WEB_STORE.md` for packaging and review checklist.
