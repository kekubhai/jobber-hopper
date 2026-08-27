# Vercel Environment Variables Setup

This application requires the following environment variables to be configured in Vercel for proper functionality.

## Required Environment Variables

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key (secret)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Sign-in URL (default: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Sign-up URL (default: `/sign-up`)
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` - Fallback redirect after sign-in (default: `/`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` - Fallback redirect after sign-up (default: `/`)

### OpenRouter (LLM form mapping + social job email pipeline)
- `OPENROUTER_API_KEY` - OpenRouter API key (secret) — **required for `/api/form-mapping`, `/api/job-posts/*`, resume import**
- `OPENROUTER_MODEL` - Model id (default: `openai/gpt-4o-mini`)
- `OPENROUTER_SITE_URL` - Public app URL, e.g. `https://jobber-hopper.vercel.app`
- `OPENROUTER_APP_NAME` - Shown in OpenRouter logs (default: `Jobber Hopper`)

### Application Configuration
- `DEFAULT_PROFILE_ID` - Default profile ID for development (default: `local-dev-user`)

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from the list above with their corresponding values
4. Make sure to select the appropriate environments (Development, Preview, Production)

## Getting the Values

### Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the values for:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Clerk
1. Go to your Clerk dashboard
2. Navigate to **API Keys**
3. Copy the values for:
   - Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

## Troubleshooting

If you encounter 500 errors on API endpoints:
1. Check that all required environment variables are set in Vercel
2. Ensure the `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` are correct
3. Redeploy your application after adding environment variables
4. Check Vercel deployment logs for specific error messages

## Development vs Production

For local development, these variables should be in `web/.env.local`. For Vercel deployments, they must be configured in the Vercel dashboard as shown above.