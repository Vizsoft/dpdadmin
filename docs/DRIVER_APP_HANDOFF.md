# DPD / Musallam Driver App — Handoff Document

> **Paste this entire file** into a new AI session when building the driver mobile app.  
> It stays in sync with the admin panel (`dpdadmin/`). Admin URL: https://dpdadmin.vercel.app  
> Backend: Supabase project `ytfmsgckjatiserpgdbz`

---

## 1. Project context

**Musallam Delivery** is an enterprise rider workforce platform in Kuwait (currency **KWD**). Riders work with external partners (**Talabat**, **Door Dash**, **Uber Eats**) — orders are fulfilled in partner apps; our app wraps **delivery logging, compliance, earnings, HR requests, and Control Tower support**.

The **admin panel** verifies deliveries, approves requests, manages zones/vehicles, sends notifications, and chats with riders. **This document** defines what the driver app must read/write so both sides stay aligned.

---

## 2. Auth (driver app)

| Item | Value |
|------|-------|
| **Primary method** | `driver_code` + **6-digit App Passcode** (issued by admin) |
| Fallback (first link) | Phone **+965** + OTP (`supabase.auth.signInWithOtp`) — used **once** to bind the auth user to the intake/driver row |
| Profile table | `profiles` where `role = 'rider'` |
| Driver row | `drivers` where `id = auth.uid()` (1:1 with profile) |
| Locale | `profiles.locale` — `en` \| `ar` |
| Admin block | `role = 'staff'` users use email login on web only |

### 2a. App passcode login (default after first link)

The admin panel auto-issues a **6-digit numeric passcode** (`drivers.app_passcode`) the moment a driver row transitions to `status = 'active'`. Admins share it privately with the driver and the driver enters `driver_code + passcode` on the login screen.

1. App calls RPC `select * from public.driver_app_lookup_by_passcode(p_driver_code, p_passcode)` (granted to `anon`).
2. RPC returns `{ ok: true, user_id }` only when the driver row is `active`, not archived, and both values match. Errors: `invalid_credentials`, `driver_not_active`, `driver_archived`.
3. With `user_id` in hand, exchange for a real Supabase session — easiest path: call a service-role edge function that issues an OTP / magic-link / signed JWT for that `auth.users.id` (we do **not** ship the service-role key in the app).
4. Admin can rotate via `select public.regenerate_driver_app_passcode(p_driver_id)` (staff only via RLS helper `is_admin_panel_user()`); rotation invalidates the old code immediately.
5. The passcode is plaintext in `drivers.app_passcode` so admin staff can read it out to the driver. Treat it as a shared secret — show it only behind the staff "reveal" gesture.

**Constraints already enforced in DB:**

- `app_passcode ~ '^[0-9]{6}$'` (check constraint)
- `UNIQUE` partial index across non-null values (no two drivers share a code)
- `BEFORE INSERT OR UPDATE OF status` trigger mints a code the first time `status` becomes `active`

### 2b. First-time link (OTP — kept as a one-shot bootstrap)

The very first time a driver opens the app — before they have a `drivers` row — they still need to bind their phone to an `auth.users` row. Use OTP for that single bootstrap step, then switch to passcode for subsequent sessions.

**On first login (OTP success):** call `link_driver_by_phone(phone)` (RPC or edge function — implement in Supabase when wiring the app):

1. Normalize phone to `+965XXXXXXXX`.
2. **If** a `driver_intakes` row exists with that phone and `linked = false`:
   - Create/update `profiles` (`role = 'rider'`, intake `full_name`, `phone`, `civil_id` if stored on profile).
   - Insert `drivers` (`id = auth.uid()`, `driver_code`, `partner_id`, `zone_id`) as needed for the app.
   - Copy R2 objects `drivers/intakes/{intakeId}/{doc_type}.{ext}` → `drivers/{driverId}/{doc_type}.{ext}` (S3 CopyObject, same private bucket).
   - Insert `driver_documents` rows; create `driver_assets` from intake `assets_issued` jsonb.
   - If intake has `vehicle_id`, set `vehicles.current_driver_id = auth.uid()`.
   - Set intake `linked = true`, `linked_profile_id = auth.uid()`, legacy `status = 'linked'`.
   - Or call RPC: `select mark_driver_intake_linked(p_phone, p_profile_id)`.
