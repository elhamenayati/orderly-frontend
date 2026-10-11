import { isLineAvailableOnSchedule } from "@/lib/booking/availability";
import {
  activeBookingsOnDate,
  flattenBookingLines,
} from "@/lib/booking/catalog";
import { findConflicts, type OccupiedInterval } from "@/lib/booking/conflicts";
import { salonOperatingWindow } from "@/lib/salon/schedule";
import { stylistSchedules } from "@/mock_ts/stylists";
import { timeToMinutes, weekdayFromIsoDate } from "@/lib/format/date";

const SLOT_STEP_MINUTES = 15;

export type TimeSlotOption = {
  value: string;
  label: string;
  available: boolean;
};

function minutesToTime(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function scheduleWindow(
  bookingDate: string,
  stylistId: string,
): { start: number; end: number } | null {
  const weekday = weekdayFromIsoDate(bookingDate) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const salonWindow = salonOperatingWindow(bookingDate);
  if (salonWindow.kind === "closed") return null;

  const stylistSchedule = stylistSchedules.find(
    (item) => item.stylistId === stylistId,
  );
  if (!stylistSchedule) return null;
  if (stylistSchedule.unavailableDates.includes(bookingDate)) return null;

  const stylistSlot = stylistSchedule.weeklySlots.find(
    (slot) => slot.dayOfWeek === weekday,
  );
  if (!stylistSlot) return null;

  const start = Math.max(
    timeToMinutes(salonWindow.startTime),
    timeToMinutes(stylistSlot.startTime),
  );
  const end = Math.min(
    timeToMinutes(salonWindow.endTime),
    timeToMinutes(stylistSlot.endTime),
  );

  if (start >= end) return null;
  return { start, end };
}

export function generateTimeSlots(input: {
  bookingDate: string;
  stylistId: string;
  durationMinutes: number;
  bookingId?: string;
  excludeClientId?: string;
  draftLines?: OccupiedInterval[];
}): TimeSlotOption[] {
  const window = scheduleWindow(input.bookingDate, input.stylistId);
  if (!window || input.durationMinutes <= 0) return [];

  const occupied: OccupiedInterval[] = [
    ...flattenBookingLines(
      activeBookingsOnDate(input.bookingDate, input.bookingId),
    ).map((line) => ({
      stylistId: line.stylistId,
      startTime: line.startTime,
      reservedDurationMinutes: line.reservedDurationMinutes,
    })),
    ...(input.draftLines ?? []).filter(
      (line) => line.stylistId === input.stylistId,
    ),
  ];

  const slots: TimeSlotOption[] = [];

  for (
    let start = window.start;
    start + input.durationMinutes <= window.end;
    start += SLOT_STEP_MINUTES
  ) {
    const value = minutesToTime(start);
    const candidate: OccupiedInterval = {
      stylistId: input.stylistId,
      startTime: value,
      reservedDurationMinutes: input.durationMinutes,
    };

    const onSchedule = isLineAvailableOnSchedule({
      bookingDate: input.bookingDate,
      stylistId: input.stylistId,
      startTime: value,
      reservedDurationMinutes: input.durationMinutes,
    });

    const available =
      onSchedule && findConflicts(candidate, occupied).length === 0;

    slots.push({ value, label: value, available });
  }

  return slots;
}

export function describeTimeSlotBlocker(input: {
  bookingDate: string;
  stylistId: string;
  durationMinutes: number;
}): string | null {
  if (input.durationMinutes <= 0) {
    return "مدت زمان خدمت مشخص نیست.";
  }

  const salonWindow = salonOperatingWindow(input.bookingDate);
  if (salonWindow.kind === "closed") {
    return "سالن در این تاریخ تعطیل است. تاریخ دیگری انتخاب کنید.";
  }

  const stylistSchedule = stylistSchedules.find(
    (item) => item.stylistId === input.stylistId,
  );
  if (!stylistSchedule) {
    return "برنامه کاری آرایشگر یافت نشد.";
  }
  if (stylistSchedule.unavailableDates.includes(input.bookingDate)) {
    return "آرایشگر در این تاریخ در دسترس نیست.";
  }

  const weekday = weekdayFromIsoDate(input.bookingDate) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6;
  const stylistSlot = stylistSchedule.weeklySlots.find(
    (slot) => slot.dayOfWeek === weekday,
  );
  if (!stylistSlot) {
    return "آرایشگر در این روز هفته حضور ندارد.";
  }

  const window = scheduleWindow(input.bookingDate, input.stylistId);
  if (!window) {
    return "ساعات کاری سالن و آرایشگر برای این تاریخ هم‌پوشانی ندارند.";
  }

  if (input.durationMinutes > window.end - window.start) {
    return "مدت خدمت از بازه کاری این روز بیشتر است.";
  }

  return null;
}
