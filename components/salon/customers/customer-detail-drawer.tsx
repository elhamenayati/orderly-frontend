"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  customerAvatarClass,
  customerInitials,
  fetchCustomerRecentBookings,
  formatCustomerMobile,
  formatLastBookingLabel,
  updateSalonCustomerAsync,
  type CustomerRecentBookingRow,
} from "@/lib/salon/customers";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatFaNumber } from "@/lib/format/number";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

type CustomerDetailDrawerProps = {
  customer: Customer | null;
  open: boolean;
  bookingCount: number;
  lastBooking?: {
    bookingDate: string;
    startTime: string;
  };
  onOpenChange: (open: boolean) => void;
  onUpdated?: (customer: Customer) => void;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function bookingStatusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "confirmed":
      return "border-sky-200 bg-sky-50 text-sky-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function CustomerDetailDrawer({
  customer,
  open,
  bookingCount,
  lastBooking,
  onOpenChange,
  onUpdated,
}: CustomerDetailDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recentBookings, setRecentBookings] = useState<CustomerRecentBookingRow[]>(
    [],
  );
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!open || !customer) {
      setEditing(false);
      setError(null);
      setRecentBookings([]);
      return;
    }
    setFullName(customer.fullName);
    setMobile(customer.mobile);
    setError(null);

    let cancelled = false;
    async function loadRecentBookings() {
      setLoadingBookings(true);
      try {
        const items = await fetchCustomerRecentBookings(customer.id);
        if (!cancelled) setRecentBookings(items);
      } catch {
        if (!cancelled) setRecentBookings([]);
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    }
    void loadRecentBookings();
    return () => {
      cancelled = true;
    };
  }, [open, customer]);

  if (!customer) return null;

  const currentCustomer = customer;

  function startEditing() {
    setFullName(currentCustomer.fullName);
    setMobile(currentCustomer.mobile);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setFullName(currentCustomer.fullName);
    setMobile(currentCustomer.mobile);
    setError(null);
    setEditing(false);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await updateSalonCustomerAsync(currentCustomer.id, {
      fullName,
      mobile,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setError(null);
    onUpdated?.(result.customer);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setEditing(false);
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="left"
        data-shell="salon"
        className="w-full sm:max-w-md"
      >
        <form
          onSubmit={handleSave}
          className="flex h-full flex-col"
        >
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle>
                {editing ? "ویرایش مشتری" : "جزئیات مشتری"}
              </SheetTitle>
              {!editing ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-primary transition hover:text-primary/80"
                  onClick={startEditing}
                >
                  <Pencil className="size-4" />
                  ویرایش اطلاعات
                </button>
              ) : null}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex size-20 items-center justify-center rounded-full text-2xl font-semibold",
                  customerAvatarClass(currentCustomer.id),
                )}
              >
                {customerInitials(editing ? fullName : currentCustomer.fullName)}
              </span>
              {editing ? (
                <div className="mt-4 w-full space-y-4 text-start">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">
                      نام و نام خانوادگی{" "}
                      <span className="text-destructive">*</span>
                    </span>
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="مثال: مریم رحمانی"
                      className={fieldClassName}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">
                      شماره موبایل <span className="text-destructive">*</span>
                    </span>
                    <input
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      placeholder="09123456789"
                      dir="ltr"
                      className={cn(fieldClassName, "text-start")}
                    />
                  </label>
                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                </div>
              ) : (
                <h2 className="mt-4 text-xl font-bold">{currentCustomer.fullName}</h2>
              )}
            </div>

            {!editing ? (
              <>
                <div className="grid gap-3 rounded-2xl border border-border p-4 text-sm">
                  <InfoRow
                    label="موبایل"
                    value={formatCustomerMobile(currentCustomer.mobile)}
                    dir="ltr"
                  />
                  <InfoRow
                    label="وضعیت"
                    value={<Badge variant="secondary">فعال</Badge>}
                  />
                  <InfoRow
                    label="تعداد رزرو"
                    value={formatFaNumber(bookingCount)}
                  />
                  <InfoRow
                    label="آخرین رزرو"
                    value={
                      lastBooking
                        ? formatLastBookingLabel(
                            lastBooking.bookingDate,
                            lastBooking.startTime,
                          )
                        : "—"
                    }
                  />
                </div>

                {currentCustomer.notes ? (
                  <div className="rounded-2xl border border-border p-4 text-sm">
                    <p className="font-medium">یادداشت</p>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {currentCustomer.notes}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">رزروهای اخیر</h3>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-start font-medium">
                            تاریخ
                          </th>
                          <th className="px-3 py-2 text-start font-medium">
                            خدمت
                          </th>
                          <th className="px-3 py-2 text-start font-medium">
                            وضعیت
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingBookings ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-6 text-center text-muted-foreground"
                            >
                              در حال بارگذاری...
                            </td>
                          </tr>
                        ) : recentBookings.length === 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-3 py-6 text-center text-muted-foreground"
                            >
                              رزروی ثبت نشده است.
                            </td>
                          </tr>
                        ) : (
                          recentBookings.map((row) => (
                            <tr
                              key={row.bookingId}
                              className="border-b border-border"
                            >
                              <td className="px-3 py-2">
                                {formatJalaliShort(row.bookingDate)}
                              </td>
                              <td className="px-3 py-2">
                                {row.serviceLabels.join("، ")}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full",
                                    bookingStatusBadgeClass(row.status),
                                  )}
                                >
                                  {row.statusLabel}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={cancelEditing}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-primary hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => onOpenChange(false)}
                >
                  بستن
                </Button>
                <Button
                  render={
                    <Link
                      href={`/salon/bookings/new?customerId=${currentCustomer.id}`}
                    />
                  }
                  nativeButton={false}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                >
                  <CalendarDays className="size-4" />
                  رزرو جدید
                </Button>
              </>
            )}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span dir={dir}>{value}</span>
    </div>
  );
}
