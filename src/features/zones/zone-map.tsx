"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import type { ZoneMapInner } from "./zone-map-inner";

const ZoneMapInnerDynamic = dynamic(
  () => import("./zone-map-inner").then((m) => m.ZoneMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export type ZoneMapProps = ComponentProps<typeof ZoneMapInner>;

export function ZoneMap(props: ZoneMapProps) {
  return <ZoneMapInnerDynamic {...props} />;
}
