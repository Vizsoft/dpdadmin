"use client";

import Image from "next/image";
import { useBrandingOptional } from "@/contexts/branding-context";
import { DEFAULT_APP_SETTINGS } from "@/lib/branding/constants";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 32,
  md: 36,
  lg: 48,
} as const;

type LogoProps = {
  size?: keyof typeof sizeMap;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = "md", className, priority }: LogoProps) {
  const branding = useBrandingOptional();
  const px = sizeMap[size];
  const logoUrl = branding?.logoUrl ?? DEFAULT_APP_SETTINGS.logo_url;
  const logoType = branding?.logoType ?? DEFAULT_APP_SETTINGS.logo_type;
  const appName = branding?.appName ?? DEFAULT_APP_SETTINGS.app_name;
  const src = logoUrl ?? "/logo.png";
  const isRemote = src.startsWith("http");
  const isSvg = logoType === "svg" || src.endsWith(".svg");

  if (isSvg || isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={appName}
        width={px}
        height={px}
        className={cn("shrink-0 rounded-lg object-contain", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={appName}
      width={px}
      height={px}
      priority={priority}
      className={cn("shrink-0 rounded-lg object-contain", className)}
    />
  );
}
