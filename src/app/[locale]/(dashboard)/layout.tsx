import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-permission";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await requireAuth(locale);

  return (
    <AuthProvider
      value={{
        userId: session.id,
        email: session.email,
        fullName: session.profile.full_name,
        role: session.profile.role,
        locale: session.profile.locale,
      }}
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 space-y-6 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
