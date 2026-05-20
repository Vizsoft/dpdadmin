import type { ReactNode } from "react";
import { SettingsSecondaryNav } from "@/components/layout/settings-secondary-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-m-4 flex min-h-full flex-1 overflow-hidden md:-m-6">
      <SettingsSecondaryNav />
      <div className="flex-1 space-y-4 overflow-auto p-4 md:p-6">{children}</div>
    </div>
  );
}
