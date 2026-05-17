# Adding a new page

> Architecture: [`.cursor/rules/project-architecture.mdc`](../.cursor/rules/project-architecture.mdc)  
> Mobile app handoff: [`docs/DRIVER_APP_HANDOFF.md`](./DRIVER_APP_HANDOFF.md) — update when schema/RLS affects drivers.

## Design system (read first)

Before building UI, review:

- [`design-system/dpd-admin/TOKENS.md`](../design-system/dpd-admin/TOKENS.md) — colors, type, spacing
- [`design-system/dpd-admin/COMPONENTS.md`](../design-system/dpd-admin/COMPONENTS.md) — layout and component recipes
- [`design-system/references/`](../design-system/references/) — visual reference screens (warm cream + coral)

**Hierarchy:** `pages/<slug>.md` overrides `MASTER.md` when present.

## Quick start

```bash
npm run new:page -- <slug> [permission]
```

Example:

```bash
npm run new:page -- drivers users.view
```

## Checklist

- [ ] Run the scaffold command (or mirror its output manually)
- [ ] Add a `NAV_ITEMS` entry in `src/config/navigation.ts`
- [ ] Add permission to `PERMISSIONS` and `ROLE_PERMISSIONS` in `src/lib/auth/permissions.ts`
- [ ] Add matching keys in `src/messages/en.json` and `src/messages/ar.json`
- [ ] Use `<PageHeader title subtitle actions tabs />` — title renders in the app header
- [ ] Use `<KpiCard>` for stat strips, `<StatusPill>` for statuses
- [ ] Table headers: `text-xs font-semibold text-accent`
- [ ] Wrap sensitive actions in `<PermissionGuard permission="...">`
- [ ] Use theme tokens only (`bg-background`, `bg-card`, `text-foreground`, `text-accent`) — no raw hex
- [ ] Compare against reference screens in `design-system/references/`
- [ ] Test `/en/<slug>` and `/ar/<slug>` (RTL)
- [ ] Test light and dark mode

## Route structure

All dashboard pages live under:

`src/app/[locale]/(dashboard)/<slug>/page.tsx`

Auth is enforced by:

- `src/middleware.ts` (session)
- `(dashboard)/layout.tsx` (staff profile)
- `requirePermission()` per page
