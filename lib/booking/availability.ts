import { timeToMinutes, weekdayFromIsoDate } from "@/lib/format/date";
import {
  isWithinSalonOperatingWindow,
  salonOperatingWindow,
} from "@/lib/salon/schedule";
import { stylistSchedules } from "@/mock_ts/stylists";

export function isLineAvailableOnSchedule(input: {
  bookingDate: string;
  stylistId: string;
  startTime: string;
  reservedDurationMinutes: number;
}) {
  const weekday = weekdayFromIsoDate(input.bookingDate) as
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6;
  const start = timeToMinutes(input.startTime);
  const end = start + input.reservedDurationMinutes;

  const salonWindow = salonOperatingWindow(input.bookingDate);
  if (salonWindow.kind === "closed") return false;
  if (
    !isWithinSalonOperatingWindow({
      bookingDate: input.bookingDate,
      startTime: input.startTime,
      endMinutes: input.reservedDurationMinutes,
    })
  ) {
    return false;
  }

  const schedule = stylistSchedules.find(
    (item) => item.stylistId === input.stylistId,
  );
  if (!schedule) return false;
  if (schedule.unavailableDates.includes(input.bookingDate)) return false;

  return schedule.weeklySlots.some(
    (slot) =>
      slot.dayOfWeek === weekday &&
      timeToMinutes(slot.startTime) <= start &&
      end <= timeToMinutes(slot.endTime),
  );
}
