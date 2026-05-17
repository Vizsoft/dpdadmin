"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppRole } from "@/types/database";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

type AuthContextValue = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: AppRole;
  locale: string;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: Omit<AuthContextValue, "can">;
}) {
  const can = (permission: Permission) => hasPermission(value.role, permission);

  return (
    <AuthContext.Provider value={{ ...value, can }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
