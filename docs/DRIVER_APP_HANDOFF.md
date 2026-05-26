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
| **Primary method** | `driver_code` + **6-digit App Passcode** (issued by admin on **Verify & approve**) |
| Fallback (legacy) | Phone **+965** + OTP — only for intakes approved before admin-first provisioning |
| Profile table | `profiles` where `role = 'rider'` |
| Driver row | `drivers` where `id = auth.uid()` (1:1 with profile) |
| Locale | `profiles.locale` — `en` \| `ar` |
| Admin block | `role = 'staff'` users use email login on web only |

### 2a. App passcode login (default after first link)

The admin panel auto-issues a **6-digit numeric passcode** (`drivers.app_passcode`) the moment a driver row transitions to `status = 'active'`. Admins share it privately with the driver and the driver enters `driver_code + passcode` on the login screen.

1. App calls RPC `select * from public.driver_app_lookup_by_passcode(p_driver_code, p_passcode)` (granted to `anon`).
2. RPC returns `{ ok: true, user_id }` only when the driver row is `active`, not archived, not blocked, and both values match. Errors: `invalid_credentials`, `driver_not_active`, `driver_archived`, `driver_blocked` (includes `message` = admin reason).
3. With `user_id` in hand, exchange for a real Supabase session — easiest path: call a service-role edge function that issues an OTP / magic-link / signed JWT for that `auth.users.id` (we do **not** ship the service-role key in the app).
4. Admin can rotate via `select public.regenerate_driver_app_passcode(p_driver_id)` (staff only via RLS helper `is_admin_panel_user()`); rotation invalidates the old code immediately.
5. The passcode is plaintext in `drivers.app_passcode` so admin staff can read it out to the driver. Treat it as a shared secret — show it only behind the staff "reveal" gesture.

**Constraints already enforced in DB:**

- `app_passcode ~ '^[0-9]{6}$'` (check constraint)
- `UNIQUE` partial index across non-null values (no two drivers share a code)
- `BEFORE INSERT OR UPDATE OF status` trigger mints a code the first time `status` becomes `active`
- **`drivers.status = 'active'` is blocked** unless the driver has ≥1 **published + active** restaurant in `driver_restaurants` (helper `driver_has_active_restaurant`, trigger on `drivers` + auto-downgrade when restaurants are removed). Admins set status via RPC `set_driver_account_status(p_driver_id, p_status)` on `/drivers/[id]`.
- **Admin app block** (`drivers.is_blocked`, `drivers.blocked_reason`): separate from account status. Admins block/unblock on `/drivers/[id]` via RPC `set_driver_blocked(p_driver_id, p_blocked, p_reason)`. Blocking forces `is_on_duty = false`. On login, `driver_app_lookup_by_passcode` returns `{ ok: false, error: 'driver_blocked', message: '<reason>' }`. For signed-in sessions, subscribe to `drivers` realtime and read `is_blocked` + `blocked_reason`; show a full-screen block view when blocked.

### 2b. Admin-first provisioning (default)

Staff use **Verify & approve** on `/drivers/[id]` (or bulk import with **Approve immediately**). Server action creates `auth.users` (phone + synthetic email `{driver_code}@driver.dpd.local`) then RPC `admin_approve_driver(p_intake_id, p_user_id, p_email)`:

- Inserts `profiles` + `drivers`, copies `driver_intake_restaurants` → `driver_restaurants`, sets `drivers.status = 'active'`, mints `app_passcode`, marks intake `linked`.
- Driver signs in with **driver_code + passcode** via edge function `driver-passcode-login` (magic link on synthetic email).

`employee_id` on intakes/drivers: **required**, 1–8 digits, unique.

### 2c. Legacy OTP bootstrap (old intakes only)

For intakes still `linked = false` from before admin-first approval, the driver may OTP once to bind phone to `auth.users`.

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

Admin panel creates `driver_intakes` via **Add Driver**, **bulk import**, or edit; auth users are created on **Verify & approve** (not on intake insert alone).
- `employee_id` required on every intake (1–8 digits)
- `linked = false` until **Verify & approve** (or legacy OTP link)

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
| 3 | Home (online toggle, weekly KPIs, bumper bonus) | Dashboard, **Attendance** | `driver_sessions`, `attendance_logs` **W**, `driver_earnings_daily`, `offers`, `deliveries` |
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
| external_order_id | text | Order # from partner app (globally unique when normalized) |
| order_proof_url | text | R2 object key (`drivers/{id}/order_proof/...`) |
| status | enum | pending → admin sets verified/rejected |
| delivered_at | timestamptz | Set on driver submit |
| delivered_lat, delivered_lng | numeric | GPS at submit time |

