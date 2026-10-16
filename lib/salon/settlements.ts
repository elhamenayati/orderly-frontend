import {
  contractForStylist,
  contractSummary,
  contractTypeLabels,
  stylistById,
} from "@/lib/salon/management";
import { fetchStylists } from "@/lib/salon/stylists";
import { fetchServices } from "@/lib/salon/services";
import { fetchCustomers } from "@/lib/salon/customers";
import {
  calculateContractObligation,
  stylistAccrualEntries,
  type AccrualEntry,
  type AccrualKind,
  type ContractObligation,
  type SettlementPeriod,
} from "@/lib/salon/contract-obligations";
import { customerById, fetchBookings } from "@/lib/salon/bookings";
import { bookings } from "@/mock_ts/bookings";
import { formatToman } from "@/lib/format/money";
import {
  defaultSettlementPeriodForContract,
  listSettlementPeriods,
} from "@/lib/salon/financial-period";
import { financialPeriodLabels } from "@/lib/salon/stylist-detail";
import {
  formatJalaliShort,
  isoToJalaliDateObject,
  shiftIsoDate,
  todayIso,
} from "@/lib/format/jalali";
import { stylistSettlementRecords } from "@/mock_ts/transactions";
import { stylistContracts, stylists } from "@/mock_ts/stylists";
import { DEMO_SALON_ID } from "@/mock_ts/salon";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import type {
  ContractType,
  FinancialPeriod,
  SettlementDirection,
  SettlementMethod,
  StylistContract,
  StylistSettlementRecord,
} from "@/types/domain";

export type { ContractObligation, SettlementPeriod };

export type StylistFinancialPosition = {
  stylistId: string;
  stylistName: string;
  contractId?: string;
  contractType?: ContractType;
  contractTypeLabel: string;
  contractSummary: string;
  financialPeriodLabel: string;
  periodStart: string;
  periodEnd: string;
  sales: number;
  payable: number;
  receivable: number;
  settledToStylist: number;
  settledFromStylist: number;
  settledTotal: number;
  balance: number;
  balanceDirection: SettlementDirection | "balanced";
  status: "open" | "partial" | "settled" | "prepaid";
  bookingCredit: number;
  /** Current settlement period only — stylist share for percentage contracts. */
  periodPayable: number;
  /** Cumulative stylist share through period end — percentage contracts only. */
  cumulativePayable?: number;
  /** Prior unpaid stylist share carried into this period — percentage contracts only. */
  carriedBalance?: number;
  chairRentCharges?: number;
  chairRentRate?: number;
  chairRentPeriod?: FinancialPeriod;
};

export type LedgerKind = "settlement" | AccrualKind;

export const ledgerKindLabels: Record<LedgerKind, string> = {
  settlement: "رکورد مالی",
  booking: "رزرو",
  chair_rent: "اجاره صندلی",
  salary: "حقوق",
};

export type SettlementHistoryRow = {
  id: string;
  /** ISO datetime; accruals use the start of their day */
  occurredAt: string;
  kind: LedgerKind;
  kindLabel: string;
  direction: SettlementDirection;
  amount: number;
  methodLabel: string;
  referenceNumber?: string;
  description: string;
  bookingId?: string;
  /** Change to the balance (positive = more owed to the stylist). */
  balanceEffect: number;
  balanceAfter: number;
};

export type RecordSettlementInput = {
  stylistId: string;
  periodStart: string;
  periodEnd: string;
  direction: SettlementDirection;
  amount: number;
  occurredAt: string;
  method: SettlementMethod;
  referenceNumber?: string;
  notes?: string;
};

export type RecordSettlementResult =
  | { ok: true; record: StylistSettlementRecord }
  | { ok: false; error: string };

export const settlementDirectionLabels: Record<SettlementDirection, string> = {
  salon_to_stylist: "سالن ← آرایشگر",
  stylist_to_salon: "آرایشگر ← سالن",
};

export const settlementMethodLabels: Record<SettlementMethod, string> = {
  cash: "نقدی",
  card: "کارت",
  transfer: "کارت به کارت",
  other: "سایر",
};

export const settlementStatusLabels = {
  open: "مانده",
  partial: "رکورد جزئی",
  settled: "ثبت کامل",
  prepaid: "پیش‌پرداخت",
} as const;

