"use client";

import { useState } from "react";
import { UserRound, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { registerSalonCustomerAsync } from "@/lib/salon/customers";
import type { Customer } from "@/types/domain";

type RegisterCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (customer: Customer) => void;
};

export function RegisterCustomerDialog({
  open,
  onOpenChange,
  onRegistered,
}: RegisterCustomerDialogProps) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFullName("");
    setMobile("");
    setError(null);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await registerSalonCustomerAsync({ fullName, mobile });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onRegistered(result.customer);
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-shell="salon" className="max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <div>
                <DialogTitle>مشتری جدید</DialogTitle>
                <DialogDescription className="mt-1">
                  اگر مشتری در لیست وجود ندارد، اطلاعات او را ثبت کنید.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                نام و نام خانوادگی <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="مثال: مریم رضایی"
                  className="h-11 w-full rounded-xl border border-input bg-background ps-10 pe-3 text-sm"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                شماره موبایل <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  placeholder="مثال: 0912 345 6789"
                  dir="ltr"
                  className="h-11 w-full rounded-xl border border-input bg-background ps-10 pe-3 text-sm"
                />
              </div>
            </label>

            <p className="text-xs leading-6 text-muted-foreground">
              شماره موبایل برای شناسایی مشتری و پیگیری نوبت استفاده می‌شود.
            </p>

            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl"
              onClick={() => handleClose(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-xl"
              disabled={submitting}
            >
              {submitting ? "در حال ذخیره..." : "ذخیره و انتخاب مشتری"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
