import {
  completedBookingLines,
  stylistPerformanceKpis,
  totalCompletedSales,
  type CompletedLineRow,
  type StylistPerformanceKpis,
} from "@/lib/salon/booking-revenue";
import { fetchBookings } from "@/lib/salon/bookings";
import { fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import {
  categoryName,
  contractForStylist,
  contractSummary,
  contractTypeLabels,
  serviceName,
  stylistById,
} from "@/lib/salon/management";
import { calculateContractObligation } from "@/lib/salon/contract-obligations";
import { financialPeriodLabels } from "@/lib/salon/stylist-detail";
import { services } from "@/mock_ts/services";
import { bookings } from "@/mock_ts/bookings";
import { paymentTransactions, stylistSettlements, stylistSettlementRecords } from "@/mock_ts/transactions";
import { stylists } from "@/mock_ts/stylists";
import type {
  BookingStatus,
  PaymentTransaction,
  StylistSettlement,
  StylistSettlementRecord,
} from "@/types/domain";

export type { CompletedLineRow, StylistPerformanceKpis };
export { completedBookingLines, stylistPerformanceKpis, totalCompletedSales };

export type StylistPerformanceRow = {
  stylistId: string;
  stylistName: string;
  isActive: boolean;
  completedServices: number;
  salesTotal: number;
  contractLabel: string;
};

export function stylistPerformanceRows(options?: {
  periodStart?: string;
  periodEnd?: string;
}): StylistPerformanceRow[] {
  const lines = completedBookingLines(options);
  const totals = new Map<string, { count: number; sales: number }>();

  for (const line of lines) {
    const current = totals.get(line.stylistId) ?? { count: 0, sales: 0 };
    current.count += 1;
    current.sales += line.finalActualAmount;
    totals.set(line.stylistId, current);
  }

  return stylists
    .filter((stylist) => stylist.isActive)
    .map((stylist) => {
      const aggregate = totals.get(stylist.id) ?? { count: 0, sales: 0 };
      return {
        stylistId: stylist.id,
        stylistName: stylist.displayName,
        isActive: stylist.isActive,
        completedServices: aggregate.count,
        salesTotal: aggregate.sales,
        contractLabel: contractSummary(stylist.id),
      };
    })
    .sort((a, b) => b.salesTotal - a.salesTotal);
}

export type SalesByDateRow = {
  bookingDate: string;
  bookingCount: number;
  lineCount: number;
  salesTotal: number;
};

export function salesReportByDate(options?: {
  periodStart?: string;
  periodEnd?: string;
}): SalesByDateRow[] {
  const lines = completedBookingLines(options);
  const byDate = new Map<
    string,
    { bookingIds: Set<string>; lineCount: number; sales: number }
  >();

  for (const line of lines) {
    const bucket = byDate.get(line.bookingDate) ?? {
      bookingIds: new Set<string>(),
      lineCount: 0,
      sales: 0,
    };
    bucket.bookingIds.add(line.bookingId);
    bucket.lineCount += 1;
    bucket.sales += line.finalActualAmount;
    byDate.set(line.bookingDate, bucket);
  }

  return [...byDate.entries()]
    .map(([bookingDate, bucket]) => ({
      bookingDate,
      bookingCount: bucket.bookingIds.size,
      lineCount: bucket.lineCount,
      salesTotal: bucket.sales,
    }))
    .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate));
}

export type FinancialPositionSummary = {
  completedSales: number;
  totalInflows: number;
  totalOutflows: number;
  netCashPosition: number;
  pendingSettlements: number;
  paidSettlements: number;
};

export function financialPositionSummary(): FinancialPositionSummary {
  const completedSales = totalCompletedSales();
  const totalInflows = paymentTransactions
    .filter((item) => item.direction === "inflow")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalOutflows = paymentTransactions
    .filter((item) => item.direction === "outflow")
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingSettlements = stylistSettlements
    .filter((item) => item.status === "draft")
    .reduce((sum, item) => sum + item.amount, 0);
  const paidSettlements = stylistSettlements
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    completedSales,
    totalInflows,
    totalOutflows,
    netCashPosition: totalInflows - totalOutflows,
    pendingSettlements,
    paidSettlements,
  };
}

export const transactionKindLabels: Record<PaymentTransaction["kind"], string> =
  {
    cash: "نقدی",
    card: "کارت",
    adjustment: "تعدیل",
  };

export const transactionDirectionLabels: Record<
  PaymentTransaction["direction"],
  string
> = {
  inflow: "ورودی",
  outflow: "خروجی",
};

export function transactionListRows() {
  return [...paymentTransactions]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map((transaction) => ({
      transaction,
      signedAmount:
        transaction.direction === "inflow"
          ? transaction.amount
          : -transaction.amount,
    }));
}

export const settlementStatusLabels: Record<
  StylistSettlement["status"],
  string
> = {
  draft: "پیش‌نویس",
  paid: "پرداخت شده",
};

export function settlementListRows() {
  return [...stylistSettlements]
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))
    .map((settlement) => ({
      settlement,
      stylistName:
        stylistById(settlement.stylistId)?.displayName ?? "—",
      contractLabel: contractSummary(settlement.stylistId),
    }));
}

export function performanceDetailLines(stylistId: string, options?: {
  periodStart?: string;
  periodEnd?: string;
}) {
  return completedBookingLines(options)
    .filter((line) => line.stylistId === stylistId)
    .map((line) => ({
      ...line,
      serviceName: serviceName(line.serviceId),
    }));
}