export type SettlementListFilters = {
  stylistId?: string;
  periodStart?: string;
  periodEnd?: string;
  occurredFrom?: string;
  occurredTo?: string;
};

export type SettlementDateFilter = {
  periodStart: string;
  periodEnd: string;
};

export type StylistFinancialPositionInput = SettlementDateFilter & {
  /** Limit sales and settlements to the selected date range. */
  scopedToDateFilter?: boolean;
};

export function isSettlementDateFilterActive(
  filter: SettlementDateFilter,
): boolean {
  return Boolean(filter.periodStart.trim() || filter.periodEnd.trim());
}

export function resolveSettlementPeriod(
  filter: SettlementDateFilter,
): SettlementPeriod {
  const today = todayIso();

  if (!filter.periodStart.trim() && !filter.periodEnd.trim()) {
    return { periodStart: "", periodEnd: today };
  }

  const earliest = earliestContractEffectiveFrom(today);
  return {
    periodStart: filter.periodStart.trim() || earliest,
    periodEnd: filter.periodEnd.trim() || today,
  };
}

function syncAllSettlementRecords(items: StylistSettlementRecord[]) {
  stylistSettlementRecords.length = 0;
  stylistSettlementRecords.push(...items);
}

function syncSettlementRecordsForPeriod(
  periodStart: string,
  periodEnd: string,
  items: StylistSettlementRecord[],
) {
  for (let index = stylistSettlementRecords.length - 1; index >= 0; index -= 1) {
    const record = stylistSettlementRecords[index];
    if (
      record.periodStart === periodStart &&
      record.periodEnd === periodEnd
    ) {
      stylistSettlementRecords.splice(index, 1);
    }
  }
  stylistSettlementRecords.push(...items);
}

function upsertSettlementRecordToMock(record: StylistSettlementRecord) {
  const index = stylistSettlementRecords.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    stylistSettlementRecords[index] = record;
  } else {
    stylistSettlementRecords.push(record);
  }
}

function buildSettlementQuery(filters: SettlementListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.stylistId) {
    params.set("stylistId", filters.stylistId);
  }
  if (filters.periodStart) {
    params.set("periodStart", filters.periodStart);
  }
  if (filters.periodEnd) {
    params.set("periodEnd", filters.periodEnd);
  }
  if (filters.occurredFrom) {
    params.set("occurredFrom", filters.occurredFrom);
  }
  if (filters.occurredTo) {
    params.set("occurredTo", filters.occurredTo);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchSettlementRecords(
  filters: SettlementListFilters = {},
): Promise<StylistSettlementRecord[]> {
  if (!isApiEnabled()) {
    return stylistSettlementRecords.filter((record) => {
      if (filters.stylistId && record.stylistId !== filters.stylistId) {
        return false;
      }
      if (filters.periodStart && record.periodStart !== filters.periodStart) {
        return false;
      }
      if (filters.periodEnd && record.periodEnd !== filters.periodEnd) {
        return false;
      }
      if (filters.occurredFrom) {
        const occurredDate = record.occurredAt.slice(0, 10);
        if (occurredDate < filters.occurredFrom) return false;
      }
      if (filters.occurredTo) {
        const occurredDate = record.occurredAt.slice(0, 10);
        if (occurredDate > filters.occurredTo) return false;
      }
      return true;
    });
  }

  try {
    const items = await apiFetch<StylistSettlementRecord[]>(
      `/salon/settlements${buildSettlementQuery(filters)}`,
    );
    if (filters.periodStart && filters.periodEnd) {
      syncSettlementRecordsForPeriod(
        filters.periodStart,
        filters.periodEnd,
        items,
      );
    } else if (
      filters.stylistId ||
      filters.occurredFrom ||
      filters.occurredTo
    ) {
      // Partial filter – only upsert the returned subset
      for (const item of items) {
        upsertSettlementRecordToMock(item);
      }
    } else {
      // No filter at all → authoritative full-replace so the all-time
      // view is always accurate (removes any records deleted server-side).
      syncAllSettlementRecords(items);
    }
    return items;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری سوابق رکورد مالی با خطا مواجه شد", 0);
  }
}

export async function recordStylistSettlementAsync(
  input: RecordSettlementInput,
): Promise<RecordSettlementResult> {
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "مبلغ باید بیشتر از صفر باشد" };
  }
  if (!input.occurredAt) {
    return { ok: false, error: "تاریخ رکورد را وارد کنید" };
  }

  if (!isApiEnabled()) {
    return recordStylistSettlement(input);
  }

  try {
    const record = await apiFetch<StylistSettlementRecord>("/salon/settlements", {
      method: "POST",
      body: JSON.stringify({
        stylistId: input.stylistId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        direction: input.direction,
        amount: input.amount,
        occurredAt: input.occurredAt,
        method: input.method,
        referenceNumber: input.referenceNumber?.trim() ?? "",
        notes: input.notes?.trim() ?? "",
      }),
    });
    upsertSettlementRecordToMock(record);
    return { ok: true, record };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return { ok: false, error: "قرارداد فعال برای این آرایشگر ثبت نشده است" };
      }
      if (error.status === 400) {
        return { ok: false, error: "اطلاعات رکورد مالی نامعتبر است" };
      }
      throw error;
    }
    return { ok: false, error: "ثبت رکورد مالی با خطا مواجه شد" };
  }
}

