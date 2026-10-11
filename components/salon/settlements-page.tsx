"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Info,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  contractTypeFilterOptions,
  isSettlementDateFilterActive,
  loadSettlementReportData,
  settlementHistoryRows,
  settlementStatusLabels,
  stylistFinancialPosition,
  stylistSettlementListRows,
  type StylistFinancialPosition,
} from "@/lib/salon/settlements";
import { stylistById } from "@/lib/salon/management";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatPrice } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { RecordSettlementDrawer } from "@/components/salon/settlements/record-settlement-drawer";
import { SettlementDirectionLabel } from "@/components/salon/settlements/settlement-direction-label";
import {
  paginateItems,
  TablePagination,
} from "@/components/salon/settlements/table-pagination";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JalaliDateRangeInput } from "@/components/ui/jalali-date-range-input";
import { cn } from "@/lib/utils";
import type { ContractType } from "@/types/domain";

const STYLIST_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 10;

function statusBadgeClass(status: StylistFinancialPosition["status"]) {
  switch (status) {
    case "settled":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "prepaid":
      return "border-sky-200 bg-sky-50 text-sky-800";
    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

export function SettlementsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const initialLoadDone = useRef(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [query, setQuery] = useState("");
  const [contractFilter, setContractFilter] = useState<ContractType | "all">(
    "all",
  );
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(
    null,
  );
  const [stylistPage, setStylistPage] = useState(1);
  const [stylistPageSize, setStylistPageSize] = useState(STYLIST_PAGE_SIZE);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(HISTORY_PAGE_SIZE);
  const [recordOpen, setRecordOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (initialLoadDone.current) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setLoadError(null);
      try {
        await loadSettlementReportData({ periodStart, periodEnd });
        if (cancelled) return;
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری رکورد مالی آرایشگران با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) {
          initialLoadDone.current = true;
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

  const dateFilterActive = isSettlementDateFilterActive({
    periodStart,
    periodEnd,
  });

  const rows = useMemo(() => {
    void refreshKey;
    return stylistSettlementListRows({
      periodStart,
      periodEnd,
      query,
      contractType: contractFilter,
    });
  }, [refreshKey, periodStart, periodEnd, query, contractFilter]);

  const selectedPosition = useMemo(() => {
    if (!selectedStylistId) return null;
    return stylistFinancialPosition(selectedStylistId, {
      periodStart,
      periodEnd,
      scopedToDateFilter: dateFilterActive,
    });
  }, [
    selectedStylistId,
    periodStart,
    periodEnd,
    dateFilterActive,
    refreshKey,
  ]);

  const historyRows = useMemo(() => {
    if (!selectedStylistId) return [];
    return settlementHistoryRows(selectedStylistId, {
      periodStart,
      periodEnd,
      scopedToDateFilter: dateFilterActive,
    });
  }, [
    selectedStylistId,
    periodStart,
    periodEnd,
    dateFilterActive,
    refreshKey,
  ]);

  const selectedStylist = selectedStylistId
    ? stylistById(selectedStylistId)
    : null;

  const {
    pageItems: stylistPageRows,
    currentPage: stylistCurrentPage,
  } = paginateItems(rows, stylistPage, stylistPageSize);

  const {
    pageItems: historyPageRows,
    currentPage: historyCurrentPage,
  } = paginateItems(historyRows, historyPage, historyPageSize);

  useEffect(() => {
    setStylistPage(1);
  }, [query, contractFilter, periodStart, periodEnd]);

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedStylistId, periodStart, periodEnd]);

  useEffect(() => {
    if (
      selectedStylistId &&
      !rows.some((row) => row.stylistId === selectedStylistId)
    ) {
      setSelectedStylistId(null);
    }
  }, [rows, selectedStylistId]);

  useEffect(() => {
    if (stylistPage !== stylistCurrentPage) {
      setStylistPage(stylistCurrentPage);
    }
  }, [stylistPage, stylistCurrentPage]);

  useEffect(() => {
    if (historyPage !== historyCurrentPage) {
      setHistoryPage(historyCurrentPage);
    }
  }, [historyPage, historyCurrentPage]);

  function clearFilters() {
    setPeriodStart("");
    setPeriodEnd("");
    setQuery("");
    setContractFilter("all");
    setSelectedStylistId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            گزارش‌ها / رکورد مالی آرایشگران
          </p>
          <h1 className="mt-1 text-2xl font-bold">رکورد مالی آرایشگران</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت و ثبت پرداخت‌ها و دریافت‌های مالی آرایشگران
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setRecordOpen(true)}
          disabled={initialLoading}
        >
          <Plus className="size-4" />
          ثبت رکورد مالی
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {initialLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : (
        <>
      <Card className="shadow-none">
        <CardContent className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">جستجو</span>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="نام آرایشگر..."
                  className="h-11 w-full rounded-xl border border-input bg-background ps-10 pe-3 text-sm"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">نوع قرارداد</span>
              <select
                value={contractFilter}
                onChange={(event) =>
                  setContractFilter(event.target.value as ContractType | "all")
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {contractTypeFilterOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">بازه تاریخ</span>
              <JalaliDateRangeInput
                from={periodStart}
                to={periodEnd}
                applyOnComplete
                onChange={(from, to) => {
                  setPeriodStart(from);
                  setPeriodEnd(to);
                }}
                placeholder="از تاریخ — تا تاریخ"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={clearFilters}
            >
              پاک کردن
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>
              برای مشاهده تاریخچه و جزئیات رکورد مالی هر آرایشگر بر روی ردیف آن
              کلیک کنید.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className={cn("relative", selectedPosition && "min-h-[72vh]")}>
        <Card
          className={cn(
            "shadow-none transition-[max-height]",
            refreshing && "opacity-70",
            selectedPosition && "max-h-[42vh]",
          )}
        >
          <CardContent className="space-y-0 p-0">
            <div
              className={cn(
                "overflow-x-auto",
                selectedPosition && "max-h-[calc(42vh-4rem)] overflow-y-auto",
              )}
            >
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-[1] border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-center font-medium">آرایشگر</th>
                    <th className="px-4 py-3 text-center font-medium">قرارداد</th>
                    <th className="px-4 py-3 text-center font-medium">دوره مالی</th>
                    <th className="px-4 py-3 text-center font-medium">میزان فروش</th>
                    <th className="px-4 py-3 text-center font-medium">پرداخت شده</th>
                    <th className="px-4 py-3 text-center font-medium">مانده</th>
                    <th className="px-4 py-3 text-center font-medium">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        آرایشگری با این فیلتر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    stylistPageRows.map((row) => (
                      <tr
                        key={row.stylistId}
                        className={cn(
                          "cursor-pointer border-b border-border transition last:border-b-0 hover:bg-muted/30",
                          selectedStylistId === row.stylistId && "bg-primary/5",
                        )}
                        onClick={() => setSelectedStylistId(row.stylistId)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <StylistAvatar
                              stylistId={row.stylistId}
                              avatarPath={stylistById(row.stylistId)?.avatarPath}
                              name={row.stylistName}
                              size="sm"
                            />
                            <span className="font-medium">{row.stylistName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.contractSummary}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {dateFilterActive ? (
                            <>
                              {formatJalaliShort(row.periodStart)} —{" "}
                              {formatJalaliShort(row.periodEnd)}
                            </>
                          ) : (
                            "همه دوره‌ها"
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {row.sales > 0 ? formatPrice(row.sales) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.settledTotal > 0
                            ? formatPrice(row.settledTotal)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <BalanceCell row={row} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full",
                              statusBadgeClass(row.status),
                            )}
                          >
                            {settlementStatusLabels[row.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={stylistPage}
              pageSize={stylistPageSize}
              totalItems={rows.length}
              onPageChange={setStylistPage}
              onPageSizeChange={(size) => {
                setStylistPageSize(size);
                setStylistPage(1);
              }}
            />
          </CardContent>
        </Card>

        {selectedPosition ? (
          <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[58vh] flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <StylistAvatar
                  stylistId={selectedStylistId ?? undefined}
                  avatarPath={selectedStylist?.avatarPath}
                  name={selectedPosition.stylistName}
                  size="sm"
                />
                <div>
                  <p className="font-semibold">{selectedPosition.stylistName}</p>
                  <p className="text-xs text-muted-foreground">
                    جزئیات رکورد مالی آرایشگر
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={() => setRecordOpen(true)}>
                  <Plus className="size-4" />
                  ثبت رکورد مالی
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setSelectedStylistId(null)}
                  aria-label="بستن جزئیات"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                label="فروش آرایشگر"
                value={formatPrice(selectedPosition.sales)}
              />
              <SummaryCard
                label="بدهکار (سالن)"
                value={formatPrice(
                  selectedPosition.contractType === "percentage"
                    ? selectedPosition.cumulativePayable ?? selectedPosition.payable
                    : selectedPosition.payable,
                )}
              />
              <SummaryCard
                label="بستانکار (آرایشگر)"
                value={formatPrice(
                  selectedPosition.contractType === "percentage"
                    ? selectedPosition.cumulativePayable ?? selectedPosition.payable
                    : selectedPosition.receivable,
                )}
              />
              <SummaryCard
                label="ثبت‌شده"
                value={formatPrice(selectedPosition.settledTotal)}
              />
              <SummaryCard
                label="مانده"
                value={formatPrice(Math.abs(selectedPosition.balance))}
                highlight
                tone={
                  selectedPosition.balance === 0
                    ? "neutral"
                    : selectedPosition.balanceDirection === "salon_to_stylist"
                      ? "payable"
                      : "receivable"
                }
              />
            </div>

            <Card className="shadow-none">
              <CardContent className="space-y-0 p-0">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="font-semibold">تاریخچه رکورد مالی</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-center font-medium">تاریخ</th>
                        <th className="px-3 py-2 text-center font-medium">جهت</th>
                        <th className="px-3 py-2 text-center font-medium">مبلغ</th>
                        <th className="px-3 py-2 text-center font-medium">روش</th>
                        <th className="px-3 py-2 text-center font-medium">پیگیری</th>
                        <th className="px-3 py-2 text-center font-medium">توضیحات</th>
                        <th className="px-3 py-2 text-center font-medium">مانده</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-8 text-center text-muted-foreground"
                          >
                            رکورد مالی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        historyPageRows.map(({ record, methodLabel, balanceAfter }) => (
                          <tr
                            key={record.id}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-3 py-3">
                              {formatJalaliShort(record.occurredAt)}
                            </td>
                            <td className="px-3 py-3">
                              <SettlementDirectionLabel
                                direction={record.direction}
                                className={
                                  record.direction === "salon_to_stylist"
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }
                                arrowClassName={
                                  record.direction === "salon_to_stylist"
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }
                              />
                            </td>
                            <td className="px-3 py-3">
                              {formatPrice(record.amount)}
                            </td>
                            <td className="px-3 py-3">{methodLabel}</td>
                            <td className="px-3 py-3" dir="ltr">
                              {record.referenceNumber ?? "—"}
                            </td>
                            <td className="px-3 py-3 text-muted-foreground">
                              {record.notes ?? "—"}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {formatPrice(Math.abs(balanceAfter))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {historyRows.length > 0 ? (
                  <TablePagination
                    page={historyPage}
                    pageSize={historyPageSize}
                    totalItems={historyRows.length}
                    onPageChange={setHistoryPage}
                    onPageSizeChange={(size) => {
                      setHistoryPageSize(size);
                      setHistoryPage(1);
                    }}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-none">
              <CardContent className="space-y-4 py-4">
                <div className="rounded-2xl border border-border p-4 text-sm">
                  <p className="font-medium">قرارداد فعال</p>
                  <p className="mt-2 text-muted-foreground">
                    {selectedPosition.contractTypeLabel}
                  </p>
                  <p className="mt-1">{selectedPosition.contractSummary}</p>
                  <p className="mt-3 text-muted-foreground">
                    دوره مالی: {selectedPosition.financialPeriodLabel}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    بازه:{" "}
                    {dateFilterActive
                      ? `${formatJalaliShort(selectedPosition.periodStart)} — ${formatJalaliShort(selectedPosition.periodEnd)}`
                      : "همه دوره‌ها"}
                  </p>
                  {selectedPosition.contractType === "chair_rent" ? (
                    <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted-foreground">
                      <p>
                        درآمد رزروها: {formatPrice(selectedPosition.bookingCredit)}
                      </p>
                      <p>
                        اجاره ({selectedPosition.chairRentWorkingDays ?? 0} روز
                        کاری × {formatPrice(selectedPosition.chairRentPerDay ?? 0)}
                        ): {formatPrice(selectedPosition.receivable)}
                      </p>
                    </div>
                  ) : null}
                  {selectedPosition.contractType === "percentage" ? (
                    <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted-foreground">
                      <p>
                        سهم این دوره: {formatPrice(selectedPosition.periodPayable)}
                      </p>
                      {selectedPosition.carriedBalance &&
                      selectedPosition.carriedBalance !== 0 ? (
                        <p>
                          مانده از دوره قبل:{" "}
                          {formatPrice(Math.abs(selectedPosition.carriedBalance))}
                        </p>
                      ) : null}
                      <p>
                        جمع سهم آرایشگر:{" "}
                        {formatPrice(selectedPosition.cumulativePayable ?? 0)}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div
                  className={cn(
                    "rounded-2xl p-4 text-sm",
                    selectedPosition.balance === 0
                      ? "bg-muted"
                      : selectedPosition.balanceDirection === "salon_to_stylist"
                        ? "bg-emerald-50 text-emerald-950"
                        : "bg-rose-50 text-rose-950",
                  )}
                >
                  <p className="font-medium">مانده نهایی</p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatPrice(Math.abs(selectedPosition.balance))}
                  </p>
                  <p className="mt-2 text-sm opacity-80">
                    {selectedPosition.balance === 0
                      ? "ثبت کامل شده است"
                      : selectedPosition.balanceDirection === "salon_to_stylist"
                        ? "قابل پرداخت از سالن به آرایشگر"
                        : "قابل دریافت از آرایشگر به سالن"}
                  </p>
                </div>

                <Button
                  render={
                    <Link
                      href={`/salon/stylists/${selectedPosition.stylistId}?tab=contract`}
                    />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  مشاهده قرارداد
                </Button>
              </CardContent>
            </Card>
          </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <RecordSettlementDrawer
        open={recordOpen}
        onOpenChange={setRecordOpen}
        periodStart={periodStart}
        periodEnd={periodEnd}
        initialStylistId={selectedStylistId}
        dataVersion={refreshKey}
        onRecorded={async (stylistId) => {
          setSelectedStylistId(stylistId);
          try {
            await loadSettlementReportData({ periodStart, periodEnd });
            setRefreshKey((value) => value + 1);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              clearSalonSession();
              window.location.href = "/salon/login";
              return;
            }
            setLoadError("به‌روزرسانی سوابق رکورد مالی با خطا مواجه شد");
          }
        }}
      />
        </>
      )}
    </div>
  );
}

function BalanceCell({ row }: { row: StylistFinancialPosition }) {
  if (row.balance === 0) {
    return <span className="text-muted-foreground">۰</span>;
  }
  const positive = row.balance > 0;
  return (
    <span
      className={cn(
        "font-medium",
        positive ? "text-emerald-700" : "text-rose-700",
      )}
    >
      {formatPrice(Math.abs(row.balance))}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "neutral" | "payable" | "receivable";
}) {
  const toneClass =
    tone === "payable"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "receivable"
        ? "border-rose-200 bg-rose-50"
        : "border-border";

  return (
    <Card
      className={cn(
        "shadow-none",
        toneClass,
        highlight && "border-2 border-red-500",
      )}
    >
      <CardContent className="space-y-2 py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("text-lg font-bold", highlight && "text-foreground")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
