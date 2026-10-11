"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { salon } from "@/mock_ts/salon";

type CancelBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
  error?: string | null;
};

export function CancelBookingDialog({
  open,
  onOpenChange,
  submitting = false,
  error = null,
  onConfirm,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setReason("");
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onConfirm(reason);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-shell="salon" className="max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <DialogTitle>لغو رزرو</DialogTitle>
                <DialogDescription className="mt-1">
                  با لغو این رزرو، تمام زمان‌های رزرو شده آزاد می‌شوند.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
              <p className="font-medium">قوانین لغو {salon.brandName}</p>
              <p className="mt-2">{salon.cancellationPolicy}</p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">دلیل لغو (اختیاری)</span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="مثلاً درخواست مشتری"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </label>

            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => handleClose(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="h-11 flex-1 rounded-xl"
              disabled={submitting}
            >
              {submitting ? "در حال لغو..." : "تأیید لغو"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