3. **Else** (no intake): create minimal `profiles` + `drivers` (self-signup path).

Admin panel **does not** create auth users; it only inserts `driver_intakes` via **Add Driver** (`/drivers/new`):
- `workflow_status = 'draft'` (staff change manually to `pending` / `approved` in admin UI)
- `linked = false` until mobile OTP link

| Table / bucket | Admin | Driver app |
|----------------|-------|------------|
| `driver_intakes` | insert (staff RLS) | read on link (service role / RPC) |
| R2 `drivers/intakes/…` | admin upload (server) | copy to `drivers/{driverId}/…` on link |
| `drivers` | — | row after OTP link |
| `profiles.phone` | duplicate check on create | unique identity for link |

---

## 3. Screen inventory (user app → admin + tables)

| # | Driver screen | Admin module | Tables (read / write) |
|---|---------------|--------------|------------------------|
| 1 | Login (driver code + 6-digit passcode) | Drivers | `drivers` R via `driver_app_lookup_by_passcode` |
| 1a | First-time link (8-digit mobile + OTP) | — | `auth.users` (one-shot bootstrap only) |
| 2 | OTP verification (first link only) | — | `auth` session |
| 3 | Home (online toggle, weekly KPIs, bumper bonus) | Dashboard, Earnings | `driver_sessions`, `driver_earnings_daily`, `offers`, `deliveries` |
| 4 | Deliveries list (calendar, + Add Delivery) | Live Deliveries | `deliveries` **W**, `partners` R |
| 5 | Add delivery (order ID + proof photo) | Live Deliveries (verify tab) | `deliveries` **W** → `status=pending` |
| 6 | Fuel expense form | Requests (Fuel tab) | `requests` **W** type=fuel |
| 7 | Fuel expense history | Requests | `requests` R |
| 8 | Loan request list | Requests (Loan tab) | `requests` R, `loan_terms` R |
| 9 | New loan request | Requests | `requests` **W**, admin sets `loan_terms` on approve |
| 10 | Leave request | Requests (Leave tab) | `requests` **W** type=leave |
| 11 | Complaint submit | Requests (Complaints) | `requests` **W** type=complaint |
| 12 | Wrong action details + history | Wrong Actions, Driver detail | `wrong_actions` R |
| 13 | Earnings (this week) | Earnings | `driver_earnings_daily` R, `offers` R |
| 14 | Notifications list | Notifications | `notifications` R (via push/inbox) |
| 15 | Hygiene task (photo submit) | Notifications (Hygiene) | `hygiene_submissions` **W** |
| 16 | Control Tower chat | Support (Conversations) | `support_threads`, `support_messages` **W** |
| 17 | SOS Emergency | Support (Tickets) | `support_tickets` **W** |
| 18 | Appointment booking | Support (Appointments) | `appointment_slots` R, `appointments` **W** |
| 19 | Vehicle info | Vehicles | `vehicles` R via `drivers.vehicle_id` |
| 20 | Profile | Drivers | `drivers`, `profiles`, `driver_documents` R |
| 21 | Zone warning (outside zone timer) | Live Deliveries (Outside Zone) | `zones.polygon`, `attendance_logs.zone_compliance` **W** |

**W** = driver insert/update own rows · **R** = driver select own rows

---

## 4. Database schema (driver-visible)

### `profiles` (existing)
- `id` uuid PK (= auth.uid)
- `role` — must be `rider`
- `phone`, `full_name`, `locale`, `avatar_url`, `zone_id`

### `drivers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → profiles.id |
| driver_code | text | Exactly 5 digits from global sequence (`10001`–`99999`), auto-assigned on admin create; never reused after archive |
| archived_at | timestamptz | Set when admin archives driver; archived drivers cannot log in |
| partner_id | uuid | Talabat etc. |
| zone_id | uuid | Assigned zone |
| status | enum | active, suspended, pending |
| base_earnings_kwd | numeric | |
| is_on_duty | boolean | Toggled on Home |
| current_lat, current_lng | numeric | Updated while online |
| vehicle_id | uuid | FK → vehicles |

