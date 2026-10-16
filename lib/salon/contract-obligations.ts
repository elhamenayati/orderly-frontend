import { contractForStylist } from "@/lib/salon/management";
import {
  completedBookingLines,
  stylistPerformanceKpis,
} from "@/lib/salon/booking-revenue";
import { weekdayFromIsoDate } from "@/lib/format/date";
import { isoToJalaliDateObject, shiftIsoDate } from "@/lib/format/jalali";
import { stylistContracts } from "@/mock_ts/stylists";
import type {
  FinancialPeriod,
  SettlementDirection,
  StylistContract,
} from "@/types/domain";

export type SettlementPeriod = {
  periodStart: string;
  periodEnd: string;
};

export type ContractObligation = {
  sales: number;
  /** Completed booking revenue assigned to the stylist in this period. */
  bookingCredit: number;
  payable: number;
  receivable: number;
  /** percentage only: salon's share of sales in this period */
  salonShare?: number;
  /** percentage only: stylist's share of sales in this period */
  stylistShare?: number;
  /** chair_rent only: number of rent charges (days, Saturdays or Persian month starts) */
  chairRentCharges?: number;
  /** chair_rent only: rent per charge of the governing contract (last one applied) */
  chairRentRate?: number;
  chairRentPeriod?: FinancialPeriod;
  netObligation: number;
  primaryDirection: SettlementDirection;
};

/** In percentage contracts, `percentage` is the salon's share of booking revenue. */
export function stylistSharePercent(contract: Pick<StylistContract, "type" | "percentage">) {
  if (contract.type !== "percentage") return 0;
  return Math.max(0, 100 - (contract.percentage ?? 0));
}

function contractCoversDate(contract: StylistContract, date: string) {
  return (
    contract.effectiveFrom <= date &&
    (!contract.effectiveTo || date <= contract.effectiveTo)
  );
}

/**
 * Only the active (latest edited) contract counts; inactive versions are kept for
 * history and never feed calculations, even for dates they used to cover.
 */
function contractInForceOn(stylistId: string, date: string) {
  return stylistContracts.find(
    (contract) =>
      contract.stylistId === stylistId &&
      contract.isActive &&
      contractCoversDate(contract, date),
  );
}

const SATURDAY = 6;

/** Rent and salary fall due on each day, each Saturday, or each Persian month's 1st. */
function isPeriodChargeDay(period: FinancialPeriod, date: string) {
  switch (period) {
    case "daily":
      return true;
    case "weekly":
      return weekdayFromIsoDate(date) === SATURDAY;
    case "monthly":
      return isoToJalaliDateObject(date).day === 1;
    default:
      return false;
  }
}

/** What a completed booking is worth to the stylist under the given contract. */
function bookingStylistAmount(contract: StylistContract, sales: number) {
  switch (contract.type) {
    case "percentage":
      return Math.round((sales * stylistSharePercent(contract)) / 100);
    case "chair_rent":
      return sales;
    case "fixed_salary_plus_commission":
      return Math.round((sales * (contract.commissionPercentage ?? 0)) / 100);
    case "fixed_salary":
    default:
      return 0;
  }
}

export type AccrualKind = "booking" | "chair_rent" | "salary";

export type AccrualEntry = {
  id: string;
  date: string;
  kind: AccrualKind;
  direction: SettlementDirection;
  amount: number;
  /** booking only: completed sales of the stylist's lines in the booking */
  sales: number;
  bookingId?: string;
  contract: StylistContract;
};

/**
 * Financial events created by contracts within `period`: each completed booking,
 * each chair-rent charge and each salary charge, judged by the contract in force that day.
 */