When admin sets `status = verified`, Postgres runs `recalculate_driver_earnings(driver_id, earn_date)` which updates `driver_earnings_daily` and syncs an approved `earning_credit` in `driver_wallet_entries`.

**Driver RLS:** `SELECT` / `INSERT` where `driver_id = auth.uid()` (migration `20260609100000_driver_deliveries_app.sql`).

**RPCs (authenticated rider):**

- `driver_check_order_id_available(p_external_order_id)` → `boolean`
- `driver_get_delivery_proximity_context()` → JSON: `proximity_meters`, driver `zone_id`, `zone_type`, `zone_geometry`, assigned `restaurants[]` with lat/lng
- `driver_create_delivery(p_external_order_id, p_order_proof_url?, p_delivered_lat?, p_delivered_lng?)` → `deliveries` row (`status = pending`, copies `partner_id` / `zone_id` from `drivers`). Raises `delivery_out_of_range` when proximity gate fails.

**Delivery proximity gate** (`app_settings.driver_app_delivery_proximity_meters`, default 500; `0` disables):

- Allow submit when driver GPS is **inside assigned zone** OR **within N meters of zone boundary** OR **within N meters of any assigned restaurant** (PostGIS on server; mirrored client-side for UX).
- Enforced in `driver_create_delivery` and pre-checked in the driver app Add Delivery screen.

### `restaurants` (admin-managed)
| Column | Type | Notes |
|--------|------|-------|
| partner_id | uuid | Optional FK → partners |
| zone_id | uuid | Optional FK → zones |
| name | text | Required display name |
| external_merchant_id | text | Optional ID from partner app |
| status | enum | draft, published, archived — only **published** rows are selectable for drivers |
| is_active | boolean | Must be true for driver activation gate |

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

When admin sets `status = verified`, Postgres runs `recalculate_driver_earnings(driver_id, earn_date)` which updates `driver_earnings_daily` and syncs an approved **`earning_credit`** row in `driver_wallet_entries` (idempotent via `source_ref`).

### `driver_earnings_daily` (read only — computational aggregate)
- Per-day: deliveries, base_kwd, incentive_kwd, loan/penalty/reimbursement deductions, net_kwd
- Used for admin previews and KPIs; may be recalculated when deliveries are verified or corrected.

### `driver_wallet_entries` (read only — approved ledger for driver-visible balance)

| Column | Type | Notes |
|--------|------|-------|
| driver_id | uuid | `auth.uid()` for rider |
| earn_date | date | Kuwait calendar day |
| entry_type | enum | `earning_credit` (auto on recalc), `manual_adjustment`, `payout_debit` (future) |
| amount_kwd | numeric | Approved amount for that day/type |
| status | enum | `approved` \| `pending` \| `voided` — driver app reads **`approved` only** |
| source_ref | text | Unique idempotency key, e.g. `earning:{driver_id}:{earn_date}` |
| meta | jsonb | Snapshot of daily breakdown (deliveries, base, incentive, net, etc.) |

**Driver app queries (RLS):**

```typescript
// Approved daily credits for earnings screen / payout balance
const { data } = await supabase
  .from('driver_wallet_entries')
  .select('earn_date, amount_kwd, entry_type, status, meta')
  .eq('driver_id', userId)
  .eq('status', 'approved')
  .order('earn_date', { ascending: false });
```

Sum `amount_kwd` where `entry_type = 'earning_credit'` for “approved earnings this week”. Future payout runs will insert `payout_debit` rows against the same ledger.

Admin RPCs (staff): `get_driver_earnings_detail`, `list_driver_earnings_daily`, `recalculate_earnings_for_range`.

### `driver_earnings_daily` (legacy read — still available)
- Same columns as above; prefer **`driver_wallet_entries`** for driver-facing “approved” balances.

### `hygiene_tasks` + `hygiene_submissions`
- Admin creates task → push to driver → driver uploads photo → admin reviews

### `support_threads` + `support_messages`
- One thread per driver with Control Tower; realtime chat

