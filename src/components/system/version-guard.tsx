"use client";

import { useEffect, useState } from "react";
import { UpdateRequiredDialog } from "@/components/system/update-required-dialog";

const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "development";
const POLL_MS = 60_000;

export function VersionGuard() {
  const [updateRequired, setUpdateRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/build-id", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (!cancelled && data.buildId && data.buildId !== CLIENT_BUILD_ID) {
          setUpdateRequired(true);
        }
      } catch {
        // ignore network errors during polling
      }
    }

    void check();
    const interval = window.setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!updateRequired) {
    return null;
  }

  return <UpdateRequiredDialog />;
}
