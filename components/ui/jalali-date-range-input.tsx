"use client";

import { useEffect, useMemo, useState } from "react";
import type DateObject from "react-date-object";
import DatePicker from "react-multi-date-picker";
import { CalendarDays } from "lucide-react";
import {
  isoToJalaliDateObject,
  jalaliDateObjectToIso,
  persian,
  persianFa,
} from "@/lib/format/jalali";
import { cn } from "@/lib/utils";

type JalaliDateRangeInputProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  /** Wait for a full range (or calendar close) before calling onChange. */
  applyOnComplete?: boolean;
};

function toPickerValue(
  from: string,
  to: string,
): DateObject | DateObject[] | undefined {
  if (!from) return undefined;
  const start = isoToJalaliDateObject(from);
  if (!to) return start;
  if (to === from) return start;
  return [start, isoToJalaliDateObject(to)];
}

function normalizeRange(dates: DateObject[]) {
  if (dates.length === 0) {
    return { from: "", to: "" };
  }

  const isoDates = dates.map(jalaliDateObjectToIso);
  if (isoDates.length === 1) {
    return { from: isoDates[0], to: isoDates[0] };
  }

  const sorted = [...isoDates].sort();
  return { from: sorted[0], to: sorted[1] };
}

function sortRange(from: string, to: string) {
  if (!from || !to) return { from, to };
  return from <= to ? { from, to } : { from: to, to: from };
}

export function JalaliDateRangeInput({
  from,
  to,
  onChange,
  placeholder = "انتخاب تاریخ یا بازه",
  className,
  disabled = false,
  id,
  applyOnComplete = false,
}: JalaliDateRangeInputProps) {
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  const pickerValue = useMemo(
    () => toPickerValue(draftFrom, draftTo),
    [draftFrom, draftTo],
  );

  function applyRange(nextFrom: string, nextTo: string) {
    const sorted = sortRange(nextFrom, nextTo);
    setDraftFrom(sorted.from);
    setDraftTo(sorted.to);
    onChange(sorted.from, sorted.to);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <DatePicker
        id={id}
        range
        value={pickerValue}
        onChange={(dates) => {
          if (!dates) {
            setDraftFrom("");
            setDraftTo("");
            onChange("", "");
            return;
          }

          const selected = (Array.isArray(dates) ? dates : [dates]).filter(
            Boolean,
          ) as DateObject[];

          if (selected.length === 0) {
            setDraftFrom("");
            setDraftTo("");
            onChange("", "");
            return;
          }

          if (applyOnComplete) {
            if (selected.length === 1) {
              setDraftFrom(jalaliDateObjectToIso(selected[0]));
              setDraftTo("");
              return;
            }

            const next = normalizeRange(selected);
            applyRange(next.from, next.to);
            return;
          }

          const next = normalizeRange(selected);
          applyRange(next.from, next.to);
        }}
        onClose={() => {
          if (!applyOnComplete || !draftFrom || draftTo) return;
          applyRange(draftFrom, draftFrom);
        }}
        calendar={persian}
        locale={persianFa}
        format="YYYY/MM/DD"
        calendarPosition="bottom-center"
        fixMainPosition
        portal
        zIndex={9999}
        containerClassName="w-full"
        className="purple w-full"
        inputClass={cn(
          "h-11 w-full rounded-xl border bg-background pe-10 ps-3 text-sm outline-none transition",
          "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
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
