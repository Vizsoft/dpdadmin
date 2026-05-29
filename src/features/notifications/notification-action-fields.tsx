"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTIFICATION_ACTION_TYPES } from "./constants";
import { RequiredLabel } from "./notification-form-primitives";
import type { NotificationActionType } from "./types";

const DRIVER_SCREENS = ["home", "deliveries", "earnings", "profile", "notifications"] as const;
const DRIVER_MODULES = ["deliveries", "earnings", "attendance", "documents", "support"] as const;

export function buildActionParams(
  actionType: NotificationActionType,
  fields: Record<string, string>,
): Record<string, unknown> {
  switch (actionType) {
    case "open_screen":
      return { screen: fields.screen || "home" };
    case "open_module":
      return { module: fields.module || "deliveries" };
    case "open_record":
      return {
        module: fields.module || "deliveries",
        record_id: fields.recordId || "",
      };
    case "open_workflow":
      return { workflow: fields.workflow || "delivery_submit" };
    case "open_url":
      return { url: fields.url || "" };
    case "custom_payload":
      return { payload: fields.payload ? JSON.parse(fields.payload) : {} };
    case "silent_update_trigger":
      return { trigger: fields.trigger || "refresh_home" };
    default:
      return {};
  }
}

export function parseActionFields(
  actionType: NotificationActionType,
  params: Record<string, unknown>,
): Record<string, string> {
  switch (actionType) {
    case "open_screen":
      return { screen: String(params.screen ?? "home") };
    case "open_module":
      return { module: String(params.module ?? "deliveries") };
    case "open_record":
      return {
        module: String(params.module ?? "deliveries"),
        recordId: String(params.record_id ?? ""),
      };
    case "open_workflow":
      return { workflow: String(params.workflow ?? "delivery_submit") };
    case "open_url":
      return { url: String(params.url ?? "") };
    case "custom_payload":
      return { payload: JSON.stringify(params.payload ?? {}, null, 2) };
    case "silent_update_trigger":
      return { trigger: String(params.trigger ?? "refresh_home") };
    default:
      return {};
  }
}

export function NotificationActionFields({
  actionType,
  fields,
  onActionTypeChange,
  onFieldChange,
}: {
  actionType: NotificationActionType;
  fields: Record<string, string>;
  onActionTypeChange: (type: NotificationActionType) => void;
  onFieldChange: (key: string, value: string) => void;
}) {
  const t = useTranslations("pages.notifications");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <RequiredLabel>{t("fieldActionType")}</RequiredLabel>
        <Select value={actionType} onValueChange={(v) => onActionTypeChange(v as NotificationActionType)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_ACTION_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`actionTypes.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {actionType === "open_screen" ? (
        <div className="space-y-1">
          <RequiredLabel required>{t("fieldActionScreen")}</RequiredLabel>
          <Select value={fields.screen ?? "home"} onValueChange={(v) => onFieldChange("screen", v ?? "home")}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRIVER_SCREENS.map((screen) => (
                <SelectItem key={screen} value={screen}>
                  {t(`actionScreens.${screen}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {actionType === "open_module" ? (
        <div className="space-y-1">
          <RequiredLabel required>{t("fieldActionModule")}</RequiredLabel>
          <Select
            value={fields.module ?? "deliveries"}
            onValueChange={(v) => onFieldChange("module", v ?? "deliveries")}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRIVER_MODULES.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {t(`actionModules.${mod}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {actionType === "open_record" ? (
        <>
          <div className="space-y-1">
            <RequiredLabel required>{t("fieldActionModule")}</RequiredLabel>
            <Select
              value={fields.module ?? "deliveries"}
              onValueChange={(v) => onFieldChange("module", v ?? "deliveries")}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVER_MODULES.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {t(`actionModules.${mod}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <RequiredLabel required>{t("fieldActionRecordId")}</RequiredLabel>
            <Input
              className="h-9"
              value={fields.recordId ?? ""}
              onChange={(e) => onFieldChange("recordId", e.target.value)}
            />
          </div>
        </>
      ) : null}

      {actionType === "open_workflow" ? (
        <div className="space-y-1">
          <RequiredLabel required>{t("fieldActionWorkflow")}</RequiredLabel>
          <Input
            className="h-9"
            value={fields.workflow ?? "delivery_submit"}
            onChange={(e) => onFieldChange("workflow", e.target.value)}
          />
        </div>
      ) : null}

      {actionType === "open_url" ? (
        <div className="space-y-1">
          <RequiredLabel required>{t("fieldActionUrl")}</RequiredLabel>
          <Input
            className="h-9"
            type="url"
            value={fields.url ?? ""}
            onChange={(e) => onFieldChange("url", e.target.value)}
          />
        </div>
      ) : null}

      {actionType === "silent_update_trigger" ? (
        <div className="space-y-1">
          <RequiredLabel required>{t("fieldActionTrigger")}</RequiredLabel>
          <Input
            className="h-9"
            value={fields.trigger ?? "refresh_home"}
            onChange={(e) => onFieldChange("trigger", e.target.value)}
          />
        </div>
      ) : null}

      {actionType === "custom_payload" ? (
        <div className="space-y-1">
          <Label>{t("fieldActionParams")}</Label>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            value={fields.payload ?? "{}"}
            onChange={(e) => onFieldChange("payload", e.target.value)}
          />
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{t("actionStepHint")}</p>
    </div>
  );
}