### `driver_sessions`
- `is_online`, `went_online_at`, `went_offline_at`
- Updated by RPC `driver_set_duty_state(p_is_on_duty, p_is_online)` when the Home duty toggle changes.

### `attendance_logs`
- One row per `(driver_id, log_date)` where `log_date` uses **Asia/Kuwait** calendar date.
- **Check-in / check-out:** the Home **duty toggle ON** upserts today's row (`check_in_at`, `status = present` unless `on_leave`); **toggle OFF** sets `check_out_at`.
- Written by `driver_set_duty_state` (same RPC as sessions) — no separate attendance button in v1.
- `zone_compliance`: `inside` | `outside` (geofence reporting — future writer).
- `admin_note`: set when staff corrects a record via admin panel RPC `admin_correct_attendance`.
- Driver **SELECT** own rows (`driver_id = auth.uid()`). Admin module: `/attendance` (Live / Logs / Exceptions tabs).

**Driver read (today's log):**
```sql
select id, log_date, check_in_at, check_out_at, status, zone_compliance
  from public.attendance_logs
 where driver_id = auth.uid()
   and log_date = (now() at time zone 'Asia/Kuwait')::date;
```

**Duty toggle (check-in/out):**
```sql
select public.driver_set_duty_state(p_is_on_duty := true, p_is_online := true);  -- check in
select public.driver_set_duty_state(p_is_on_duty := false, p_is_online := false); -- check out
```
Returns full home dashboard payload (`driver_get_home_dashboard()` shape).

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

## 7. Push notifications (Notification Center v2)

Admin now sends via `notification_campaigns` + `notification_dispatch_items` (FCM provider), not direct inserts to legacy `notifications`.

### FCM data payload (version 1)

Admin dispatch sends FCM with notification title/body plus a flat string `data` map:

```json
{
  "campaign_id": "uuid",
  "payload_version": "1",
  "action_type": "open_screen | open_module | open_record | open_workflow | open_url | custom_payload | silent_update_trigger",
  "action_params": "{\"screen\":\"home\",\"delivery_id\":\"optional-uuid\"}",
  "category": "incentive | reminder | compliance | attendance | salary | emergency | announcement | operations | system_alert",
  "priority": "low | normal | high | critical",
  "deep_link": "optional musallam://...",
  "image_url": "optional HTTPS URL for rich push thumbnail (7-day signed URL at send time)",
  "media": "[{\"role\":\"banner|image\",\"type\":\"image\",\"object_key\":\"notifications/assets/...\"}]"
}
```

Parse `action_params` and `media` as JSON on the client. Unknown keys must be ignored for forward compatibility.

**Images / banners**

| Role | Admin UI | Driver app |
|------|----------|------------|
| `banner` | Wide hero on notification detail | Fetch signed read URL after open |
| `image` | Push tray thumbnail | Used in FCM `image_url`; falls back to `banner` if omitted |

To load banner/image inside the app (private R2 storage), call:

`GET /api/driver-app/notification-media?campaignId={uuid}&role=banner|image`

Requires rider session. Returns `{ readUrl, objectKey, role }`. Only allowed when the driver has a row in `notification_dispatch_items` for that campaign.

### Lifecycle states

`draft` → `pending_approval` (when high/critical/emergency/broadcast-to-all) → `scheduled` | `queued` → `processing` → `sent` → `delivered` → `opened` → `clicked` | `failed` | `cancelled` | `expired`

Approval policy (admin): high priority, critical priority, emergency category, or target mode `all` require `notifications.approve` before send.

### Client event ingestion

POST `https://dpdadmin.vercel.app/api/notifications/events` with rider session:

```json
{
  "campaign_id": "uuid",
  "dispatch_item_id": "uuid",
  "event_type": "delivered | opened | clicked | failed | token_invalid",
  "event_at": "ISO timestamp",
  "meta": { "app_version": "1.0.0", "platform": "ios|android" }
}
```

Alternatively call RPC `record_notification_client_event(p_campaign_id, p_dispatch_item_id, p_event_type, p_event_at, p_metadata)` as the authenticated rider.

### Push token registration

Upsert into `driver_push_tokens` on login/token refresh:

| Column | Value |
|--------|-------|
| `driver_id` | `auth.uid()` |
| `token` | FCM device token |
| `platform` | `ios` \| `android` |
| `is_active` | `true` |

Deactivate stale tokens when FCM returns invalid-registration.

### Firebase client bootstrap

Project: **Musallam Delivery** (`musallam-delivery-kw`)

| Platform | Package / bundle | Firebase app ID |
|----------|------------------|-----------------|
| Android | `kw.musallam.delivery` | `1:942102607123:android:2b709642cb7ab7a48096e6` |
| iOS | `kw.musallam.delivery` | `1:942102607123:ios:442ef4381a6480f48096e6` |

**Option A — native config files:** copy from admin repo `docs/firebase/google-services.json` (Android) and `GoogleService-Info.plist` (iOS).

**Option B — runtime fetch from admin:**

```
GET https://dpdadmin.vercel.app/api/driver-app/firebase-config?platform=android
GET https://dpdadmin.vercel.app/api/driver-app/firebase-config?platform=ios
```

Response includes `config.projectId`, `config.appId`, `config.apiKey`, `config.messagingSenderId`, plus `serverConfigured` (admin FCM credentials present).

### Deep links

| action_type | Behavior |
|-------------|----------|
| `open_screen` | Navigate using `action_params.screen` (+ optional params) |
| `open_module` | Open app module from `action_params.module` |
| `open_record` | Open entity detail from `action_params.record_type` + `record_id` |
| `open_workflow` | Start workflow from `action_params.workflow` |
| `open_url` | External URL from `action_params.url` |
| `custom_payload` | App-defined handler for `action_params` |
| `silent_update_trigger` | Background refresh only; no UI navigation |

Scheme: `musallam://` (configure in app)

---

## 7b. Legacy push section (deprecated)

The block below is superseded by §7 above. Do not implement against the old shape.

### Campaign payload shape (version 1) — deprecated reference

```json
{
  "version": 1,
  "title": "string",
  "body": "string",
  "category": "general | operations | compliance | payroll | alerts",
  "priority": "low | normal | high | broadcast | emergency",
  "action_payload": {
    "action": "open_screen | open_deeplink | open_url | acknowledge",
    "route": "/home",
    "params": {
      "hygiene_task_id": "optional uuid",
      "delivery_id": "optional uuid"
    },
    "deeplink": "optional musallam://..."
  },
  "data_payload": {
    "campaign_id": "uuid",
    "dispatch_item_id": "uuid",
    "source": "admin_notification_center",
    "meta": {}
  }
}
```

### Client ack/open/click event contract — deprecated reference

App must POST/emit these back to backend bridge (or equivalent ingestion endpoint) per dispatch item:

- `acknowledged` when push received in device queue
- `opened` when user opens notification content
- `clicked` when primary action/deeplink is executed

Minimum fields:

```json
{
  "campaign_id": "uuid",
  "dispatch_item_id": "uuid",
  "event_type": "acknowledged | opened | clicked",
  "event_at": "ISO timestamp",
  "meta": {
    "app_version": "string",
    "platform": "ios|android",
    "deeplink": "optional"
  }
}
```

### Deep links — deprecated reference

| action_payload.action | Route/Behavior |
|-----------------------|----------------|
| `open_screen` | use `action_payload.route` |
| `open_deeplink` | use `action_payload.deeplink` |
| `open_url` | external URL in `action_payload.params.url` |
| `acknowledge` | stay in place and emit `clicked` |

Scheme: `musallam://` (configure in app)

---

## 8. Geofencing

`zones` stays the canonical geometry table. Geofence behavior now lives in companion tables:

- `zone_geofence_settings` (1:1 by `zone_id`) with:
  - `geofence_kind`: `inclusion | exclusion`
  - `status`: `active | inactive | draft`
  - alert toggles: `alert_on_entry`, `alert_on_exit`, `alert_on_dwell`, `dwell_time_seconds`
  - assignment + notifications: `assign_to_all_drivers`, `driver_group_label`, `notify_in_app`, `notify_email`, `notify_sms`
- `geofence_events` audit trail (future crossing detection writer): `event_type`, `occurred_at`, location/accuracy, metadata

RLS summary:

- Staff (`is_admin_panel_user()`) can manage/read settings and read events.
- Event writes are currently staff/service driven (mobile client should not assume direct inserts yet).

Realtime:

- `zone_geofence_settings` and `geofence_events` are published on `supabase_realtime`.

Current app behavior:

1. Admin defines zones in `/zones` with `zone_type` + `geometry` (GeoJSON Feature):
   - **polygon:** `{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[lng,lat],...]] } }`
   - **circle:** `{ type: "Feature", geometry: { type: "Point", coordinates: [lng,lat] }, properties: { radiusMeters: 1500 } }`
2. Geofence UI defaults for legacy zones are `inclusion + active + entry/exit alerts enabled`, so older rows render safely even before settings are explicitly saved.
3. Driver assigned `drivers.zone_id`
4. While online, app posts `current_lat/lng` to `drivers` every N seconds
5. Client checks point-in-zone (polygon: `booleanPointInPolygon`; circle: distance ≤ `radiusMeters`); if outside → show countdown banner (Home screen)
6. Server writes `attendance_logs.zone_compliance = outside` for reporting
7. Admin **Outside Zone** tab lists drivers in violation

Shared validation logic (admin): `src/lib/geo/zone-geometry.ts` — mirror in mobile app.

---

## 9. App settings (read at app start + on reconnect)

```sql
select driver_app_title,
       driver_app_logo_url,
       driver_app_splash_url,
       driver_app_icon_url,
       updated_at,
       driver_app_maintenance_mode,
       driver_app_maintenance_message,
       driver_app_login_hint,
       driver_app_delivery_proximity_meters
  from public.app_settings
 where id = 1;
```

- **Anon-readable** via policy `app_settings_public_branding_read` (same row as admin branding).
- When `driver_app_maintenance_mode = true`: render a full-screen maintenance view using `driver_app_maintenance_message`. Block login and in-app actions; allow retry/poll.
- **Separate** from `maintenance_mode` on the same row (that flag gates the **admin panel** only).
- `driver_app_logo_url` / `driver_app_splash_url` / `driver_app_icon_url` are public Supabase Storage URLs under bucket `branding`, paths `driver-app/logo.*`, `driver-app/splash.*`, and `driver-app/icon.*`. Uploads append a `?v=` cache-bust query param.
- **App icon refresh:** subscribe to `app_settings` realtime (row `id = 1`) or poll `updated_at` / compare `driver_app_icon_url` on app resume. When the URL changes, download the new image and update the launcher icon (Expo: `expo-dynamic-app-icon` or platform-specific APIs).
- `driver_app_title` is the mobile app display name (defaults to `Musallam Delivery`). Admin subtitle/login hint remain on `app_subtitle` / `driver_app_login_hint` (configured under Settings → Branding).
- `driver_app_delivery_proximity_meters` (default 500): max meters outside zone boundary or from assigned restaurant to allow Add Delivery. `0` disables the gate. Loaded via `driver_get_delivery_proximity_context()` when opening Add Delivery (includes zone geometry + assigned restaurants).

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
- **FCM + APNs** for push (triggered from Notification Center dispatch worker / queue)

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

All driver builds use the **DPD production** Supabase project (`ytfmsgckjatiserpgdbz`). The former test project `dpd-test` was removed.

```env
EXPO_PUBLIC_SUPABASE_URL=https://ytfmsgckjatiserpgdbz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from DPD project API settings>
```

Never ship `SUPABASE_SERVICE_ROLE_KEY` in the mobile app.

---

*Last synced: 2026-05-25 — [admin+app] Notification Center v2 contract: `notification_*` domain tables, lifecycle states, priority approvals, versioned payload (`action_payload` + `data_payload`), and required `acknowledged/opened/clicked` event callbacks.*

*Prior: 2026-06-23 — [admin+app] Geofence schema upgrade (`zone_geofence_settings`, `geofence_events`), default settings fallback for legacy zones, realtime publication for geofence tables, and create/edit geofence rule controls.*

*Prior: 2026-06-07 — [admin+app] R2 env-only credentials; storage stats dashboard; driver upload API (`/api/driver-uploads/*`) + `storage_uploads` audit table.*

*Prior: 2026-06-05 — [admin+app] Driver app settings: `driver_app_title`, logo/splash URLs, `driver_app_maintenance_mode` + message. Admin page `/settings/app`. Migration `20260605100000_driver_app_settings.sql`.*

*Prior: 2026-06-04 — [admin+app] Driver codes shortened to exactly 5 digits (`10001`–`99999`). Migration renumbers existing rows; `allocate_driver_code` enforces capacity.*

*Prior: 2026-06-03 — Global sequence + archive (`archived_at`).*

*Prior: 2026-06-02 — Driver app passcode + driver_code/passcode login.*
