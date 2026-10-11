"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, History, Loader2 } from "lucide-react";
import {
  fetchSalonSubscription,
  subscriptionActionLabels,
  type SalonSubscriptionDetail,
} from "@/lib/salon/subscription";
import {
  paymentStatusBadgeClass,
  paymentStatusLabels,
  subscriptionExpiryCountdown,
  subscriptionStatusBadgeClass,
  subscriptionStatusLabels,
} from "@/lib/admin/salons";
import { ApiError } from "@/lib/api/client";
import { formatJalaliShort } from "@/lib/format/jalali";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

export function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SalonSubscriptionDetail>({ history: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchSalonSubscription();
        if (!cancelled) setDetail(data);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message || "بارگذاری اطلاعات اشتراک با خطا مواجه شد"
              : "بارگذاری اطلاعات اشتراک با خطا مواجه شد",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscription = detail.subscription;
  const expiry = useMemo(
    () => (subscription ? subscriptionExpiryCountdown(subscription.endsAt) : null),
    [subscription],
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">اشتراک سالن</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          پلن فعال و تاریخچه تغییرات اشتراک پلتفرم
        </p>
      </div>

      {subscription ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">اشتراک فعلی</h2>
                  <p className="text-sm text-muted-foreground">
                    {subscription.planName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    subscriptionStatusBadgeClass(subscription.status),
                  )}
                >
                  {subscriptionStatusLabels[subscription.status]}
                </Badge>
                {subscription.paymentStatus ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      paymentStatusBadgeClass(subscription.paymentStatus),
                    )}
                  >
                    {paymentStatusLabels[subscription.paymentStatus]}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoRow label="پلن" value={subscription.planName} />
              <InfoRow
                label="تاریخ شروع"
                value={formatJalaliShort(subscription.startsAt)}
              />
              <InfoRow
                label="تاریخ انقضا"
                value={formatJalaliShort(subscription.endsAt)}
              />
              <InfoRow
                label="آخرین تمدید"
                value={
                  subscription.renewedAt
                    ? formatDateTime(subscription.renewedAt)
                    : "—"
                }
              />
            </div>

            {expiry ? (
              <p
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  expiry.expired
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {expiry.label}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            اشتراکی برای این سالن ثبت نشده است.
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <History className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">تاریخچه اشتراک</h2>
              <p className="text-sm text-muted-foreground">
                ثبت، تمدید و تغییرات پرداخت اشتراک
              </p>
            </div>
          </div>

          {detail.history.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              هنوز رویدادی در تاریخچه ثبت نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {detail.history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {subscriptionActionLabels[entry.action]}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entry.planName}
                      </p>
                    </div>
                    <div className="text-end text-xs text-muted-foreground">
                      <p>{formatDateTime(entry.changedAt)}</p>
                      <p className="mt-1">توسط {entry.changedBy}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">شروع: </span>
                      {formatJalaliShort(entry.startsAt)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">انقضا: </span>
                      {formatJalaliShort(entry.endsAt)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">وضعیت: </span>
                      {subscriptionStatusLabels[entry.status]}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">پرداخت: </span>
                      {paymentStatusLabels[entry.paymentStatus]}
                    </div>
                  </div>

                  {entry.note ? (
                    <p className="mt-3 text-xs text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
