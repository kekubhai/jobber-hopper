# Jobber Hopper Web

Phase 0 and Phase 1 focus on a single profile source of truth. The extension cannot run autofill actions until a master profile exists and is ready.

## 1. Environment

Copy [web/.env.example](web/.env.example) to [web/.env.local](web/.env.local) and fill values.

**Important:** Next.js only loads env from the `web/` folder (`web/.env.local`), not the repo root. After changing env, restart `pnpm dev:web`.

```bash
OPENROUTER_API_KEY=sk-or-your-key
OPENROUTER_MODEL=openai/gpt-4o-mini

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

DEFAULT_PROFILE_ID=local-dev-user
```

## 2. Supabase Schema

In Supabase SQL editor, run [web/supabase/schema.sql](web/supabase/schema.sql).

This creates **`master_profiles`** — one row per profile key (e.g. `local-dev-user`). All dashboard form data is stored in JSON on that row:

| Column | Contents |
|--------|----------|
| `personal` | name, email, phone, links, summary, … |
| `address` | street, city, region, postal, country |
| `education` | array of school/degree entries |
| `work_history` | array of jobs |
| `custom_qa_pairs` | array of question/answer pairs |

The web app and extension read and write **only** this table for autofill data. There are no separate education/work/Q&A tables.

### Why `user_profiles` and `master_profiles`?

| Table | Role |
|-------|------|
| **`master_profiles`** | **Application / autofill data** — everything you fill on the dashboard so forms can be filled. This is the source of truth for Phase 1–3. |
| **`user_profiles`** | **Login account shell** — one row per Supabase Auth user (email, display name, avatar). Created when someone signs up. Optional link `master_profile_id` → which master row is theirs. |

They are split on purpose:

- **Auth** (`auth.users` + `user_profiles`) = who signed in.
- **Master profile** = what to put on job applications (large, nested, versioned as JSON).

Phase 1 uses a fixed `profile_id` (`local-dev-user`) and the service role — no login required. When you turn on auth, you tie `master_profiles.user_id` (or `user_profiles.master_profile_id`) so each logged-in user gets their own master row.

Migration `create_user_profiles` (see [web/supabase/migrations/](web/supabase/migrations/)) adds `user_profiles`, optional `master_profiles.user_id`, RLS, and the signup trigger.

## 3. Run App

From repo root:

```bash
pnpm install
pnpm dev:web
```

Dashboard is at `http://localhost:3000`.

## 4. Phase 1 APIs

- `GET /api/profile?profileId=...` loads profile
- `POST /api/profile` saves profile
- `GET /api/profile/exists?profileId=...` checks existence/readiness
- `POST /api/analyze?profileId=...` returns AI action only if profile is ready

If profile is missing/incomplete, analyze returns `412`.
