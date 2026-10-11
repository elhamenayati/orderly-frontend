"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Loader2,
  Plus,
  Search,
  Store,
} from "lucide-react";
import {
  filteredAdminSalonListRows,
  fetchAdminSalons,
  paymentStatusFilterOptions,
  paymentStatusLabels,
  salonStatusFilterOptions,
  salonStatusLabels,
  subscriptionPlanFilterOptions,
  type AdminSalonTableRow,
} from "@/lib/admin/salons";
import { formatJalaliShort } from "@/lib/format/jalali";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TableRowActionsMenu,
  tableRowActionsMenuItemClassName,
} from "@/components/ui/table-row-actions-menu";
import { cn } from "@/lib/utils";
import type { SalonStatus, SubscriptionPaymentStatus } from "@/types/domain";

const fieldClassName =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AdminSalonsPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SalonStatus | "all">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<
    SubscriptionPaymentStatus | "all"
  >("all");
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        await fetchAdminSalons();
        if (cancelled) return;
        setRefreshKey((value) => value + 1);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message || "بارگذاری سالن‌ها با خطا مواجه شد"
              : "بارگذاری سالن‌ها با خطا مواجه شد",
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

  const rows = useMemo(() => {
    void refreshKey;
    return filteredAdminSalonListRows({
      query,
      status: statusFilter,
      planName: planFilter,
      paymentStatus: paymentFilter,
    });
  }, [refreshKey, query, statusFilter, planFilter, paymentFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="size-5" />
            <span className="text-sm">سالن‌ها</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold">سالن‌ها</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <span>داشبورد</span>
            <ChevronLeft className="size-3.5" />
            <span className="text-foreground">سالن‌ها</span>
          </p>
        </div>
        <Button
          render={<Link href="/admin/salons/new" />}
          nativeButton={false}
          className="h-11 rounded-lg bg-teal-600 px-5 hover:bg-teal-700"
        >
          <Plus className="size-4" />
          ایجاد سالن
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در سالن‌ها، مالک، موبایل..."
              className={cn(fieldClassName, "ps-10")}
            />
          </label>
          <FilterSelect
            label="وضعیت"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as SalonStatus | "all")}
            options={salonStatusFilterOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
          <FilterSelect
            label="پلن اشتراک"
            value={planFilter}
            onChange={setPlanFilter}
            options={subscriptionPlanFilterOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
          <FilterSelect
            label="وضعیت پرداخت"
            value={paymentFilter}
            onChange={(value) =>
              setPaymentFilter(value as SubscriptionPaymentStatus | "all")
            }
            options={paymentStatusFilterOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-0 p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              در حال بارگذاری...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted-foreground">
              سالنی با این فیلتر یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">سالن</th>
                    <th className="px-4 py-3 text-start font-medium">
                      مالک / مدیر سالن
                    </th>
                    <th className="px-4 py-3 text-start font-medium">موبایل</th>
                    <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                    <th className="px-4 py-3 text-start font-medium">اشتراک</th>
                    <th className="px-4 py-3 text-start font-medium">
                      وضعیت پرداخت
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      شروع اشتراک
                    </th>
                    <th className="px-4 py-3 text-start font-medium">انقضا</th>
                    <th className="px-4 py-3 text-start font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <SalonTableRow key={row.record.salonId} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SalonTableRow({ row }: { row: AdminSalonTableRow }) {
  const initial = row.brandName.trim().charAt(0) || "س";

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/20">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            {initial}
          </span>
          <div>
            <p className="font-medium">{row.brandName}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.displayCode}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">{row.record.ownerName}</td>
      <td className="px-4 py-3" dir="ltr">
        {formatMobile(row.record.ownerMobile)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge kind="salon" value={row.status} />
      </td>
      <td className="px-4 py-3">{row.planName}</td>
      <td className="px-4 py-3">
        <StatusBadge kind="payment" value={row.paymentStatus} />
      </td>
      <td className="px-4 py-3">
        {row.subscription
          ? formatJalaliShort(row.subscription.startsAt)
          : "—"}
      </td>
      <td className="px-4 py-3">
        {row.subscription ? formatJalaliShort(row.subscription.endsAt) : "—"}
      </td>
      <td className="px-4 py-3">
        <TableRowActionsMenu
          triggerClassName="border border-border"
          menuClassName="bg-card"
        >
          <Link
            href={`/admin/salons/${row.record.salonId}`}
            className={tableRowActionsMenuItemClassName}
          >
            مشاهده جزئیات
          </Link>
        </TableRowActionsMenu>
      </td>
    </tr>
  );
}

function StatusBadge({
  kind,
  value,
}: {
  kind: "salon" | "payment";
  value: SalonStatus | SubscriptionPaymentStatus;
}) {
  const salonClasses: Record<SalonStatus, string> = {
    active: "border-teal-200 bg-teal-50 text-teal-800",
    pending: "border-amber-200 bg-amber-50 text-amber-800",
    suspended: "border-rose-200 bg-rose-50 text-rose-800",
    inactive: "border-slate-200 bg-slate-100 text-slate-700",
  };

  const paymentClasses: Record<SubscriptionPaymentStatus, string> = {
    paid: "border-teal-200 bg-teal-50 text-teal-800",
    unpaid: "border-rose-200 bg-rose-50 text-rose-800",
  };

  const label =
    kind === "salon"
      ? salonStatusLabels[value as SalonStatus]
      : paymentStatusLabels[value as SubscriptionPaymentStatus];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        kind === "salon"
          ? salonClasses[value as SalonStatus]
          : paymentClasses[value as SubscriptionPaymentStatus],
      )}
    >
      {label}
    </span>
  );
}

function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}
