"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Send,
  Store,
  X,
} from "lucide-react";
import {
  adminFormErrorMessages,
  createAdminSalonAsync,
  createSalonPlanOptions,
  defaultCreateSalonDates,
  initialSalonStatusOptions,
  paymentStatusFilterOptions,
  salonCategoryOptions,
} from "@/lib/admin/salons";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SalonStatus, SubscriptionPaymentStatus } from "@/types/domain";

const fieldClassName =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AdminSalonCreatePage() {
  const router = useRouter();
  const defaultDates = useMemo(() => defaultCreateSalonDates(), []);

  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [sendOtp, setSendOtp] = useState(true);
  const [planName, setPlanName] = useState("");
  const [startsAt, setStartsAt] = useState(defaultDates.startsAt);
  const [endsAt, setEndsAt] = useState(defaultDates.endsAt);
  const [paymentStatus, setPaymentStatus] = useState<
    SubscriptionPaymentStatus | ""
  >("");
  const [initialStatus, setInitialStatus] = useState<
    Extract<SalonStatus, "pending" | "active"> | ""
  >("pending");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createAdminSalonAsync({
      brandName,
      category,
      description,
      phone,
      address,
      ownerName,
      ownerMobile,
      sendOtp,
      planName,
      startsAt,
      endsAt,
      paymentStatus: paymentStatus as SubscriptionPaymentStatus,
      initialStatus: initialStatus as Extract<SalonStatus, "pending" | "active">,
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

    router.push(`/admin/salons/${result.salonId}`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="size-5 text-teal-600" />
                <span className="text-sm">ایجاد سالن جدید</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold">ایجاد سالن جدید</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Link
                  href="/admin/salons"
                  className="transition hover:text-primary"
                >
                  سالن‌ها
                </Link>
                <ChevronLeft className="size-3.5" />
                <span className="text-foreground">ایجاد سالن</span>
              </p>
            </div>
            <Link
              href="/admin/salons"
              aria-label="بستن"
              className="flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <FormSection title="اطلاعات پایه">
            <Field label="نام سالن" required>
              <input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="نام سالن را وارد کنید"
                className={fieldClassName}
              />
            </Field>
            <Field label="دسته‌بندی" required>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={fieldClassName}
              >
                <option value="">انتخاب کنید</option>
                {salonCategoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="شماره تماس" required>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="02188776655"
                dir="ltr"
                className={cn(fieldClassName, "text-start")}
              />
            </Field>
            <Field label="آدرس" required>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="آدرس سالن را وارد کنید"
                className={fieldClassName}
              />
            </Field>
            <Field label="توضیحات سالن" required>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="توضیحات سالن را وارد کنید"
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
          </FormSection>

          <FormSection title="مدیر / مالک سالن">
            <Field label="نام مدیر / مالک" required>
              <input
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="نام مدیر / مالک را وارد کنید"
                className={fieldClassName}
              />
            </Field>
            <Field label="شماره موبایل" required>
              <input
                value={ownerMobile}
                onChange={(event) => setOwnerMobile(event.target.value)}
                dir="ltr"
                placeholder="0912 *** ****"
                className={cn(fieldClassName, "text-start")}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
              <input
                type="checkbox"
                checked={sendOtp}
                onChange={(event) => setSendOtp(event.target.checked)}
                className="size-4 rounded border-input"
              />
              <span className="inline-flex items-center gap-2 text-sm">
                <Send className="size-4 text-teal-600" />
                ارسال کد تایید (OTP) به مدیر
              </span>
            </label>
          </FormSection>
        </div>

        <FormSection title="اشتراک و وضعیت">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="پلن اشتراک" required>
              <select
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                className={fieldClassName}
              >
                <option value="">انتخاب پلن</option>
                {createSalonPlanOptions.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="تاریخ شروع" required>
              <JalaliDateInput
                value={startsAt}
                onChange={setStartsAt}
                maxDate={endsAt || undefined}
                placeholder="انتخاب تاریخ"
              />
            </Field>
            <Field label="تاریخ انقضا" required>
              <JalaliDateInput
                value={endsAt}
                onChange={setEndsAt}
                minDate={startsAt || undefined}
                placeholder="انتخاب تاریخ"
              />
            </Field>
            <Field label="وضعیت پرداخت" required>
              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as SubscriptionPaymentStatus)
                }
                className={fieldClassName}
              >
                <option value="">انتخاب وضعیت</option>
                {paymentStatusFilterOptions
                  .filter((item) => item.value !== "all")
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="وضعیت سالن (اولیه)" required>
              <select
                value={initialStatus}
                onChange={(event) =>
                  setInitialStatus(
                    event.target.value as Extract<
                      SalonStatus,
                      "pending" | "active"
                    >,
                  )
                }
                className={fieldClassName}
              >
                {initialSalonStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-w-32 rounded-lg"
            render={<Link href="/admin/salons" />}
            nativeButton={false}
          >
            انصراف
          </Button>
          <Button
            type="submit"
            className="h-11 min-w-40 rounded-lg bg-teal-600 px-6 hover:bg-teal-700"
            disabled={submitting}
          >
            {submitting ? "در حال ایجاد..." : "ایجاد سالن"}
          </Button>
        </div>
      </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/10 p-4 md:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
