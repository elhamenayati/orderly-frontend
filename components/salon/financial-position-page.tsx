"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Loader2,
  Receipt,
  Wallet,
} from "lucide-react";
import {
  customerReceiptBreakdown,
  defaultFinancialPeriod,
  financialFlowRows,
  loadFinancialPositionData,
  salonFinancialPosition,
} from "@/lib/salon/financial-position";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatPrice } from "@/lib/format";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FinancialPositionPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const defaultPeriod = defaultFinancialPeriod();
  const [periodStart, setPeriodStart] = useState(defaultPeriod.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.periodEnd);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await loadFinancialPositionData({ periodStart, periodEnd });
        if (cancelled) return;
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری وضعیت مالی با خطا مواجه شد");
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

  const period = useMemo(
    () => ({ periodStart, periodEnd }),
    [periodStart, periodEnd],
  );

  const summary = useMemo(() => {
    void refreshKey;
    return salonFinancialPosition(period);
  }, [period, refreshKey]);
  const receiptBreakdown = useMemo(() => {
    void refreshKey;
    return customerReceiptBreakdown(period);
  }, [period, refreshKey]);
  const flowRows = useMemo(() => financialFlowRows(summary), [summary]);
  const maxFlowAmount = Math.max(...flowRows.map((row) => row.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          گزارش‌ها / وضعیت مالی سالن
        </p>
        <h1 className="mt-1 text-2xl font-bold">وضعیت مالی سالن</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          خلاصه وضعیت مالی سالن در بازه انتخاب‌شده
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
        <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
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
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            فروش و دریافت
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              title="فروش خدمات (واقعی)"
              value={formatPrice(summary.serviceSales)}
              hint="بر اساس مبلغ نهایی خدمات تکمیل‌شده"
              icon={<CircleDollarSign className="size-5" />}
              tone="emerald"
            />
            <KpiCard
              title="دریافت از مشتریان"
              value={formatPrice(summary.customerReceipts)}
              hint="مبالغ پرداخت‌شده توسط مشتریان"
              icon={<Receipt className="size-5" />}
              tone="sky"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            وضعیت مالی آرایشگران
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              title="قابل پرداخت به آرایشگران"
              value={formatPrice(summary.payableToStylists)}
              hint="تعهدات سالن به آرایشگران"
              icon={<ArrowDownLeft className="size-5" />}
              tone="rose"
            />
            <KpiCard
              title="قابل دریافت از آرایشگران"
              value={formatPrice(summary.receivableFromStylists)}
              hint="مطالبات سالن از آرایشگران"
              icon={<ArrowUpRight className="size-5" />}
              tone="amber"
            />
            <KpiCard
              title="پرداخت‌شده به آرایشگران"
              value={formatPrice(summary.settlementPaid)}
              hint="رکوردهای مالی پرداخت‌شده در این دوره"
              icon={<Wallet className="size-5" />}
              tone="violet"
            />
            <KpiCard
              title="دریافت‌شده از آرایشگران"
              value={formatPrice(summary.settlementReceived)}
              hint="وصولی‌های انجام‌شده در این دوره"
              icon={<Banknote className="size-5" />}
              tone="emerald"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile
          label="مانده قابل پرداخت"
          value={formatPrice(summary.outstandingPayable)}
          hint="تعهدات − پرداخت‌شده"
        />
        <SummaryTile
          label="مانده قابل دریافت"
          value={formatPrice(summary.outstandingReceivable)}
          hint="مطالبات − دریافت‌شده"
        />
        <SummaryTile
          label="مانده خالص (وضعیت نهایی)"
          value={formatPrice(Math.abs(summary.netSalonPosition))}
          hint={
            summary.netSalonPosition > 0
              ? "سالن به آرایشگران بدهکار است"
              : summary.netSalonPosition < 0
                ? "آرایشگران به سالن بدهکارند"
                : "ثبت کامل"
          }
          highlight={summary.netSalonPosition !== 0}
          negative={summary.netSalonPosition > 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="shadow-none">
          <CardContent className="space-y-4 py-4">
            <h2 className="font-semibold">خلاصه جریان‌های مالی</h2>
            <div className="space-y-3">
              {flowRows.map((row) => (
                <div key={row.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{row.label}</span>
                    <span className="font-medium">{formatPrice(row.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        row.tone === "emerald" && "bg-emerald-500",
                        row.tone === "sky" && "bg-sky-500",
                        row.tone === "violet" && "bg-violet-500",
                        row.tone === "amber" && "bg-amber-500",
                        row.tone === "primary" && "bg-primary",
                      )}
                      style={{
                        width: `${Math.max(4, (row.amount / maxFlowAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="space-y-4 py-4">
            <h2 className="font-semibold">تفکیک دریافت از مشتریان</h2>
            {receiptBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                دریافتی در این بازه ثبت نشده است.
              </p>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {formatPrice(summary.customerReceipts)}
                </p>
                <div className="space-y-3">
                  {receiptBreakdown.map((row) => (
                    <div
                      key={row.kind}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <div className="text-end">
                        <p className="font-medium">{formatPrice(row.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFaNumber(Math.round(row.sharePercent))}٪
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          render={<Link href="/salon/reports/transactions" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          تراکنش‌های مالی
        </Button>
        <Button
          render={<Link href="/salon/settlements" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          رکورد مالی آرایشگران
        </Button>
        <Button
          render={<Link href="/salon/reports/sales" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          گزارش فروش
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          این گزارش Profit Report نیست و صرفاً وضعیت مالی و جریان‌های نقدی بین
          سالن و آرایشگران را در بازه{" "}
          {formatJalaliShort(periodStart)} — {formatJalaliShort(periodEnd)}{" "}
          نشان می‌دهد.
        </p>
      </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
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
  tone: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
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

function SummaryTile({
  label,
  value,
  hint,
  highlight = false,
  negative = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <Card className={cn("shadow-none", highlight && "border-primary/30")}>
      <CardContent className="space-y-1 py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-xl font-bold",
            negative ? "text-rose-700" : "text-foreground",
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
