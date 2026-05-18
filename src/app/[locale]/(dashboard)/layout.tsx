import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-permission";
import { getAppOpsSettings } from "@/lib/auth/app-settings";
import { redirect } from "@/i18n/navigation";
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
  const ops = await getAppOpsSettings();

  if (ops.maintenanceMode && !session.isSuperAdmin) {
    redirect({ href: "/maintenance", locale });
  }

  return (
    <AuthProvider
      value={{
        userId: session.id,
        email: session.email,
        fullName: session.profile.full_name,
        role: session.profile.role,
        locale: session.profile.locale,
        adminRoleId: session.profile.admin_role_id,
        approvalStatus: session.profile.approval_status,
        isSuperAdmin: session.isSuperAdmin,
        adminRoleSlug: session.adminRoleSlug,
        permissions: Array.from(session.permissions),
      }}
    >
      <PageHeaderProvider>
        <div className="flex min-h-svh w-full bg-background">
          <SidebarProvider className="flex min-h-svh w-full">
            <AppSidebar />
            <SidebarInset className="flex min-h-svh min-w-0 flex-1 flex-col bg-card shadow-[0_0_24px_rgba(15,15,15,0.04)]">
              <AppHeader />
              <main className="flex-1 space-y-6 overflow-auto p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </PageHeaderProvider>
    </AuthProvider>
  );
}
