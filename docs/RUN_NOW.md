# Get DPD Admin running (do this now)

## Step 1 — Add service role key locally

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/ytfmsgckjatiserpgdbz/settings/api)
2. Copy **service_role** key (secret)
3. Paste into `dpdadmin/.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 8 chars) in the same file

## Step 2 — Apply database migrations

Link Supabase CLI (one time) and push migrations (includes `app_settings`, RBAC tables, approval flow):

```bash
cd dpdadmin
npx supabase link --project-ref ytfmsgckjatiserpgdbz
npx supabase db push
```

If CLI is unavailable, run SQL from `supabase/migrations/` in the [SQL editor](https://supabase.com/dashboard/project/ytfmsgckjatiserpgdbz/sql). Required migrations:

- `20260518120000_app_settings.sql` — branding
- `20260519000000_rbac_approval_setup.sql` — roles, permissions, sign-up approval, super-admin claim, maintenance mode

Ensure a public **`branding`** storage bucket exists for logo uploads (Settings → Branding).

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

### First install (no super admin yet)

1. Go to `/en/signup` and create the first account.
2. You are redirected to `/en/setup/claim-super-admin` — confirm once to become super admin.
3. Further sign-ups go to **pending approval** until you approve them in **Settings → Access requests**.

### Existing production

Migration seeds `chethan@vizsoft.in` as super admin and sets `super_admin_claimed = true`. The claim page is hidden; existing staff are migrated to the **Administrator** role.

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
| “Not authorized” | Profile must be `approved` with an `admin_role_id`, or on allowlist |
| Stuck on pending | Super admin must approve in Settings → Access requests |
| Maintenance screen | Super admin can disable maintenance in Settings; others are blocked |
| “Update required” dialog | Refresh the page after a new deploy (`NEXT_PUBLIC_BUILD_ID` / Vercel commit SHA) |
| Blank page / env error | Check all `NEXT_PUBLIC_*` vars in `.env.local` or Vercel |
| Login works locally but not on Vercel | Set `NEXT_PUBLIC_APP_URL` to production URL and redeploy |
| Branding save/upload fails | Run `npx supabase db push`; confirm `branding` bucket in Storage |
