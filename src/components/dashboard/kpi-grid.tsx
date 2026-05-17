import { KpiCard } from "@/components/dashboard/kpi-card";

export function KpiGrid({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((kpi) => (
        <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
      ))}
    </div>
  );
}
