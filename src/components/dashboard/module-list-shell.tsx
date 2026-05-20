import { PageContentHeader } from "@/components/dashboard/page-content-header";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { DataTableShell } from "@/components/dashboard/data-table-shell";
import { TabBar, type TabItem } from "@/components/dashboard/tab-bar";
import type { ReactNode } from "react";

export function ModuleListShell({
  title,
  subtitle,
  actions,
  tabs,
  activeTabId,
  kpis,
  columns,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  tabs?: TabItem[];
  activeTabId?: string;
  kpis: { label: string; value: string | number }[];
  columns: string[];
  emptyTitle: string;
  emptyDescription?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <PageContentHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        tabs={
          tabs && activeTabId ? (
            <TabBar items={tabs} activeId={activeTabId} />
          ) : undefined
        }
      />
      <KpiGrid items={kpis} />
      {children}
      <DataTableShell
        columns={columns}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
