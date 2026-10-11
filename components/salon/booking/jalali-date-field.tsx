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
};

export function JalaliDateField({
  value,
  minDate = todayIso(),
  onChange,
  className,
}: JalaliDateFieldProps) {
  function handleShift(days: number) {
    const next = shiftIsoDate(value, days);
    if (next < minDate) return;
    onChange(next);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleShift(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          aria-label="روز قبل"
        >
          <ChevronRight className="size-5" />
        </button>

        <JalaliDateInput
          value={value}
          minDate={minDate}
          onChange={onChange}
          format="dddd DD MMMM YYYY"
          className="min-w-0 flex-1"
        />

        <button
          type="button"
          onClick={() => handleShift(1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          aria-label="روز بعد"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{formatJalaliLong(value)}</p>
    </div>
  );
}
