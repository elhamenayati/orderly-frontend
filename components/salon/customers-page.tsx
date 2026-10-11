"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Eye,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import {
  customerAvatarClass,
  customerInitials,
  fetchCustomers,
  formatCustomerMobile,
  formatLastBookingLabel,
  type CustomerListRow,
} from "@/lib/salon/customers";
import { formatFaNumber } from "@/lib/format/number";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { CustomerDetailDrawer } from "@/components/salon/customers/customer-detail-drawer";
import { RegisterCustomerDrawer } from "@/components/salon/customers/register-customer-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

const PAGE_SIZE = 10;

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function CustomersPage() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [rows, setRows] = useState<CustomerListRow[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);

  const selectedRow = rows.find((row) => row.customer.id === detailCustomerId);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, rows.length);

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
        const nextRows = await fetchCustomers(query);
        if (cancelled) return;
        setRows(nextRows);
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
          showToast("بارگذاری مشتریان با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, query]);

  async function reloadRows() {
    try {
      const nextRows = await fetchCustomers(query);
      setRows(nextRows);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSalonSession();
        window.location.href = "/salon/login";
        return;
      }
      showToast("بارگذاری مشتریان با خطا مواجه شد");
    }
  }

  function handleRegistered(customer: Customer) {
    void reloadRows().then(() => setDetailCustomerId(customer.id));
  }

  function clearFilters() {
    setQuery("");
    setPage(1);
  }

  const hasActiveFilters = query.trim().length > 0;

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مشتریان</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            لیست مشتریان سالن خود را مشاهده، جستجو و مدیریت کنید.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => setRegisterOpen(true)}
        >
          <Plus className="size-4" />
          ثبت مشتری
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-4 py-4">
          <div className="flex flex-nowrap items-center gap-3">
            <label className="relative block min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="جستجو بر اساس نام مشتری یا شماره موبایل..."
                className={cn(fieldClassName, "ps-10")}
              />
            </label>

            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <SlidersHorizontal className="size-4" />
              پاک کردن فیلترها
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{formatFaNumber(rows.length)} مشتری</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-0 p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">نام</th>
                  <th className="px-4 py-3 text-start font-medium">موبایل</th>
                  <th className="px-4 py-3 text-start font-medium">آخرین رزرو</th>
                  <th className="px-4 py-3 text-start font-medium">تعداد رزرو</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      مشتری‌ای با این جستجو یافت نشد.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.customer.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                              customerAvatarClass(row.customer.id),
                            )}
                          >
                            {customerInitials(row.customer.fullName)}
                          </span>
                          <span className="font-medium">
                            {row.customer.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {formatCustomerMobile(row.customer.mobile)}
                      </td>
                      <td className="px-4 py-3">
                        {row.lastBooking ? (
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">
                              {formatLastBookingLabel(
                                row.lastBooking.bookingDate,
                                row.lastBooking.startTime,
                              )}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-primary/10 px-2 py-1 font-medium text-primary">
                          {formatFaNumber(row.bookingCount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-primary transition hover:text-primary/80"
                            onClick={() => setDetailCustomerId(row.customer.id)}
                          >
                            <Eye className="size-4" />
                            مشاهده
                          </button>
                          <Link
                            href={`/salon/bookings/new?customerId=${row.customer.id}`}
                            className="inline-flex items-center gap-1 text-primary transition hover:text-primary/80"
                          >
                            <CalendarDays className="size-4" />
                            رزرو جدید
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>نمایش</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-background px-2"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {formatFaNumber(size)}
                  </option>
                ))}
              </select>
              <span>ردیف</span>
            </div>

            <p>
              {formatFaNumber(rangeStart)} تا {formatFaNumber(rangeEnd)} از{" "}
              {formatFaNumber(rows.length)} مشتری
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                قبلی
              </Button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    className="min-w-11"
                    onClick={() => setPage(pageNumber)}
                  >
                    {formatFaNumber(pageNumber)}
                  </Button>
                ),
              )}
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

      <RegisterCustomerDrawer
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onRegistered={handleRegistered}
      />

      <CustomerDetailDrawer
        customer={selectedRow?.customer ?? null}
        open={Boolean(selectedRow)}
        bookingCount={selectedRow?.bookingCount ?? 0}
        lastBooking={selectedRow?.lastBooking}
        onOpenChange={(open) => {
          if (!open) setDetailCustomerId(null);
        }}
        onUpdated={() => void reloadRows()}
      />
    </div>
  );
}
