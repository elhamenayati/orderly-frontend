import { customerById, fetchCustomers } from "@/lib/salon/customers";
import { fetchBookings } from "@/lib/salon/bookings";
import {
  fetchSettlementRecords,
  settlementMethodLabels,
} from "@/lib/salon/settlements";
import { fetchStylists } from "@/lib/salon/stylists";
import { stylistById } from "@/lib/salon/management";
import { transactionKindLabels } from "@/lib/salon/reports";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { bookings } from "@/mock_ts/bookings";
import { customers } from "@/mock_ts/customers";
import { paymentTransactions, stylistSettlementRecords } from "@/mock_ts/transactions";
import { stylists } from "@/mock_ts/stylists";
import type {
  PaymentTransaction,
  SettlementMethod,
  StylistSettlementRecord,
} from "@/types/domain";

export type FinancialTransactionType =
  | "customer_payment"
  | "stylist_settlement_payment"
  | "stylist_settlement_receipt";

export type FinancialTransactionFilters = {
  periodStart: string;
  periodEnd: string;
  type?: FinancialTransactionType | "all";
  stylistId?: string;
  customerId?: string;
  paymentMethod?: string;
};

export type FinancialTransactionRow = {
  id: string;
  occurredAt: string;
  type: FinancialTransactionType;
  typeLabel: string;
  amount: number;
  directionLabel: string;
  directionTone: "inflow" | "outflow";
  paymentMethodLabel: string;
  partyLabel: string;
  partyMobile?: string;
  partyKind: "customer" | "stylist";
  partyId?: string;
  reference: string;
  createdBy: string;
  bookingId?: string;
  notes?: string;
  source: "payment" | "settlement";
};

export type FinancialTransactionDetail = FinancialTransactionRow & {
  createdAt: string;
  bookingReference?: string;
};

export type FinancialTransactionSummary = {
  totalCount: number;
  customerReceiptTotal: number;
  customerReceiptCount: number;
  stylistPaymentTotal: number;
  stylistPaymentCount: number;
  stylistReceiptTotal: number;
  stylistReceiptCount: number;
  periodVolumeTotal: number;
};

export type PaymentTransactionFilters = {
  dateFrom?: string;
  dateTo?: string;
  direction?: PaymentTransaction["direction"];
};

function upsertPaymentTransactionToMock(transaction: PaymentTransaction) {
  const index = paymentTransactions.findIndex((item) => item.id === transaction.id);
  if (index >= 0) {
    paymentTransactions[index] = transaction;
  } else {
    paymentTransactions.push(transaction);
  }
}

function buildPaymentTransactionQuery(filters: PaymentTransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.direction) params.set("direction", filters.direction);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchPaymentTransactions(
  filters: PaymentTransactionFilters = {},
): Promise<PaymentTransaction[]> {
  if (!isApiEnabled()) {
    return paymentTransactions.filter((item) => {
      const occurredDate = item.occurredAt.slice(0, 10);
      if (filters.dateFrom && occurredDate < filters.dateFrom) return false;
      if (filters.dateTo && occurredDate > filters.dateTo) return false;
      if (filters.direction && item.direction !== filters.direction) return false;
      return true;
    });
  }

  try {
    const items = await apiFetch<PaymentTransaction[]>(
      `/salon/payment-transactions${buildPaymentTransactionQuery(filters)}`,
    );
    for (const item of items) {
      upsertPaymentTransactionToMock(item);
    }
    return items;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری تراکنش‌های پرداخت با خطا مواجه شد", 0);
  }
}

export async function loadFinancialTransactionsData(options: {
  periodStart: string;
  periodEnd: string;
}) {
  await Promise.all([
    fetchStylists({ status: "active" }),
    fetchCustomers(),
    fetchBookings({ status: "completed" }),
    fetchPaymentTransactions({
      dateFrom: options.periodStart,
      dateTo: options.periodEnd,
    }),
    fetchSettlementRecords({
      occurredFrom: options.periodStart,
      occurredTo: options.periodEnd,
    }),
  ]);
}

export async function loadTransactionsReportData(options: {
  periodStart: string;
  periodEnd: string;
}) {
  await loadFinancialTransactionsData(options);
}

