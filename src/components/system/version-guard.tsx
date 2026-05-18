"use client";

import { useQuery } from "@tanstack/react-query";
import { UpdateRequiredDialog } from "@/components/system/update-required-dialog";
import { queryKeys } from "@/lib/query/query-keys";

const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "development";
const POLL_MS = 60_000;

async function fetchBuildId(): Promise<{ buildId: string }> {
  const res = await fetch("/api/build-id", { cache: "no-store" });
  if (!res.ok) throw new Error(`build-id ${res.status}`);
  return res.json() as Promise<{ buildId: string }>;
}

export function VersionGuard() {
  const { data, isSuccess } = useQuery({
    queryKey: queryKeys.app.buildId(),
    queryFn: fetchBuildId,
    staleTime: 30_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const updateRequired =
    isSuccess &&
    Boolean(data?.buildId) &&
    data.buildId !== CLIENT_BUILD_ID;

  if (!updateRequired) {
    return null;
  }

  return <UpdateRequiredDialog />;
}
