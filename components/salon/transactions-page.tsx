"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  defaultTransactionsPeriod,
  filteredFinancialTransactions,
  financialTransactionDetail,
  financialTransactionFilterOptions,
  financialTransactionSummary,
  formatTransactionDateTime,
  loadTransactionsReportData,
  type FinancialTransactionRow,
  type FinancialTransactionType,
} from "@/lib/salon/transactions";
import { formatPrice } from "@/lib/format";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { TransactionDetailDrawer } from "@/components/salon/transactions/transaction-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { cn } from "@/lib/utils";

export function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const defaultPeriod = defaultTransactionsPeriod();
  const [periodStart, setPeriodStart] = useState(defaultPeriod.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.periodEnd);
  const [typeFilter, setTypeFilter] = useState<FinancialTransactionType | "all">(
    "all",
  );
  const [stylistId, setStylistId] = useState("all");
  const [customerId, setCustomerId] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await loadTransactionsReportData({ periodStart, periodEnd });
        if (cancelled) return;
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری تراکنش‌های مالی با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

  const filterOptions = useMemo(() => {
    void refreshKey;
    return financialTransactionFilterOptions();
  }, [refreshKey]);

  const filters = useMemo(
    () => ({
      periodStart,
      periodEnd,
      type: typeFilter,
      stylistId,
      customerId,
      paymentMethod,
    }),
    [periodStart, periodEnd, typeFilter, stylistId, customerId, paymentMethod],
  );

  const rows = useMemo(() => {
    void refreshKey;
    return filteredFinancialTransactions(filters);
  }, [filters, refreshKey]);
  const summary = useMemo(() => financialTransactionSummary(rows), [rows]);
  const selectedDetail = useMemo(() => {
    void refreshKey;
    return selectedId ? financialTransactionDetail(selectedId) : null;
  }, [selectedId, refreshKey]);

  function openDetail(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  function clearFilters() {
    setTypeFilter("all");
    setStylistId("all");
    setCustomerId("all");
    setPaymentMethod("all");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          گزارش‌ها / تراکنش‌های مالی
        </p>
        <h1 className="mt-1 text-2xl font-bold">تراکنش‌های مالی</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مشاهده و پیگیری پرداخت‌های مشتریان و رکوردهای مالی آرایشگران — Audit Trail
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : (
        <>
      <Card className="shadow-none">
        <CardContent className="grid gap-4 py-4 lg:grid-cols-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">از تاریخ</span>
            <JalaliDateInput
              value={periodStart}
              onChange={setPeriodStart}
              placeholder="از تاریخ"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">تا تاریخ</span>
            <JalaliDateInput
              value={periodEnd}
              minDate={periodStart || undefined}
              onChange={setPeriodEnd}
              placeholder="تا تاریخ"
            />
          </label>
          <FilterSelect
            label="نوع تراکنش"
            value={typeFilter}
            onChange={(value) =>
              setTypeFilter(value as FinancialTransactionType | "all")
            }
            options={filterOptions.types}
          />
          <FilterSelect
            label="آرایشگر"
            value={stylistId}
            onChange={setStylistId}
            options={filterOptions.stylists}
          />
          <FilterSelect
            label="مشتری"
            value={customerId}
            onChange={setCustomerId}
            options={filterOptions.customers}
          />
          <FilterSelect
            label="روش پرداخت"
            value={paymentMethod}
            onChange={setPaymentMethod}
            options={filterOptions.paymentMethods}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-primary transition hover:text-primary/80"
        >
          پاک کردن فیلترها
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="کل تراکنش‌ها"
          value={`${formatFaNumber(summary.totalCount)} تراکنش`}
          icon={<ClipboardList className="size-5" />}
          tone="violet"
        />
        <SummaryCard
          title="دریافت از مشتریان"
          value={formatPrice(summary.customerReceiptTotal)}
          hint={`${formatFaNumber(summary.customerReceiptCount)} تراکنش`}
          icon={<ArrowDownLeft className="size-5" />}
          tone="emerald"
        />
        <SummaryCard
          title="پرداخت به آرایشگران"
          value={formatPrice(summary.stylistPaymentTotal)}
          hint={`${formatFaNumber(summary.stylistPaymentCount)} تراکنش`}
          icon={<ArrowUpRight className="size-5" />}
          tone="rose"
        />
        <SummaryCard
          title="دریافت از آرایشگران"
          value={formatPrice(summary.stylistReceiptTotal)}
          hint={`${formatFaNumber(summary.stylistReceiptCount)} تراکنش`}
          icon={<ArrowDownLeft className="size-5" />}
          tone="sky"
        />
        <SummaryCard
          title="جمع دوره"
          value={formatPrice(summary.periodVolumeTotal)}
          icon={<Wallet className="size-5" />}
          tone="amber"
        />
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-0 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-start font-medium">نوع</th>
                  <th className="px-4 py-3 text-start font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-start font-medium">جهت</th>
                  <th className="px-4 py-3 text-start font-medium">روش</th>
                  <th className="px-4 py-3 text-start font-medium">
                    مشتری / آرایشگر
                  </th>
                  <th className="px-4 py-3 text-start font-medium">مرجع</th>
                  <th className="px-4 py-3 text-start font-medium">ثبت‌کننده</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      تراکنشی با این فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "cursor-pointer border-b border-border transition last:border-b-0 hover:bg-muted/30",
                        selectedId === row.id && "bg-primary/5",
                      )}
                      onClick={() => openDetail(row.id)}
                    >
                      <td className="px-4 py-3">
                        {formatTransactionDateTime(row.occurredAt)}
                      </td>
                      <td className="px-4 py-3">{row.typeLabel}</td>
                      <td className="px-4 py-3 font-medium">
                        {formatPrice(row.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <DirectionCell row={row} />
                      </td>
                      <td className="px-4 py-3">{row.paymentMethodLabel}</td>
                      <td className="px-4 py-3">{row.partyLabel}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {row.reference}
                      </td>
                      <td className="px-4 py-3">{row.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransactionDetailDrawer
        transaction={selectedDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DirectionCell({ row }: { row: FinancialTransactionRow }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full",
        row.directionTone === "inflow"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {row.directionTone === "inflow" ? (
          <ArrowDownLeft className="size-3.5" />
        ) : (
          <ArrowUpRight className="size-3.5" />
        )}
        {row.directionLabel}
      </span>
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone: "violet" | "emerald" | "rose" | "sky" | "amber";
}) {
  const toneClass = {
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              toneClass,
            )}
          >
            {icon}
          </span>
        </div>
        <p className="text-lg font-bold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
