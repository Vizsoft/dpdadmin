import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { requireAuth } from "@/lib/auth/require-permission";
import { getAppOpsSettings } from "@/lib/auth/app-settings";
import { redirect } from "@/i18n/navigation";
import { AuthProvider } from "@/contexts/auth-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

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
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <SidebarProvider className="flex h-svh w-full overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden bg-background">
            <main className="flex-1 overflow-auto px-6 py-4 md:px-8 md:py-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AuthProvider>
  );
}
