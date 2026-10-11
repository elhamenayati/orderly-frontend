"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  Scissors,
} from "lucide-react";
import { DEFAULT_REPORT_PERIOD } from "@/lib/salon/reports";
import {
  loadSalesReportData,
  salonSalesBreakdownByCategory,
  salonSalesBreakdownByDate,
  salonSalesBreakdownByService,
  salonSalesBreakdownByStylist,
  salonSalesFilterOptions,
  salonSalesKpis,
  salonSalesTrendByDate,
  type SalonSalesBreakdownRow,
} from "@/lib/salon/sales-report";
import { stylistById } from "@/lib/salon/management";
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

type BreakdownTab = "service" | "category" | "stylist" | "date";

const breakdownTabs: { id: BreakdownTab; label: string }[] = [
  { id: "service", label: "تفکیک خدمت" },
  { id: "category", label: "تفکیک دسته" },
  { id: "stylist", label: "تفکیک آرایشگر" },
  { id: "date", label: "تفکیک تاریخ" },
];

export function SalesReportPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periodStart, setPeriodStart] = useState(DEFAULT_REPORT_PERIOD.start);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_REPORT_PERIOD.end);
  const [categoryId, setCategoryId] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [stylistId, setStylistId] = useState("all");
  const [breakdownTab, setBreakdownTab] = useState<BreakdownTab>("service");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await loadSalesReportData({ periodStart, periodEnd });
        if (cancelled) return;
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری گزارش فروش با خطا مواجه شد");
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
    return salonSalesFilterOptions();
  }, [refreshKey]);

  const filters = useMemo(
    () => ({
      periodStart,
      periodEnd,
      categoryId,
      serviceId,
      stylistId,
    }),
    [periodStart, periodEnd, categoryId, serviceId, stylistId],
  );

  const kpis = useMemo(() => {
    void refreshKey;
    return salonSalesKpis(filters);
  }, [filters, refreshKey]);

  const breakdownRows = useMemo(() => {
    void refreshKey;
    switch (breakdownTab) {
      case "category":
        return salonSalesBreakdownByCategory(filters);
      case "stylist":
        return salonSalesBreakdownByStylist(filters);
      case "date":
        return salonSalesBreakdownByDate(filters).map((row) => ({
          ...row,
          label: formatJalaliShort(row.label),
        }));
      default:
        return salonSalesBreakdownByService(filters);
    }
  }, [breakdownTab, filters, refreshKey]);

  const stylistRows = useMemo(() => {
    void refreshKey;
    return salonSalesBreakdownByStylist(filters).slice(0, 6);
  }, [filters, refreshKey]);

  const trendPoints = useMemo(() => {
    void refreshKey;
    return salonSalesTrendByDate(filters);
  }, [filters, refreshKey]);
  const maxTrendSales = Math.max(...trendPoints.map((point) => point.sales), 1);

  const visibleServices = filterOptions.services.filter((item) => {
    if (item.id === "all") return true;
    if (categoryId === "all") return true;
    return "categoryId" in item && item.categoryId === categoryId;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          گزارش‌ها / گزارش فروش سالن
        </p>
        <h1 className="mt-1 text-2xl font-bold">گزارش فروش سالن</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          فروش واقعی بر اساس خدمات انجام‌شده و رزروهای تکمیل‌شده — مبلغ نهایی
          checkout
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
        <CardContent className="grid gap-4 py-4 lg:grid-cols-5">
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
            <span className="text-sm font-medium">دسته‌بندی</span>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setServiceId("all");
              }}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {filterOptions.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">خدمت</span>
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {visibleServices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">آرایشگر</span>
            <select
              value={stylistId}
              onChange={(event) => setStylistId(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {filterOptions.stylists.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="فروش واقعی"
          value={formatPrice(kpis.actualSales)}
          icon={<CircleDollarSign className="size-5" />}
          tone="violet"
        />
        <KpiCard
          title="رزروهای تکمیل‌شده"
          value={`${formatFaNumber(kpis.completedBookings)} رزرو`}
          icon={<ClipboardList className="size-5" />}
          tone="emerald"
        />
        <KpiCard
          title="تعداد خدمات"
          value={`${formatFaNumber(kpis.serviceCount)} خدمت`}
          icon={<Scissors className="size-5" />}
          tone="sky"
        />
        <KpiCard
          title="میانگین ارزش رزرو"
          value={formatPrice(kpis.averageBookingValue)}
          icon={<CalendarDays className="size-5" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {trendPoints.length > 0 ? (
            <Card className="shadow-none">
              <CardContent className="space-y-4 py-4">
                <h2 className="font-semibold">روند فروش در بازه زمانی</h2>
                <div className="flex h-40 items-end gap-1">
                  {trendPoints.map((point) => (
                    <div
                      key={point.bookingDate}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                      title={formatJalaliShort(point.bookingDate)}
                    >
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition hover:bg-primary"
                        style={{
                          height: `${Math.max(8, (point.sales / maxTrendSales) * 100)}%`,
                        }}
                      />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {formatJalaliShort(point.bookingDate).slice(-2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-none">
            <CardContent className="space-y-0 p-0">
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
                        {breakdownTab === "service"
                          ? "خدمت"
                          : breakdownTab === "category"
                            ? "دسته"
                            : breakdownTab === "stylist"
                              ? "آرایشگر"
                              : "تاریخ"}
                      </th>
                      {breakdownTab === "service" ? (
                        <th className="px-3 py-2 text-start font-medium">
                          دسته
                        </th>
                      ) : null}
                      <th className="px-3 py-2 text-start font-medium">تعداد</th>
                      <th className="px-3 py-2 text-start font-medium">
                        فروش واقعی
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        سهم از فروش
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        میانگین
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={breakdownTab === "service" ? 6 : 5}
                          className="px-3 py-10 text-center text-muted-foreground"
                        >
                          فروش تکمیل‌شده‌ای با این فیلتر یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      breakdownRows.map((row) => (
                        <BreakdownRow
                          key={row.id}
                          row={row}
                          showCategory={breakdownTab === "service"}
                        />
                      ))
                    )}
                  </tbody>
                  {breakdownRows.length > 0 ? (
                    <tfoot className="border-t border-border bg-muted/30 font-medium">
                      <tr>
                        <td
                          className="px-3 py-3"
                          colSpan={breakdownTab === "service" ? 2 : 1}
                        >
                          جمع
                        </td>
                        <td className="px-3 py-3">
                          {formatFaNumber(kpis.serviceCount)}
                        </td>
                        <td className="px-3 py-3">
                          {formatPrice(kpis.actualSales)}
                        </td>
                        <td className="px-3 py-3">۱۰۰٪</td>
                        <td className="px-3 py-3">—</td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-none">
          <CardContent className="space-y-4 py-4">
            <h2 className="font-semibold">فروش بر اساس آرایشگر</h2>
            {stylistRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">داده‌ای موجود نیست.</p>
            ) : (
              <div className="space-y-3">
                {stylistRows.map((row) => {
                  const stylist = stylistById(row.id);
                  return (
                    <div
                      key={row.id}
                      className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                    >
                      <StylistAvatar
                        stylistId={row.id}
                        avatarPath={stylist?.avatarPath}
                        name={row.label}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFaNumber(row.count)} خدمت
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-sm font-semibold">
                          {formatPrice(row.sales)}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(row.sharePercent, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatFaNumber(Math.round(row.sharePercent))}٪
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              render={<Link href="/salon/performance" />}
              nativeButton={false}
              variant="outline"
              className="w-full rounded-xl"
            >
              مشاهده همه آرایشگران
            </Button>
          </CardContent>
        </Card>
      </div>
        </>
      )}
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
  tone: "violet" | "emerald" | "sky" | "amber";
}) {
  const toneClass = {
    violet: "bg-violet-50 text-violet-700",
    emerald: "bg-emerald-50 text-emerald-700",
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
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  row,
  showCategory,
}: {
  row: SalonSalesBreakdownRow;
  showCategory: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-3 font-medium">{row.label}</td>
      {showCategory ? (
        <td className="px-3 py-3 text-muted-foreground">{row.sublabel ?? "—"}</td>
      ) : null}
      <td className="px-3 py-3">{formatFaNumber(row.count)}</td>
      <td className="px-3 py-3">{formatPrice(row.sales)}</td>
      <td className="px-3 py-3">
        <div className="flex min-w-[100px] items-center gap-2">
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
      <td className="px-3 py-3">{formatPrice(row.averageValue)}</td>
    </tr>
  );
}