export type PerformanceBreakdownRow = {
  id: string;
  label: string;
  count: number;
  sales: number;
  sharePercent: number;
};

export type StylistFinancialSnapshot = {
  stylistId: string;
  stylistName: string;
  contractTypeLabel: string;
  contractSummary: string;
  financialPeriodLabel: string;
  periodSales: number;
  commissionLabel?: string;
  commissionAmount?: number;
  paidAmount: number;
  remainingPayable: number;
};

function stylistCompletedLines(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
) {
  return completedBookingLines(options).filter(
    (line) => line.stylistId === stylistId,
  );
}

function breakdownRows(
  lines: CompletedLineRow[],
  keyFn: (line: CompletedLineRow) => { id: string; label: string },
): PerformanceBreakdownRow[] {
  const buckets = new Map<string, { label: string; count: number; sales: number }>();

  for (const line of lines) {
    const { id, label } = keyFn(line);
    const bucket = buckets.get(id) ?? { label, count: 0, sales: 0 };
    bucket.count += 1;
    bucket.sales += line.finalActualAmount;
    buckets.set(id, bucket);
  }

  const totalSales = lines.reduce((sum, line) => sum + line.finalActualAmount, 0);

  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      count: bucket.count,
      sales: bucket.sales,
      sharePercent: totalSales > 0 ? (bucket.sales / totalSales) * 100 : 0,
    }))
    .sort((a, b) => b.sales - a.sales);
}

export function stylistPerformanceBreakdownByService(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
) {
  return breakdownRows(stylistCompletedLines(stylistId, options), (line) => ({
    id: line.serviceId,
    label: serviceName(line.serviceId),
  }));
}

export function stylistPerformanceBreakdownByCategory(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
) {
  return breakdownRows(stylistCompletedLines(stylistId, options), (line) => {
    const service = services.find((item) => item.id === line.serviceId);
    const categoryId = service?.categoryId ?? "unknown";
    return {
      id: categoryId,
      label: categoryName(categoryId),
    };
  });
}

export function stylistPerformanceBreakdownByDate(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
) {
  return breakdownRows(stylistCompletedLines(stylistId, options), (line) => ({
    id: line.bookingDate,
    label: line.bookingDate,
  }));
}

function settlementRecordOverlapsPeriod(
  record: StylistSettlementRecord,
  periodStart?: string,
  periodEnd?: string,
) {
  if (periodStart && record.periodEnd < periodStart) return false;
  if (periodEnd && record.periodStart > periodEnd) return false;
  return true;
}

export function stylistFinancialSnapshot(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
): StylistFinancialSnapshot | null {
  const stylist = stylistById(stylistId);
  if (!stylist) return null;

  const contract = contractForStylist(stylistId);
  const kpis = stylistPerformanceKpis(stylistId, options);
  const relevantRecords = stylistSettlementRecords.filter(
    (item) =>
      item.stylistId === stylistId &&
      settlementRecordOverlapsPeriod(
        item,
        options?.periodStart,
        options?.periodEnd,
      ),
  );

  const paidAmount = relevantRecords
    .filter((item) => item.direction === "salon_to_stylist")
    .reduce((sum, item) => sum + item.amount, 0);

  const obligation = calculateContractObligation(stylistId, {
    periodStart: options?.periodStart ?? "",
    periodEnd: options?.periodEnd ?? "",
  });

  let commissionLabel: string | undefined;
  let commissionAmount: number | undefined;

  if (contract?.type === "percentage" && contract.percentage !== undefined) {
    commissionLabel = `${100 - contract.percentage}٪`;
    commissionAmount = obligation.payable;
  } else if (
    contract?.type === "fixed_salary_plus_commission" &&
    contract.commissionPercentage !== undefined
  ) {
    commissionLabel = `${contract.commissionPercentage}٪`;
    commissionAmount = Math.round(
      (kpis.actualSales * contract.commissionPercentage) / 100,
    );
  }

  const settledFromStylist = relevantRecords
    .filter((item) => item.direction === "stylist_to_salon")
    .reduce((sum, item) => sum + item.amount, 0);
  const balance =
    obligation.netObligation - paidAmount + settledFromStylist;
  const remainingPayable = balance > 0 ? balance : 0;

  return {
    stylistId,
    stylistName: stylist.displayName,
    contractTypeLabel: contract
      ? contractTypeLabels[contract.type]
      : "بدون قرارداد",
    contractSummary: contractSummary(stylistId),
    financialPeriodLabel: contract
      ? financialPeriodLabels[contract.financialPeriod]
      : "—",
    periodSales: kpis.actualSales,
    commissionLabel,
    commissionAmount,
    paidAmount,
    remainingPayable,
  };
}

export function activeStylistsForReport() {
  return stylists
    .filter((stylist) => stylist.isActive)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "fa"));
}

export const DEFAULT_REPORT_PERIOD = {
  start: "2026-08-01",
  end: "2026-08-31",
};

export async function loadPerformanceReportData(options: {
  periodStart: string;
  periodEnd: string;
}) {
  await Promise.all([
    fetchStylists({ status: "active" }),
    fetchServices(),
    fetchBookings({
      status: "completed",
      dateFrom: options.periodStart,
      dateTo: options.periodEnd,
    }),
  ]);
}

export function bookingsCountByStatus() {
  const counts: Record<BookingStatus, number> = {
    draft: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };
  for (const booking of bookings) {
    counts[booking.status] += 1;
  }
  return counts;
}
