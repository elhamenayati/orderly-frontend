"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import {
  adminFormErrorMessages,
  createSalonPlanOptions,
  defaultCreateSalonDates,
  paymentStatusFilterOptions,
  renewSalonSubscriptionAsync,
} from "@/lib/admin/salons";
import type { Subscription, SubscriptionPaymentStatus } from "@/types/domain";

const fieldClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type RenewSubscriptionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonId: string;
  subscription: Subscription;
  onSaved: () => void;
};

export function RenewSubscriptionDrawer({
  open,
  onOpenChange,
  salonId,
  subscription,
  onSaved,
}: RenewSubscriptionDrawerProps) {
  const defaultDates = defaultCreateSalonDates();
  const [planName, setPlanName] = useState(subscription.planName);
  const [startsAt, setStartsAt] = useState(defaultDates.startsAt);
  const [endsAt, setEndsAt] = useState(defaultDates.endsAt);
  const [paymentStatus, setPaymentStatus] =
    useState<SubscriptionPaymentStatus>("paid");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dates = defaultCreateSalonDates();
    setPlanName(subscription.planName);
    setStartsAt(dates.startsAt);
    setEndsAt(dates.endsAt);
    setPaymentStatus("paid");
    setError(null);
  }, [open, subscription.planName]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await renewSalonSubscriptionAsync({
      salonId,
      planName,
      startsAt,
      endsAt,
      paymentStatus,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.errors
          .map((code) => adminFormErrorMessages[code] ?? code)
          .join(" · "),
      );
      return;
    }

    onSaved();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-teal-600" />
            تمدید اشتراک
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              پلن اشتراک <span className="text-destructive">*</span>
            </span>
            <select
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              className={fieldClassName}
            >
              {createSalonPlanOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              تاریخ شروع دوره جدید <span className="text-destructive">*</span>
            </span>
            <JalaliDateInput
              value={startsAt}
              onChange={setStartsAt}
              maxDate={endsAt || undefined}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              تاریخ انقضا <span className="text-destructive">*</span>
            </span>
            <JalaliDateInput
              value={endsAt}
              onChange={setEndsAt}
              minDate={startsAt || undefined}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">
              وضعیت پرداخت <span className="text-destructive">*</span>
            </span>
            <select
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(event.target.value as SubscriptionPaymentStatus)
              }
              className={fieldClassName}
            >
              {paymentStatusFilterOptions
                .filter((item) => item.value !== "all")
                .map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
            </select>
          </label>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <SheetFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-teal-600 hover:bg-teal-700"
              disabled={submitting}
            >
              {submitting ? "در حال ثبت..." : "ثبت تمدید"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