const DEFAULT_CREATED_BY = "مینا محمدی";

export const financialTransactionTypeLabels: Record<
  FinancialTransactionType,
  string
> = {
  customer_payment: "پرداخت مشتری",
  stylist_settlement_payment: "رکورد مالی (پرداخت)",
  stylist_settlement_receipt: "رکورد مالی (دریافت)",
};

export const financialTransactionDirectionLabels = {
  customer_inflow: "دریافت از مشتری",
  stylist_payment: "پرداخت به آرایشگر",
  stylist_receipt: "دریافت از آرایشگر",
} as const;

function isoDateFromTimestamp(value: string) {
  return value.slice(0, 10);
}

function inPeriod(
  isoDate: string,
  period: { periodStart: string; periodEnd: string },
) {
  return isoDate >= period.periodStart && isoDate <= period.periodEnd;
}

function bookingCustomerId(bookingId?: string) {
  if (!bookingId) return undefined;
  return bookings.find((item) => item.id === bookingId)?.customerId;
}

function mapPaymentMethodLabel(source: "payment" | "settlement", key: string) {
  if (source === "payment") {
    return transactionKindLabels[key as PaymentTransaction["kind"]] ?? key;
  }
  return settlementMethodLabels[key as SettlementMethod] ?? key;
}

function customerPaymentRows(): FinancialTransactionRow[] {
  return paymentTransactions
    .filter((item) => item.direction === "inflow")
    .map((transaction) => {
      const customerId = bookingCustomerId(transaction.bookingId);
      const customer = customerId ? customerById(customerId) : undefined;
      return {
        id: transaction.id,
        occurredAt: transaction.occurredAt,
        type: "customer_payment" as const,
        typeLabel: financialTransactionTypeLabels.customer_payment,
        amount: transaction.amount,
        directionLabel: financialTransactionDirectionLabels.customer_inflow,
        directionTone: "inflow" as const,
        paymentMethodLabel: mapPaymentMethodLabel("payment", transaction.kind),
        partyLabel: customer?.fullName ?? "مشتری",
        partyMobile: customer?.mobile,
        partyKind: "customer" as const,
        partyId: customerId,
        reference:
          transaction.referenceNumber ??
          `PAY-${transaction.id.replace(/^txn_/, "").toUpperCase()}`,
        createdBy: transaction.createdBy ?? DEFAULT_CREATED_BY,
        bookingId: transaction.bookingId,
        notes: transaction.note,
        source: "payment" as const,
      };
    });
}

function settlementTransactionRows(): FinancialTransactionRow[] {
  return stylistSettlementRecords.map((record) => {
    const stylist = stylistById(record.stylistId);
    const isPayment = record.direction === "salon_to_stylist";
    return {
      id: record.id,
      occurredAt: `${record.occurredAt}T12:00:00.000Z`,
      type: isPayment
        ? ("stylist_settlement_payment" as const)
        : ("stylist_settlement_receipt" as const),
      typeLabel: isPayment
        ? financialTransactionTypeLabels.stylist_settlement_payment
        : financialTransactionTypeLabels.stylist_settlement_receipt,
      amount: record.amount,
      directionLabel: isPayment
        ? financialTransactionDirectionLabels.stylist_payment
        : financialTransactionDirectionLabels.stylist_receipt,
      directionTone: isPayment ? ("outflow" as const) : ("inflow" as const),
      paymentMethodLabel: mapPaymentMethodLabel("settlement", record.method),
      partyLabel: stylist?.displayName ?? "—",
      partyMobile: stylist?.mobile,
      partyKind: "stylist" as const,
      partyId: record.stylistId,
      reference:
        record.referenceNumber ??
        `SETT-${record.id.replace(/^set_/, "").toUpperCase()}`,
      createdBy: record.createdBy ?? DEFAULT_CREATED_BY,
      notes: record.notes,
      source: "settlement" as const,
    };
  });
}

export function allFinancialTransactions(): FinancialTransactionRow[] {
  return [...customerPaymentRows(), ...settlementTransactionRows()].sort(
    (a, b) => b.occurredAt.localeCompare(a.occurredAt),
  );
}

