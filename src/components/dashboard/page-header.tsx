"use client";

import type { ReactNode } from "react";
import { useRegisterPageHeader } from "@/contexts/page-header-context";

export function PageHeader({
  title,
  subtitle,
  actions,
  tabs,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
}) {
  useRegisterPageHeader({ title, subtitle, actions, tabs });
  return null;
}
