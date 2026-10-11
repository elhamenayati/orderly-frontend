import { weekdayFromIsoDate } from "@/lib/format/date";
import { shiftIsoDate } from "@/lib/format/jalali";
import { weeklyScheduleRows } from "@/lib/salon/stylist-detail";
import type { DayOfWeek } from "@/types/domain";

/** Count calendar days in [periodStart, periodEnd] where the stylist is scheduled to work. */
export function countStylistWorkingDays(
  stylistId: string,
  periodStart: string,
  periodEnd: string,
): number {
  const activeDays = new Set<DayOfWeek>(
    weeklyScheduleRows(stylistId)
      .filter((row) => row.active)
      .map((row) => row.dayOfWeek),
  );

  if (activeDays.size === 0 || periodStart > periodEnd) {
    return 0;
  }

  let count = 0;
  for (let date = periodStart; date <= periodEnd; date = shiftIsoDate(date, 1)) {
    if (activeDays.has(weekdayFromIsoDate(date) as DayOfWeek)) {
      count += 1;
    }
  }
  return count;
}
