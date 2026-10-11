"use client";

import { useEffect, useState } from "react";
import { Phone, UserRound } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { registerSalonCustomerAsync } from "@/lib/salon/customers";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

type RegisterCustomerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (customer: Customer) => void;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function RegisterCustomerDrawer({
  open,
  onOpenChange,
  onRegistered,
}: RegisterCustomerDrawerProps) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setMobile("");
    setError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await registerSalonCustomerAsync({ fullName, mobile });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onRegistered(result.customer);
    onOpenChange(false);
  }

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
                <UserRound className="size-5" />
              </span>
              <SheetTitle>ثبت مشتری</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                نام و نام خانوادگی <span className="text-destructive">*</span>
              </span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="مثال: مریم رحمانی"
                className={fieldClassName}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                شماره موبایل <span className="text-destructive">*</span>
              </span>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="09123456789"
                dir="ltr"
                className={cn(fieldClassName, "text-start")}
              />
            </label>

            <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
              <Phone className="mt-0.5 size-3.5 shrink-0" />
              شماره موبایل برای شناسایی مشتری و پیگیری نوبت استفاده می‌شود.
            </p>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-input hover:border-primary/40 hover:text-primary"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
