import type { ResolvedMenuNode } from "@/lib/menu/menu-merge";

/** Full-width pages under an inline group that should not show the secondary nav. */
export const PATHS_WITHOUT_INLINE_SECONDARY_NAV = ["/settings/roles"] as const;

function pathnameUsesFullWidthWithoutSecondaryNav(pathname: string): boolean {
  return PATHS_WITHOUT_INLINE_SECONDARY_NAV.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** First navigable child href for an inline group row in the main sidebar. */
export function firstChildHref(group: ResolvedMenuNode): string | null {
  for (const child of group.children ?? []) {
    if (child.href) return child.href;
  }
  return null;
}

/** True when pathname is under any child of this inline group. */
export function pathnameMatchesInlineGroup(
  group: ResolvedMenuNode,
  pathname: string,
): boolean {
  for (const child of group.children ?? []) {
    if (!child.href) continue;
    if (pathname === child.href || pathname.startsWith(`${child.href}/`)) {
      return true;
    }
  }
  return false;
}

export function findInlineGroupForPath(
  tree: ResolvedMenuNode[],
  pathname: string,
): ResolvedMenuNode | null {
  if (pathnameUsesFullWidthWithoutSecondaryNav(pathname)) {
    return null;
  }
  for (const node of tree) {
    if (node.type !== "group" || node.displayMode !== "inline") continue;
    if (pathnameMatchesInlineGroup(node, pathname)) return node;
  }
  return null;
}