function rowPaymentMethodKey(row: FinancialTransactionRow) {
  if (row.source === "payment") {
    const transaction = paymentTransactions.find((item) => item.id === row.id);
    return transaction?.kind;
  }
  const record = stylistSettlementRecords.find((item) => item.id === row.id);
  return record?.method;
}

export function filteredFinancialTransactions(
  filters: FinancialTransactionFilters,
) {
  const period = {
    periodStart: filters.periodStart,
    periodEnd: filters.periodEnd,
  };

  return allFinancialTransactions().filter((row) => {
    if (!inPeriod(isoDateFromTimestamp(row.occurredAt), period)) return false;
    if (filters.type && filters.type !== "all" && row.type !== filters.type) {
      return false;
    }
    if (
      filters.stylistId &&
      filters.stylistId !== "all" &&
      (row.partyKind !== "stylist" || row.partyId !== filters.stylistId)
    ) {
      return false;
    }
    if (
      filters.customerId &&
      filters.customerId !== "all" &&
      (row.partyKind !== "customer" || row.partyId !== filters.customerId)
    ) {
      return false;
    }
    if (filters.paymentMethod && filters.paymentMethod !== "all") {
      if (rowPaymentMethodKey(row) !== filters.paymentMethod) return false;
    }
    return true;
  });
}

export function financialTransactionSummary(
  rows: FinancialTransactionRow[],
): FinancialTransactionSummary {
  const customerRows = rows.filter((row) => row.type === "customer_payment");
  const paymentRows = rows.filter(
    (row) => row.type === "stylist_settlement_payment",
  );
  const receiptRows = rows.filter(
    (row) => row.type === "stylist_settlement_receipt",
  );

  return {
    totalCount: rows.length,
    customerReceiptTotal: customerRows.reduce((sum, row) => sum + row.amount, 0),
    customerReceiptCount: customerRows.length,
    stylistPaymentTotal: paymentRows.reduce((sum, row) => sum + row.amount, 0),
    stylistPaymentCount: paymentRows.length,
    stylistReceiptTotal: receiptRows.reduce((sum, row) => sum + row.amount, 0),
    stylistReceiptCount: receiptRows.length,
    periodVolumeTotal: rows.reduce((sum, row) => sum + row.amount, 0),
  };
}

export function financialTransactionDetail(
  transactionId: string,
): FinancialTransactionDetail | null {
  const row = allFinancialTransactions().find(
    (item) => item.id === transactionId,
  );
  if (!row) return null;

  const createdAt =
    row.source === "payment"
      ? (paymentTransactions.find((item) => item.id === row.id)?.occurredAt ??
        row.occurredAt)
      : (stylistSettlementRecords.find((item) => item.id === row.id)
          ?.createdAt ?? row.occurredAt);

  return {
    ...row,
    createdAt,
    bookingReference: row.bookingId,
  };
}

export function financialTransactionFilterOptions() {
  return {
    types: [
      { id: "all", label: "همه انواع" },
      ...Object.entries(financialTransactionTypeLabels).map(([id, label]) => ({
        id,
        label,
      })),
    ],
    customers: [
      { id: "all", label: "همه مشتریان" },
      ...customers.map((item) => ({ id: item.id, label: item.fullName })),
    ],
    stylists: [
      { id: "all", label: "همه آرایشگران" },
      ...stylists
        .filter((item) => item.isActive)
        .map((item) => ({ id: item.id, label: item.displayName })),
    ],
    paymentMethods: [
      { id: "all", label: "همه روش‌ها" },
      { id: "cash", label: "نقدی" },
      { id: "card", label: "کارت" },
      { id: "transfer", label: "کارت به کارت" },
      { id: "other", label: "سایر" },
    ],
  };
}

export function defaultTransactionsPeriod() {
  return {
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
  };
}

export function formatTransactionDateTime(isoTimestamp: string) {
  const [datePart, timePart] = isoTimestamp.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const faDate = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  if (!timePart) return faDate;
  const [hours, minutes] = timePart.split(":");
  return `${faDate} ${hours}:${minutes}`;
}
