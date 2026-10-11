"use client";

import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import { CalendarDays } from "lucide-react";
import {
  isoToJalaliDateObject,
  jalaliDateObjectToIso,
  persian,
  persianFa,
} from "@/lib/format/jalali";
import { cn } from "@/lib/utils";

type JalaliDateInputProps = {
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  format?: string;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
};

export function JalaliDateInput({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "انتخاب تاریخ",
  format = "YYYY/MM/DD",
  className,
  disabled = false,
  invalid = false,
  id,
}: JalaliDateInputProps) {
  const pickerValue = useMemo(
    () => (value ? isoToJalaliDateObject(value) : undefined),
    [value],
  );
  const minPickerValue = useMemo(
    () => (minDate ? isoToJalaliDateObject(minDate) : undefined),
    [minDate],
  );
  const maxPickerValue = useMemo(
    () => (maxDate ? isoToJalaliDateObject(maxDate) : undefined),
    [maxDate],
  );

  return (
    <div className={cn("relative w-full", className)}>
      <DatePicker
        id={id}
        value={pickerValue}
        onChange={(date) => {
          if (!date || Array.isArray(date)) {
            onChange("");
            return;
          }
          onChange(jalaliDateObjectToIso(date));
        }}
        calendar={persian}
        locale={persianFa}
        minDate={minPickerValue}
        maxDate={maxPickerValue}
        format={format}
        calendarPosition="bottom-center"
        fixMainPosition
        portal
        zIndex={9999}
        containerClassName="w-full"
        className="purple w-full"
        inputClass={cn(
          "h-11 w-full rounded-xl border bg-background pe-10 ps-3 text-sm outline-none transition",
          "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
          invalid &&
            "border-destructive focus:border-destructive focus:ring-destructive/20",
          disabled && "cursor-not-allowed opacity-60",
        )}
        placeholder={placeholder}
        arrow={false}
        editable={false}
        disabled={disabled}
      />
      <CalendarDays className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
