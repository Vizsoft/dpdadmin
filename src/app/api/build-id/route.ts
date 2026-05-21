import { NextResponse } from "next/server";
import { resolveBuildId } from "@/lib/app/build-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const buildId = resolveBuildId();

  return NextResponse.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
