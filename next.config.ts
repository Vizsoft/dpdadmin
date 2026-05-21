import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { DEV_BUILD_ID, resolveBuildId } from "./src/lib/app/build-id";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const buildId =
  process.env.NODE_ENV === "development"
    ? DEV_BUILD_ID
    : resolveBuildId(process.env);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
};

export default withNextIntl(nextConfig);