export async function loadSettlementReportData(
  filter: SettlementDateFilter,
) {
  const period = resolveSettlementPeriod(filter);
  const dateFilterActive = isSettlementDateFilterActive(filter);

  await Promise.all([
    fetchStylists({ status: "active" }),
    fetchServices(),
    fetchCustomers().catch(() => []),
    fetchBookings({
      status: "completed",
      ...(dateFilterActive
        ? { dateFrom: period.periodStart, dateTo: period.periodEnd }
        : {}),
    }),
    fetchSettlementRecords(
      dateFilterActive
        ? {
            occurredFrom: period.periodStart,
            occurredTo: period.periodEnd,
          }
        : {},
    ),
  ]);
}

function earliestContractEffectiveFrom(throughPeriodEnd: string) {
  const activeContracts = stylistContracts.filter((contract) => contract.isActive);
  if (activeContracts.length === 0) {
    return throughPeriodEnd;
  }
  return activeContracts.reduce(
    (earliest, contract) =>
      contract.effectiveFrom < earliest ? contract.effectiveFrom : earliest,
    activeContracts[0]!.effectiveFrom,
  );
}

function obligationPeriodStart(
  contractEffectiveFrom: string,
  period: SettlementPeriod,
) {
  return period.periodStart < contractEffectiveFrom
    ? contractEffectiveFrom
    : period.periodStart;
}

function cumulativePercentageObligation(
  stylistId: string,
  contract: StylistContract,
  throughPeriod: SettlementPeriod,
) {
  const start = contract.effectiveFrom;
  const periods = listSettlementPeriods(contract, start, throughPeriod.periodEnd);

  return periods.reduce((total, item) => {
    const periodStart = obligationPeriodStart(start, item);
    const obligation = calculateContractObligation(stylistId, {
      periodStart,
      periodEnd:
        item.periodEnd > throughPeriod.periodEnd
          ? throughPeriod.periodEnd
          : item.periodEnd,
    });
    return total + obligation.netObligation;
  }, 0);
}

function settlementRecordsThrough(stylistId: string, throughDate: string) {
  return stylistSettlementRecords
    .filter((record) => record.stylistId === stylistId)
    .filter((record) => record.occurredAt.slice(0, 10) <= throughDate);
}

function settlementRecordsInRange(
  stylistId: string,
  period: SettlementPeriod,
) {
  return stylistSettlementRecords
    .filter((record) => record.stylistId === stylistId)
    .filter((record) => {
      const occurredDate = record.occurredAt.slice(0, 10);
      return (
        occurredDate >= period.periodStart && occurredDate <= period.periodEnd
      );
    });
}

function settlementTotals(records: StylistSettlementRecord[]) {
  const settledToStylist = records
    .filter((record) => record.direction === "salon_to_stylist")
    .reduce((sum, record) => sum + record.amount, 0);
  const settledFromStylist = records
    .filter((record) => record.direction === "stylist_to_salon")
    .reduce((sum, record) => sum + record.amount, 0);
  return {
    settledToStylist,
    settledFromStylist,
    settledTotal: settledToStylist + settledFromStylist,
  };
}

