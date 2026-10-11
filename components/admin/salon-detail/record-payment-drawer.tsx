"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  adminFormErrorMessages,
  paymentStatusFilterOptions,
  paymentStatusLabels,
  updateSalonPaymentStatusAsync,
} from "@/lib/admin/salons";
import type { SubscriptionPaymentStatus } from "@/types/domain";

const fieldClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type RecordPaymentDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonId: string;
  currentPaymentStatus: SubscriptionPaymentStatus;
  onSaved: () => void;
};

export function RecordPaymentDrawer({
  open,
  onOpenChange,
  salonId,
  currentPaymentStatus,
  onSaved,
}: RecordPaymentDrawerProps) {
  const [paymentStatus, setPaymentStatus] =
    useState<SubscriptionPaymentStatus>(currentPaymentStatus);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPaymentStatus(currentPaymentStatus);
    setError(null);
  }, [open, currentPaymentStatus]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await updateSalonPaymentStatusAsync(salonId, paymentStatus);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-teal-600" />
            جزئیات پرداخت
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
          <p className="text-sm text-muted-foreground">
            وضعیت پرداخت فعلی:{" "}
            <span className="font-medium text-foreground">
              {paymentStatusLabels[currentPaymentStatus]}
            </span>
          </p>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              وضعیت پرداخت <span className="text-destructive">*</span>
            </span>
            <select
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(event.target.value as SubscriptionPaymentStatus)
              }
              className={fieldClassName}
            >
              {paymentStatusFilterOptions
                .filter((item) => item.value !== "all")
                .map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
            </select>
          </label>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-teal-600 hover:bg-teal-700"
              disabled={submitting || paymentStatus === currentPaymentStatus}
            >
              {submitting ? "در حال ذخیره..." : "ثبت وضعیت پرداخت"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
