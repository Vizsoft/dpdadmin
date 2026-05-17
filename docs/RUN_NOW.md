# Get DPD Admin running (do this now)

## Step 1 — Add service role key locally

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/ytfmsgckjatiserpgdbz/settings/api)
2. Copy **service_role** key (secret)
3. Paste into `dpdadmin/.env.local` as `SUPABASE_SERVICE_ROLE_KEY=...`
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 8 chars) in the same file

## Step 2 — Create the admin user (one time)

```bash
cd dpdadmin
npm run bootstrap:admin
```

This creates the auth user, adds email to `admin_allowlist`, and sets `profiles.role = staff`.

## Step 3 — Run locally

```bash
npm run dev
```

Open http://localhost:3000/en/login and sign in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Step 4 — Supabase Auth settings

In Dashboard → **Authentication** → **Providers** → **Email**:

- Enable Email provider
- Turn **ON** “Confirm email” only if you want email verification (bootstrap sets `email_confirm: true` so you can leave it off for internal admin)

## Step 5 — Production (Vercel)

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
