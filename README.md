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

1. Link project: `vercel link` → name **dpdadmin**
2. Add environment variables from `.env.example`
3. Deploy: `vercel` or push to Git

Add production URL to Supabase Auth redirect allowlist.
