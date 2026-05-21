"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { cn } from "@/lib/utils";
import { createPartner, deletePartner, updatePartner } from "./partners-actions";
import { isPartnerErrorKey } from "./partner-errors";
import type { PartnerRow } from "./types";

function partnerErrorToast(
  t: ReturnType<typeof useTranslations<"pages.partners">>,
  error?: string,
) {
  if (error && isPartnerErrorKey(error)) {
    return t(`errors.${error}`);
  }
  return t("errors.save_failed");
}

function PartnerFormBody({
  partner,
  onClose,
  onSaved,
  onDeleted,
  onRequestDelete,
}: {
  partner: PartnerRow | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onRequestDelete: () => void;
}) {
  const t = useTranslations("pages.partners");
  const { can } = useAuth();
  const canManage = can("partners.manage");
  const isEdit = Boolean(partner);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(partner?.name ?? "");
  const [description, setDescription] = useState(partner?.description ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(partner?.logo_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    setRemoveLogo(false);
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (logoFile) formData.append("logo", logoFile);
      if (removeLogo) formData.append("removeLogo", "true");
      if (isEdit && partner) formData.append("id", partner.id);

      const result =
        isEdit && partner ? await updatePartner(formData) : await createPartner(formData);

      if (result.error) {
        toast.error(partnerErrorToast(t, result.error));
        return;
      }

      if (result.logoWarning && isPartnerErrorKey(result.logoWarning)) {
        toast.warning(t(`errors.${result.logoWarning}`));
      }

      toast.success(isEdit ? t("updated") : t("created"));
      onClose();
      onSaved();
    });
  };

  return (
    <>
      <DialogHeader className="border-b border-border px-6 py-4 pr-14">
        <DialogTitle>{isEdit ? t("editPartnerTitle") : t("addPartnerTitle")}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="partner-name">{t("fieldTitle")}</Label>
          <Input
            id="partner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("fieldTitlePlaceholder")}
            className="rounded-lg"
          />
          <p className="text-[11px] text-muted-foreground">{t("titleHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="partner-description">{t("fieldDescription")}</Label>
          <textarea
            id="partner-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fieldDescriptionPlaceholder")}
            rows={3}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
            )}
          />
          <p className="text-[11px] text-muted-foreground">{t("descriptionHint")}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("fieldLogo")}</Label>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              {logoPreview && !removeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">{t("noLogo")}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-lg"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="me-2 h-3.5 w-3.5" />
                {t("uploadLogo")}
              </Button>
              {logoPreview && !removeLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-destructive hover:text-destructive"
                  onClick={() => {
                    setRemoveLogo(true);
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                >
                  {t("removeLogo")}
                </Button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("logoHint")}</p>
        </div>
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
        {isEdit && canManage ? (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if ((partner?.driver_count ?? 0) > 0) {
                toast.error(t("errors.has_drivers"));
                return;
              }
              onRequestDelete();
            }}
            disabled={isPending || (partner?.driver_count ?? 0) > 0}
            title={
              (partner?.driver_count ?? 0) > 0 ? t("errors.has_drivers") : undefined
            }
          >
            <Trash2 className="me-2 h-3.5 w-3.5" />
            {t("deletePartner")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            onClick={onClose}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            onClick={handleSave}
            disabled={isPending || !name.trim()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              t("saveChanges")
            ) : (
              t("createPartner")
            )}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

type PartnerFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: PartnerRow | null;
  onSaved: () => void;
  onDeleted: () => void;
};

export function PartnerFormSheet({
  open,
  onOpenChange,
  partner,
  onSaved,
  onDeleted,
}: PartnerFormSheetProps) {
  const t = useTranslations("pages.partners");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const runDelete = async () => {
    if (!partner) return;
    const result = await deletePartner(partner.id);
    if (result.error) {
      toast.error(partnerErrorToast(t, result.error));
      throw new Error(result.error);
    }
    toast.success(t("deleted"));
    onOpenChange(false);
    onDeleted();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-md flex-col gap-0" showCloseButton>
          {open ? (
            <PartnerFormBody
              key={partner?.id ?? "new"}
              partner={partner ?? null}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
              onDeleted={onDeleted}
              onRequestDelete={() => setDeleteOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {partner ? (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemTitle={t("deletePartner")}
          itemName={partner.name}
          confirmText={partner.name}
          onConfirm={runDelete}
        />
      ) : null}
    </>
  );
}
