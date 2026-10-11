import { totalCompletedSales } from "@/lib/salon/booking-revenue";
import { transactionKindLabels } from "@/lib/salon/reports";
import { calculateContractObligation } from "@/lib/salon/contract-obligations";
import { stylistSettlementListRows } from "@/lib/salon/settlements";
import { loadFinancialTransactionsData } from "@/lib/salon/transactions";
import { paymentTransactions, stylistSettlementRecords } from "@/mock_ts/transactions";
import { stylists } from "@/mock_ts/stylists";
import type { PaymentTransaction } from "@/types/domain";

export type SalonFinancialPeriod = {
  periodStart: string;
  periodEnd: string;
};

export type SalonFinancialPositionSummary = {
  periodStart: string;
  periodEnd: string;
  serviceSales: number;
  customerReceipts: number;
  payableToStylists: number;
  receivableFromStylists: number;
  settlementPaid: number;
  settlementReceived: number;
  outstandingPayable: number;
  outstandingReceivable: number;
  netSalonPosition: number;
};

export type CustomerReceiptBreakdownRow = {
  kind: PaymentTransaction["kind"];
  label: string;
  amount: number;
  sharePercent: number;
};

export type FinancialFlowRow = {
  id: string;
  label: string;
  amount: number;
  tone: "emerald" | "sky" | "violet" | "amber" | "primary";
};

function isoDateFromTimestamp(timestamp: string) {
  return timestamp.slice(0, 10);
}

function inPeriod(isoDate: string, period: SalonFinancialPeriod) {
  return isoDate >= period.periodStart && isoDate <= period.periodEnd;
}

function settlementRecordsInPeriod(period: SalonFinancialPeriod) {
  return stylistSettlementRecords.filter((record) =>
    inPeriod(record.occurredAt, period),
  );
}

export function salonFinancialPosition(
  period: SalonFinancialPeriod,
): SalonFinancialPositionSummary {
  const serviceSales = totalCompletedSales(period);

  const customerReceipts = paymentTransactions
    .filter(
      (item) =>
        item.direction === "inflow" &&
        inPeriod(isoDateFromTimestamp(item.occurredAt), period),
    )
    .reduce((sum, item) => sum + item.amount, 0);

  let payableToStylists = 0;
  let receivableFromStylists = 0;

  for (const stylist of stylists.filter((item) => item.isActive)) {
    const obligation = calculateContractObligation(stylist.id, period);
    payableToStylists += obligation.payable;
    receivableFromStylists += obligation.receivable;
  }

  const records = settlementRecordsInPeriod(period);
  const settlementPaid = records
    .filter((item) => item.direction === "salon_to_stylist")
    .reduce((sum, item) => sum + item.amount, 0);
  const settlementReceived = records
    .filter((item) => item.direction === "stylist_to_salon")
    .reduce((sum, item) => sum + item.amount, 0);

  const outstandingPayable = Math.max(payableToStylists - settlementPaid, 0);
  const outstandingReceivable = Math.max(
    receivableFromStylists - settlementReceived,
    0,
  );
  const netSalonPosition = outstandingPayable - outstandingReceivable;

  return {
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    serviceSales,
    customerReceipts,
    payableToStylists,
    receivableFromStylists,
    settlementPaid,
    settlementReceived,
    outstandingPayable,
    outstandingReceivable,
    netSalonPosition,
  };
}

export function customerReceiptBreakdown(
  period: SalonFinancialPeriod,
): CustomerReceiptBreakdownRow[] {
  const inflow = paymentTransactions.filter(
    (item) =>
      item.direction === "inflow" &&
      inPeriod(isoDateFromTimestamp(item.occurredAt), period),
  );
  const total = inflow.reduce((sum, item) => sum + item.amount, 0);
  const buckets = new Map<PaymentTransaction["kind"], number>();

  for (const item of inflow) {
    buckets.set(item.kind, (buckets.get(item.kind) ?? 0) + item.amount);
  }

  return [...buckets.entries()]
    .map(([kind, amount]) => ({
      kind,
      label: transactionKindLabels[kind],
      amount,
      sharePercent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function financialFlowRows(
  summary: SalonFinancialPositionSummary,
): FinancialFlowRow[] {
  return [
    {
      id: "sales",
      label: "فروش خدمات",
      amount: summary.serviceSales,
      tone: "emerald",
    },
    {
      id: "receipts",
      label: "دریافت از مشتریان",
      amount: summary.customerReceipts,
      tone: "sky",
    },
    {
      id: "paid",
      label: "پرداخت به آرایشگران",
      amount: summary.settlementPaid,
      tone: "violet",
    },
    {
      id: "received",
      label: "دریافت از آرایشگران",
      amount: summary.settlementReceived,
      tone: "amber",
    },
    {
      id: "net",
      label: "جریان نقدی خالص",
      amount:
        summary.customerReceipts -
        summary.settlementPaid +
        summary.settlementReceived,
      tone: "primary",
    },
  ];
}

export function stylistPositionRows(period: SalonFinancialPeriod) {
  return stylistSettlementListRows({
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });
}

export function defaultFinancialPeriod() {
  return {
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
  };
}

export async function loadFinancialPositionData(options: {
  periodStart: string;
  periodEnd: string;
}) {
  await loadFinancialTransactionsData(options);
}
