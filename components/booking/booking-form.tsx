"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { env } from "@/config/env";
import {
  createEmptyLine,
  lineErrorMessages,
  recheckAllLines,
} from "@/lib/booking/line-utils";
import {
  isValidGuestMobile,
  submitGuestBooking,
} from "@/lib/booking/submit-guest";
import { validateBookingDraft } from "@/lib/booking/validation";
import { salon } from "@/lib/salon/public-data";
import type { BookingDraft } from "@/types/booking";
import { BookingLineEditor, WizardStepHeader } from "@/components/booking/booking-line-editor";
import { BookingSummary } from "@/components/booking/booking-summary";
import { Button } from "@/components/ui/button";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { LotusLogo } from "@/components/icons/lotus-logo";

type WizardStep = "services" | "guest" | "review";

const WIZARD_STEPS = ["خدمات", "اطلاعات", "بررسی"];

function isoDateFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIso() {
  return isoDateFromDate(new Date());
}

function defaultBookingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDateFromDate(date);
}

const guestErrorMessages: Record<string, string> = {
  guest_name_required: "نام و نام خانوادگی را وارد کنید",
  guest_mobile_invalid: "شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید",
  customer_required: "اطلاعات مهمان کامل نیست",
  booking_date_required: "تاریخ نوبت معتبر نیست",
  lines_required: "حداقل یک خدمت اضافه کنید",
  invalid_lines: "برخی خدمات ناقص یا نامعتبر هستند",
};

export function BookingForm() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("services");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    customerId: null,
    bookingDate: defaultBookingDate(),
    notes: "",
    lines: [createEmptyLine()],
  }));

  const stepIndex = step === "services" ? 0 : step === "guest" ? 1 : 2;

  const checkedDraft = useMemo(() => recheckAllLines(draft), [draft]);

  function updateDraft(next: BookingDraft) {
    setDraft(recheckAllLines(next));
  }

  function updateLine(clientId: string, line: BookingDraft["lines"][number]) {
    updateDraft({
      ...draft,
      lines: draft.lines.map((item) =>
        item.clientId === clientId ? line : item,
      ),
    });
  }

  function addLine() {
    updateDraft({
      ...draft,
      lines: [...draft.lines, createEmptyLine(`line-${crypto.randomUUID()}`)],
    });
  }

  function removeLine(clientId: string) {
    updateDraft({
      ...draft,
      lines: draft.lines.filter((item) => item.clientId !== clientId),
    });
  }

  function goToGuestStep() {
    const nextDraft = recheckAllLines(draft);
    setDraft(nextDraft);
    const errors = validateBookingDraft({
      ...nextDraft,
      customerId: "pending",
    }).filter((code) => code !== "customer_required");

    const lineErrors = nextDraft.lines.some(
      (line) =>
        line.availability === "conflict" ||
        line.errors.length > 0 ||
        line.availability !== "available",
    );

    if (errors.length > 0 || lineErrors) {
      setFormError(
        lineErrors
          ? "لطفاً همه خدمات را کامل کنید و زمان بدون تداخل انتخاب کنید"
          : "لطفاً اطلاعات خدمات را کامل کنید",
      );
      return;
    }

    setFormError(null);
    setStep("guest");
  }

  function goToReviewStep() {
    if (!guestName.trim()) {
      setFormError(guestErrorMessages.guest_name_required);
      return;
    }
    if (!isValidGuestMobile(guestMobile)) {
      setFormError(guestErrorMessages.guest_mobile_invalid);
      return;
    }

    setFormError(null);
    setStep("review");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError(null);

    const result = submitGuestBooking({
      draft: checkedDraft,
      guestName,
      guestMobile,
    });

    setSubmitting(false);

    if (!result.ok) {
      const message =
        result.errors
          .map((code) => guestErrorMessages[code] ?? lineErrorMessages[code] ?? code)
          .join(" · ") || "ثبت نوبت ناموفق بود";
      setFormError(message);
      return;
    }

    sessionStorage.setItem("mahoura:lastBookingId", result.bookingId);
    if (result.mockSmsSent) {
      sessionStorage.setItem("mahoura:mockSmsSent", "1");
    } else {
      sessionStorage.removeItem("mahoura:mockSmsSent");
    }

    router.push(`/book/success?bookingId=${encodeURIComponent(result.bookingId)}`);
  }

  if (!env.enableCustomerBooking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">رزرو آنلاین در حال حاضر غیرفعال است.</p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4 rounded-xl">
          بازگشت به سالن
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Button
            render={<Link href="/" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            aria-label="بازگشت"
          >
            <ArrowRight className="size-5" />
          </Button>
          <LotusLogo className="size-7 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">رزرو نوبت</p>
            <p className="truncate text-xs text-muted-foreground">{salon.brandName}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
        <WizardStepHeader current={stepIndex} steps={WIZARD_STEPS} />

        {step === "services" ? (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">تاریخ نوبت</span>
              <JalaliDateInput
                value={draft.bookingDate}
                minDate={todayIso()}
                onChange={(bookingDate) =>
                  updateDraft({ ...draft, bookingDate })
                }
                format="dddd DD MMMM YYYY"
                placeholder="انتخاب تاریخ نوبت"
              />
            </label>

            <div className="space-y-3">
              {checkedDraft.lines.map((line, index) => (
                <BookingLineEditor
                  key={line.clientId}
                  line={line}
                  lineIndex={index}
                  draft={checkedDraft}
                  canRemove={checkedDraft.lines.length > 1}
                  onChange={(next) => updateLine(line.clientId, next)}
                  onRemove={() => removeLine(line.clientId)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={addLine}
            >
              <Plus className="size-4" />
              افزودن خدمت دیگر
            </Button>
          </div>
        ) : null}

        {step === "guest" ? (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">نام و نام خانوادگی</span>
              <input
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="مثلاً مینا احمدی"
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">شماره موبایل</span>
              <input
                type="tel"
                value={guestMobile}
                onChange={(event) => setGuestMobile(event.target.value)}
                placeholder="09123456789"
                dir="ltr"
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
              />
            </label>
          </div>
        ) : null}

        {step === "review" ? (
          <BookingSummary
            draft={checkedDraft}
            guestName={guestName}
            guestMobile={guestMobile}
            showGuest
            showPolicy
          />
        ) : null}

        {formError ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          {step !== "services" ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-xl"
              onClick={() =>
                setStep(step === "review" ? "guest" : "services")
              }
            >
              قبلی
            </Button>
          ) : null}

          {step === "services" ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-xl"
              onClick={goToGuestStep}
            >
              ادامه
            </Button>
          ) : null}

          {step === "guest" ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-xl"
              onClick={goToReviewStep}
            >
              ادامه
            </Button>
          ) : null}

          {step === "review" ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-xl"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "در حال ثبت..." : "تأیید و ثبت نوبت"}
            </Button>
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {env.appName} · {salon.brandName}
        </p>
      </div>
    </div>
  );
}
