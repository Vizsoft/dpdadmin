# Changelog

Master ship log for DPD Admin. Newest entries at the top.

## 2026-05-18 — ship `6c5098c`

### ✨ Features
- `6c5098c` — Database-driven RBAC (`admin_roles`, `admin_permissions`, `admin_role_permissions`) with Settings → Roles & permissions matrix (super admin)
- `6c5098c` — Sign up → pending approval; super admin approves with assignable role (not super admin)
- `6c5098c` — One-time first-user **claim super admin** at `/setup/claim-super-admin` when `super_admin_claimed` is false
- `6c5098c` — Maintenance mode toggle (super admin only) + `/maintenance` page
- `6c5098c` — Forgot / reset password flows via Supabase
- `6c5098c` — Deploy update gate: `NEXT_PUBLIC_BUILD_ID`, `/api/build-id`, non-dismissable refresh dialog

### 🔧 Remaining enhancements
- `6c5098c` — Migration `rbac_approval_setup` on remote Supabase `ytfmsgckjatiserpgdbz`; staff → Administrator, chethan → Super Admin

---

## 2026-05-18 — ship `fdc0a46`

### ✨ Features
- `fdc0a46` — Global branding via `app_settings` (Supabase): app name, subtitle, logo (PNG/JPG/WebP/SVG), curated fonts; Settings → Branding panel with `settings.manage`

### 🎨 UI / UX & performance
- `fdc0a46` — Full-width dashboard shell (fluid main panel); dark navy sidebar with tan active state; Settings pinned to sidebar footer; Inter + optional Google fonts via `data-font`

### 🔧 Remaining enhancements
- `fdc0a46` — Apply `20260518120000_app_settings.sql` on remote Supabase if `supabase db push` not yet run; confirm public `branding` storage bucket

---

## 2026-05-18 — ship `211768e`

### ✨ Features
- `211768e` — Control Tower scaffold: 10 admin modules (dashboard, drivers, deliveries, vehicles, attendance, requests, wrong-actions, earnings, notifications, support, settings); core Postgres schema migration; permissions, i18n (en/ar), page shells

### 🔧 Remaining enhancements
- `211768e` — `docs/DRIVER_APP_HANDOFF.md` for mobile synergy; design system under `design-system/dpd-admin/`

---

## 2026-05-17 — ship `f9ca7fa`

### ✨ Features
- `f9ca7fa` — Initial Next.js 16 + Supabase Auth admin foundation (email/password, allowlist, staff role)

### 🎨 UI / UX & performance
- `f9ca7fa` — Warm cream + coral design language; shadcn/ui component base
