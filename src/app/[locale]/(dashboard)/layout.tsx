import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-permission";
import { AuthProvider } from "@/contexts/auth-context";
import { PageHeaderProvider } from "@/contexts/page-header-context";
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
      <PageHeaderProvider>
        <div className="min-h-svh bg-background p-3">
          <SidebarProvider>
            <div className="flex min-h-[calc(100svh-1.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_24px_rgba(15,15,15,0.06)]">
              <AppSidebar />
              <SidebarInset className="flex flex-col bg-card">
                <AppHeader />
                <main className="flex-1 space-y-6 overflow-auto p-6">{children}</main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </PageHeaderProvider>
    </AuthProvider>
  );
}
