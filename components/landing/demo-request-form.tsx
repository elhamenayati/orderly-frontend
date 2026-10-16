"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { submitDemoRequest } from "@/lib/landing/demo-request";
import { isValidGuestMobile, normalizeMobile } from "@/lib/booking/submit-guest";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type FormState = {
  fullName: string;
  salonName: string;
  mobile: string;
  city: string;
  message: string;
};

const INITIAL: FormState = {
  fullName: "",
  salonName: "",
  mobile: "",
  city: "",
  message: "",
};

export function DemoRequestForm({ className }: { className?: string }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.fullName.trim().length < 2) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    if (form.salonName.trim().length < 2) {
      setError("نام سالن را وارد کنید.");
      return;
    }
    if (!isValidGuestMobile(form.mobile)) {
      setError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۱۲۳۴۵۶۷).");
      return;
    }

    setSubmitting(true);
    try {
      await submitDemoRequest({
        fullName: form.fullName.trim(),
        salonName: form.salonName.trim(),
        mobile: normalizeMobile(form.mobile),
        city: form.city.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      setSuccess(true);
      setForm(INITIAL);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ثبت درخواست با خطا مواجه شد. دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center",
          className,
        )}
        role="status"
      >
        <p className="text-base font-semibold text-emerald-900">
          درخواست شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم.
        </p>
        <Button
          type="button"
          variant="outline"
          size="salon"
          className="mt-5"
          onClick={() => setSuccess(false)}
        >
          ثبت درخواست دیگر
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6", className)}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">نام و نام خانوادگی</span>
          <input
            required
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            className={fieldClassName}
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">نام سالن</span>
          <input
            required
            value={form.salonName}
            onChange={(event) => update("salonName", event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">شماره موبایل</span>
          <input
            required
            value={form.mobile}
            onChange={(event) => update("mobile", event.target.value)}
            className={fieldClassName}
            inputMode="tel"
            dir="ltr"
            placeholder="0912xxxxxxx"
            autoComplete="tel"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">
            شهر <span className="text-muted-foreground">(اختیاری)</span>
          </span>
          <input
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">
          توضیحات <span className="text-muted-foreground">(اختیاری)</span>
        </span>
        <textarea
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="salon" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? "در حال ثبت..." : "ثبت درخواست دمو"}
      </Button>
    </form>
  );
}
