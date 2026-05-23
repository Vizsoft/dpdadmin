"use client";

import { DriverFormSheet } from "./driver-form-sheet";
import type { DriverDetailModel } from "./types";

export function DriverEditSheet({
  driver,
  intakeId,
  open,
  onOpenChange,
}: {
  driver: DriverDetailModel;
  intakeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DriverFormSheet
      mode="edit"
      driver={driver}
      intakeId={intakeId}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
