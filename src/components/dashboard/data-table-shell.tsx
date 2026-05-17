import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";

export function DataTableShell({
  columns,
  emptyTitle,
  emptyDescription,
  skeletonRows = 5,
}: {
  columns: string[];
  emptyTitle: string;
  emptyDescription?: string;
  skeletonRows?: number;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-border shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead key={col} className="text-xs font-semibold text-accent">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i} className="hover:bg-muted/40">
                {columns.map((col) => (
                  <TableCell key={col}>
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t border-border p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      </CardContent>
    </Card>
  );
}
