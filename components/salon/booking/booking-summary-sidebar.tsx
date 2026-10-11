"use client";

import { CalendarDays, Phone, UserRound } from "lucide-react";
import { estimatedTotal } from "@/lib/booking/totals";
import { findService } from "@/lib/booking/catalog";
import { formatJalaliLong } from "@/lib/format/jalali";
import { formatPrice } from "@/lib/format";
import {
  customerById,
  formatCustomerMobile,
} from "@/lib/salon/customers";
import { serviceName, stylistById } from "@/lib/salon/management";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import type { BookingDraft } from "@/types/booking";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type BookingSummarySidebarProps = {
  draft: BookingDraft;
  mode?: "create" | "edit";
};

export function BookingSummarySidebar({
  draft,
  mode = "create",
}: BookingSummarySidebarProps) {
  const customer = customerById(draft.customerId);
  const total = estimatedTotal(draft.lines);
  const completeLines = draft.lines.filter(
    (line) => line.serviceId && line.stylistId && line.startTime,
  );

  return (
    <Card className="sticky top-6 shadow-none">
      <CardContent className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-semibold">خلاصه رزرو</h2>
          <Badge className="mt-2" variant="secondary">
            {mode === "create" ? "وضعیت: در انتظار ثبت" : "وضعیت: در انتظار ذخیره"}
          </Badge>
        </div>

        {customer ? (
          <div className="space-y-2 rounded-xl bg-muted/50 px-3 py-3 text-sm">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" />
              <span className="font-medium">{customer.fullName}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" />
              <span dir="ltr">{formatCustomerMobile(customer.mobile)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">مشتری انتخاب نشده</p>
        )}

        <div className="flex items-start gap-2 text-sm">
          <CalendarDays className="mt-0.5 size-4 text-primary" />
          <span>{formatJalaliLong(draft.bookingDate)}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">خدمات</p>
          {completeLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز خدمتی کامل نشده</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {completeLines.map((line) => {
                const service = line.serviceId
                  ? findService(line.serviceId)
                  : undefined;
                const stylist = line.stylistId
                  ? stylistById(line.stylistId)
                  : undefined;
                return (
                  <li
                    key={line.clientId}
                    className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                  >
                    <div>
                      <p>{service?.name ?? serviceName(line.serviceId!)}</p>
                      <p className="text-xs text-muted-foreground">
                        {stylist?.displayName}
                        {line.startTime
                          ? ` · ${formatTimeDisplay(line.startTime)}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {line.estimatedPrice !== null
                        ? formatPrice(line.estimatedPrice)
                        : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">جمع مبلغ تخمینی</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatPrice(total)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
