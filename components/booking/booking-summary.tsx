"use client";

import { Clock } from "lucide-react";
import { findService } from "@/lib/booking/catalog";
import {
  displayedMinimumDeposit,
  estimatedTotal,
} from "@/lib/booking/totals";
import { formatDateFa } from "@/lib/format/date";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatTimeDisplay, salon } from "@/lib/salon/public-data";
import { stylists } from "@/mock_ts/stylists";
import type { BookingDraft } from "@/types/booking";
import { Card, CardContent } from "@/components/ui/card";

type BookingSummaryProps = {
  draft: BookingDraft;
  guestName?: string;
  guestMobile?: string;
  customerName?: string;
  customerMobile?: string;
  showGuest?: boolean;
  showCustomer?: boolean;
  customerFirst?: boolean;
  showPolicy?: boolean;
  showNotes?: boolean;
};

export function BookingSummary({
  draft,
  guestName,
  guestMobile,
  customerName,
  customerMobile,
  showGuest = false,
  showCustomer = false,
  customerFirst = false,
  showPolicy = true,
  showNotes = false,
}: BookingSummaryProps) {
  const total = estimatedTotal(draft.lines);
  const deposit = displayedMinimumDeposit(draft.lines);

  const customerCard =
    showCustomer && (customerName || customerMobile) ? (
      <Card className="shadow-none">
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">مشتری</p>
          {customerName ? <p>{customerName}</p> : null}
          {customerMobile ? (
            <p className="text-muted-foreground" dir="ltr">
              {customerMobile}
            </p>
          ) : null}
        </CardContent>
      </Card>
    ) : null;

  const servicesCard = (
    <Card className="shadow-none">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">تاریخ نوبت</span>
          <span className="font-medium">{formatDateFa(draft.bookingDate)}</span>
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          {draft.lines.map((line, index) => {
            const service = line.serviceId
              ? findService(line.serviceId)
              : undefined;
            const stylist = line.stylistId
              ? stylists.find((item) => item.id === line.stylistId)
              : undefined;

            return (
              <div key={line.clientId} className="space-y-1 text-sm">
                <p className="font-medium">
                  {index + 1}. {service?.name ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {stylist?.displayName ?? "—"}
                  {line.startTime ? ` · ${formatTimeDisplay(line.startTime)}` : ""}
                </p>
                {line.reservedDurationMinutes ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {formatDuration(line.reservedDurationMinutes)}
                    {line.estimatedPrice !== null
                      ? ` · ${formatPrice(line.estimatedPrice)}`
                      : ""}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {customerFirst ? customerCard : null}
      {servicesCard}
      {!customerFirst ? customerCard : null}

      {showGuest && (guestName || guestMobile) ? (
        <Card className="shadow-none">
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">اطلاعات مهمان</p>
            {guestName ? <p>{guestName}</p> : null}
            {guestMobile ? (
              <p className="text-muted-foreground" dir="ltr">
                {guestMobile}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showNotes && draft.notes ? (
        <Card className="shadow-none">
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">یادداشت</p>
            <p className="leading-7 text-muted-foreground">{draft.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع تخمینی</span>
            <span className="font-semibold text-primary">{formatPrice(total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">حداقل ودیعه (نمایشی)</span>
            <span>{formatPrice(deposit)}</span>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            ودیعه در این نسخه فقط نمایش داده می‌شود و آنلاین دریافت نمی‌شود.
          </p>
        </CardContent>
      </Card>

      {showPolicy ? (
        <Card className="shadow-none">
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">قوانین لغو {salon.brandName}</p>
            <p className="leading-7 text-muted-foreground">
              {salon.cancellationPolicy}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
