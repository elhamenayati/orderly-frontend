"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Pencil, Receipt, UserRound, XCircle } from "lucide-react";
import { cancelSalonBookingAsync } from "@/lib/booking/submit-salon";
import { salesAmount } from "@/lib/booking/totals";
import { formatDateFa } from "@/lib/format/date";
import { formatPrice } from "@/lib/format";
import {
  bookingEstimatedTotal,
  bookingLineSummary,
  bookingPaymentStatus,
  bookingPaymentStatusLabels,
  bookingSourceLabels,
  bookingStatusLabels,
  cancelledByLabels,
  customerDisplayName,
  customerMobile,
  fetchBookingById,
  fetchCheckoutTransaction,
  formatBookingDisplayId,
} from "@/lib/salon/bookings";
import { fetchCustomers } from "@/lib/salon/customers";
import { fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import { transactionKindLabels } from "@/lib/salon/reports";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { CancelBookingDialog } from "@/components/salon/booking/cancel-booking-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Booking, BookingStatus, PaymentTransaction } from "@/types/domain";

function statusBadgeVariant(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "default" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function formatDateTimeFa(iso: string) {
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  return `${formatDateFa(date)}${time ? ` · ${time}` : ""}`;
}

export function BookingDetailPage({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checkoutTransaction, setCheckoutTransaction] =
    useState<PaymentTransaction | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await Promise.all([
          fetchStylists(),
          fetchServices(),
          fetchCustomers(),
        ]);
        const item = await fetchBookingById(bookingId);
        if (cancelled) return;
        setBooking(item);
        if (item?.status === "completed") {
          const transaction = await fetchCheckoutTransaction(bookingId);
          if (!cancelled) setCheckoutTransaction(transaction);
        } else {
          setCheckoutTransaction(null);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری جزئیات رزرو با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const lineRows = useMemo(
    () => (booking ? bookingLineSummary(booking) : []),
    [booking],
  );

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button
          render={<Link href="/salon/bookings" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">رزرو یافت نشد.</p>
        <Button
          render={<Link href="/salon/bookings" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const paymentStatus = bookingPaymentStatus(booking);
  const estimatedTotal = bookingEstimatedTotal(booking);
  const salesTotal = booking.services.reduce(
    (sum, line) => sum + salesAmount(line.finalActualAmount),
    0,
  );

  async function handleCancelConfirm(reason: string) {
    setCancelSubmitting(true);
    setCancelError(null);

    const result = await cancelSalonBookingAsync({
      bookingId: booking!.id,
      reason,
      cancelledBy: "salon",
    });

    setCancelSubmitting(false);

    if (!result.ok) {
      setCancelError("لغو رزرو انجام نشد");
      return;
    }

    const refreshed = await fetchBookingById(booking!.id);
    setBooking(refreshed);
    setCancelOpen(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            render={<Link href="/salon/bookings" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label="بازگشت"
          >
            <ArrowRight className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">جزئیات رزرو</h1>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
              {formatBookingDisplayId(booking)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(booking.status)}>
            {bookingStatusLabels[booking.status]}
          </Badge>
          <Badge variant="outline">{bookingSourceLabels[booking.source]}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">تاریخ رزرو: </span>
          <span className="font-medium">{formatDateFa(booking.bookingDate)}</span>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex items-center gap-3 py-5">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">مشتری</p>
            <p className="font-semibold">{customerDisplayName(booking.customerId)}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {customerMobile(booking.customerId)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-4">
            <p className="font-medium">خدمات رزرو</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">#</th>
                  <th className="px-4 py-3 text-start font-medium">دسته‌بندی</th>
                  <th className="px-4 py-3 text-start font-medium">خدمت</th>
                  <th className="px-4 py-3 text-start font-medium">آرایشگر</th>
                  <th className="px-4 py-3 text-start font-medium">زمان</th>
                  <th className="px-4 py-3 text-start font-medium">مدت</th>
                  <th className="px-4 py-3 text-start font-medium">قیمت تخمینی</th>
                </tr>
              </thead>
              <tbody>
                {lineRows.map((line) => (
                  <tr key={line.index} className="border-b border-border">
                    <td className="px-4 py-3">{line.index}</td>
                    <td className="px-4 py-3">{line.categoryName}</td>
                    <td className="px-4 py-3 font-medium">{line.serviceName}</td>
                    <td className="px-4 py-3">{line.stylistName}</td>
                    <td className="px-4 py-3">{line.startTime}</td>
                    <td className="px-4 py-3">{line.durationLabel}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatPrice(line.estimatedPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/20">
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-3 text-start text-muted-foreground"
                  >
                    جمع تخمینی
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    {formatPrice(estimatedTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {booking.notes ? (
        <Card className="shadow-none">
          <CardContent className="space-y-2 py-5 text-sm">
            <p className="font-medium">یادداشت</p>
            <p className="leading-7 text-muted-foreground">{booking.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="flex items-center justify-between py-5 text-sm">
          <span className="font-medium">وضعیت پرداخت</span>
          <Badge variant={paymentStatus === "paid" ? "secondary" : "outline"}>
            {bookingPaymentStatusLabels[paymentStatus]}
          </Badge>
        </CardContent>
      </Card>

      {booking.status === "completed" ? (
        <>
          <Card className="shadow-none">
            <CardContent className="space-y-3 py-5">
              <p className="font-medium">مبالغ نهایی خدمات</p>
              {lineRows.map((line) => (
                <div
                  key={line.index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {line.index}. {line.serviceName}
                  </span>
                  <span>{formatPrice(salesAmount(line.finalActualAmount))}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                <span>جمع فروش</span>
                <span className="text-primary">{formatPrice(salesTotal)}</span>
              </div>
            </CardContent>
          </Card>

          {checkoutTransaction ? (
            <Card className="shadow-none">
              <CardContent className="space-y-3 py-5 text-sm">
                <p className="font-medium">تسویه</p>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">روش پرداخت</span>
                  <span className="font-medium">
                    {transactionKindLabels[checkoutTransaction.kind]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">مبلغ دریافتی</span>
                  <span className="font-medium">
                    {formatPrice(checkoutTransaction.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">تاریخ تسویه</span>
                  <span>
                    {formatDateFa(checkoutTransaction.occurredAt.slice(0, 10))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {booking.status === "cancelled" ? (
        <Card className="shadow-none border-destructive/20">
          <CardContent className="space-y-3 py-5 text-sm">
            <p className="font-medium text-destructive">اطلاعات لغو</p>
            {booking.cancelledAt ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاریخ لغو</span>
                <span>{formatDateTimeFa(booking.cancelledAt)}</span>
              </div>
            ) : null}
            {booking.cancelledBy ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">لغو توسط</span>
                <span>{cancelledByLabels[booking.cancelledBy]}</span>
              </div>
            ) : null}
            {booking.cancellationReason ? (
              <p className="border-t border-border pt-3 text-muted-foreground">
                {booking.cancellationReason}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {booking.status === "confirmed" ? (
        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button
            render={<Link href={`/salon/bookings/${booking.id}/edit`} />}
            nativeButton={false}
            variant="outline"
            className="rounded-xl"
          >
            <Pencil className="size-4" />
            ویرایش رزرو
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-destructive hover:text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="size-4" />
            لغو رزرو
          </Button>
          <Button
            render={<Link href={`/salon/bookings/${booking.id}/checkout`} />}
            nativeButton={false}
            className="rounded-xl"
          >
            <Receipt className="size-4" />
            تسویه و تکمیل
          </Button>
        </div>
      ) : null}

      <CancelBookingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        submitting={cancelSubmitting}
        error={cancelError}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
