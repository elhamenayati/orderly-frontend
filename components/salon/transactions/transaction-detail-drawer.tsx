"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Printer, Receipt } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  formatTransactionDateTime,
  type FinancialTransactionDetail,
} from "@/lib/salon/transactions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type TransactionDetailDrawerProps = {
  transaction: FinancialTransactionDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransactionDetailDrawer({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailDrawerProps) {
  if (!transaction) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-shell="salon"
        className="w-full sm:max-w-md"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Receipt className="size-5" />
              </span>
              <SheetTitle>جزئیات تراکنش</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">مبلغ</p>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(transaction.amount)}
              </p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-sm font-medium",
                  transaction.directionTone === "inflow"
                    ? "text-emerald-700"
                    : "text-rose-700",
                )}
              >
                {transaction.directionTone === "inflow" ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
                {transaction.directionLabel}
              </p>
            </div>

            <DetailSection title="اطلاعات تراکنش">
              <DetailRow label="نوع" value={transaction.typeLabel} />
              <DetailRow label="روش پرداخت" value={transaction.paymentMethodLabel} />
              <DetailRow label="مرجع" value={transaction.reference} dir="ltr" />
              <DetailRow
                label="تاریخ"
                value={formatTransactionDateTime(transaction.occurredAt)}
              />
            </DetailSection>

            <DetailSection title="طرف تراکنش">
              <DetailRow label="نام" value={transaction.partyLabel} />
              {transaction.partyMobile ? (
                <DetailRow
                  label="موبایل"
                  value={transaction.partyMobile}
                  dir="ltr"
                />
              ) : null}
              {transaction.bookingReference ? (
                <DetailRow
                  label="رزرو مرتبط"
                  value={
                    <Link
                      href={`/salon/bookings/${transaction.bookingReference}`}
                      className="text-primary hover:underline"
                    >
                      {transaction.bookingReference}
                    </Link>
                  }
                />
              ) : null}
            </DetailSection>

            <DetailSection title="ثبت">
              <DetailRow label="ثبت‌کننده" value={transaction.createdBy} />
              <DetailRow label="نقش" value="مدیر سالن" />
              <DetailRow
                label="زمان ثبت"
                value={formatTransactionDateTime(transaction.createdAt)}
              />
            </DetailSection>

            {transaction.notes ? (
              <DetailSection title="توضیحات">
                <p className="text-sm leading-7 text-muted-foreground">
                  {transaction.notes}
                </p>
              </DetailSection>
            ) : null}

            <p className="text-xs leading-6 text-muted-foreground">
              این صفحه به‌عنوان Audit Trail عمل می‌کند. سوابق مالی قابل ردیابی
              هستند و بدون ثبت جدید بازنویسی نمی‌شوند.
            </p>
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              بستن
            </Button>
            <Button type="button" className="rounded-xl" disabled>
              <Printer className="size-4" />
              چاپ رسید
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <p className="font-medium">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: ReactNode;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span dir={dir} className="text-end font-medium">
        {value}
      </span>
    </div>
  );
}
