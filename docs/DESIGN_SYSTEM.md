# DPD Admin — Design System

**Visual base:** [shadcn/ui](https://ui.shadcn.com) (`base-nova`, neutral). Use components from `@/components/ui/*` and product shells from `@/components/app/*`.

**Structure reference:** [Shopify Polaris](https://polaris-react.shopify.com/) — page hierarchy, index tables, settings secondary nav, empty states. Do **not** copy Polaris colors, fonts, or deprecated React components.

---

## Tokens

- Use **semantic CSS variables** only: `background`, `foreground`, `card`, `muted`, `muted-foreground`, `border`, `primary`, `sidebar-*`.
- Theme presets live in [`src/app/themes.css`](../src/app/themes.css). Default is **light neutral admin shell**.
- Operational colors: `success`, `warning`, `danger` (+ `-bg`) for status pills only.
- **Forbidden in feature code:** hex colors, `text-accent` on table headers, `shadow-md ring-black/5` on every card, Bodoni/cream palette from archived docs.

## Spacing

- Dashboard main padding: `p-6` (layout).
- Page vertical rhythm: `AppPage` → `space-y-6`.
- Card radius: `rounded-xl`, border `border-border`, shadow `shadow-sm` max.

## Page recipes

### 1. Index (list) page

```
AppPage
  AppPageHeader (title, description, actions, optional tabs)
  optional KpiGrid
  AppListCard (toolbar + AppDataTable)
```

Canonical examples: Partners, Drivers. Placeholders: `ModuleIndexPage`.

### 2. Detail page

```
AppPage
  AppPageHeader (+ breadcrumbs / back)
  summary Card
  TabBar
  tab content (AppDataTable or AppEmptyState)
```

### 3. Create / edit form

```
AppPage (narrow optional)
  AppPageHeader
  AppFormSection × N
  footer: primary Button + outline cancel
```

### 4. Settings

```
AppSettingsLayout (secondary nav + content)
  page content in Cards / AppFormSection
```

Settings nav must keep `SETTINGS_SUB_ITEMS`, permissions, and `/settings` exact-match active rule.

## Tables

- Header cells: `TABLE_HEAD_CLASS` from `@/components/app/constants` (or `AppDataTable`).
- Row hover: `hover:bg-muted/40`.
- Empty state: `AppDataTableEmpty` + `AppEmptyState`.

## Components map

| Use | Import |
|-----|--------|
| Page shell | `@/components/app` → `AppPage`, `AppPageHeader` |
| List index | `AppListCard`, `AppListToolbar`, `AppDataTable` |
| Settings frame | `AppSettingsLayout` |
| Form sections | `AppFormSection` |
| Status | `StatusPill`, `Badge` |
| Tabs | `TabBar` from `@/components/dashboard/tab-bar` |

## Adding a page

1. Pick a recipe above.
2. Add i18n under `pages.<module>` in `en.json` / `ar.json`.
3. Do not add per-page color or shadow overrides.
