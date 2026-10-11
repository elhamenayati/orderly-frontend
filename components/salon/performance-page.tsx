"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  Scissors,
  Wallet,
} from "lucide-react";
import {
  activeStylistsForReport,
  DEFAULT_REPORT_PERIOD,
  loadPerformanceReportData,
  stylistFinancialSnapshot,
  stylistPerformanceBreakdownByCategory,
  stylistPerformanceBreakdownByDate,
  stylistPerformanceBreakdownByService,
  stylistPerformanceKpis,
  type PerformanceBreakdownRow,
} from "@/lib/salon/reports";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatPrice } from "@/lib/format";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BreakdownTab = "service" | "category" | "date";

const breakdownTabs: { id: BreakdownTab; label: string }[] = [
  { id: "service", label: "تفکیک بر اساس خدمت" },
  { id: "category", label: "تفکیک بر اساس دسته" },
  { id: "date", label: "تفکیک بر اساس تاریخ" },
];

export function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periodStart, setPeriodStart] = useState(DEFAULT_REPORT_PERIOD.start);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_REPORT_PERIOD.end);
  const [stylistId, setStylistId] = useState("");
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("service");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await loadPerformanceReportData({ periodStart, periodEnd });
        if (cancelled) return;
        const stylists = activeStylistsForReport();
        setStylistId((current) => {
          if (current && stylists.some((item) => item.id === current)) {
            return current;
          }
          return stylists[0]?.id ?? "";
        });
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری گزارش کارکرد با خطا مواجه شد");
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

  const stylists = useMemo(() => activeStylistsForReport(), [refreshKey]);

  const periodOptions = useMemo(
    () => ({ periodStart, periodEnd }),
    [periodStart, periodEnd, refreshKey],
  );

  const kpis = useMemo(
    () => stylistPerformanceKpis(stylistId, periodOptions),
    [stylistId, periodOptions],
  );

  const breakdownRows = useMemo(() => {
    switch (breakdownTab) {
      case "category":
        return stylistPerformanceBreakdownByCategory(stylistId, periodOptions);
      case "date":
        return stylistPerformanceBreakdownByDate(stylistId, periodOptions).map(
          (row) => ({ ...row, label: formatJalaliShort(row.label) }),
        );
      default:
        return stylistPerformanceBreakdownByService(stylistId, periodOptions);
    }
  }, [breakdownTab, stylistId, periodOptions]);

  const financial = useMemo(
    () => stylistFinancialSnapshot(stylistId, periodOptions),
    [stylistId, periodOptions],
  );

  const selectedStylist = stylists.find((item) => item.id === stylistId);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          گزارش‌ها / گزارش کارکرد آرایشگران
        </p>
        <h1 className="mt-1 text-2xl font-bold">گزارش کارکرد آرایشگران</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عملکرد آرایشگر بر اساس خدمات تکمیل‌شده و فروش واقعی
        </p>
      </div>

      <Card className="shadow-none">
        <CardContent className="grid gap-4 py-4 lg:grid-cols-[1fr_1fr_minmax(220px,280px)]">
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
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">آرایشگر</span>
            <div className="relative">
              <select
                value={stylistId}
                onChange={(event) => setStylistId(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pe-10 text-sm"
              >
                {stylists.map((stylist) => (
                  <option key={stylist.id} value={stylist.id}>
                    {stylist.displayName}
                  </option>
                ))}
              </select>
              {selectedStylist ? (
                <StylistAvatar
                  stylistId={selectedStylist.id}
                  avatarPath={selectedStylist.avatarPath}
                  name={selectedStylist.displayName}
                  size="xs"
                  className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2"
                />
              ) : null}
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="رزروهای مرتبط"
          value={`${formatFaNumber(kpis.relatedBookings)} رزرو`}
          icon={<ClipboardList className="size-5" />}
          tone="violet"
        />
        <KpiCard
          title="خدمات تکمیل‌شده"
          value={`${formatFaNumber(kpis.completedServices)} خدمت`}
          icon={<Scissors className="size-5" />}
          tone="sky"
        />
        <KpiCard
          title="فروش واقعی"
          value={formatPrice(kpis.actualSales)}
          icon={<CircleDollarSign className="size-5" />}
          tone="emerald"
        />
        <KpiCard
          title="میانگین ارزش خدمت"
          value={formatPrice(kpis.averageServiceValue)}
          icon={<Wallet className="size-5" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="shadow-none">
          <CardContent className="space-y-4 p-0">
            <div className="flex flex-wrap gap-2 border-b border-border px-4 pt-4">
              {breakdownTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBreakdownTab(tab.id)}
                  className={cn(
                    "rounded-t-lg border-b-2 px-3 py-2 text-sm transition",
                    breakdownTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto px-4 pb-4">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">
                      {breakdownTab === "category"
                        ? "دسته"
                        : breakdownTab === "date"
                          ? "تاریخ"
                          : "خدمت"}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      تعداد خدمت
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      فروش واقعی
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      سهم از فروش
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-10 text-center text-muted-foreground"
                      >
                        داده‌ای در این بازه ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    breakdownRows.map((row) => (
                      <BreakdownRow key={row.id} row={row} />
                    ))
                  )}
                </tbody>
                {breakdownRows.length > 0 ? (
                  <tfoot className="border-t border-border bg-muted/30 font-medium">
                    <tr>
                      <td className="px-3 py-3">جمع</td>
                      <td className="px-3 py-3">
                        {formatFaNumber(kpis.completedServices)}
                      </td>
                      <td className="px-3 py-3">{formatPrice(kpis.actualSales)}</td>
                      <td className="px-3 py-3">۱۰۰٪</td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {financial ? (
            <Card className="shadow-none">
              <CardContent className="space-y-4 py-4">
                <div>
                  <h2 className="font-semibold">قرارداد و وضعیت مالی</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    خلاصه قرارداد فعال — جدا از محاسبه حقوق
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <SnapshotRow label="نوع قرارداد" value={financial.contractTypeLabel} />
                  <SnapshotRow label="جزئیات قرارداد" value={financial.contractSummary} />
                  <SnapshotRow
                    label="دوره مالی"
                    value={financial.financialPeriodLabel}
                  />
                  <SnapshotRow
                    label="فروش دوره"
                    value={formatPrice(financial.periodSales)}
                  />
                  {financial.commissionAmount !== undefined ? (
                    <SnapshotRow
                      label={`پورسانت (${financial.commissionLabel})`}
                      value={formatPrice(financial.commissionAmount)}
                    />
                  ) : null}
                  <SnapshotRow
                    label="پرداخت‌شده"
                    value={formatPrice(financial.paidAmount)}
                  />
                  <SnapshotRow
                    label="مانده قابل پرداخت"
                    value={formatPrice(financial.remainingPayable)}
                  />
                </div>

                <Button
                  render={
                    <Link href={`/salon/stylists/${financial.stylistId}?tab=contract`} />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  مشاهده جزئیات مالی
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-none">
            <CardContent className="space-y-3 py-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <CalendarDays className="size-4 text-primary" />
                <span>خلاصه عملکرد</span>
              </div>
              <SnapshotRow
                label="بازه گزارش"
                value={`${formatJalaliShort(periodStart)} — ${formatJalaliShort(periodEnd)}`}
              />
              <SnapshotRow
                label="آرایشگر"
                value={selectedStylist?.displayName ?? "—"}
              />
              <SnapshotRow
                label="میانگین فروش هر رزرو"
                value={
                  kpis.relatedBookings > 0
                    ? formatPrice(
                        Math.round(kpis.actualSales / kpis.relatedBookings),
                      )
                    : "—"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          توجه: این گزارش فقط نمایانگر عملکرد است و به معنای محاسبه یا تعیین
          حقوق و مزایا نیست. عملکرد ≠ جبران خدمت.
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: "violet" | "sky" | "emerald" | "amber";
}) {
  const toneClass = {
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
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
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ row }: { row: PerformanceBreakdownRow }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-3 font-medium">{row.label}</td>
      <td className="px-3 py-3">{formatFaNumber(row.count)}</td>
      <td className="px-3 py-3">{formatPrice(row.sales)}</td>
      <td className="px-3 py-3">
        <div className="flex min-w-[120px] items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(row.sharePercent, 100)}%` }}
            />
          </div>
          <span className="w-10 text-xs text-muted-foreground">
            {formatFaNumber(Math.round(row.sharePercent))}٪
          </span>
        </div>
      </td>
    </tr>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}