### `deliveries`
| Column | Type | Notes |
|--------|------|-------|
| driver_id | uuid | = auth.uid() |
| partner_id | uuid | Selected partner |
| zone_id | uuid | Zone at time of delivery |
| restaurant_id | uuid | Optional FK → `restaurants` (merchant) |
| external_order_id | text | Order # from partner app |
| order_proof_url | text | Storage path |
| status | enum | pending → admin sets verified/rejected |
| delivered_at | timestamptz | |

When admin sets `status = verified`, Postgres runs `recalculate_driver_earnings(driver_id, earn_date)` and updates `driver_earnings_daily`.

**Driver RLS (to implement):** INSERT/SELECT where `driver_id = auth.uid()`.

### `restaurants` (admin-managed)
| Column | Type | Notes |
|--------|------|-------|
| partner_id | uuid | FK → partners |
| name | text | Display name |
| external_merchant_id | text | Optional ID from partner app |
| is_active | boolean | |

Configured in admin **Settings → DPD → Restaurants**.

### `delivery_rules` / `incentive_rules` (admin-managed)
- Scope: `zone`, `partner`, or `restaurant` (exactly one FK per rule).
- `delivery_rules`: which verified deliveries count toward incentives (if none active globally, all verified deliveries count).
- `incentive_rules`: `period` (daily/weekly/monthly), `target_deliveries`, `reward_kwd`; matching rules **stack** (sum of rewards).
- Kuwait calendar for weekly (Mon–Sun) and monthly periods in SQL (`Asia/Kuwait`).

Admin UI: **DPD** (`/dpd`, `earnings.view` / `earnings.manage`). Legacy `/settings/dpd` redirects to `/dpd`.

### `requests`
| Column | Type | Notes |
|--------|------|-------|
| request_code | text | RQ-#### |
| request_type | enum | loan, leave, fuel, complaint, document |
| status | enum | pending, approved, rejected |
| amount_kwd | numeric | Loan/fuel amount |
| start_date, end_date | date | Leave range |
| details | text | Reason |
| attachment_url | text | Receipt etc. |
| decision_reason | text | Set by admin on reject |

### `loan_terms` (read only for driver after approve)
- `total_kwd`, `deduction_kwd`, `months`, `installment_remaining`

### `wrong_actions` (read only)
- `action_type`, `severity`, `details`, `occurred_at`

### `driver_earnings_daily` (read only)
- Per-day: deliveries, base_kwd, incentive_kwd, deductions, net_kwd

### `hygiene_tasks` + `hygiene_submissions`
- Admin creates task → push to driver → driver uploads photo → admin reviews

### `support_threads` + `support_messages`
- One thread per driver with Control Tower; realtime chat

### `driver_sessions`
- `is_online`, `went_online_at`, `went_offline_at`

### `attendance_logs`
- Auto on check-in/out; `zone_compliance`: inside | outside

---

## 5. Storage

