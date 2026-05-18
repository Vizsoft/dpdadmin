import { PageSkeleton } from "@/components/dashboard/page-skeleton";

export default function DashboardHomeLoading() {
  return <PageSkeleton showTabs={false} kpiCount={6} columns={4} tableRows={4} />;
}
