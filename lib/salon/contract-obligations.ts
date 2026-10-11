import { contractForStylist } from "@/lib/salon/management";
import { stylistPerformanceKpis } from "@/lib/salon/booking-revenue";
import { countStylistWorkingDays } from "@/lib/salon/working-days";
import type { SettlementDirection, StylistContract } from "@/types/domain";

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
  /** chair_rent only: working days × daily rate */
  chairRentWorkingDays?: number;
  chairRentPerDay?: number;
  netObligation: number;
  primaryDirection: SettlementDirection;
};

/** In percentage contracts, `percentage` is the salon's share of booking revenue. */
export function salonSharePercent(contract: Pick<StylistContract, "type" | "percentage">) {
  if (contract.type !== "percentage") return 0;
  return contract.percentage ?? 0;
}

export function stylistSharePercent(contract: Pick<StylistContract, "type" | "percentage">) {
  if (contract.type !== "percentage") return 0;
  return Math.max(0, 100 - (contract.percentage ?? 0));
}

export function calculateContractObligation(
  stylistId: string,
  period: SettlementPeriod,
): ContractObligation {
  const contract = contractForStylist(stylistId);
  const sales = stylistPerformanceKpis(stylistId, period).actualSales;

  if (!contract) {
    return {
      sales,
      bookingCredit: sales,
      payable: 0,
      receivable: 0,
      netObligation: 0,
      primaryDirection: "salon_to_stylist",
    };
  }

  let payable = 0;
  let receivable = 0;
  let bookingCredit = 0;
  let salonShare: number | undefined;
  let stylistShare: number | undefined;
  let chairRentWorkingDays: number | undefined;
  let chairRentPerDay: number | undefined;

  switch (contract.type) {
    case "percentage": {
      bookingCredit = sales;
      const salonRate = salonSharePercent(contract);
      const stylistRate = stylistSharePercent(contract);
      salonShare = Math.round((sales * salonRate) / 100);
      stylistShare = Math.round((sales * stylistRate) / 100);
      payable = stylistShare;
      break;
    }
    case "fixed_salary":
      bookingCredit = sales;
      payable = contract.fixedSalary ?? 0;
      break;
    case "fixed_salary_plus_commission":
      bookingCredit = sales;
      payable =
        (contract.fixedSalary ?? 0) +
        Math.round((sales * (contract.commissionPercentage ?? 0)) / 100);
      break;
    case "chair_rent": {
      bookingCredit = sales;
      chairRentPerDay = contract.chairRent ?? 0;
      chairRentWorkingDays = countStylistWorkingDays(
        stylistId,
        period.periodStart,
        period.periodEnd,
      );
      payable = sales;
      receivable = chairRentPerDay * chairRentWorkingDays;
      break;
    }
  }

  const netObligation = payable - receivable;

  return {
    sales,
    bookingCredit,
    payable,
    receivable,
    salonShare,
    stylistShare,
    chairRentWorkingDays,
    chairRentPerDay,
    netObligation,
    primaryDirection:
      netObligation >= 0 ? "salon_to_stylist" : "stylist_to_salon",
  };
}
