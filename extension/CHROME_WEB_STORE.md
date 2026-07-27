# Chrome Web Store submission (Jobber Hopper)

Start this checklist early — review often takes several days.

## Before you upload

1. **Deploy the web app** (Vercel or similar) with production env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
   - `OPENROUTER_SITE_URL` (your public dashboard URL)
2. **Apply Supabase migrations** in `web/supabase/migrations/` (including form mapping cache + extension pairing).
3. **Enable Supabase Auth** (email/password) and confirm email templates if required.
4. **Update `extension/manifest.json` `host_permissions`** to include your production API origin, e.g. `https://your-app.vercel.app/*` (MV3 requires explicit hosts for `fetch` from the extension).
5. **Icons** — add `extension/icons/icon16.png`, `icon48.png`, `icon128.png` and reference them in `manifest.json` (`action.default_icon`, `icons`).
6. **Zip the `extension/` folder** after `pnpm --dir extension build` (include `.js`, `manifest.json`, `popup.html`, icons; exclude `node_modules`, `*.ts`, `scripts`).

## Store listing copy (draft)

- **Name:** Jobber Hopper
- **Summary:** Review and fill job applications from one master profile.
- **Category:** Productivity
- **Privacy policy:** Host a page on your dashboard (e.g. `/privacy`) describing profile data, Supabase storage, optional OpenRouter field-label mapping, and that forms are never auto-submitted.

## Permissions justification

| Permission | Why |
|------------|-----|
| `storage` | API base URL, profile id, auth tokens after dashboard pairing |
| `activeTab` | Inspect the active tab’s form fields for review |
| `host_permissions` | Load/sync profile and form-mapping API on your backend only |

## Review tips

- Demo video: sign in → save profile → generate pairing code → extension link → Greenhouse apply page → Refresh Review → Fill.
- State clearly: user must click fill; no automated submission.
- Single purpose: job application autofill assistant.

## Versioning

Bump `manifest.json` `version` for each store upload (semver).
