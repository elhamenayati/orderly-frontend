"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatJalaliLong,
  shiftIsoDate,
  todayIso,
} from "@/lib/format/jalali";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { cn } from "@/lib/utils";

type JalaliDateFieldProps = {
  value: string;
  minDate?: string;
  onChange: (isoDate: string) => void;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
};

export function JalaliDateField({
  value,
  minDate = todayIso(),
  onChange,
  className,
  compact = false,
  disabled = false,
}: JalaliDateFieldProps) {
  function handleShift(days: number) {
    if (!value) {
      onChange(minDate);
      return;
    }
    const next = shiftIsoDate(value, days);
    if (next < minDate) return;
    onChange(next);
  }

  return (
    <div
      className={cn(
        compact ? "w-full min-w-0 max-w-sm" : "space-y-2",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleShift(-1)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed",
            compact ? "size-11" : "size-10",
          )}
          aria-label="روز قبل"
        >
          <ChevronRight className="size-5" />
        </button>

        <JalaliDateInput
          value={value}
          minDate={minDate}
          onChange={onChange}
          format="dddd DD MMMM YYYY"
          placeholder="تاریخ نوبت را انتخاب کنید"
          className="min-w-0 flex-1"
          disabled={disabled}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleShift(1)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed",
            compact ? "size-11" : "size-10",
          )}
          aria-label="روز بعد"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>
      {!compact && value ? (
        <p className="text-xs text-muted-foreground">{formatJalaliLong(value)}</p>
      ) : null}
    </div>
  );
}
