"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateRolePermissions } from "@/features/settings/roles-actions";
import type { AdminRoleRow } from "@/lib/auth/get-role-permissions";
import { PERMISSIONS, type Permission } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export type PermissionRow = {
  slug: string;
  label: string;
  category: string;
};

export function RolesPermissionsPanel({
  roles,
  permissions,
}: {
  roles: AdminRoleRow[];
  permissions: PermissionRow[];
}) {
  const t = useTranslations("pages.settings.roles");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const editableRoles = useMemo(
    () => roles.filter((r) => !r.isSuperAdmin),
    [roles],
  );

  const [selectedRoleId, setSelectedRoleId] = useState(editableRoles[0]?.id ?? "");
  const selectedRole = editableRoles.find((r) => r.id === selectedRoleId) ?? editableRoles[0];

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(selectedRole?.permissions ?? []),
  );

  const byCategory = permissions.reduce<Record<string, PermissionRow[]>>((acc, p) => {
    const list = acc[p.category] ?? [];
    list.push(p);
    acc[p.category] = list;
    return acc;
  }, {});

  function selectRole(roleId: string) {
    const role = editableRoles.find((r) => r.id === roleId);
    setSelectedRoleId(roleId);
    setChecked(new Set(role?.permissions ?? []));
  }

  function toggle(slug: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roleSelect">{t("selectRole")}</Label>
          <select
            id="roleSelect"
            className="h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm"
            value={selectedRoleId}
            onChange={(e) => selectRole(e.target.value)}
            disabled={isPending}
          >
            {editableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium capitalize">{category}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((perm) => {
                const slug = perm.slug as Permission;
                if (!Object.values(PERMISSIONS).includes(slug)) return null;
                return (
                  <li key={perm.slug} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id={`perm-${perm.slug}`}
                      className="size-4 rounded border-input"
                      checked={checked.has(perm.slug)}
                      onChange={() => toggle(perm.slug)}
                      disabled={isPending}
                    />
                    <label htmlFor={`perm-${perm.slug}`} className="cursor-pointer">
                      {perm.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <Button
          className="cursor-pointer rounded-lg"
          disabled={isPending || !selectedRoleId}
          onClick={() => {
            startTransition(async () => {
              const result = await updateRolePermissions(
                selectedRoleId,
                Array.from(checked),
              );
              if (result.error) {
                toast.error(t("errors.saveFailed"));
                return;
              }
              toast.success(t("saved"));
              router.refresh();
            });
          }}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
