"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatJalaliShort } from "@/lib/format/jalali";
import { scheduleExceptionTypeLabels } from "@/lib/salon/schedule";
import type { SalonScheduleException } from "@/types/domain";
import { formatTimeDisplay } from "@/lib/salon/public-data";

type DeleteExceptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exception: SalonScheduleException | null;
  onConfirm: () => void;
};

export function DeleteExceptionDialog({
  open,
  onOpenChange,
  exception,
  onConfirm,
}: DeleteExceptionDialogProps) {
  if (!exception) return null;

  const dateLabel =
    exception.dateTo && exception.dateTo !== exception.date
      ? `${formatJalaliShort(exception.date)} – ${formatJalaliShort(exception.dateTo)}`
      : formatJalaliShort(exception.date);

  const details =
    exception.type === "special_hours" && exception.startTime && exception.endTime
      ? `${formatTimeDisplay(exception.startTime)} تا ${formatTimeDisplay(exception.endTime)}`
      : exception.note ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-shell="salon" className="max-w-md overflow-hidden p-0">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <DialogTitle>حذف استثنا</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5 text-sm leading-7">
          <p className="text-muted-foreground">
            آیا از حذف این استثنا مطمئن هستید؟ سالن در این تاریخ به حالت عادی
            برمی‌گردد.
          </p>
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p>
              <span className="text-muted-foreground">تاریخ: </span>
              {dateLabel}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">نوع: </span>
              {scheduleExceptionTypeLabels[exception.type]}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">جزئیات: </span>
              {details}
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-stretch">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 flex-1 rounded-xl"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