### Cloudflare R2 (private — admin + linked driver docs)

Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`. Server-only uploads; staff read via presigned GET (15 min).

| Prefix | Who writes | Path |
|--------|------------|------|
| `drivers/intakes/{intake_id}/` | Admin panel (Add Driver) | `{doc_type}.{pdf\|png\|jpg\|webp}` |
| `drivers/{driver_id}/` | Link RPC / mobile onboarding | `{doc_type}.{ext}` |
| `partners/{partner_id}/` | Admin panel | `logo.{ext}` |

`driver_documents.file_url` should store the **object key** (e.g. `drivers/{uuid}/license.pdf`), not a public URL. Resolve with presigned GET in admin/mobile as needed.

Legacy Supabase buckets `driver-intakes` and `partner-logos` are deprecated; migrate with `node scripts/migrate-storage-to-r2.mjs`.

### Supabase Storage (still used for mobile operational uploads)

| Bucket | Driver upload | Path |
|--------|---------------|------|
| delivery-proofs | Yes | `{driver_id}/{uuid}.jpg` |
| fuel-receipts | Yes | `{driver_id}/{request_id}.jpg` |
| hygiene-photos | Yes | `{driver_id}/{task_id}.jpg` |
| support-attachments | Yes | `{thread_id}/{uuid}` |

RLS: authenticated user can write only under their `driver_id` prefix where applicable.

---

## 6. Realtime subscriptions

```typescript
// Support chat
supabase.channel(`support:thread:${threadId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `thread_id=eq.${threadId}` }, handler)

// Duty status (optional)
supabase.channel('driver_sessions').on('postgres_changes', ...)

// Notifications inbox
supabase.channel(`notifications:driver:${driverId}`).on(...)
```

---

## 7. Push notifications

Admin sends via `notifications` table. Payload shape:

```json
{
  "title": "string",
  "body": "string",
  "on_click_action": "home | deliveries | vehicle | profile | hygiene_task | custom_link",
  "link_url": "optional",
  "hygiene_task_id": "optional uuid"
}
```

### Deep links

| on_click_action | Route |
|-----------------|-------|
| home | `/` |
| deliveries | `/deliveries` |
| vehicle | `/vehicle` |
| profile | `/profile` |
| hygiene_task | `/hygiene/{task_id}` |
| custom_link | `link_url` |

Scheme: `musallam://` (configure in app)

---

## 8. Geofencing

1. Admin defines zones in `/zones` with `zone_type` + `geometry` (GeoJSON Feature):
   - **polygon:** `{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[lng,lat],...]] } }`
   - **circle:** `{ type: "Feature", geometry: { type: "Point", coordinates: [lng,lat] }, properties: { radiusMeters: 1500 } }`
2. Driver assigned `drivers.zone_id`
3. While online, app posts `current_lat/lng` to `drivers` every N seconds
4. Client checks point-in-zone (polygon: `booleanPointInPolygon`; circle: distance ≤ `radiusMeters`); if outside → show countdown banner (Home screen)
5. Server writes `attendance_logs.zone_compliance = outside` for reporting
6. Admin **Outside Zone** tab lists drivers in violation

Shared validation logic (admin): `src/lib/geo/zone-geometry.ts` — mirror in mobile app.

---

## 9. App settings (read at app start + on reconnect)

```sql
select driver_app_title,
       driver_app_logo_url,
       driver_app_splash_url,
       driver_app_maintenance_mode,
       driver_app_maintenance_message,
       driver_app_login_hint
  from public.app_settings
 where id = 1;
```

- **Anon-readable** via policy `app_settings_public_branding_read` (same row as admin branding).
- When `driver_app_maintenance_mode = true`: render a full-screen maintenance view using `driver_app_maintenance_message`. Block login and in-app actions; allow retry/poll.
- **Separate** from `maintenance_mode` on the same row (that flag gates the **admin panel** only).
- `driver_app_logo_url` / `driver_app_splash_url` are public Supabase Storage URLs under bucket `branding`, paths `driver-app/logo.*` and `driver-app/splash.*`. Uploads append a `?v=` cache-bust query param.
- `driver_app_title` is the mobile app display name (defaults to `Musallam Delivery`). Admin subtitle/login hint remain on `app_subtitle` / `driver_app_login_hint` (configured under Settings → Branding).

---

## 10. Brand / UI

Match admin semantic tokens: `docs/DESIGN_SYSTEM.md` (CSS variables: `primary`, `background`, `muted`, etc.)

- Background cream `#FAF6F2`, accent coral `#EF5B4D`, primary CTA dark `#1A1A1A`
- Status: green Active, coral Suspended/Warning
- Currency: **KWD** with 3 decimal places where needed
- RTL: full Arabic support (`ar`)

Bottom nav (driver app): **Home · Deliveries · Earnings · Vehicle · Profile**

---

## 11. Status flows (admin ↔ app)

### Delivery
`driver submits (pending)` → `admin verifies (verified)` or `rejects (rejected + reason)` → app shows badge

### Request (loan/fuel/leave/complaint)
`driver submits (pending)` → `admin approves/rejects` → app updates list; loan shows repayment terms from `loan_terms`

### Fuel
`pending` → `approved` → `reimbursed` (payroll run — admin marks via earnings)

### Hygiene task
`admin creates task` → `push to driver` → `driver submits photo (pending)` → `admin completes/rejects` → penalty may apply to earnings

---

## 12. How to keep this file updated

When implementing an **admin panel** feature, update this file if you change:

- [ ] Table/column/enum added or renamed
- [ ] RLS policy for driver role
- [ ] Storage bucket or path convention
- [ ] Realtime channel name
- [ ] Push payload or deep-link route
- [ ] New screen on either side

Tag admin PRs: `[admin+app]` in `.cursor/rules/project-architecture.mdc` change log.

---

## 13. Suggested mobile stack (not prescriptive)

- **React Native / Expo** or **Flutter**
- **Supabase JS** client with secure storage for session
- **Mapbox / Google Maps** for zone overlay
- **FCM + APNs** for push (trigger via Supabase Edge Function on `notifications` insert)

---

## 14. Uploads (R2)

Driver images and documents use the **same private R2 bucket** as the admin panel (`dpd-private`). R2 credentials live only in **Vercel env vars** on the admin Next.js app — never in the mobile bundle.

**Base URL:** `https://dpdadmin.vercel.app` (or your deployed admin origin)

**Auth:** `Authorization: Bearer <supabase_access_token>` for the signed-in rider (`profiles.role = 'rider'`, `drivers.id = auth.uid()`).

### Recommended flow (presigned PUT)

1. `POST /api/driver-uploads/presign`  
   Body (JSON): `{ "entityType", "entityId?", "contentType", "filename", "sizeBytes" }`  
   Response: `{ uploadId, uploadUrl, objectKey, expiresAt, requiredHeaders: { "Content-Type": "..." } }`

2. `PUT <uploadUrl>` with raw file bytes and the **exact** `Content-Type` from step 1.

3. `POST /api/driver-uploads/confirm`  
   Body: `{ "uploadId" }`  
   Response: `{ ok: true, objectKey, sizeBytes }`

### Proxy fallback (when direct PUT is blocked)

`POST /api/driver-uploads/proxy` — `multipart/form-data`: `entityType`, optional `entityId`, `file`.

### List my uploads

`GET /api/driver-uploads/mine?limit=50` — returns completed uploads with short-lived `readUrl` (presigned GET).

### Allowed `entityType` values

| entityType | Max size | Content types |
|------------|----------|---------------|
| `driver_doc` | 10 MB | `image/*`, `application/pdf` |
| `driver_selfie` | 5 MB | `image/*` |
| `order_proof` | 10 MB | `image/*`, `application/pdf` |

Object keys are server-generated: `drivers/{driverId}/{entityType}/{date}/{uuid}.{ext}`.

### CORS

Set `DRIVER_APP_ORIGINS` on the admin deployment (comma-separated app origins). Preflight `OPTIONS` is supported on all upload routes.

### Admin visibility

Every completed upload is recorded in `storage_uploads` and shown on **Settings → Cloudflare R2** (filter: Driver app). Admin intake uploads use `uploaded_via = 'admin'`.

---

## 15. Supabase connection

```env
EXPO_PUBLIC_SUPABASE_URL=https://ytfmsgckjatiserpgdbz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from admin .env.local>
```

Never ship `SUPABASE_SERVICE_ROLE_KEY` in the mobile app.

---

*Last synced: 2026-06-07 — [admin+app] R2 env-only credentials; storage stats dashboard; driver upload API (`/api/driver-uploads/*`) + `storage_uploads` audit table.*

*Prior: 2026-06-05 — [admin+app] Driver app settings: `driver_app_title`, logo/splash URLs, `driver_app_maintenance_mode` + message. Admin page `/settings/app`. Migration `20260605100000_driver_app_settings.sql`.*

*Prior: 2026-06-04 — [admin+app] Driver codes shortened to exactly 5 digits (`10001`–`99999`). Migration renumbers existing rows; `allocate_driver_code` enforces capacity.*

*Prior: 2026-06-03 — Global sequence + archive (`archived_at`).*

*Prior: 2026-06-02 — Driver app passcode + driver_code/passcode login.*
