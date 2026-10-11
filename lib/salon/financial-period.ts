import { weekdayFromIsoDate } from "@/lib/format/date";
import {
  isoDateFromDate,
  shiftIsoDate,
  todayIso,
} from "@/lib/format/jalali";
import type { FinancialPeriod, StylistContract } from "@/types/domain";

export type PeriodBounds = {
  periodStart: string;
  periodEnd: string;
};

type PeriodContract = Pick<
  StylistContract,
  "financialPeriod" | "financialPeriodStartDay"
>;

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function isoDateWithDay(year: number, month: number, day: number) {
  const clamped = Math.min(Math.max(day, 1), daysInMonth(year, month));
  return isoDateFromDate(new Date(year, month - 1, clamped));
}

/** Persian-week convention used in the app: Saturday → Friday. */
export function saturdayWeekStart(isoDate: string) {
  const dow = weekdayFromIsoDate(isoDate);
  const daysSinceSaturday = (dow + 1) % 7;
  return shiftIsoDate(isoDate, -daysSinceSaturday);
}

export function contractPeriodBounds(
  contract: PeriodContract,
  referenceDate: string = todayIso(),
): PeriodBounds {
  switch (contract.financialPeriod) {
    case "daily":
      return { periodStart: referenceDate, periodEnd: referenceDate };
    case "weekly": {
      const periodStart = saturdayWeekStart(referenceDate);
      return {
        periodStart,
        periodEnd: shiftIsoDate(periodStart, 6),
      };
    }
    case "monthly": {
      const startDay = contract.financialPeriodStartDay || 1;
      const [year, month, day] = referenceDate.split("-").map(Number);

      if (day >= startDay) {
        const periodStart = isoDateWithDay(year, month, startDay);
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const periodEnd = shiftIsoDate(
          isoDateWithDay(nextYear, nextMonth, startDay),
          -1,
        );
        return { periodStart, periodEnd };
      }

      const prevYear = month === 1 ? year - 1 : year;
      const prevMonth = month === 1 ? 12 : month - 1;
      const periodStart = isoDateWithDay(prevYear, prevMonth, startDay);
      const periodEnd = shiftIsoDate(isoDateWithDay(year, month, startDay), -1);
      return { periodStart, periodEnd };
    }
    default:
      return contractPeriodBounds(
        { financialPeriod: "monthly", financialPeriodStartDay: 1 },
        referenceDate,
      );
  }
}

export function defaultSettlementPeriodForContract(
  contract?: PeriodContract | null,
  referenceDate: string = todayIso(),
): PeriodBounds {
  if (contract) {
    return contractPeriodBounds(contract, referenceDate);
  }
  return contractPeriodBounds(
    { financialPeriod: "monthly", financialPeriodStartDay: 1 },
    referenceDate,
  );
}

/** All settlement periods from contract start through the selected period end. */
export function listSettlementPeriods(
  contract: PeriodContract,
  effectiveFrom: string,
  throughPeriodEnd: string,
): PeriodBounds[] {
  const periods: PeriodBounds[] = [];
  let reference = effectiveFrom;

  for (let guard = 0; guard < 520; guard += 1) {
    const bounds = contractPeriodBounds(contract, reference);

    if (bounds.periodEnd < effectiveFrom) {
      reference = shiftIsoDate(bounds.periodEnd, 1);
      continue;
    }
    if (bounds.periodStart > throughPeriodEnd) {
      break;
    }

    const alreadyListed = periods.some(
      (item) =>
        item.periodStart === bounds.periodStart &&
        item.periodEnd === bounds.periodEnd,
    );
    if (!alreadyListed) {
      periods.push(bounds);
    }

    if (bounds.periodEnd >= throughPeriodEnd) {
      break;
    }
    reference = shiftIsoDate(bounds.periodEnd, 1);
  }

  return periods;
}

export function financialPeriodDescription(period: FinancialPeriod) {
  switch (period) {
    case "daily":
      return "روزانه";
    case "weekly":
      return "هفتگی (شنبه تا جمعه)";
    case "monthly":
      return "ماهانه";
    default:
      return "—";
  }
}
