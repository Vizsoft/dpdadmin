"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function AddDriverPageShell() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/drivers?add=1");
  }, [router]);

  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