function openingBalanceForPercentagePeriod(
  stylistId: string,
  contract: StylistContract,
  period: SettlementPeriod,
) {
  const start = contract.effectiveFrom;
  const openingDate = shiftIsoDate(period.periodStart, -1);
  if (openingDate < start) {
    return 0;
  }

  const cumulativeBefore = cumulativePercentageObligation(stylistId, contract, {
    periodStart: start,
    periodEnd: openingDate,
  });
  const priorRecords = settlementRecordsThrough(stylistId, openingDate);
  const { settledToStylist, settledFromStylist } = settlementTotals(priorRecords);
  return cumulativeBefore - settledToStylist + settledFromStylist;
}

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export { calculateContractObligation };

function deriveStatus(
  balance: number,
  settledTotal: number,
  netObligation: number,
): StylistFinancialPosition["status"] {
  if (balance === 0) return "settled";
  if (settledTotal === 0) return "open";
  if (Math.sign(balance) !== Math.sign(netObligation) && netObligation !== 0) {
    return "prepaid";
  }
  return "partial";
}

export function stylistFinancialPosition(
  stylistId: string,
  input: StylistFinancialPositionInput,
): StylistFinancialPosition | null {
  const stylist = stylistById(stylistId);
  if (!stylist) return null;

  const scopedToDateFilter = input.scopedToDateFilter ?? false;
  const period = resolveSettlementPeriod(input);
  const contract = contractForStylist(stylistId);
  const obligationStart = contract
    ? obligationPeriodStart(contract.effectiveFrom, period)
    : period.periodStart;
  const periodObligation = calculateContractObligation(stylistId, {
    periodStart: obligationStart,
    periodEnd: period.periodEnd,
  });
  const records = scopedToDateFilter
    ? settlementRecordsInRange(stylistId, period)
    : settlementRecordsThrough(stylistId, period.periodEnd);

  const { settledToStylist, settledFromStylist, settledTotal } =
    settlementTotals(records);

  const useCumulativeBalance =
    contract?.type === "percentage" && !scopedToDateFilter;
  const cumulativePayable =
    contract && useCumulativeBalance
      ? cumulativePercentageObligation(stylistId, contract, period)
      : undefined;
  const netObligation = useCumulativeBalance
    ? (cumulativePayable ?? 0)
    : periodObligation.netObligation;
  const balance = netObligation - settledToStylist + settledFromStylist;
  const carriedBalance =
    contract && useCumulativeBalance
      ? openingBalanceForPercentagePeriod(stylistId, contract, period)
      : undefined;

  let balanceDirection: StylistFinancialPosition["balanceDirection"] =
    "balanced";
  if (balance > 0) balanceDirection = "salon_to_stylist";
  if (balance < 0) balanceDirection = "stylist_to_salon";

  const reportingStart = obligationStart;

  return {
    stylistId,
    stylistName: stylist.displayName,
    contractId: contract?.id,
    contractType: contract?.type,
    contractTypeLabel: contract
      ? contractTypeLabels[contract.type]
      : "بدون قرارداد",
    contractSummary: contractSummary(stylistId),
    financialPeriodLabel: contract
      ? financialPeriodLabels[contract.financialPeriod]
      : "—",
    periodStart: reportingStart,
    periodEnd: period.periodEnd,
    sales: periodObligation.sales,
    payable: useCumulativeBalance
      ? (cumulativePayable ?? 0)
      : periodObligation.payable,
    receivable: periodObligation.receivable,
    settledToStylist,
    settledFromStylist,
    settledTotal,
    balance,
    balanceDirection,
    status: deriveStatus(balance, settledTotal, netObligation),
    bookingCredit: periodObligation.bookingCredit,
    periodPayable: periodObligation.payable,
    cumulativePayable,
    carriedBalance,
    chairRentCharges: periodObligation.chairRentCharges,
    chairRentRate: periodObligation.chairRentRate,
    chairRentPeriod: periodObligation.chairRentPeriod,
  };
}

