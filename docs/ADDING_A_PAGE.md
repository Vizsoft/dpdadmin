# Adding a new page

## Quick start

```bash
npm run new:page -- <slug> [permission]
```

Example:

```bash
npm run new:page -- analytics reports.view
```

## Checklist

- [ ] Run the scaffold command (or mirror its output manually)
- [ ] Add a `NAV_ITEMS` entry in `src/config/navigation.ts`
- [ ] Add permission to `PERMISSIONS` and `ROLE_PERMISSIONS` in `src/lib/auth/permissions.ts`
- [ ] Add matching keys in `src/messages/en.json` and `src/messages/ar.json`
- [ ] Wrap sensitive actions in `<PermissionGuard permission="...">`
- [ ] Use theme tokens (`bg-background`, `text-foreground`) — avoid hardcoded colors
- [ ] Test `/en/<slug>` and `/ar/<slug>` (RTL)
- [ ] Test light and dark mode

## Route structure

All dashboard pages live under:

`src/app/[locale]/(dashboard)/<slug>/page.tsx`

Auth is enforced by:

- `src/middleware.ts` (session)
- `(dashboard)/layout.tsx` (staff profile)
- `requirePermission()` per page
