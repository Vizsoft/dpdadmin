"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  FolderPlus,
  Loader2,
  PanelRight,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconPicker } from "@/components/menu-editor/icon-picker";
import {
  copyMenuConfig,
  getMenuConfig,
  resetMenuConfig,
  saveMenuConfig,
  type MenuNode,
} from "@/services/menu-config-service";
import { mergeMenu } from "@/lib/menu/menu-merge";
import { MENU_REGISTRY } from "@/lib/menu/menu-registry";
import { cn } from "@/lib/utils";
import type { AdminRoleRow } from "@/lib/auth/get-role-permissions";

const NONE_GROUP = "__none__";

function humanizeRole(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function roleLabel(roles: AdminRoleRow[], slug: string): string {
  return roles.find((r) => r.slug === slug)?.name ?? humanizeRole(slug);
}

function notifyMenuConfigUpdated(targetRole: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`sidebar-menu-cache:v3:${targetRole}`);
    window.dispatchEvent(
      new CustomEvent("menu-config-updated", { detail: { role: targetRole } }),
    );
  } catch {
    /* ignore */
  }
}

type FlatRow = {
  itemId: string;
  label: string;
  icon: string;
  hidden: boolean;
  groupId: string;
};

type OrderEntry = { kind: "group" | "item"; id: string };

function flattenTree(tree: MenuNode[]): {
  rows: FlatRow[];
  groups: MenuNode[];
  order: OrderEntry[];
} {
  const rows: FlatRow[] = [];
  const groups: MenuNode[] = [];
  const order: OrderEntry[] = [];
  for (const n of tree) {
    if (n.type === "group") {
      groups.push(n);
      order.push({ kind: "group", id: n.id });
      for (const child of n.children || []) {
        if (child.type === "item") {
          rows.push({
            itemId: child.id,
            label: child.label,
            icon: child.icon,
            hidden: !!child.hidden,
            groupId: n.id,
          });
        }
      }
    } else if (n.type === "item") {
      order.push({ kind: "item", id: n.id });
      rows.push({
        itemId: n.id,
        label: n.label,
        icon: n.icon,
        hidden: !!n.hidden,
        groupId: NONE_GROUP,
      });
    }
  }
  return { rows, groups, order };
}

function rebuildTree(
  rows: FlatRow[],
  groups: MenuNode[],
  order: OrderEntry[],
): MenuNode[] {
  const rowByItem = new Map<string, FlatRow>();
  for (const r of rows) rowByItem.set(r.itemId, r);
  const groupById = new Map<string, MenuNode>();
  for (const g of groups) groupById.set(g.id, g);
  const rowsByGroup = new Map<string, FlatRow[]>();
  for (const r of rows) {
    if (r.groupId === NONE_GROUP) continue;
    if (!rowsByGroup.has(r.groupId)) rowsByGroup.set(r.groupId, []);
    rowsByGroup.get(r.groupId)!.push(r);
  }
  const result: MenuNode[] = [];
  const seenItems = new Set<string>();
  for (const entry of order) {
    if (entry.kind === "item") {
      const r = rowByItem.get(entry.id);
      if (r && r.groupId === NONE_GROUP) {
        result.push({
          id: r.itemId,
          type: "item",
          label: r.label,
          icon: r.icon,
          hidden: r.hidden,
        });
        seenItems.add(r.itemId);
      }
    } else {
      const g = groupById.get(entry.id);
      if (!g) continue;
      const children = (rowsByGroup.get(g.id) || []).map((r) => ({
        id: r.itemId,
        type: "item" as const,
        label: r.label,
        icon: r.icon,
        hidden: r.hidden,
      }));
      if (children.length > 0 || g.id.startsWith("group-custom-")) {
        result.push({ ...g, children });
      }
    }
  }
  for (const r of rows) {
    if (r.groupId === NONE_GROUP && !seenItems.has(r.itemId)) {
      result.push({
        id: r.itemId,
        type: "item",
        label: r.label,
        icon: r.icon,
        hidden: r.hidden,
      });
    }
  }
  return result;
}