function bookingEntryDescription(entry: AccrualEntry) {
  const booking = bookings.find((item) => item.id === entry.bookingId);
  const customer = booking ? customerById(booking.customerId) : undefined;
  const parts = [
    booking?.displayCode ? `رزرو ${booking.displayCode}` : null,
    customer?.fullName ?? null,
    `فروش ${formatToman(entry.sales)}`,
  ];
  const { contract } = entry;
  if (contract.type === "percentage") {
    parts.push(`سهم آرایشگر ${100 - (contract.percentage ?? 0)}٪`);
  } else if (contract.type === "fixed_salary_plus_commission") {
    parts.push(`پورسانت ${contract.commissionPercentage ?? 0}٪`);
  } else if (contract.type === "fixed_salary") {
    parts.push("درآمد سالن");
  }
  return parts.filter(Boolean).join(" · ");
}

function periodChargeDescription(entry: AccrualEntry) {
  const title = entry.kind === "chair_rent" ? "اجاره صندلی" : "حقوق";
  switch (entry.contract.financialPeriod) {
    case "monthly":
      return `${title} ${isoToJalaliDateObject(entry.date).format("MMMM YYYY")}`;
    case "weekly":
      return `${title} هفته ${formatJalaliShort(entry.date)}`;
    default:
      return `${title} روز ${formatJalaliShort(entry.date)}`;
  }
}

function accrualToLedgerRow(entry: AccrualEntry): Omit<SettlementHistoryRow, "balanceAfter"> {
  return {
    id: entry.id,
    occurredAt: `${entry.date}T00:00:00`,
    kind: entry.kind,
    kindLabel: ledgerKindLabels[entry.kind],
    direction: entry.direction,
    amount: entry.amount,
    methodLabel: "—",
    description:
      entry.kind === "booking"
        ? bookingEntryDescription(entry)
        : periodChargeDescription(entry),
    bookingId: entry.bookingId,
    balanceEffect:
      entry.direction === "salon_to_stylist" ? entry.amount : -entry.amount,
  };
}

function settlementToLedgerRow(
  record: StylistSettlementRecord,
): Omit<SettlementHistoryRow, "balanceAfter"> {
  return {
    id: record.id,
    occurredAt: record.occurredAt,
    kind: "settlement",
    kindLabel: ledgerKindLabels.settlement,
    direction: record.direction,
    amount: record.amount,
    methodLabel: settlementMethodLabels[record.method],
    referenceNumber: record.referenceNumber,
    description: record.notes ?? "—",
    balanceEffect:
      record.direction === "salon_to_stylist" ? -record.amount : record.amount,
  };
}

/**
 * Bookings, chair rent, salary and recorded payments in one ledger, newest first.
 * The running balance ends at the position's balance (positive = salon owes stylist).
 */
export function settlementHistoryRows(
  stylistId: string,
  input: StylistFinancialPositionInput,
): SettlementHistoryRow[] {
  const position = stylistFinancialPosition(stylistId, input);
  if (!position) return [];

  const scopedToDateFilter = input.scopedToDateFilter ?? false;
  const period = resolveSettlementPeriod(input);
  const records = scopedToDateFilter
    ? settlementRecordsInRange(stylistId, period)
    : settlementRecordsThrough(stylistId, period.periodEnd);
  const accruals = position.contractId
    ? stylistAccrualEntries(stylistId, {
        periodStart: position.periodStart,
        periodEnd: position.periodEnd,
      })
    : [];

  const chronological = [
    ...accruals.map(accrualToLedgerRow),
    ...records.map(settlementToLedgerRow),
  ].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  let balance = 0;
  const withBalance = chronological.map((row) => {
    balance += row.balanceEffect;
    return { ...row, balanceAfter: balance };
  });

  return withBalance.reverse();
}

export function projectBalanceAfterSettlement(
  position: StylistFinancialPosition,
  direction: SettlementDirection,
  amount: number,
) {
  if (!amount || amount <= 0) return position.balance;
  if (direction === "salon_to_stylist") {
    return position.balance - amount;
  }
  return position.balance + amount;
}

export function balanceFavorLabel(balance: number) {
  if (balance === 0) return "ثبت کامل";
  if (balance > 0) return "به نفع آرایشگر";
  return "به نفع سالن";
}

export type StylistSettlementListRow = StylistFinancialPosition;

