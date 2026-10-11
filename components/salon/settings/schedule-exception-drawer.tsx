"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { cn } from "@/lib/utils";
import type { SalonScheduleException } from "@/types/domain";
import type { ScheduleExceptionInput } from "@/lib/salon/settings";

type ScheduleExceptionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: SalonScheduleException | null;
  onSave: (input: ScheduleExceptionInput) => void;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ScheduleExceptionDrawer({
  open,
  onOpenChange,
  editing,
  onSave,
}: ScheduleExceptionDrawerProps) {
  const [useRange, setUseRange] = useState(false);
  const [date, setDate] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [type, setType] = useState<ScheduleExceptionInput["type"]>("full_closure");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [endTimeError, setEndTimeError] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setUseRange(Boolean(editing.dateTo && editing.dateTo !== editing.date));
      setDate(editing.date);
      setDateTo(editing.dateTo ?? "");
      setType(editing.type);
      setStartTime(editing.startTime ?? "10:00");
      setEndTime(editing.endTime ?? "17:00");
      setNote(editing.note ?? "");
    } else {
      setUseRange(false);
      setDate("");
      setDateTo("");
      setType("full_closure");
      setStartTime("10:00");
      setEndTime("17:00");
      setNote("");
    }
    setError(null);
    setEndTimeError(false);
  }, [open, editing]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!date) {
      setError("تاریخ را انتخاب کنید");
      return;
    }
    if (useRange && dateTo && dateTo < date) {
      setError("تاریخ پایان باید بعد از تاریخ شروع باشد");
      return;
    }
    if (type === "special_hours" && !endTime) {
      setEndTimeError(true);
      setError("لطفاً ساعت پایان را انتخاب کنید");
      return;
    }

    onSave({
      date,
      dateTo: useRange && dateTo ? dateTo : undefined,
      type,
      startTime: type === "special_hours" ? startTime : undefined,
      endTime: type === "special_hours" ? endTime : undefined,
      note,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-shell="salon"
        className="w-full sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </span>
              <SheetTitle>
                {editing
                  ? "ویرایش ساعت خاص / تعطیلی"
                  : "افزودن ساعت کاری خاص / تعطیلی"}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">بازه تاریخ</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!useRange}
                  onChange={() => setUseRange(false)}
                />
                تاریخ مشخص
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={useRange}
                  onChange={() => setUseRange(true)}
                />
                بازه تاریخ
              </label>
            </fieldset>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">تاریخ</span>
              <JalaliDateInput
                value={date}
                onChange={setDate}
                placeholder="انتخاب تاریخ"
              />
            </label>

            {useRange ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">تا تاریخ</span>
                <JalaliDateInput
                  value={dateTo}
                  minDate={date || undefined}
                  onChange={setDateTo}
                  placeholder="انتخاب تاریخ پایان"
                />
              </label>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">نوع</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as ScheduleExceptionInput["type"])
                }
                className={fieldClassName}
              >
                <option value="full_closure">تعطیل کامل</option>
                <option value="special_hours">ساعات کاری متفاوت</option>
              </select>
            </label>

            {type === "special_hours" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">ساعت شروع</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={fieldClassName}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">ساعت پایان</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(event.target.value);
                      setEndTimeError(false);
                    }}
                    className={cn(
                      fieldClassName,
                      endTimeError &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                </label>
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">توضیح (اختیاری)</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 200))}
                rows={3}
                className={cn(
                  fieldClassName,
                  "h-auto py-2",
                )}
              />
              <p className="text-xs text-muted-foreground">{note.length}/200</p>
            </label>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-input hover:border-primary/40 hover:text-primary"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90">
              ذخیره
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
