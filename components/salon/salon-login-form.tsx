"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Info,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { OrderlyLogo } from "@/components/icons/orderly-logo";
import { Button } from "@/components/ui/button";
import { toFaDigits } from "@/lib/format/number";
import {
  createSalonSession,
  demoOtpHint,
  isValidSalonMobile,
  maskMobile,
  otpRemainingSeconds,
  SALON_OTP_RESEND_COOLDOWN_SECONDS,
  sendSalonOtp,
  verifySalonOtp,
} from "@/lib/salon/auth";
import { cn } from "@/lib/utils";

type LoginStep =
  | "mobile"
  | "otp"
  | "no_access"
  | "salon_blocked"
  | "loading";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const raw = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return toFaDigits(raw);
}

function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/95 p-6 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AuthBranding() {
  return (
    <div className="mb-6 text-center">
      <OrderlyLogo className="mx-auto h-[4.25rem]" priority />
      <h1 className="mt-4 text-lg font-semibold">پنل مدیریت سالن</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        مدیریت آسان سالن، نوبت‌ها و خدمات
      </p>
    </div>
  );
}

function OtpInputs({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (next: string) => void;
  hasError: boolean;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const focusIndex = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const applyDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join("").slice(0, 6));
  };

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          aria-label={`رقم ${index + 1}`}
          className={cn(
            "size-11 rounded-xl border bg-background text-center text-lg font-medium outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
            hasError ? "border-destructive" : "border-input",
          )}
          onChange={(event) => {
            const nextChar = event.target.value.replace(/\D/g, "").slice(-1);
            const next = [...digits];
            next[index] = nextChar;
            applyDigits(next);
            if (nextChar && index < 5) focusIndex(index + 1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              focusIndex(index - 1);
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);
            if (!pasted) return;
            applyDigits(pasted.split("").concat(Array(6).fill("")).slice(0, 6));
            focusIndex(Math.min(pasted.length, 5));
          }}
        />
      ))}
    </div>
  );
}

