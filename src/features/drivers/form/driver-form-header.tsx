"use client";

import { SectionLabel } from "./driver-form-primitives";
import { DriverFormStepper, type DriverFormStepId } from "./driver-form-stepper";

export function DriverFormHeader({
  title,
  subtitle,
  progressLabel,
  stepLabels,
  activeStep,
  onStepClick,
}: {
  title: string;
  subtitle: string;
  progressLabel: string;
  stepLabels: Record<DriverFormStepId, string>;
  activeStep: DriverFormStepId;
  onStepClick: (stepId: DriverFormStepId) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-8 py-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-2">
        <SectionLabel>{progressLabel}</SectionLabel>
        <DriverFormStepper activeStep={activeStep} onStepClick={onStepClick} labels={stepLabels} />
      </div>
    </div>
  );
}

