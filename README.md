# DPD Admin

Internal admin panel for DPD operations. Built with Next.js, Supabase Auth, and shadcn/ui.

## Stack

- **Next.js 16** (App Router)
- **Supabase** — Auth (Google + email/password), Postgres, RLS
- **next-intl** — English / Arabic (RTL)
- **next-themes** — Light / dark mode
- **shadcn/ui** — UI components

## Getting started

```bash
cd dpdadmin
cp .env.example .env.local
# Fill Supabase keys in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/en`).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (optional for admin scripts) |
| `NEXT_PUBLIC_APP_URL` | App URL for OAuth callbacks |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Preferred Firebase server credential JSON |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Fallback Firebase credentials when JSON is omitted |
| `FIREBASE_ANALYTICS_ENABLED` | Toggle analytics event hooks from Notification Center |
| `FIREBASE_CRASHLYTICS_ENABLED` | Toggle crash signal ingestion hooks |
| `FIREBASE_PERFORMANCE_ENABLED` | Toggle latency/performance telemetry hooks |
| `FIREBASE_REMOTE_CONFIG_ENABLED` | Toggle remote config operational controls |

### Environment split (minimal)

- **Production stays unchanged:** Supabase `ytfmsgckjatiserpgdbz` + R2 bucket `dpd-private`
- **Local/dev/testing:** Supabase `cgpioijpvriiqqnauwlx` + R2 bucket `dpd-private-dev`
- **Keep same across environments:** Google Maps key, MapTiler key/id, R2 account credentials
- **Do not run** `npm run env:push-vercel` until the script is updated for separate targets; it pushes one file to all Vercel environments.
- **Firebase:** configure per environment (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) for Notification Center delivery and telemetry hooks.

## Auth

- **Google OAuth** and **email/password** (no OTP)
- Admin access requires `profiles.role = staff` and `archived_at IS NULL`
- New users should be on `admin_allowlist` (email → role)

```sql
INSERT INTO admin_allowlist (email, role) VALUES ('you@company.com', 'staff');
```

Enable Google provider in Supabase Dashboard and set redirect URL:

- `http://localhost:3000/auth/callback` (dev)
- `https://your-domain.com/auth/callback` (prod)

## Adding pages

See [docs/ADDING_A_PAGE.md](docs/ADDING_A_PAGE.md).

```bash
npm run new:page -- analytics reports.view
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run new:page` | Scaffold a new dashboard page |

## Deploy (Vercel)

Production: **https://dpdadmin.vercel.app**

1. Link project: `vercel link` → name **dpdadmin**
2. Add environment variables from `.env.example`
3. Apply migrations: `npx supabase link --project-ref ytfmsgckjatiserpgdbz` then `npx supabase db push`
4. Deploy: `vercel deploy --prod` or push to Git

Add production URL to Supabase Auth redirect allowlist.

**Branding:** Settings → Branding (app name, logo PNG/JPG/WebP/SVG, site font). Requires `app_settings` migration and `branding` storage bucket.

## Notification Center

- Routes:
  - `/notifications`
  - `/notifications/new`
  - `/notifications/[id]`
  - `/notifications/history`
  - `/notifications/automations`
  - `/notifications/templates`
  - `/notifications/analytics`
- Domain tables are created by migration `20260627010000_notification_center_v2.sql` (`notification_*` tables).
- Approval policy is priority-based by default (`high`, `broadcast`, `emergency`).
- Dispatch worker can be run from the dashboard or via server action entrypoint `runNotificationWorkerNow`.