export function stylistAccrualEntries(
  stylistId: string,
  period: SettlementPeriod,
): AccrualEntry[] {
  if (!period.periodStart || period.periodStart > period.periodEnd) {
    return [];
  }

  const entries: AccrualEntry[] = [];

  const bookingsById = new Map<string, { date: string; sales: number }>();
  for (const line of completedBookingLines(period)) {
    if (line.stylistId !== stylistId) continue;
    const current = bookingsById.get(line.bookingId);
    if (current) {
      current.sales += line.finalActualAmount;
    } else {
      bookingsById.set(line.bookingId, {
        date: line.bookingDate,
        sales: line.finalActualAmount,
      });
    }
  }
  for (const [bookingId, { date, sales }] of bookingsById) {
    const contract = contractInForceOn(stylistId, date);
    if (!contract) continue;
    entries.push({
      id: `booking:${bookingId}`,
      date,
      kind: "booking",
      direction: "salon_to_stylist",
      amount: bookingStylistAmount(contract, sales),
      sales,
      bookingId,
      contract,
    });
  }

  for (
    let date = period.periodStart;
    date <= period.periodEnd;
    date = shiftIsoDate(date, 1)
  ) {
    const contract = contractInForceOn(stylistId, date);
    if (!contract || contract.type === "percentage") continue;
    // A weekly rent contract starting mid-week is charged a full week on its first day.
    const isFirstWeeklyRentDay =
      contract.type === "chair_rent" &&
      contract.financialPeriod === "weekly" &&
      date === contract.effectiveFrom;
    if (!isFirstWeeklyRentDay && !isPeriodChargeDay(contract.financialPeriod, date)) {
      continue;
    }

    if (contract.type === "chair_rent") {
      entries.push({
        id: `chair_rent:${contract.id}:${date}`,
        date,
        kind: "chair_rent",
        direction: "stylist_to_salon",
        amount: contract.chairRent ?? 0,
        sales: 0,
        contract,
      });
    } else {
      entries.push({
        id: `salary:${contract.id}:${date}`,
        date,
        kind: "salary",
        direction: "salon_to_stylist",
        amount: contract.fixedSalary ?? 0,
        sales: 0,
        contract,
      });
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateContractObligation(
  stylistId: string,
  period: SettlementPeriod,
): ContractObligation {
  const contract = contractForStylist(stylistId);
  const allSales = stylistPerformanceKpis(stylistId, period).actualSales;

  if (!contract) {
    return {
      sales: allSales,
      bookingCredit: allSales,
      payable: 0,
      receivable: 0,
      netObligation: 0,
      primaryDirection: "salon_to_stylist",
    };
  }

  const entries = stylistAccrualEntries(stylistId, period);
  const bookingEntries = entries.filter((entry) => entry.kind === "booking");
  const rentEntries = entries.filter((entry) => entry.kind === "chair_rent");
  const contractSales = bookingEntries.reduce((sum, entry) => sum + entry.sales, 0);

  const sales = contract.type === "chair_rent" ? contractSales : allSales;
  const bookingCredit = sales;
  const payable = entries
    .filter((entry) => entry.direction === "salon_to_stylist")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const receivable = entries
    .filter((entry) => entry.direction === "stylist_to_salon")
    .reduce((sum, entry) => sum + entry.amount, 0);

  let salonShare: number | undefined;
  let stylistShare: number | undefined;
  if (contract.type === "percentage") {
    stylistShare = bookingEntries.reduce((sum, entry) => sum + entry.amount, 0);
    salonShare = contractSales - stylistShare;
  }

  let chairRentCharges: number | undefined;
  let chairRentRate: number | undefined;
  let chairRentPeriod: FinancialPeriod | undefined;
  if (contract.type === "chair_rent") {
    const lastRent = rentEntries[rentEntries.length - 1];
    chairRentCharges = rentEntries.length;
    chairRentRate = lastRent?.amount ?? contract.chairRent ?? 0;
    chairRentPeriod = lastRent?.contract.financialPeriod ?? contract.financialPeriod;
  }

  const netObligation = payable - receivable;

  return {
    sales,
    bookingCredit,
    payable,
    receivable,
    salonShare,
    stylistShare,
    chairRentCharges,
    chairRentRate,
    chairRentPeriod,
    netObligation,
    primaryDirection:
      netObligation >= 0 ? "salon_to_stylist" : "stylist_to_salon",
  };
}
