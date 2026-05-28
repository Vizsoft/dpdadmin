import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";

export type InvalidateDriverCachesInput = {
  intakeId?: string | null;
  profileId?: string | null;
};

/** Await invalidation so list/detail/documents refetch before UI reads stale cache. */
export async function invalidateDriverCaches(
  queryClient: QueryClient,
  input: InvalidateDriverCachesInput = {},
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
  if (input.intakeId) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.drivers.detail(input.intakeId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.drivers.documents(input.intakeId, input.profileId ?? null),
    });
  }
}