export function MenuEditorPanel({ roles }: { roles: AdminRoleRow[] }) {
  const t = useTranslations("pages.settings.menuEditor");
  const [role, setRole] = useState("");
  const [rows, setRows] = useState<FlatRow[]>([]);
  const [groups, setGroups] = useState<MenuNode[]>([]);
  const [order, setOrder] = useState<OrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [copyFromRole, setCopyFromRole] = useState("");
  const [copyToRole, setCopyToRole] = useState("");

  useEffect(() => {
    if (roles.length > 0 && !role) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap default role tab
      setRole(roles[0]!.slug);
    }
  }, [roles, role]);

  useEffect(() => {
    if (role) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep copy target in sync with active tab
      setCopyToRole(role);
    }
  }, [role]);

  useEffect(() => {
    if (roles.length === 0 || copyFromRole) return;
    const other = roles.find((r) => r.slug !== role);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- default copy source to a different role
    setCopyFromRole(other?.slug ?? roles[0]!.slug);
  }, [roles, role, copyFromRole]);

  const applyMenuTree = useCallback((tree: MenuNode[], markDirty: boolean) => {
    const flat = flattenTree(tree);
    setRows(flat.rows);
    setGroups(flat.groups);
    setOrder(flat.order);
    setDirty(markDirty);
  }, []);

  const load = useCallback(async (r: string) => {
    if (!r) return;
    setLoading(true);
    try {
      const cfg = await getMenuConfig(r);
      const { tree } = mergeMenu(cfg);
      applyMenuTree(tree, false);
    } finally {
      setLoading(false);
    }
  }, [applyMenuTree]);

  useEffect(() => {
    if (role) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reload editor when role tab changes
      void load(role);
    }
  }, [role, load]);

  const updateRow = (itemId: string, patch: Partial<FlatRow>) => {
    setRows((rs) => {
      const row = rs.find((r) => r.itemId === itemId);
      if (!row) return rs;
      const nextGroupId = patch.groupId ?? row.groupId;
      if (patch.groupId !== undefined && patch.groupId !== row.groupId) {
        setOrder((o) => {
          const has = o.some((e) => e.kind === "item" && e.id === itemId);
          if (nextGroupId === NONE_GROUP && !has) {
            return [...o, { kind: "item", id: itemId }];
          }
          if (nextGroupId !== NONE_GROUP && has) {
            return o.filter((e) => !(e.kind === "item" && e.id === itemId));
          }
          return o;
        });
      }
      return rs.map((r) => (r.itemId === itemId ? { ...r, ...patch } : r));
    });
    setDirty(true);
  };

  const moveRow = (itemId: string, dir: -1 | 1) => {
    const row = rows.find((r) => r.itemId === itemId);
    if (!row) return;
    if (row.groupId === NONE_GROUP) {
      setOrder((o) => {
        const idx = o.findIndex((e) => e.kind === "item" && e.id === itemId);
        if (idx < 0) return o;
        const target = idx + dir;
        if (target < 0 || target >= o.length) return o;
        const copy = [...o];
        const [moved] = copy.splice(idx, 1);
        copy.splice(target, 0, moved!);
        return copy;
      });
      setDirty(true);
      return;
    }
    setRows((rs) => {
      const sameGroup = rs.filter((r) => r.groupId === row.groupId);
      const idxInGroup = sameGroup.findIndex((r) => r.itemId === itemId);
      const targetIdx = idxInGroup + dir;
      if (targetIdx < 0 || targetIdx >= sameGroup.length) return rs;
      const groupRowsReordered = [...sameGroup];
      const [moved] = groupRowsReordered.splice(idxInGroup, 1);
      groupRowsReordered.splice(targetIdx, 0, moved!);
      const newOrder: FlatRow[] = [];
      let gc = 0;
      for (const r of rs) {
        newOrder.push(r.groupId === row.groupId ? groupRowsReordered[gc++]! : r);
      }
      return newOrder;
    });
    setDirty(true);
  };

  const moveEntry = (idx: number, dir: -1 | 1) => {
    setOrder((o) => {
      const target = idx + dir;
      if (target < 0 || target >= o.length) return o;
      const copy = [...o];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved!);
      return copy;
    });
    setDirty(true);
  };

  const addGroup = () => {
    const id = `group-custom-${Date.now()}`;
    setGroups((g) => [
      ...g,
      { id, type: "group", label: t("newGroupLabel"), icon: "Folder", children: [] },
    ]);
    setOrder((o) => [...o, { kind: "group", id }]);
    setDirty(true);
  };

  const deleteGroup = (gid: string) => {
    if (!gid.startsWith("group-custom-")) return;
    setRows((rs) =>
      rs.map((r) => {
        if (r.groupId !== gid) return r;
        setOrder((o) => {
          const has = o.some((e) => e.kind === "item" && e.id === r.itemId);
          return has ? o : [...o, { kind: "item", id: r.itemId }];
        });
        return { ...r, groupId: NONE_GROUP };
      }),
    );
    setGroups((g) => g.filter((x) => x.id !== gid));
    setOrder((o) => o.filter((e) => !(e.kind === "group" && e.id === gid)));
    setDirty(true);
  };

  const renameGroup = (gid: string, label: string) => {
    setGroups((g) => g.map((x) => (x.id === gid ? { ...x, label } : x)));
    setDirty(true);
  };

  const resetRow = (itemId: string) => {
    const reg = MENU_REGISTRY.find((r) => r.id === itemId);
    if (!reg) return;
    updateRow(itemId, {
      label: reg.defaultLabel,
      icon: reg.defaultIcon,
      hidden: false,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tree = rebuildTree(rows, groups, order);
      await saveMenuConfig(role, tree);
      setDirty(false);
      notifyMenuConfigUpdated(role);
      toast.success(t("saved"), {
        description: t("savedDesc", { role: roleLabel(roles, role) }),
      });
    } catch (err) {
      toast.error(t("saveFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(t("resetConfirm", { role: roleLabel(roles, role) }))) return;
    await resetMenuConfig(role);
    await load(role);
    toast.success(t("resetDone"));
  };

  const handleCopySettings = async () => {
    if (!copyFromRole || !copyToRole || copyFromRole === copyToRole) return;
    if (
      !confirm(
        t("copyConfirm", {
          from: roleLabel(roles, copyFromRole),
          to: roleLabel(roles, copyToRole),
        }),
      )
    ) {
      return;
    }

    setCopying(true);
    try {
      await copyMenuConfig(copyFromRole, copyToRole);
      notifyMenuConfigUpdated(copyToRole);
      if (copyToRole === role) {
        await load(role);
      }
      toast.success(t("copyDone"), {
        description: t("copyDoneDesc", {
          from: roleLabel(roles, copyFromRole),
          to: roleLabel(roles, copyToRole),
        }),
      });
    } catch (err) {
      toast.error(t("copyFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCopying(false);
    }
  };

  const handleLoadFromRole = async () => {
    if (!copyFromRole || copyFromRole === role) return;
    if (dirty && !confirm(t("loadFromDiscard"))) return;

    setLoading(true);
    try {
      const cfg = await getMenuConfig(copyFromRole);
      const { tree } = mergeMenu(cfg);
      applyMenuTree(tree, true);
      toast.success(t("loadedFrom"), {
        description: t("loadedFromDesc", { role: roleLabel(roles, copyFromRole) }),
      });
    } catch (err) {
      toast.error(t("copyFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRolesDisabled =
    !copyFromRole || !copyToRole || copyFromRole === copyToRole;

  const toggleGroupMode = (gid: string) => {
    setGroups((gs) =>
      gs.map((g) =>
        g.id === gid
          ? { ...g, displayMode: g.displayMode === "panel" ? "inline" : "panel" }
          : g,
      ),
    );
    setDirty(true);
  };

  const groupOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: NONE_GROUP, label: t("noGroup") },
    ];
    for (const g of groups) opts.push({ value: g.id, label: g.label });
    return opts;
  }, [groups, t]);

  const roleSelectItems = useMemo(
    () =>
      roles.map((r) => ({
        value: r.slug,
        label: r.name,
      })),
    [roles],
  );

  const rowByItem = useMemo(() => {
    const map = new Map<string, FlatRow>();
    for (const r of rows) map.set(r.itemId, r);
    return map;
  }, [rows]);

  const rowsByGroup = useMemo(() => {
    const map = new Map<string, FlatRow[]>();
    for (const r of rows) {
      if (r.groupId === NONE_GROUP) continue;
      if (!map.has(r.groupId)) map.set(r.groupId, []);
      map.get(r.groupId)!.push(r);
    }
    return map;
  }, [rows]);

  if (roles.length === 0 && !loading) {
    return <p className="text-sm text-muted-foreground">{t("noRoles")}</p>;
  }

  const renderRowControls = (r: FlatRow, idx: number, total: number) => (
    <div
      key={r.itemId}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50",
        r.hidden && "opacity-50",
      )}
    >
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => moveRow(r.itemId, -1)}
          disabled={idx === 0}
          className="h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => moveRow(r.itemId, 1)}
          disabled={idx === total - 1}
          className="h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      <IconPicker value={r.icon} onChange={(icon) => updateRow(r.itemId, { icon })} />
      <Input
        value={r.label}
        onChange={(e) => updateRow(r.itemId, { label: e.target.value })}
        className="h-7 flex-1 text-sm"
      />
      <Select
        items={groupOptions}
        value={r.groupId}
        onValueChange={(v) => v && updateRow(r.itemId, { groupId: v })}
      >
        <SelectTrigger className="h-7 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {groupOptions.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              label={o.label}
              className="text-xs"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => updateRow(r.itemId, { hidden: !r.hidden })}
        title={r.hidden ? t("show") : t("hide")}
        className="h-7 w-7"
      >
        {r.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => resetRow(r.itemId)}
        title={t("resetDefault")}
        className="h-7 w-7"
      >
        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-4">
      {roles.length > 0 && (
        <Tabs value={role} onValueChange={setRole}>
          <TabsList className="h-9">
            {roles.map((r) => (
              <TabsTrigger key={r.id} value={r.slug} className="text-xs">
                {r.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {roles.length > 1 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">{t("copySectionTitle")}</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("copyFrom")}</Label>
              <Select
                items={roleSelectItems}
                value={copyFromRole}
                onValueChange={(v) => v && setCopyFromRole(v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t("copyFrom")} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.slug} label={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            <div className="min-w-[140px] flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("copyTo")}</Label>
              <Select
                items={roleSelectItems}
                value={copyToRole}
                onValueChange={(v) => v && setCopyToRole(v)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder={t("copyTo")} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.slug} label={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 cursor-pointer"
              disabled={copyRolesDisabled || copying || saving}
              onClick={() => void handleCopySettings()}
            >
              {copying ? (
                <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="me-1.5 h-3.5 w-3.5" />
              )}
              {copying ? t("copying") : t("copySettings")}
            </Button>
            {copyFromRole && copyFromRole !== role && copyToRole === role && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 cursor-pointer"
                disabled={loading || copying || saving}
                onClick={() => void handleLoadFromRole()}
              >
                {t("loadIntoEditor")}
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("copySectionHint")}</p>
        </div>
      )}

      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {order.map((entry, entryIdx) => {
                if (entry.kind === "item") {
                  const r = rowByItem.get(entry.id);
                  if (!r || r.groupId !== NONE_GROUP) return null;
                  return (
                    <div key={`item-${entry.id}`} className="p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveEntry(entryIdx, -1)}
                            disabled={entryIdx === 0}
                            className="h-3 text-muted-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveEntry(entryIdx, 1)}
                            disabled={entryIdx === order.length - 1}
                            className="h-3 text-muted-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t("topLevel")}
                        </span>
                      </div>
                      {renderRowControls(r, 0, 1)}
                    </div>
                  );
                }
                const g = groups.find((x) => x.id === entry.id);
                if (!g) return null;
                const sectionRows = rowsByGroup.get(g.id) || [];
                const isPanel = g.displayMode === "panel";
                return (
                  <div key={`group-${g.id}`} className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moveEntry(entryIdx, -1)}
                          disabled={entryIdx === 0}
                          className="h-3 text-muted-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveEntry(entryIdx, 1)}
                          disabled={entryIdx === order.length - 1}
                          className="h-3 text-muted-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <IconPicker
                        value={g.icon || "Folder"}
                        onChange={(icon) => {
                          setGroups((gs) =>
                            gs.map((x) => (x.id === g.id ? { ...x, icon } : x)),
                          );
                          setDirty(true);
                        }}
                      />
                      <Input
                        value={g.label}
                        onChange={(e) => renameGroup(g.id, e.target.value)}
                        className="h-7 max-w-[220px] text-[11px] font-semibold uppercase tracking-wider"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        ({sectionRows.length})
                      </span>
                      <div className="flex-1" />
                      <Button
                        type="button"
                        size="sm"
                        variant={isPanel ? "default" : "outline"}
                        onClick={() => toggleGroupMode(g.id)}
                        className="h-6 gap-1 px-2 text-[10px]"
                      >
                        <PanelRight className="h-3 w-3" />
                        {isPanel ? t("panel") : t("inline")}
                      </Button>
                      {g.id.startsWith("group-custom-") && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteGroup(g.id)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {sectionRows.map((r, idx) =>
                        renderRowControls(r, idx, sectionRows.length),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addGroup}>
          <FolderPlus className="me-1.5 h-3.5 w-3.5" />
          {t("addGroup")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleReset}>
          {t("resetAll")}
        </Button>
        <div className="flex-1" />
        {dirty && (
          <span className="text-xs text-muted-foreground">{t("unsavedChanges")}</span>
        )}
        <Button type="button" size="sm" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
