"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import {
  activeStylistsForSettlement,
  balanceFavorLabel,
  loadSettlementReportData,
  projectBalanceAfterSettlement,
  recordStylistSettlementAsync,
  settlementMethodLabels,
  settlementPeriodForDrawer,
  stylistFinancialPosition,
} from "@/lib/salon/settlements";
import { SettlementDirectionLabel } from "@/components/salon/settlements/settlement-direction-label";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SettlementDirection, SettlementMethod } from "@/types/domain";

type RecordSettlementDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodStart: string;
  periodEnd: string;
  initialStylistId: string | null;
  dataVersion?: number;
  onRecorded: (stylistId: string) => void | Promise<void>;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function RecordSettlementDrawer({
  open,
  onOpenChange,
  periodStart,
  periodEnd,
  initialStylistId,
  dataVersion = 0,
  onRecorded,
}: RecordSettlementDrawerProps) {
  const stylists = useMemo(() => activeStylistsForSettlement(), []);
  const [stylistId, setStylistId] = useState("");
  const [direction, setDirection] = useState<SettlementDirection>(
    "salon_to_stylist",
  );
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [method, setMethod] = useState<SettlementMethod>("transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPosition, setLoadingPosition] = useState(false);
  const [localDataVersion, setLocalDataVersion] = useState(0);

  const pagePeriod = useMemo(
    () => ({ periodStart, periodEnd }),
    [periodStart, periodEnd],
  );

  const effectivePeriod = useMemo(() => {
    if (!stylistId) return pagePeriod;
    return settlementPeriodForDrawer(stylistId, pagePeriod, initialStylistId);
  }, [stylistId, pagePeriod, initialStylistId]);

  const position = useMemo(() => {
    void dataVersion;
    void localDataVersion;
    if (!stylistId) return null;
    return stylistFinancialPosition(stylistId, {
      periodStart: effectivePeriod.periodStart,
      periodEnd: effectivePeriod.periodEnd,
      scopedToDateFilter: false,
    });
  }, [stylistId, effectivePeriod, dataVersion, localDataVersion]);

  useEffect(() => {
    if (!open) return;

    const defaultStylistId =
      initialStylistId && stylists.some((item) => item.id === initialStylistId)
        ? initialStylistId
        : (stylists[0]?.id ?? "");

    setStylistId(defaultStylistId);
    setAmount("");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setMethod("transfer");
    setReferenceNumber("");
    setNotes("");
    setError(null);
  }, [open, initialStylistId, stylists]);

  useEffect(() => {
    if (!open || !stylistId) return;

    let cancelled = false;

    async function refreshPositionData() {
      setLoadingPosition(true);
      try {
        const period = settlementPeriodForDrawer(
          stylistId,
          pagePeriod,
          initialStylistId,
        );
        await loadSettlementReportData(period);
        if (!cancelled) {
          setLocalDataVersion((value) => value + 1);
        }
      } finally {
        if (!cancelled) {
          setLoadingPosition(false);
        }
      }
    }

    void refreshPositionData();
    return () => {
      cancelled = true;
    };
  }, [open, stylistId, pagePeriod, initialStylistId]);

  useEffect(() => {
    if (!position) return;
    setDirection(
      position.balanceDirection === "stylist_to_salon"
        ? "stylist_to_salon"
        : "salon_to_stylist",
    );
  }, [stylistId, position]);

  const parsedAmount = useMemo(
    () => Number(amount.replace(/[^\d]/g, "")) || 0,
    [amount],
  );

  const projectedBalance = useMemo(() => {
    if (!position) return 0;
    return projectBalanceAfterSettlement(position, direction, parsedAmount);
  }, [position, direction, parsedAmount]);

  const selectedStylist = stylists.find((item) => item.id === stylistId);

  if (stylists.length === 0) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!position || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await recordStylistSettlementAsync({
        stylistId: position.stylistId,
        periodStart: position.periodStart,
        periodEnd: position.periodEnd,
        direction,
        amount: parsedAmount,
        occurredAt,
        method,
        referenceNumber,
        notes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await onRecorded(position.stylistId);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  const previewTone =
    projectedBalance === 0
      ? "border-border bg-muted/40 text-foreground"
      : projectedBalance > 0
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-shell="salon"
        className="w-full sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <SheetTitle>ثبت رکورد مالی جدید</SheetTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  ثبت پرداخت یا دریافت مرتبط با آرایشگر
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                آرایشگر <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <select
                  value={stylistId}
                  onChange={(event) => {
                    setStylistId(event.target.value);
                    setError(null);
                  }}
                  className={cn(fieldClassName, "pe-10")}
                >
                  {stylists.map((stylist) => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.displayName}
                    </option>
                  ))}
                </select>
                {selectedStylist ? (
                  <StylistAvatar
                    stylistId={selectedStylist.id}
                    avatarPath={selectedStylist.avatarPath}
                    name={selectedStylist.displayName}
                    className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2"
                    size="xs"
                  />
                ) : null}
              </div>
            </label>

            {position ? (
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {loadingPosition ? (
                  <span>در حال محاسبه مانده...</span>
                ) : (
                  <>
                    مانده فعلی:{" "}
                    <span className="font-medium text-foreground">
                      {formatPrice(Math.abs(position.balance))}
                    </span>{" "}
                    — {balanceFavorLabel(position.balance)}
                    {position.settledTotal > 0 ? (
                      <span className="mt-1 block">
                        ثبت‌شده تا این دوره:{" "}
                        <span className="font-medium text-foreground">
                          {formatPrice(position.settledTotal)}
                        </span>
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            <fieldset className="block space-y-2">
              <legend className="text-sm font-medium">
                جهت پرداخت <span className="text-destructive">*</span>
              </legend>
              <div className="grid gap-2">
                {(
                  ["salon_to_stylist", "stylist_to_salon"] as SettlementDirection[]
                ).map((value) => {
                  const selected = direction === value;
                  const tone =
                    value === "salon_to_stylist"
                      ? "text-emerald-700"
                      : "text-rose-700";

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDirection(value)}
                      className={cn(
                        fieldClassName,
                        "flex h-auto min-h-11 items-center px-3 py-2 transition",
                        selected
                          ? value === "salon_to_stylist"
                            ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200"
                            : "border-rose-300 bg-rose-50 ring-2 ring-rose-200"
                          : "hover:border-primary/30",
                      )}
                    >
                      <SettlementDirectionLabel
                        direction={value}
                        className={tone}
                        arrowClassName={tone}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                مبلغ (تومان) <span className="text-destructive">*</span>
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="مثال: 2000000"
                dir="ltr"
                className={cn(fieldClassName, "text-start")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                تاریخ <span className="text-destructive">*</span>
              </span>
              <JalaliDateInput
                value={occurredAt}
                onChange={setOccurredAt}
                placeholder="تاریخ رکورد"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                روش پرداخت <span className="text-destructive">*</span>
              </span>
              <select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as SettlementMethod)
                }
                className={fieldClassName}
              >
                {Object.entries(settlementMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">شماره پیگیری / مرجع</span>
              <input
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                placeholder="اختیاری"
                dir="ltr"
                className={cn(fieldClassName, "text-start")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">توضیحات</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="توضیحات اختیاری..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {position ? (
              <div className={cn("rounded-2xl border px-4 py-3 text-sm", previewTone)}>
                <p className="font-medium">مانده پس از این رکورد</p>
                <p className="mt-2 text-lg font-bold">
                  {formatPrice(Math.abs(projectedBalance))}
                </p>
                <p className="mt-1 opacity-80">
                  {balanceFavorLabel(projectedBalance)}
                </p>
              </div>
            ) : null}

            <p className="text-xs leading-6 text-muted-foreground">
              ثبت جزئی مجاز است. با تغییر آرایشگر، مانده و پیش‌نمایش
              به‌روزرسانی می‌شود.
            </p>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary hover:bg-primary/90"
              disabled={!position || submitting || loadingPosition}
            >
              {submitting ? "در حال ثبت..." : "ثبت رکورد مالی"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
