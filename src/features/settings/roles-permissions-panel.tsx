"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  Bike,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  ClipboardCheck,
  Folder,
  Handshake,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Map as MapIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  createCustomRole,
  deleteCustomRole,
  duplicateRole,
  updateRoleMeta,
  updateMultipleRolePermissions,
} from "@/features/settings/roles-actions";
import type { AdminRoleRow } from "@/lib/auth/get-role-permissions";
import { isValidRoleSlug, slugifyRoleName } from "@/lib/auth/permission-catalog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type PermissionRow = {
  slug: string;
  label: string;
  category: string;
};

const COLLAPSED_STORAGE_KEY = "dpd-roles-collapsed-categories";

const CATEGORY_META: Record<string, { icon: LucideIcon; labelKey: string }> = {
  admin: { icon: Shield, labelKey: "categories.admin" },
  dashboard: { icon: LayoutDashboard, labelKey: "categories.dashboard" },
  drivers: { icon: Users, labelKey: "categories.drivers" },
  partners: { icon: Handshake, labelKey: "categories.partners" },
  restaurants: { icon: UtensilsCrossed, labelKey: "categories.restaurants" },
  vehicles: { icon: Bike, labelKey: "categories.vehicles" },
  deliveries: { icon: Package, labelKey: "categories.deliveries" },
  zones: { icon: MapIcon, labelKey: "categories.zones" },
  attendance: { icon: ClipboardCheck, labelKey: "categories.attendance" },
  requests: { icon: Inbox, labelKey: "categories.requests" },
  compliance: { icon: AlertTriangle, labelKey: "categories.compliance" },
  earnings: { icon: Wallet, labelKey: "categories.earnings" },
  notifications: { icon: Bell, labelKey: "categories.notifications" },
  support: { icon: LifeBuoy, labelKey: "categories.support" },
  settings: { icon: Settings, labelKey: "categories.settings" },
};

type RolesT = ReturnType<typeof useTranslations<"pages.settings.roles">>;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function setsFromRolePermissions(roles: AdminRoleRow[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const role of roles) {
    if (role.isSuperAdmin) continue;
    out[role.id] = new Set(role.permissions);
  }
  return out;
}

function clonePermissionsByRole(
  source: Record<string, Set<string>>,
): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [id, perms] of Object.entries(source)) {
    out[id] = new Set(perms);
  }
  return out;
}

function loadCollapsedCategories(allCategories: string[]): Set<string> {
  if (typeof window === "undefined") {
    const expanded = new Set(allCategories.slice(0, 2));
    return new Set(allCategories.filter((c) => !expanded.has(c)));
  }
  try {
    const raw = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return new Set(parsed.filter((c) => allCategories.includes(c)));
    }
  } catch {
    /* ignore */
  }
  const expanded = new Set(allCategories.slice(0, 2));
  return new Set(allCategories.filter((c) => !expanded.has(c)));
}

function saveCollapsedCategories(collapsed: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(Array.from(collapsed)));
  } catch {
    /* ignore */
  }
}

