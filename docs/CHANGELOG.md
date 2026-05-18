# Changelog

Master ship log for DPD Admin. Newest entries at the top.

## 2026-05-20 — ship `59508b8`

### ✨ Features
- `59508b8` — Zones management at `/zones`: split list + Leaflet/OSM map, polygon and circle geofences, full CRUD with `zones.manage`
- `59508b8` — Shared geofence helpers in `src/lib/geo/zone-geometry.ts` (`isPointInZone`, validation); `DRIVER_APP_HANDOFF.md` §8 updated
- `59508b8` — Supabase migration `zones_geometry`: `zone_type`, `geometry` jsonb, `code` on `zones` (applied via MCP on `ytfmsgckjatiserpgdbz`)

### 🎨 UI / UX & performance
- `59508b8` — Zone cards with driver expand, map overlay + floating action card; en/ar i18n for zones module

### 🔧 Remaining enhancements
- `59508b8` — `/deliveries/zones` redirects to `/zones`; add `/zones` in menu editor; install `supabase` CLI locally for `db push`

---

## 2026-05-18 — ship `2432854`

### ✨ Features
- `2432854` — Menu editor at `/settings/menu-editor`: per-role sidebar layout (rename, reorder, hide, groups, inline/panel)
- `2432854` — Languages at `/settings/languages` + translation editor at `/settings/languages/[code]` (en source, ar editable via API)
- `2432854` — DB-driven sidebar: `menu_configs` merged with `MENU_REGISTRY`; cache + `menu-config-updated` event on save
- `2432854` — Migration `menu_configs_locales` applied on Supabase `ytfmsgckjatiserpgdbz`

### 🎨 UI / UX & performance
- — shadcn Switch, Tabs, Select, Popover for admin tools UI

### 🔧 Remaining enhancements
- — Install `supabase` CLI locally for `db push` / `db:types` (ship used Supabase MCP)

---

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