export function SalonLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncOtpTimer = useCallback(() => {
    setOtpSecondsLeft(otpRemainingSeconds(mobile));
  }, [mobile]);

  useEffect(() => {
    if (step !== "otp") return;
    syncOtpTimer();
    const interval = window.setInterval(syncOtpTimer, 1000);
    return () => window.clearInterval(interval);
  }, [step, syncOtpTimer]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== "loading") return;
    const timeout = window.setTimeout(() => {
      router.push("/salon/bookings");
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [step, router]);

  const mobileInvalid =
    mobileTouched && mobile.length > 0 && !isValidSalonMobile(mobile);
  const canRequestOtp = isValidSalonMobile(mobile);
  const otpExpired = step === "otp" && otpSecondsLeft <= 0;
  const canSubmitOtp =
    otp.length === 6 && !otpExpired && step === "otp";

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    setMobileTouched(true);
    if (!isValidSalonMobile(mobile)) {
      setMobileError("شماره موبایل معتبر نیست");
      return;
    }
    setIsSubmitting(true);
    const result = await sendSalonOtp(mobile);
    setIsSubmitting(false);
    if (!result.ok) {
      setMobileError(result.error);
      return;
    }
    setMobileError("");
    setOtp("");
    setOtpError("");
    setResendCooldown(0);
    setStep("otp");
    syncOtpTimer();
  }

  async function resendOtp() {
    if (resendCooldown > 0 || !isValidSalonMobile(mobile) || isSubmitting) return;
    setIsSubmitting(true);
    const result = await sendSalonOtp(mobile);
    setIsSubmitting(false);
    if (!result.ok) {
      setOtpError(result.error);
      return;
    }
    setOtp("");
    setOtpError("");
    setResendCooldown(SALON_OTP_RESEND_COOLDOWN_SECONDS);
    syncOtpTimer();
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmitOtp || isSubmitting) return;

    setIsSubmitting(true);
    const result = await verifySalonOtp(mobile, otp);
    setIsSubmitting(false);

    if (!result.ok) {
      if ("error" in result) {
        setOtpError("کد وارد‌شده صحیح نیست یا منقضی شده است");
        return;
      }
      if (result.reason === "no_salon") {
        setStep("no_access");
        return;
      }
      setStep("salon_blocked");
      return;
    }

    createSalonSession(result.session);
    setStep("loading");
  }

  function backToMobile() {
    setStep("mobile");
    setOtp("");
    setOtpError("");
  }

  if (step === "loading") {
    return (
      <AuthCard className="text-center">
        <AuthBranding />
        <Loader2 className="mx-auto size-10 animate-spin text-primary" />
        <p className="mt-4 font-medium">در حال ورود به پنل سالن...</p>
        <p className="mt-1 text-sm text-muted-foreground">
          لطفاً چند لحظه صبر کنید
        </p>
        <div className="mt-6 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="flex items-start justify-center gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              اطلاعات شما با موفقیت تایید شد و در حال انتقال به پنل مدیریتی
              هستید.
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (step === "no_access") {
    return (
      <AuthCard>
        <AuthBranding />
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Info className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold">
            دسترسی شما به سالن فعال نیست
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            شماره موبایل واردشده به هیچ حساب سالن معتبری متصل نیست. برای ایجاد
            حساب جدید یا فعال‌سازی دسترسی با پشتیبانی تماس بگیرید.
          </p>
          <div className="mt-4 w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">شماره موبایل شما: </span>
            <span dir="ltr" className="font-medium">
              {mobile}
            </span>
          </div>
          <Button
            type="button"
            className="mt-4 h-11 w-full rounded-xl"
            size="lg"
            onClick={() => window.open("tel:02191000000", "_self")}
          >
            تماس با پشتیبانی
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-11 w-full rounded-xl"
            size="lg"
            onClick={backToMobile}
          >
            بازگشت به ورود
          </Button>
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            تیم پشتیبانی در ساعات کاری پاسخگو است
          </p>
        </div>
      </AuthCard>
    );
  }

  if (step === "salon_blocked") {
    return (
      <AuthCard>
        <AuthBranding />
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <TriangleAlert className="size-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold">
            حساب سالن غیرفعال یا تعلیق شده است
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            به‌دلیل مشکل در اشتراک یا تعلیق موقت، دسترسی به پنل مسدود شده است.
            برای رفع مشکل با مالک سالن یا پشتیبانی تماس بگیرید.
          </p>
          <div className="mt-4 w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">شماره موبایل شما: </span>
            <span dir="ltr" className="font-medium">
              {mobile}
            </span>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              size="lg"
              onClick={backToMobile}
            >
              بازگشت
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl"
              size="lg"
              onClick={() => window.open("tel:02191000000", "_self")}
            >
              تماس با پشتیبانی
            </Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            پس از رفع مشکل می‌توانید دوباره وارد شوید
          </p>
        </div>
      </AuthCard>
    );
  }

  if (step === "otp") {
    return (
      <AuthCard>
        <AuthBranding />
        <button
          type="button"
          onClick={backToMobile}
          className="mb-4 flex items-center gap-1 text-sm text-primary transition hover:underline"
        >
          <ArrowRight className="size-4" />
          ویرایش شماره
        </button>
        <h2 className="text-base font-semibold">تایید شماره موبایل</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          کد ارسال‌شده به{" "}
          <span dir="ltr" className="font-medium text-foreground">
            {maskMobile(mobile)}
          </span>{" "}
          را وارد کنید
        </p>

        <form onSubmit={submitOtp} className="mt-6">
          <OtpInputs
            value={otp}
            onChange={(next) => {
              setOtp(next);
              setOtpError("");
            }}
            hasError={Boolean(otpError)}
          />

          {otpError ? (
            <p className="mt-3 flex items-center justify-center gap-1 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {otpError}
            </p>
          ) : null}

          <div
            className={cn(
              "mt-4 flex items-center justify-center gap-1 text-sm",
              otpExpired ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Clock className="size-4 shrink-0" />
            {otpExpired ? (
              <span>تا {formatCountdown(0)} دیگر معتبر است</span>
            ) : (
              <span>تا {formatCountdown(otpSecondsLeft)} دیگر معتبر است</span>
            )}
          </div>

          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={resendOtp}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-1 text-sm transition",
              resendCooldown > 0
                ? "cursor-not-allowed text-muted-foreground"
                : "text-primary hover:underline",
            )}
          >
            <RefreshCw className="size-4" />
            {resendCooldown > 0
              ? `ارسال مجدد کد (${toFaDigits(String(resendCooldown))} ثانیه)`
              : "ارسال مجدد کد"}
          </button>

          <Button
            type="submit"
            className="mt-6 h-11 w-full rounded-xl"
            size="lg"
            disabled={!canSubmitOtp || isSubmitting}
          >
            {isSubmitting ? "در حال بررسی..." : "ورود به پنل"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          پیامک دریافت نکردید؟ پوشه تبلیغات یا اسپم را بررسی کنید.
          <br />
          {demoOtpHint}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthBranding />
      <h2 className="text-base font-semibold">ورود به پنل</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        برای دریافت کد ورود، شماره موبایل خود را وارد کنید
      </p>

      <form onSubmit={requestOtp} className="mt-6">
        <label className="text-sm font-medium" htmlFor="salon-mobile">
          شماره موبایل
        </label>
        <div className="relative mt-2">
          <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="salon-mobile"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09xxxxxxxxx"
            dir="ltr"
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value.replace(/[^\d]/g, "").slice(0, 11));
              setMobileError("");
            }}
            onBlur={() => setMobileTouched(true)}
            className={cn(
              "h-11 w-full rounded-xl border bg-background py-2 ps-10 pe-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
              mobileInvalid || mobileError
                ? "border-destructive"
                : "border-input",
            )}
          />
        </div>
        {mobileInvalid || mobileError ? (
          <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {mobileError || "شماره موبایل معتبر نیست"}
          </p>
        ) : null}

        <Button
          type="submit"
          className="mt-6 h-11 w-full rounded-xl"
          size="lg"
          disabled={!canRequestOtp || isSubmitting}
        >
          {isSubmitting ? "در حال ارسال..." : "دریافت کد ورود"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        با ورود، شرایط استفاده و سیاست حریم خصوصی را می‌پذیرید.
      </p>
    </AuthCard>
  );
}
