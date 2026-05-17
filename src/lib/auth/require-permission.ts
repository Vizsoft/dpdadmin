import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "./get-session";
import { hasPermission, type Permission } from "./permissions";

export async function requireAuth(locale: string) {
  const session = await getSessionUser();
  if (!session) {
    redirect({ href: "/login", locale });
    throw new Error("Unauthenticated");
  }
  return session;
}

export async function requirePermission(locale: string, permission: Permission) {
  const session = await requireAuth(locale);
  if (!hasPermission(session.profile.role, permission)) {
    redirect({ href: "/unauthorized", locale });
  }
  return session;
}