function categoryLabel(category: string, t: RolesT): string {
  const meta = CATEGORY_META[category];
  if (meta) return t(meta.labelKey as "categories.admin");
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CategoryIcon({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  const Icon = meta?.icon ?? Folder;
  return <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

function RolesPanelHeader({
  t,
  isPending,
  onNew,
  onDuplicate,
  onExpandAll,
  onCollapseAll,
}: {
  t: RolesT;
  isPending: boolean;
  onNew: () => void;
  onDuplicate: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription className="text-xs">{t("subtitle")}</CardDescription>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 cursor-pointer gap-1 rounded-lg text-xs"
          onClick={onExpandAll}
          disabled={isPending}
        >
          <ChevronsUpDown className="size-3.5" />
          {t("expandAll")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 cursor-pointer gap-1 rounded-lg text-xs"
          onClick={onCollapseAll}
          disabled={isPending}
        >
          <ChevronsDownUp className="size-3.5" />
          {t("collapseAll")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 cursor-pointer gap-1 rounded-lg text-xs"
          onClick={onNew}
          disabled={isPending}
        >
          <Plus className="size-3.5" />
          {t("newRole")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 cursor-pointer gap-1 rounded-lg text-xs"
          onClick={onDuplicate}
          disabled={isPending}
        >
          {t("duplicateRole")}
        </Button>
      </div>
    </div>
  );
}

function RoleToolbar({
  roles,
  selectedColumnId,
  dirtyRoleIds,
  usageMap,
  t,
  onSelect,
  onRename,
  onDelete,
}: {
  roles: AdminRoleRow[];
  selectedColumnId: string;
  dirtyRoleIds: Set<string>;
  usageMap: Map<string, number>;
  t: RolesT;
  onSelect: (id: string) => void;
  onRename: (role: AdminRoleRow) => void;
  onDelete: (role: AdminRoleRow) => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2.5">
      {roles.map((role) => {
        const selected = role.id === selectedColumnId;
        const dirty = dirtyRoleIds.has(role.id);
        const userCount = usageMap.get(role.id) ?? 0;
        return (
          <div
            key={role.id}
            role="button"
            tabIndex={0}
            className={cn(
              "flex min-w-[140px] shrink-0 cursor-pointer flex-col gap-1 rounded-lg border px-3 py-2 text-start transition-colors",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-muted/30 hover:bg-muted/50",
            )}
            onClick={() => onSelect(role.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(role.id);
              }
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">{role.name}</span>
              {dirty ? (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-amber-500"
                  title={t("unsaved")}
                />
              ) : null}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {t("usersAssigned", { count: userCount })}
            </span>
            {!role.isSystem ? (
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-6 cursor-pointer"
                  aria-label={t("renameRole")}
                  onClick={() => onRename(role)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-6 cursor-pointer text-destructive hover:text-destructive"
                  aria-label={t("deleteRole")}
                  onClick={() => onDelete(role)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PermissionSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="border-b border-border px-4 py-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-8 rounded-lg ps-8 text-sm"
        />
      </div>
    </div>
  );
}

function CategorySectionBody({
  perms,
  editableRoles,
  selectedColumnId,
  permissionsByRole,
  isPending,
  toggle,
}: {
  perms: PermissionRow[];
  editableRoles: AdminRoleRow[];
  selectedColumnId: string;
  permissionsByRole: Record<string, Set<string>>;
  isPending: boolean;
  toggle: (roleId: string, slug: string, on: boolean) => void;
}) {
  return (
    <div className="border-t border-border/60 bg-muted/20">
      {perms.map((perm) => (
        <PermissionRowItem
          key={perm.slug}
          perm={perm}
          editableRoles={editableRoles}
          selectedColumnId={selectedColumnId}
          permissionsByRole={permissionsByRole}
          isPending={isPending}
          toggle={toggle}
        />
      ))}
    </div>
  );
}

function PermissionRowItem({
  perm,
  editableRoles,
  selectedColumnId,
  permissionsByRole,
  isPending,
  toggle,
}: {
  perm: PermissionRow;
  editableRoles: AdminRoleRow[];
  selectedColumnId: string;
  permissionsByRole: Record<string, Set<string>>;
  isPending: boolean;
  toggle: (roleId: string, slug: string, on: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2 last:border-b-0">
      <p className="min-w-0 flex-1 text-sm text-foreground">{perm.label}</p>
      <div className="flex shrink-0 items-center gap-1">
        {editableRoles.map((role) => {
          const checked = permissionsByRole[role.id]?.has(perm.slug) ?? false;
          const highlighted = role.id === selectedColumnId;
          return (
            <div
              key={role.id}
              className={cn(
                "flex w-10 items-center justify-center rounded-md py-1",
                highlighted && "bg-primary/5",
              )}
            >
              <Switch
                checked={checked}
                disabled={isPending}
                onCheckedChange={(on) => toggle(role.id, perm.slug, on)}
                className="cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RolesPermissionsPanel({
  roles,
  permissions,
  usageCounts,
}: {
  roles: AdminRoleRow[];
  permissions: PermissionRow[];
  usageCounts: { roleId: string; userCount: number }[];
}) {
  const t = useTranslations("pages.settings.roles");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const editableRoles = useMemo(
    () => roles.filter((r) => !r.isSuperAdmin),
    [roles],
  );

  const usageMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usageCounts) m.set(u.roleId, u.userCount);
    return m;
  }, [usageCounts]);

  const savedByRole = useMemo(() => setsFromRolePermissions(roles), [roles]);

  const [permissionsByRole, setPermissionsByRole] = useState<Record<string, Set<string>>>(
    () => clonePermissionsByRole(savedByRole),
  );

  const [selectedColumnId, setSelectedColumnId] = useState(
    () => editableRoles[0]?.id ?? "",
  );

  const [permissionSearch, setPermissionSearch] = useState("");

  const byCategory = useMemo(() => {
    return permissions.reduce<Record<string, PermissionRow[]>>((acc, p) => {
      const list = acc[p.category] ?? [];
      list.push(p);
      acc[p.category] = list;
      return acc;
    }, {});
  }, [permissions]);

  const sortedCategories = useMemo(
    () => Object.keys(byCategory).sort((a, b) => a.localeCompare(b)),
    [byCategory],
  );

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => loadCollapsedCategories(sortedCategories),
  );

  useEffect(() => {
    setPermissionsByRole(clonePermissionsByRole(savedByRole));
  }, [savedByRole]);

  const persistCollapsed = useCallback((next: Set<string>) => {
    setCollapsedCategories(next);
    saveCollapsedCategories(next);
  }, []);

  const expandAll = useCallback(() => {
    persistCollapsed(new Set());
  }, [persistCollapsed]);

  const collapseAll = useCallback(() => {
    persistCollapsed(new Set(sortedCategories));
  }, [persistCollapsed, sortedCategories]);

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      saveCollapsedCategories(next);
      return next;
    });
  }, []);

  const dirtyRoleIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const role of editableRoles) {
      const current = permissionsByRole[role.id];
      const saved = savedByRole[role.id];
      if (!current || !saved) continue;
      if (!setsEqual(current, saved)) dirty.add(role.id);
    }
    return dirty;
  }, [editableRoles, permissionsByRole, savedByRole]);

  const hasDirty = dirtyRoleIds.size > 0;

  const searchQuery = permissionSearch.trim().toLowerCase();

  const filteredByCategory = useMemo(() => {
    if (!searchQuery) return byCategory;
    const out: Record<string, PermissionRow[]> = {};
    for (const [category, perms] of Object.entries(byCategory)) {
      const filtered = perms.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery) ||
          p.slug.toLowerCase().includes(searchQuery),
      );
      if (filtered.length > 0) out[category] = filtered;
    }
    return out;
  }, [byCategory, searchQuery]);

  const visibleCategories = useMemo(
    () =>
      sortedCategories.filter((c) => (filteredByCategory[c]?.length ?? 0) > 0),
    [sortedCategories, filteredByCategory],
  );

  const toggle = useCallback((roleId: string, slug: string, on: boolean) => {
    setPermissionsByRole((prev) => {
      const next = { ...prev };
      const set = new Set(next[roleId] ?? []);
      if (on) set.add(slug);
      else set.delete(slug);
      next[roleId] = set;
      return next;
    });
  }, []);

  const setCategoryForRole = useCallback(
    (roleId: string, slugs: string[], enabled: boolean) => {
      setPermissionsByRole((prev) => {
        const next = { ...prev };
        const set = new Set(next[roleId] ?? []);
        for (const slug of slugs) {
          if (enabled) set.add(slug);
          else set.delete(slug);
        }
        next[roleId] = set;
        return next;
      });
    },
    [],
  );

  const discardAll = useCallback(() => {
    setPermissionsByRole(clonePermissionsByRole(savedByRole));
  }, [savedByRole]);

  const saveAll = useCallback(() => {
    const updates = Array.from(dirtyRoleIds).map((roleId) => ({
      roleId,
      permissionSlugs: Array.from(permissionsByRole[roleId] ?? []),
    }));
    startTransition(async () => {
      const result = await updateMultipleRolePermissions(updates);
      if (result.error) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });
  }, [dirtyRoleIds, permissionsByRole, router, t]);

  const selectedColumn =
    editableRoles.find((r) => r.id === selectedColumnId) ?? editableRoles[0];

  useEffect(() => {
    if (dirtyRoleIds.size === 0) return;
    setCollapsedCategories((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const roleId of dirtyRoleIds) {
        const current = permissionsByRole[roleId];
        const saved = savedByRole[roleId];
        if (!current || !saved) continue;
        for (const perm of permissions) {
          const was = saved.has(perm.slug);
          const now = current.has(perm.slug);
          if (was !== now && next.has(perm.category)) {
            next.delete(perm.category);
            changed = true;
          }
        }
      }
      if (changed) saveCollapsedCategories(next);
      return changed ? next : prev;
    });
  }, [dirtyRoleIds, permissions, permissionsByRole, savedByRole]);

  const [newOpen, setNewOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");

  function openNewDialog() {
    setFormName("");
    setFormSlug("");
    setFormTemplateId(selectedColumnId || editableRoles[0]?.id || "");
    setNewOpen(true);
  }

  function openDuplicateDialog() {
    if (!selectedColumn) {
      toast.message(t("selectColumn"));
      return;
    }
    setFormName(`${selectedColumn.name} Copy`);
    setFormSlug(slugifyRoleName(`${selectedColumn.slug}_copy`));
    setDupOpen(true);
  }

  function openRenameDialog(role: AdminRoleRow) {
    setFormName(role.name);
    setSelectedColumnId(role.id);
    setRenameOpen(true);
  }

  function handleNameChangeForSlug(name: string) {
    setFormName(name);
    setFormSlug(slugifyRoleName(name));
  }

  function mapCreateError(code?: string): string {
    switch (code) {
      case "invalid_name":
        return t("errors.invalidName");
      case "invalid_slug":
        return t("errors.invalidSlug");
      case "slug_exists":
        return t("errors.slugExists");
      case "slug_reserved":
        return t("errors.slugReserved");
      default:
        return t("errors.createFailed");
    }
  }

  if (editableRoles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("selectRole")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="border-b border-border px-4 py-3">
          <RolesPanelHeader
            t={t}
            isPending={isPending}
            onNew={openNewDialog}
            onDuplicate={openDuplicateDialog}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
          <p className="mt-2 text-xs text-muted-foreground">{t("superAdminNote")}</p>
        </CardHeader>

        <CardContent className="flex flex-col p-0">
          <RoleToolbar
            roles={editableRoles}
            selectedColumnId={selectedColumnId}
            dirtyRoleIds={dirtyRoleIds}
            usageMap={usageMap}
            t={t}
            onSelect={setSelectedColumnId}
            onRename={openRenameDialog}
            onDelete={(role) => {
              setSelectedColumnId(role.id);
              setDeleteOpen(true);
            }}
          />

          <PermissionSearchBar
            value={permissionSearch}
            onChange={setPermissionSearch}
            placeholder={t("searchPermission")}
          />

          <div className="max-h-[min(60vh,640px)] overflow-y-auto">
            {visibleCategories.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noSearchResults")}
              </p>
            ) : (
              visibleCategories.map((category) => {
                const perms = filteredByCategory[category] ?? [];
                const isCollapsed = collapsedCategories.has(category);
                const selectedPerms = selectedColumn
                  ? permissionsByRole[selectedColumn.id]
                  : undefined;
                const checkedCount = perms.filter((p) =>
                  selectedPerms?.has(p.slug),
                ).length;
                const slugs = perms.map((p) => p.slug);

                return (
                  <section
                    key={category}
                    className="border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-start hover:opacity-80"
                        onClick={() => toggleCategory(category)}
                        aria-expanded={!isCollapsed}
                      >
                        <CategoryIcon category={category} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {categoryLabel(category, t)}
                          </p>
                          {selectedColumn ? (
                            <p className="text-xs text-muted-foreground">
                              {t("categoryProgress", {
                                checked: checkedCount,
                                total: perms.length,
                              })}
                            </p>
                          ) : null}
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            isCollapsed && "-rotate-90",
                          )}
                        />
                      </button>
                      {selectedColumn && !isCollapsed ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 cursor-pointer px-2 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              setCategoryForRole(selectedColumn.id, slugs, true)
                            }
                          >
                            {t("selectAll")}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 cursor-pointer px-2 text-xs"
                            disabled={isPending}
                            onClick={() =>
                              setCategoryForRole(selectedColumn.id, slugs, false)
                            }
                          >
                            {t("clearAll")}
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {!isCollapsed ? (
                      <CategorySectionBody
                        perms={perms}
                        editableRoles={editableRoles}
                        selectedColumnId={selectedColumnId}
                        permissionsByRole={permissionsByRole}
                        isPending={isPending}
                        toggle={toggle}
                      />
                    ) : null}
                  </section>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
            {hasDirty ? (
              <span className="me-auto text-xs text-amber-600 dark:text-amber-400">
                {t("unsaved")}
              </span>
            ) : (
              <span className="me-auto" />
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 cursor-pointer text-xs"
              disabled={isPending || !hasDirty}
              onClick={discardAll}
            >
              {t("discardAll")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 cursor-pointer rounded-lg text-xs"
              disabled={isPending || !hasDirty}
              onClick={saveAll}
            >
              {isPending ? t("saving") : t("saveAll")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogs.newTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.newDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-role-name">{t("roleName")}</Label>
              <Input
                id="new-role-name"
                value={formName}
                onChange={(e) => handleNameChangeForSlug(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-slug">{t("roleSlug")}</Label>
              <Input
                id="role-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="rounded-lg font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("startFromRole")}</Label>
              <Select
                value={formTemplateId}
                onValueChange={(v) => setFormTemplateId(v ?? "")}
              >
                <SelectTrigger className="w-full cursor-pointer rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id} label={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setNewOpen(false)}
            >
              {t("discard")}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={
                isPending || !formName.trim() || !isValidRoleSlug(formSlug)
              }
              onClick={() => {
                const template = editableRoles.find((r) => r.id === formTemplateId);
                const templatePerms = template
                  ? Array.from(permissionsByRole[template.id] ?? [])
                  : [];
                startTransition(async () => {
                  const result = await createCustomRole(
                    formName,
                    formSlug,
                    templatePerms,
                  );
                  if (result.error) {
                    toast.error(mapCreateError(result.error));
                    return;
                  }
                  toast.success(t("saved"));
                  setNewOpen(false);
                  if (result.roleId) setSelectedColumnId(result.roleId);
                  router.refresh();
                });
              }}
            >
              {isPending ? t("creating") : t("createRole")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogs.duplicateTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.duplicateDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dup-role-name">{t("roleName")}</Label>
              <Input
                id="dup-role-name"
                value={formName}
                onChange={(e) => handleNameChangeForSlug(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-role-slug">{t("roleSlug")}</Label>
              <Input
                id="dup-role-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDupOpen(false)}
            >
              {t("discard")}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={
                isPending ||
                !selectedColumn ||
                !formName.trim() ||
                !isValidRoleSlug(formSlug)
              }
              onClick={() => {
                if (!selectedColumn) return;
                startTransition(async () => {
                  const result = await duplicateRole(
                    selectedColumn.id,
                    formName,
                    formSlug,
                  );
                  if (result.error) {
                    toast.error(mapCreateError(result.error));
                    return;
                  }
                  toast.success(t("saved"));
                  setDupOpen(false);
                  if (result.roleId) setSelectedColumnId(result.roleId);
                  router.refresh();
                });
              }}
            >
              {isPending ? t("duplicating") : t("duplicate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialogs.renameTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.renameDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="rename-role">{t("roleName")}</Label>
            <Input
              id="rename-role"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setRenameOpen(false)}
            >
              {t("discard")}
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={
                isPending ||
                !selectedColumn ||
                selectedColumn.isSystem ||
                !formName.trim()
              }
              onClick={() => {
                if (!selectedColumn || selectedColumn.isSystem) return;
                startTransition(async () => {
                  const result = await updateRoleMeta(selectedColumn.id, formName);
                  if (result.error) {
                    toast.error(t("errors.renameFailed"));
                    return;
                  }
                  toast.success(t("saved"));
                  setRenameOpen(false);
                  router.refresh();
                });
              }}
            >
              {isPending ? t("renaming") : t("rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedColumn && !selectedColumn.isSystem ? (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemTitle={t("deleteConfirmTitle")}
          itemName={selectedColumn.name}
          confirmText={t("deleteConfirmText")}
          warning={
            (usageMap.get(selectedColumn.id) ?? 0) > 0
              ? t("errors.roleInUse")
              : undefined
          }
          onConfirm={() => {
            startTransition(async () => {
              const result = await deleteCustomRole(selectedColumn.id);
              if (result.error === "role_in_use") {
                toast.error(t("errors.roleInUse"));
                return;
              }
              if (result.error) {
                toast.error(t("errors.deleteFailed"));
                return;
              }
              toast.success(t("saved"));
              setDeleteOpen(false);
              const next = editableRoles.find((r) => r.id !== selectedColumn.id);
              if (next) setSelectedColumnId(next.id);
              router.refresh();
            });
          }}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
