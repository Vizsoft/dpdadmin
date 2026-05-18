"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { getMenuConfig } from "@/services/menu-config-service";
import {
  buildInitialTree,
  mergeMenu,
  resolveForSidebar,
  type ResolvedMenuNode,
} from "@/lib/menu/menu-merge";

const cacheByRole = new Map<string, ResolvedMenuNode[]>();

function menuStorageKey(role: string) {
  return `sidebar-menu-cache:v4:${role}`;
}

function loadCachedMenu(role: string): ResolvedMenuNode[] {
  const mem = cacheByRole.get(role);
  if (mem?.length) return mem;
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(menuStorageKey(role));
    if (raw) {
      const parsed = JSON.parse(raw) as ResolvedMenuNode[];
      cacheByRole.set(role, parsed);
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveCachedMenu(role: string, tree: ResolvedMenuNode[]) {
  cacheByRole.set(role, tree);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(menuStorageKey(role), JSON.stringify(tree));
  } catch {
    /* ignore */
  }
}

export function useSidebarMenu() {
  const { adminRoleSlug, can, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: tree = [], isLoading: loading } = useQuery({
    queryKey: ["sidebar-menu", adminRoleSlug, isSuperAdmin],
  queryFn: async () => {
      const cached = loadCachedMenu(adminRoleSlug);
      if (cached.length > 0) return cached;

      try {
        const cfg = await getMenuConfig(adminRoleSlug);
        const { tree: merged } = mergeMenu(cfg);
        const resolved = resolveForSidebar(merged, can, isSuperAdmin);
        if (resolved.length === 0) {
          const fallback = buildInitialTree(can, isSuperAdmin);
          saveCachedMenu(adminRoleSlug, fallback);
          return fallback;
        }
        saveCachedMenu(adminRoleSlug, resolved);
        return resolved;
      } catch {
        const fallback = buildInitialTree(can, isSuperAdmin);
        saveCachedMenu(adminRoleSlug, fallback);
        return fallback;
      }
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ role?: string }>).detail;
      if (!detail?.role || detail.role === adminRoleSlug) {
        cacheByRole.delete(adminRoleSlug);
        void queryClient.invalidateQueries({
          queryKey: ["sidebar-menu", adminRoleSlug],
        });
      }
    };
    window.addEventListener("menu-config-updated", onUpdate);
    return () => window.removeEventListener("menu-config-updated", onUpdate);
  }, [adminRoleSlug, queryClient]);

  return { tree, loading };
}
