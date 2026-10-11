"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  History,
  Mail,
  Phone,
  Store,
} from "lucide-react";
import { ChangeStatusDialog } from "@/components/admin/salon-detail/change-status-dialog";
import { RecordPaymentDrawer } from "@/components/admin/salon-detail/record-payment-drawer";
import { RenewSubscriptionDrawer } from "@/components/admin/salon-detail/renew-subscription-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchAdminSalonDetail,
  findAdminRecord,
  findSalonById,
  findSubscription,
  formatAdminDateTime,
  formatAdminMobile,
  getSalonStatusHistory,
  getSubscriptionHistory,
  paymentStatusBadgeClass,
  paymentStatusLabels,
  salonStatusBadgeClass,
  salonStatusLabels,
  subscriptionActionLabels,
  subscriptionExpiryCountdown,
  subscriptionStatusBadgeClass,
  subscriptionStatusLabels,
} from "@/lib/admin/salons";
import { ApiError } from "@/lib/api/client";
import { formatJalaliShort } from "@/lib/format/jalali";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "subscription" | "activity";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "نمای کلی" },
  { key: "subscription", label: "وضعیت پرداخت" },
  { key: "activity", label: "گزارش فعالیت" },
];

export function AdminSalonDetailPage({ salonId }: { salonId: string }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [renewDrawerOpen, setRenewDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const detail = await fetchAdminSalonDetail(salonId);
        if (cancelled) return;
        if (!detail) {
          setLoadError("سالن یافت نشد.");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message || "بارگذاری جزئیات سالن با خطا مواجه شد"
              : "بارگذاری جزئیات سالن با خطا مواجه شد",
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
  }, [salonId]);

  const salon = useMemo(
    () => findSalonById(salonId),
    [salonId, refreshKey],
  );
  const record = useMemo(
    () => findAdminRecord(salonId),
    [salonId, refreshKey],
  );
  const subscription = useMemo(
    () => (record ? findSubscription(record.subscriptionId) : undefined),
    [record, refreshKey],
  );
  const statusHistory = useMemo(
    () => getSalonStatusHistory(salonId),
    [salonId, refreshKey],
  );
  const subscriptionHistory = useMemo(
    () => getSubscriptionHistory(salonId),
    [salonId, refreshKey],
  );

  function refresh() {
    void fetchAdminSalonDetail(salonId).then(() => {
      setRefreshKey((value) => value + 1);
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        در حال بارگذاری...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button
          render={<Link href="/admin/salons" />}
          nativeButton={false}
          variant="outline"
          className="rounded-lg"
        >
          بازگشت به لیست سالن‌ها
        </Button>
      </div>
    );
  }

  if (!salon || !record) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">سالن یافت نشد.</p>
        <Button
          render={<Link href="/admin/salons" />}
          nativeButton={false}
          variant="outline"
          className="rounded-lg"
        >
          بازگشت به لیست سالن‌ها
        </Button>
      </div>
    );
  }

  const expiry = subscription
    ? subscriptionExpiryCountdown(subscription.endsAt)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start gap-4">
        <Button
          render={<Link href="/admin/salons" />}
          nativeButton={false}
          variant="outline"
          className="h-10 rounded-lg px-3"
        >
          <ArrowRight className="size-4" />
          بازگشت
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700">
            <Store className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{salon.brandName}</h1>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  salonStatusBadgeClass(salon.status),
                )}
              >
                {salonStatusLabels[salon.status]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {record.displayCode}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "border-b-2 pb-3 text-sm font-medium transition whitespace-nowrap",
                tab === item.key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <SectionCard title="وضعیت جاری">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">وضعیت</p>
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      salonStatusBadgeClass(salon.status),
                    )}
                  >
                    {salonStatusLabels[salon.status]}
                  </span>
                </div>
                {record.lastStatusChangeAt ? (
                  <InfoRow
                    label="آخرین تغییر وضعیت"
                    value={formatAdminDateTime(record.lastStatusChangeAt)}
                  />
                ) : null}
                {record.lastStatusChangeBy ? (
                  <InfoRow label="توسط" value={record.lastStatusChangeBy} />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-lg"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  تغییر وضعیت سالن
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="اطلاعات پایه">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="کد سالن" value={record.displayCode} />
                <InfoRow label="نام سالن" value={salon.brandName} />
                <InfoRow label="نوع" value="سالن" />
                <InfoRow
                  label="تخصص"
                  value={record.category ?? "خدمات زیبایی"}
                />
                <InfoRow
                  label="تاریخ ثبت"
                  value={formatAdminDateTime(record.createdAt)}
                />
                <InfoRow label="ثبت توسط" value="ادمین پلتفرم" />
              </div>
              {salon.description ? (
                <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                  {salon.description}
                </p>
              ) : null}
            </SectionCard>

            <SectionCard title="مدیر / مالک سالن">
              <div className="flex items-start gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-lg font-semibold text-slate-700">
                  {record.ownerName.slice(0, 1)}
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold">{record.ownerName}</p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 shrink-0" />
                    <span dir="ltr">{formatAdminMobile(record.ownerMobile)}</span>
                  </p>
                  {record.ownerEmail ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" />
                      <span dir="ltr">{record.ownerEmail}</span>
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 w-full rounded-lg"
              >
                ویرایش اطلاعات
              </Button>
            </SectionCard>
          </div>

          {subscription ? (
            <Card className="shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-base font-semibold">خلاصه اشتراک فعلی</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-10 rounded-lg bg-slate-900 px-4 hover:bg-slate-800"
                      onClick={() => setRenewDrawerOpen(true)}
                    >
                      <CalendarDays className="size-4" />
                      تمدید اشتراک
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-lg"
                      onClick={() => setPaymentDrawerOpen(true)}
                    >
                      <CreditCard className="size-4" />
                      جزئیات پرداخت
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <SummaryItem label="پلن" value={subscription.planName} />
                  <SummaryItem
                    label="تاریخ شروع"
                    value={formatJalaliShort(subscription.startsAt)}
                  />
                  <SummaryItem
                    label="تاریخ انقضا"
                    value={formatJalaliShort(subscription.endsAt)}
                    hint={
                      expiry && !expiry.expired ? (
                        <span className="text-xs text-destructive">
                          {expiry.label}
                        </span>
                      ) : expiry?.expired ? (
                        <span className="text-xs text-destructive">
                          {expiry.label}
                        </span>
                      ) : null
                    }
                  />
                  <SummaryItem
                    label="وضعیت اشتراک"
                    badge={
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          subscriptionStatusBadgeClass(subscription.status),
                        )}
                      >
                        {subscriptionStatusLabels[subscription.status]}
                      </span>
                    }
                  />
                  <SummaryItem
                    label="وضعیت پرداخت"
                    badge={
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          paymentStatusBadgeClass(record.paymentStatus),
                        )}
                      >
                        {paymentStatusLabels[record.paymentStatus]}
                      </span>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "subscription" && subscription ? (
        <Card className="shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">مدیریت اشتراک</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  مشاهده و مدیریت پلن، دوره اشتراک و وضعیت پرداخت
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-10 rounded-lg bg-slate-900 px-4 hover:bg-slate-800"
                  onClick={() => setRenewDrawerOpen(true)}
                >
                  <CalendarDays className="size-4" />
                  تمدید اشتراک
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg"
                  onClick={() => setPaymentDrawerOpen(true)}
                >
                  <CreditCard className="size-4" />
                  ثبت وضعیت پرداخت
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                label="وضعیت اشتراک"
                value={subscriptionStatusLabels[subscription.status]}
              />
              <InfoRow
                label="وضعیت پرداخت"
                value={paymentStatusLabels[record.paymentStatus]}
              />
              {record.lastRenewalAt ? (
                <InfoRow
                  label="آخرین تمدید"
                  value={formatAdminDateTime(record.lastRenewalAt)}
                />
              ) : null}
            </div>

            {expiry ? (
              <p
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm",
                  expiry.expired
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {expiry.label}
              </p>
            ) : null}

            <div className="space-y-3 border-t border-border pt-5">
              <div className="flex items-center gap-2">
                <History className="size-5 text-muted-foreground" />
                <h3 className="text-base font-semibold">تاریخچه اشتراک</h3>
              </div>

              {subscriptionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  هنوز رویدادی در تاریخچه اشتراک ثبت نشده است.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">
                          تاریخ
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          رویداد
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          پلن
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          دوره
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          وضعیت
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          پرداخت
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          توسط
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionHistory.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-t border-border"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatAdminDateTime(entry.changedAt)}
                          </td>
                          <td className="px-4 py-3">
                            {subscriptionActionLabels[entry.action]}
                          </td>
                          <td className="px-4 py-3">{entry.planName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatJalaliShort(entry.startsAt)} –{" "}
                            {formatJalaliShort(entry.endsAt)}
                          </td>
                          <td className="px-4 py-3">
                            {subscriptionStatusLabels[entry.status]}
                          </td>
                          <td className="px-4 py-3">
                            {paymentStatusLabels[entry.paymentStatus]}
                          </td>
                          <td className="px-4 py-3">{entry.changedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">وضعیت و فعالیت</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    وضعیت فعلی:{" "}
                    <span className="font-medium text-foreground">
                      {salonStatusLabels[salon.status]}
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  تغییر وضعیت سالن
                </Button>
              </div>

              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  هنوز تاریخچه‌ای ثبت نشده است.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-start font-medium">
                          تاریخ
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          از وضعیت
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          به وضعیت
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          توسط
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          توضیح
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusHistory.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-t border-border"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatAdminDateTime(entry.changedAt)}
                          </td>
                          <td className="px-4 py-3">
                            {entry.fromStatus
                              ? salonStatusLabels[entry.fromStatus]
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {salonStatusLabels[entry.toStatus]}
                          </td>
                          <td className="px-4 py-3">{entry.changedBy}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {entry.note ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <ChangeStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        salonId={salonId}
        currentStatus={salon.status}
        onSaved={refresh}
      />

      {subscription ? (
        <>
          <RenewSubscriptionDrawer
            open={renewDrawerOpen}
            onOpenChange={setRenewDrawerOpen}
            salonId={salonId}
            subscription={subscription}
            onSaved={refresh}
          />
          <RecordPaymentDrawer
            open={paymentDrawerOpen}
            onOpenChange={setPaymentDrawerOpen}
            salonId={salonId}
            currentPaymentStatus={record.paymentStatus}
            onSaved={refresh}
          />
        </>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  badge,
  hint,
}: {
  label: string;
  value?: string;
  badge?: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {badge ? (
        <div className="mt-1">{badge}</div>
      ) : (
        <p className="mt-1 text-sm font-medium">{value}</p>
      )}
      {hint ? <div className="mt-1">{hint}</div> : null}
    </div>
  );
}
