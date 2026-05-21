"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCustomRole,
  deleteCustomRole,
  duplicateRole,
  updateRoleMeta,
  updateMultipleRolePermissions,
} from "@/features/settings/roles-actions";
import type { AdminRoleRow } from "@/lib/auth/get-role-permissions";
import {
  CATALOG_SLUG_SET,
  isValidRoleSlug,
  slugifyRoleName,
} from "@/lib/auth/permission-catalog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  useEffect(() => {
    setPermissionsByRole(clonePermissionsByRole(savedByRole));
  }, [savedByRole]);

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

  // Dialog state
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

  const colCount = editableRoles.length + 1;

  return (
    <>
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t("title")}</CardTitle>
              <CardDescription className="text-xs">{t("subtitle")}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 cursor-pointer gap-1 rounded-lg text-xs"
                onClick={openNewDialog}
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
                onClick={openDuplicateDialog}
                disabled={isPending}
              >
                {t("duplicateRole")}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("superAdminNote")}</p>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th
                    className="sticky left-0 top-0 z-30 min-w-[200px] border-e border-border bg-muted/30 px-3 py-2 text-start font-semibold text-muted-foreground"
                  >
                    {t("matrixPermission")}
                  </th>
                  {editableRoles.map((role) => {
                    const isDirty = dirtyRoleIds.has(role.id);
                    const isSelected = role.id === selectedColumnId;
                    return (
                      <th
                        key={role.id}
                        className={cn(
                          "sticky top-0 z-20 min-w-[120px] border-e border-border bg-muted/30 px-2 py-2 text-center align-bottom last:border-e-0",
                          isSelected && "bg-primary/5",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedColumnId(role.id)}
                          className="flex w-full cursor-pointer flex-col items-center gap-0.5"
                        >
                          <span
                            className={cn(
                              "truncate font-semibold text-foreground",
                              isDirty && "text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {role.name}
                            {isDirty ? " •" : ""}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {role.slug}
                          </span>
                          {(usageMap.get(role.id) ?? 0) > 0 ? (
                            <span className="text-[9px] text-muted-foreground">
                              {t("usersAssigned", {
                                count: usageMap.get(role.id) ?? 0,
                              })}
                            </span>
                          ) : null}
                        </button>
                        {!role.isSystem ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="mx-auto mt-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
                              aria-label={t("renameRole")}
                            >
                              <MoreHorizontal className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-36">
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs"
                                onClick={() => openRenameDialog(role)}
                              >
                                <Pencil className="size-3.5" />
                                {t("renameRole")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedColumnId(role.id);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                                {t("deleteRole")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((category) => (
                  <Fragment key={category}>
                    <tr className="bg-muted/50">
                      <td
                        colSpan={colCount}
                        className="sticky left-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {category}
                      </td>
                    </tr>
                    {(byCategory[category] ?? []).map((perm) => {
                      const inCatalog = CATALOG_SLUG_SET.has(perm.slug);
                      return (
                        <tr
                          key={perm.slug}
                          className="border-b border-border/60 hover:bg-muted/20"
                        >
                          <td className="sticky left-0 z-10 border-e border-border bg-background px-3 py-1.5 text-start font-medium">
                            {perm.label}
                            {!inCatalog ? (
                              <span className="ms-1 text-[9px] font-normal text-muted-foreground">
                                ({t("unknownPermission")})
                              </span>
                            ) : null}
                          </td>
                          {editableRoles.map((role) => (
                            <td
                              key={`${role.id}-${perm.slug}`}
                              className={cn(
                                "border-e border-border/60 px-2 py-1 text-center last:border-e-0",
                                role.id === selectedColumnId && "bg-primary/5",
                              )}
                            >
                              <Switch
                                checked={
                                  permissionsByRole[role.id]?.has(perm.slug) ?? false
                                }
                                onCheckedChange={(on) =>
                                  toggle(role.id, perm.slug, on)
                                }
                                disabled={isPending}
                                className="mx-auto"
                                aria-label={`${role.name} — ${perm.label}`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
            {hasDirty ? (
              <span className="me-auto text-[10px] text-amber-600 dark:text-amber-400">
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

      {/* New role */}
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
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role-slug">{t("roleSlug")}</Label>
              <Input
                id="new-role-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                className="h-9 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("startFromRole")}</Label>
              <Select
                value={formTemplateId}
                onValueChange={(v) => setFormTemplateId(v ?? "")}
              >
                <SelectTrigger className="h-9 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="cursor-pointer">
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

      {/* Duplicate role */}
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
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-role-slug">{t("roleSlug")}</Label>
              <Input
                id="dup-role-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                className="h-9 font-mono text-sm"
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

      {/* Rename */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("dialogs.renameTitle")}</DialogTitle>
            <DialogDescription>{t("dialogs.renameDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="rename-role-name">{t("roleName")}</Label>
            <Input
              id="rename-role-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1.5 h-9"
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

      {/* Delete */}
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
