"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  adminFormErrorMessages,
  salonStatusBadgeClass,
  salonStatusLabels,
  updateSalonStatusAsync,
} from "@/lib/admin/salons";
import { cn } from "@/lib/utils";
import type { SalonStatus } from "@/types/domain";

const statusOptions: SalonStatus[] = [
  "pending",
  "active",
  "suspended",
  "inactive",
];

type ChangeStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonId: string;
  currentStatus: SalonStatus;
  onSaved: () => void;
};

export function ChangeStatusDialog({
  open,
  onOpenChange,
  salonId,
  currentStatus,
  onSaved,
}: ChangeStatusDialogProps) {
  const [nextStatus, setNextStatus] = useState<SalonStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNextStatus(currentStatus);
    setError(null);
  }, [open, currentStatus]);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    const result = await updateSalonStatusAsync(salonId, nextStatus);
    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.errors
          .map((code) => adminFormErrorMessages[code] ?? code)
          .join(" · "),
      );
      return;
    }

    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>تغییر وضعیت سالن</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-muted-foreground">
            وضعیت جدید دسترسی سالن به پلتفرم را انتخاب کنید. سالن‌های
            تعلیق‌شده یا غیرفعال نمی‌توانند عملیات جدید انجام دهند؛ داده‌های
            تاریخی همچنان قابل مشاهده هستند.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setNextStatus(status)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-start text-sm transition",
                  nextStatus === status
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500/20"
                    : "border-border hover:border-teal-300",
                )}
              >
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    salonStatusBadgeClass(status),
                  )}
                >
                  {salonStatusLabels[status]}
                </span>
              </button>
            ))}
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-teal-600 hover:bg-teal-700"
            disabled={submitting || nextStatus === currentStatus}
            onClick={handleSave}
          >
            {submitting ? "در حال ذخیره..." : "تایید و ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
