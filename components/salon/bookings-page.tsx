"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import {
  activeStylistsForFilter,
  bookingListRows,
  bookingPaymentStatusLabels,
  bookingStatusLabels,
  fetchBookings,
  type BookingStatusCounts,
} from "@/lib/salon/bookings";
import { fetchCustomers } from "@/lib/salon/customers";
import { fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { usePersistentFilter } from "@/lib/salon/persistent-filters";
import { clearSalonSession } from "@/lib/salon/auth";
import type { BookingStatus } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JalaliDateRangeInput } from "@/components/ui/jalali-date-range-input";
import { Card, CardContent } from "@/components/ui/card";
import {
  TableRowActionsMenu,
  tableRowActionsMenuItemClassName,
} from "@/components/ui/table-row-actions-menu";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const statusFilters: Array<{ value: BookingStatus | "all"; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "confirmed", label: "تأییدشده" },
  { value: "completed", label: "تکمیل‌شده" },
  { value: "cancelled", label: "لغوشده" },
];

function statusBadgeClass(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "completed":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "";
  }
}

function paymentBadgeClass(paid: boolean) {
  return paid
    ? "border-sky-200 bg-sky-50 text-sky-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function MultiValueCell({ values }: { values: string[] }) {
  return (
    <div className="space-y-1">
      {values.map((value, index) => (
        <p key={`${value}-${index}`} className="leading-5">
          {value}
        </p>
      ))}
    </div>
  );
}

function BookingActionsMenu({ bookingId, status }: { bookingId: string; status: BookingStatus }) {
  return (
    <TableRowActionsMenu>
      <Link
        href={`/salon/bookings/${bookingId}`}
        className={cn(tableRowActionsMenuItemClassName, "flex items-center gap-2")}
      >
        <Eye className="size-4" />
        مشاهده جزئیات
      </Link>
      {status === "confirmed" ? (
        <>
          <Link
            href={`/salon/bookings/${bookingId}/edit`}
            className={tableRowActionsMenuItemClassName}
          >
            ویرایش
          </Link>
          <Link
            href={`/salon/bookings/${bookingId}/checkout`}
            className={tableRowActionsMenuItemClassName}
          >
            تسویه و تکمیل
          </Link>
        </>
      ) : null}
    </TableRowActionsMenu>
  );
}

