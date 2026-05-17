# Get DPD Admin running (do this now)

## Step 1 — Add service role key locally

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/ytfmsgckjatiserpgdbz/settings/api)
2. Copy **service_role** key (secret)
3. Paste into `dpdadmin/.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 8 chars) in the same file

## Step 2 — Apply database migrations

Link Supabase CLI (one time) and push migrations (includes `app_settings` for branding):

```bash
cd dpdadmin
npx supabase link --project-ref ytfmsgckjatiserpgdbz
npx supabase db push
```

If CLI is unavailable, run SQL from `supabase/migrations/` in the [SQL editor](https://supabase.com/dashboard/project/ytfmsgckjatiserpgdbz/sql). Ensure a public **`branding`** storage bucket exists for logo uploads (Settings → Branding).

## Step 3 — Create the admin user (one time)

```bash
cd dpdadmin
npm run bootstrap:admin
```

This creates the auth user, adds email to `admin_allowlist`, and sets `profiles.role = staff`.

## Step 4 — Run locally

```bash
npm run dev
```

Open http://localhost:3000/en/login and sign in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Step 5 — Supabase Auth settings

In Dashboard → **Authentication** → **Providers** → **Email**:

- Enable Email provider
- Turn **ON** “Confirm email” only if you want email verification (bootstrap sets `email_confirm: true` so you can leave it off for internal admin)

## Step 6 — Production (Vercel)

Env vars must be set on Vercel (already partially done). Required:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ytfmsgckjatiserpgdbz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (backup) |
| `NEXT_PUBLIC_APP_URL` | `https://dpdadmin.vercel.app` |

Then redeploy:

```bash
vercel deploy --prod
```

Sign in at https://dpdadmin.vercel.app/en/login (same email/password as bootstrap).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Invalid email or password” | Run `npm run bootstrap:admin` again |
| “Not authorized” | Email must be in `admin_allowlist` and profile role `staff` |
| Blank page / env error | Check all `NEXT_PUBLIC_*` vars in `.env.local` or Vercel |
| Login works locally but not on Vercel | Set `NEXT_PUBLIC_APP_URL` to production URL and redeploy |
| Branding save/upload fails | Run `npx supabase db push`; confirm `branding` bucket in Storage |
