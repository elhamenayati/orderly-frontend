import { salonSchedule } from "@/mock_ts/salon";
import { timeToMinutes, weekdayFromIsoDate } from "@/lib/format/date";
import type {
  DayOfWeek,
  SalonScheduleException,
  WeeklyScheduleSlot,
} from "@/types/domain";

export type SalonOperatingWindow =
  | { kind: "closed"; reason?: "weekly" | "exception" }
  | { kind: "open"; startTime: string; endTime: string; source: "weekly" | "exception" };

export const WEEK_DAYS: Array<{ dayOfWeek: DayOfWeek; label: string }> = [
  { dayOfWeek: 6, label: "شنبه" },
  { dayOfWeek: 0, label: "یکشنبه" },
  { dayOfWeek: 1, label: "دوشنبه" },
  { dayOfWeek: 2, label: "سه‌شنبه" },
  { dayOfWeek: 3, label: "چهارشنبه" },
  { dayOfWeek: 4, label: "پنجشنبه" },
  { dayOfWeek: 5, label: "جمعه" },
];

function isDateInRange(date: string, start: string, end?: string) {
  if (!end || end === start) return date === start;
  return date >= start && date <= end;
}

function activeExceptionForDate(
  date: string,
): SalonScheduleException | undefined {
  return salonSchedule.exceptions.find(
    (item) =>
      item.status === "active" && isDateInRange(date, item.date, item.dateTo),
  );
}

export function salonOperatingWindow(bookingDate: string): SalonOperatingWindow {
  const exception = activeExceptionForDate(bookingDate);
  if (exception?.type === "full_closure") {
    return { kind: "closed", reason: "exception" };
  }

  if (
    exception?.type === "special_hours" &&
    exception.startTime &&
    exception.endTime
  ) {
    return {
      kind: "open",
      startTime: exception.startTime,
      endTime: exception.endTime,
      source: "exception",
    };
  }

  const weekday = weekdayFromIsoDate(bookingDate) as DayOfWeek;
  const weekly = salonSchedule.weeklySlots.find(
    (slot) => slot.dayOfWeek === weekday,
  );
  if (!weekly) {
    return { kind: "closed", reason: "weekly" };
  }

  return {
    kind: "open",
    startTime: weekly.startTime,
    endTime: weekly.endTime,
    source: "weekly",
  };
}

export function isSalonClosedOnDate(bookingDate: string) {
  return salonOperatingWindow(bookingDate).kind === "closed";
}

export function isWithinSalonOperatingWindow(input: {
  bookingDate: string;
  startTime: string;
  endMinutes: number;
}) {
  const window = salonOperatingWindow(input.bookingDate);
  if (window.kind === "closed") return false;

  const start = timeToMinutes(input.startTime);
  const end = start + input.endMinutes;
  return (
    start >= timeToMinutes(window.startTime) &&
    end <= timeToMinutes(window.endTime)
  );
}

export function syncClosedDatesFromExceptions() {
  salonSchedule.closedDates = salonSchedule.exceptions
    .filter((item) => item.status === "active" && item.type === "full_closure")
    .flatMap((item) => {
      if (!item.dateTo || item.dateTo === item.date) return [item.date];
      const dates: string[] = [];
      const cursor = new Date(`${item.date}T12:00:00`);
      const end = new Date(`${item.dateTo}T12:00:00`);
      while (cursor <= end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
      }
      return dates;
    });
}

export function weeklyRowsForSettings() {
  return WEEK_DAYS.map(({ dayOfWeek, label }) => {
    const slot = salonSchedule.weeklySlots.find(
      (item) => item.dayOfWeek === dayOfWeek,
    );
    return {
      dayOfWeek,
      label,
      active: Boolean(slot),
      startTime: slot?.startTime ?? "09:00",
      endTime: slot?.endTime ?? "19:00",
    };
  });
}

export const scheduleExceptionTypeLabels = {
  full_closure: "تعطیل کامل",
  special_hours: "ساعات کاری متفاوت",
} as const;
