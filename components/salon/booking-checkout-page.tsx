"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  checkoutSalonBookingAsync,
  salonSubmitErrorMessages,
} from "@/lib/booking/submit-salon";
import {
  bookingServiceLabel,
  customerDisplayName,
  customerMobile,
  fetchBookingById,
  formatBookingDisplayId,
} from "@/lib/salon/bookings";
import { fetchCustomers } from "@/lib/salon/customers";
import { fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import { formatDateFa } from "@/lib/format/date";
import { formatPrice } from "@/lib/format";
import { stylistById } from "@/lib/salon/management";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import type { Booking, PaymentTransaction } from "@/types/domain";
import { BookingStepsNav } from "@/components/salon/booking/booking-steps-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LineAmountState = Record<string, string>;

const paymentKinds: Array<{
  value: PaymentTransaction["kind"];
  label: string;
}> = [
  { value: "cash", label: "نقدی" },
  { value: "card", label: "کارت" },
];

function mapSubmitErrors(errors: string[]) {
  return errors
    .map((code) => salonSubmitErrorMessages[code] ?? code)
    .join(" · ");
}

export function BookingCheckoutPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentKind, setPaymentKind] =
    useState<PaymentTransaction["kind"]>("cash");
  const [note, setNote] = useState("");
  const [lineAmounts, setLineAmounts] = useState<LineAmountState>({});

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
        if (!item) {
          setBooking(null);
          return;
        }
        setBooking(item);
        setLineAmounts(
          Object.fromEntries(
            item.services.map((line) => [
              line.id,
              String(line.estimatedPrice),
            ]),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setLoadError("بارگذاری اطلاعات تسویه با خطا مواجه شد");
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

  const total = useMemo(() => {
    if (!booking) return 0;
    return booking.services.reduce((sum, line) => {
      const raw = lineAmounts[line.id];
      const value = Number(raw);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [booking, lineAmounts]);

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
        <p className="text-sm text-destructive">نوبت یافت نشد.</p>
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

  if (booking.status !== "confirmed") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">این نوبت آماده تسویه نیست.</p>
        <Button
          render={<Link href={`/salon/bookings/${booking.id}`} />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          بازگشت به جزئیات
        </Button>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);

    const result = await checkoutSalonBookingAsync({
      bookingId: booking!.id,
      lines: booking!.services.map((line) => ({
        serviceLineId: line.id,
        finalActualAmount: Number(lineAmounts[line.id] ?? "0"),
      })),
      paymentKind,
      note: note.trim() || undefined,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(mapSubmitErrors(result.errors));
      return;
    }

    router.push(`/salon/bookings/${booking!.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href={`/salon/bookings/${booking.id}`} />}
          nativeButton={false}
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          aria-label="بازگشت"
        >
          <ArrowRight className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">تسویه نوبت</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {formatBookingDisplayId(booking)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            مبلغ نهایی هر خدمت را وارد کنید — فروش از این مقادیر محاسبه می‌شود
          </p>
        </div>
      </div>

      <BookingStepsNav activeStep={4} />

      <Card className="shadow-none">
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">{customerDisplayName(booking.customerId)}</p>
          <p className="text-muted-foreground" dir="ltr">
            {customerMobile(booking.customerId)}
          </p>
          <p className="text-muted-foreground">
            {formatDateFa(booking.bookingDate)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {booking.services.map((line, index) => {
          const stylist = stylistById(line.stylistId);
          return (
            <Card key={line.id} className="shadow-none">
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    {index + 1}. {bookingServiceLabel(line.serviceId)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stylist?.displayName ?? "—"} ·{" "}
                    {formatTimeDisplay(line.startTime)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    تخمین: {formatPrice(line.estimatedPrice)}
                  </p>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">مبلغ نهایی (تومان)</span>
                  <input
                    type="number"
                    min={0}
                    value={lineAmounts[line.id] ?? ""}
                    onChange={(event) =>
                      setLineAmounts((current) => ({
                        ...current,
                        [line.id]: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    dir="ltr"
                  />
                </label>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>جمع دریافتی</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">روش پرداخت</span>
            <select
              value={paymentKind}
              onChange={(event) =>
                setPaymentKind(event.target.value as PaymentTransaction["kind"])
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              {paymentKinds.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">یادداشت (اختیاری)</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      {formError ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          render={<Link href={`/salon/bookings/${booking.id}`} />}
          nativeButton={false}
        >
          انصراف
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "در حال ثبت..." : "تکمیل و ثبت فروش"}
        </Button>
      </div>
    </div>
  );
}