export function stylistSettlementListRows(options: {
  periodStart: string;
  periodEnd: string;
  query?: string;
  contractType?: ContractType | "all";
}): StylistSettlementListRow[] {
  const normalizedQuery = options.query?.trim().toLowerCase() ?? "";
  const scopedToDateFilter = isSettlementDateFilterActive(options);
  const positionInput: StylistFinancialPositionInput = {
    periodStart: options.periodStart,
    periodEnd: options.periodEnd,
    scopedToDateFilter,
  };

  return stylists
    .filter((stylist) => stylist.isActive)
    .filter((stylist) => {
      if (!normalizedQuery) return true;
      return stylist.displayName.toLowerCase().includes(normalizedQuery);
    })
    .filter((stylist) => {
      if (!options.contractType || options.contractType === "all") return true;
      const contract = contractForStylist(stylist.id);
      return contract?.type === options.contractType;
    })
    .map((stylist) => stylistFinancialPosition(stylist.id, positionInput))
    .filter((row): row is StylistFinancialPosition => row !== null)
    .sort((a, b) => a.stylistName.localeCompare(b.stylistName, "fa"));
}

export function settlementSummaryTotals(rows: StylistFinancialPosition[]) {
  return rows.reduce(
    (acc, row) => {
      acc.totalPayable += row.payable;
      acc.totalReceivable += row.receivable;
      acc.totalSettled += row.settledTotal;
      acc.totalBalance += row.balance;
      return acc;
    },
    {
      totalPayable: 0,
      totalReceivable: 0,
      totalSettled: 0,
      totalBalance: 0,
    },
  );
}

export function recordStylistSettlement(
  input: RecordSettlementInput,
): RecordSettlementResult {
  if (!input.amount || input.amount <= 0) {
    return { ok: false, error: "مبلغ باید بیشتر از صفر باشد" };
  }
  if (!input.occurredAt) {
    return { ok: false, error: "تاریخ رکورد را وارد کنید" };
  }

  const stylist = stylistById(input.stylistId);
  if (!stylist) {
    return { ok: false, error: "آرایشگر یافت نشد" };
  }

  const contract = contractForStylist(input.stylistId);
  if (!contract) {
    return { ok: false, error: "قرارداد فعال برای این آرایشگر ثبت نشده است" };
  }

  const record: StylistSettlementRecord = {
    id: nextId("set"),
    salonId: DEMO_SALON_ID,
    stylistId: input.stylistId,
    contractId: contract.id,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    direction: input.direction,
    amount: input.amount,
    occurredAt: input.occurredAt,
    method: input.method,
    referenceNumber: input.referenceNumber?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  stylistSettlementRecords.push(record);
  return { ok: true, record };
}

export function activeStylistsForSettlement() {
  return stylists
    .filter((stylist) => stylist.isActive)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "fa"));
}

export function activeContractsForFilter() {
  return stylistContracts.filter((contract) => contract.isActive);
}

export function contractTypeFilterOptions(): {
  value: ContractType | "all";
  label: string;
}[] {
  return [
    { value: "all", label: "همه قراردادها" },
    ...Object.entries(contractTypeLabels).map(([value, label]) => ({
      value: value as ContractType,
      label,
    })),
  ];
}

export { contractTypeLabels };

export function defaultSettlementPeriod() {
  return defaultSettlementPeriodForContract(null);
}

export function settlementPeriodForStylist(stylistId: string) {
  return defaultSettlementPeriodForContract(contractForStylist(stylistId));
}

export function settlementPeriodForStylistAt(
  stylistId: string,
  referenceDate: string,
) {
  return defaultSettlementPeriodForContract(
    contractForStylist(stylistId),
    referenceDate,
  );
}

/** Period used when recording or previewing a settlement in the drawer. */
export function settlementPeriodForDrawer(
  stylistId: string,
  pageFilter: SettlementDateFilter,
  anchorStylistId: string | null,
): SettlementPeriod {
  if (isSettlementDateFilterActive(pageFilter)) {
    const period = resolveSettlementPeriod(pageFilter);
    if (anchorStylistId && stylistId === anchorStylistId) {
      return period;
    }
    return settlementPeriodForStylistAt(stylistId, period.periodEnd);
  }

  return defaultSettlementPeriodForContract(contractForStylist(stylistId));
}

export function contractForStylistExport(stylistId: string): StylistContract | undefined {
  return contractForStylist(stylistId);
}
