/** Stable id for local dev — client and /api/build-id must match. */
export const DEV_BUILD_ID = "development";

/**
 * Build / deployment identity for the update-required gate.
 * Prefer VERCEL_DEPLOYMENT_ID so redeploys trigger a refresh even on the same git commit.
 */
export function resolveBuildId(env: NodeJS.ProcessEnv = process.env): string {
  if (env.NODE_ENV === "development") {
    return DEV_BUILD_ID;
  }

  return (
    env.VERCEL_DEPLOYMENT_ID ??
    env.VERCEL_GIT_COMMIT_SHA ??
    env.NEXT_PUBLIC_BUILD_ID ??
    "unknown"
  );
}
