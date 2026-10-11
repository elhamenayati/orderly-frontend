"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { env } from "@/config/env";
import { findBookingById } from "@/lib/booking/submit-guest";
import { BookingSummary } from "@/components/booking/booking-summary";
import { customers } from "@/mock_ts/customers";
import { salon } from "@/lib/salon/public-data";
import { Button } from "@/components/ui/button";
import type { BookingDraft } from "@/types/booking";

export function BookSuccessContent() {
  const searchParams = useSearchParams();
  const [mockSmsSent, setMockSmsSent] = useState(false);
  const [storedBookingId, setStoredBookingId] = useState<string | null>(null);
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    setMockSmsSent(sessionStorage.getItem("mahoura:mockSmsSent") === "1");
    setStoredBookingId(sessionStorage.getItem("mahoura:lastBookingId"));
  }, []);

  const resolvedBookingId = bookingId ?? storedBookingId ?? undefined;
  const booking = resolvedBookingId
    ? findBookingById(resolvedBookingId)
    : undefined;
  const customer = booking
    ? customers.find((item) => item.id === booking.customerId)
    : undefined;

  const draft: BookingDraft | null = booking
    ? {
        bookingId: booking.id,
        customerId: booking.customerId,
        bookingDate: booking.bookingDate,
        notes: booking.notes ?? "",
        lines: booking.services.map((line) => ({
          clientId: line.id,
          persistedId: line.id,
          serviceId: line.serviceId,
          stylistId: line.stylistId,
          startTime: line.startTime,
          reservedDurationMinutes: line.reservedDurationMinutes,
          estimatedPrice: line.estimatedPrice,
          availability: "available" as const,
          errors: [],
        })),
      }
    : null;

  if (!booking || !draft) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">نوبت یافت نشد.</p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4 rounded-xl">
          بازگشت به سالن
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8">
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">نوبت شما ثبت شد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            رزرو شما در {salon.brandName} با موفقیت تأیید شد.
          </p>
        </div>

        <BookingSummary
          draft={draft}
          guestName={customer?.fullName}
          guestMobile={customer?.mobile}
          showGuest
          showPolicy
        />

        {mockSmsSent && env.enableMockSms ? (
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 text-sm">
            <MessageSquare className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">پیامک تأیید (نمایشی)</p>
              <p className="leading-7 text-muted-foreground">
                در نسخه دمو، پیامک تأیید نوبت به {customer?.mobile} ارسال
                می‌شد. برای لغو، طبق قوانین سالن عمل کنید؛ در دمو لغو از
                طریق پیامک نیز نمایشی است.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted-foreground">
            برای لغو نوبت با سالن تماس بگیرید. {salon.cancellationPolicy}
          </p>
        )}

        <Button render={<Link href="/" />} nativeButton={false} className="h-12 w-full rounded-xl">
          بازگشت به صفحه سالن
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {env.appName} · کد نوبت: {booking.id}
        </p>
      </div>
    </div>
  );
}