export function BookingsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [counts, setCounts] = useState<BookingStatusCounts>({
    all: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [statusFilter, setStatusFilter] = usePersistentFilter<BookingStatus | "all">(
    "bookings",
    "status",
    "all",
  );
  const [stylistFilter, setStylistFilter] = usePersistentFilter(
    "bookings",
    "stylist",
    "all",
  );
  const [customerQuery, setCustomerQuery] = usePersistentFilter(
    "bookings",
    "query",
    "",
  );
  const [dateFrom, setDateFrom] = usePersistentFilter("bookings", "dateFrom", "");
  const [dateTo, setDateTo] = usePersistentFilter("bookings", "dateTo", "");
  const [page, setPage] = usePersistentFilter("bookings", "page", 1);
  const [refreshKey, setRefreshKey] = useState(0);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        await Promise.all([
          fetchStylists({ status: "active" }),
          fetchCustomers(),
          fetchServices({ status: "active" }),
        ]);
        const result = await fetchBookings({
          status: statusFilter,
          stylistId: stylistFilter,
          customerQuery,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (cancelled) return;
        setCounts(result.counts);
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            showToast("نشست شما منقضی شده — لطفاً دوباره وارد شوید");
            window.setTimeout(() => {
              window.location.href = "/salon/login";
            }, 1200);
            return;
          }
          showToast("بارگذاری رزروها با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    statusFilter,
    stylistFilter,
    customerQuery,
    dateFrom,
    dateTo,
  ]);

  const stylists = useMemo(() => activeStylistsForFilter(), [refreshKey]);

  const rows = useMemo(() => {
    void refreshKey;
    return bookingListRows({
      status: statusFilter,
      stylistId: stylistFilter,
      customerQuery,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }, [
    refreshKey,
    statusFilter,
    stylistFilter,
    customerQuery,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">رزروها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت و مشاهده رزروهای سالن
          </p>
        </div>
        <Button
          render={<Link href="/salon/bookings/new" />}
          nativeButton={false}
          className="shrink-0"
        >
          <Plus className="size-4" />
          رزرو جدید
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="py-4">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
            <label className="relative block min-w-[220px] flex-[1.3]">
              <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={customerQuery}
                onChange={(event) => {
                  setCustomerQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="جستجو بر اساس نام یا شماره موبایل"
                className={cn(fieldClassName, "ps-10")}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as BookingStatus | "all");
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[140px] flex-[0.8]")}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <select
              value={stylistFilter}
              onChange={(event) => {
                setStylistFilter(event.target.value);
                setPage(1);
              }}
              className={cn(fieldClassName, "min-w-[140px] flex-[0.8]")}
            >
              <option value="all">همه آرایشگران</option>
              {stylists.map((stylist) => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.displayName}
                </option>
              ))}
            </select>

            <div className="min-w-[160px] flex-[0.85] shrink-0">
              <JalaliDateRangeInput
                from={dateFrom}
                to={dateTo}
                onChange={(from, to) => {
                  setDateFrom(from);
                  setDateTo(to);
                  setPage(1);
                }}
                placeholder="یک تاریخ یا بازه زمانی"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                setStatusFilter("all");
                setStylistFilter("all");
                setCustomerQuery("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              <SlidersHorizontal className="size-4" />
              پاک کردن فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "همه رزروها", value: counts.all, icon: CalendarDays, tone: "text-primary" },
          { label: "تأییدشده", value: counts.confirmed, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "تکمیل‌شده", value: counts.completed, icon: CheckCircle2, tone: "text-sky-600" },
          { label: "لغوشده", value: counts.cancelled, icon: XCircle, tone: "text-rose-600" },
        ].map((item) => (
          <Card key={item.label} className="shadow-none">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{formatFaNumber(item.value)}</p>
              </div>
              <item.icon className={cn("size-8 opacity-80", item.tone)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">شماره رزرو</th>
                  <th className="px-4 py-3 text-start font-medium">مشتری</th>
                  <th className="px-4 py-3 text-start font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-start font-medium">خدمات</th>
                  <th className="px-4 py-3 text-start font-medium">آرایشگران</th>
                  <th className="px-4 py-3 text-start font-medium">ساعات</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت پرداخت</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت رزرو</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      رزروی با این فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.booking.id}
                      className="border-b border-border align-top transition hover:bg-muted/20"
                    >
                      <td className="px-4 py-4 font-medium" dir="ltr">
                        {row.displayId}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{row.customerName}</p>
                        <p
                          className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"
                          dir="ltr"
                        >
                          <Phone className="size-3.5 shrink-0" />
                          {row.customerMobile}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {row.bookingDateLabel}
                      </td>
                      <td className="px-4 py-4 min-w-32">
                        <MultiValueCell values={row.serviceNames} />
                      </td>
                      <td className="px-4 py-4 min-w-32">
                        <MultiValueCell values={row.stylistNames} />
                      </td>
                      <td className="px-4 py-4 min-w-24">
                        <MultiValueCell values={row.startTimes} />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                            paymentBadgeClass(row.paymentStatus === "paid"),
                          )}
                        >
                          {bookingPaymentStatusLabels[row.paymentStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                            statusBadgeClass(row.booking.status),
                          )}
                        >
                          {bookingStatusLabels[row.booking.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <BookingActionsMenu
                          bookingId={row.booking.id}
                          status={row.booking.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-sm">
            <p className="text-muted-foreground">
              نمایش {(currentPage - 1) * PAGE_SIZE + (pageRows.length ? 1 : 0)} تا{" "}
              {(currentPage - 1) * PAGE_SIZE + pageRows.length} از {rows.length}{" "}
              مورد
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                قبلی
              </Button>
              <span className="text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
