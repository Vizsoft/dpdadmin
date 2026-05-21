import type { ReactNode } from "react";
import { AppSettingsLayout } from "@/components/app";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <AppSettingsLayout>{children}</AppSettingsLayout>;
}
