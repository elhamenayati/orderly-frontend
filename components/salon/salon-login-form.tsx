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

const ABRINAK_MARK_SRC = "/images/brand/abrinak-mark-v2.png";

const LOGIN_PURPLE = "#5c3396";
const LOGIN_PURPLE_LIGHT = "#7a52b8";

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

function FormHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 text-center">
      <div
        className="mx-auto flex size-[5.4rem] items-center justify-center rounded-2xl p-3 shadow-[0_8px_24px_rgba(92,51,150,0.12)]"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Bypass Next image optimizer — it was flattening the white logo onto black. */}
        <img
          src={ABRINAK_MARK_SRC}
          alt="Abrinak"
          width={72}
          height={72}
          className="size-full object-contain"
          style={{ backgroundColor: "#ffffff" }}
        />
      </div>
      <h1 className="mt-7 text-[2rem] font-bold leading-tight text-[#1a1a2e]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-7 text-[#6b7280]">{subtitle}</p>
    </div>
  );
}

function LoginPrimaryButton({
  children,
  disabled,
  type = "submit",
  onClick,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-semibold text-white transition",
        "bg-[#5c3396] hover:bg-[#4f2b82] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {children}
    </button>
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
            "size-11 rounded-xl border bg-white text-center text-lg font-medium outline-none transition focus-visible:border-[#5c3396] focus-visible:ring-2 focus-visible:ring-[#5c3396]/20",
            hasError ? "border-destructive" : "border-[#e5e7eb]",
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

function TermsFooter() {
  return (
    <p className="mt-6 text-center text-xs leading-6 text-[#9ca3af]">
      با ورود به پنل، شما{" "}
      <span className="cursor-pointer text-[#5c3396] hover:underline">
        توافق‌نامه استفاده
      </span>{" "}
      و{" "}
      <span className="cursor-pointer text-[#5c3396] hover:underline">
        سیاست حریم خصوصی
      </span>{" "}
      را می‌پذیرید.
    </p>
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
  const canSubmitOtp = otp.length === 6 && !otpExpired && step === "otp";

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
      <div className="text-center">
        <FormHeader
          title="در حال ورود..."
          subtitle="لطفاً چند لحظه صبر کنید"
        />
        <Loader2
          className="mx-auto size-10 animate-spin"
          style={{ color: LOGIN_PURPLE }}
        />
        <div
          className="mt-6 rounded-2xl px-4 py-3 text-sm"
          style={{ backgroundColor: `${LOGIN_PURPLE}14`, color: LOGIN_PURPLE }}
        >
          <div className="flex items-start justify-center gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>
              اطلاعات شما با موفقیت تایید شد و در حال انتقال به پنل مدیریتی
              هستید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "no_access") {
    return (
      <div>
        <FormHeader
          title="دسترسی شما به سالن فعال نیست"
          subtitle="شماره موبایل واردشده به هیچ حساب سالن معتبری متصل نیست."
        />
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Info className="size-6" />
          </div>
          <div className="mt-4 w-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm">
            <span className="text-[#6b7280]">شماره موبایل شما: </span>
            <span dir="ltr" className="font-medium text-[#1a1a2e]">
              {mobile}
            </span>
          </div>
          <LoginPrimaryButton
            type="button"
            className="mt-6"
            onClick={() => window.open("tel:02191000000", "_self")}
          >
            تماس با پشتیبانی
          </LoginPrimaryButton>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-12 w-full rounded-2xl border-[#e5e7eb]"
            size="lg"
            onClick={backToMobile}
          >
            بازگشت به ورود
          </Button>
        </div>
      </div>
    );
  }

  if (step === "salon_blocked") {
    return (
      <div>
        <FormHeader
          title="حساب سالن غیرفعال است"
          subtitle="به‌دلیل مشکل در اشتراک یا تعلیق موقت، دسترسی به پنل مسدود شده است."
        />
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <TriangleAlert className="size-6" />
          </div>
          <div className="mt-4 w-full rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm">
            <span className="text-[#6b7280]">شماره موبایل شما: </span>
            <span dir="ltr" className="font-medium text-[#1a1a2e]">
              {mobile}
            </span>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-[#e5e7eb]"
              size="lg"
              onClick={backToMobile}
            >
              بازگشت
            </Button>
            <LoginPrimaryButton
              type="button"
              className="mt-0"
              onClick={() => window.open("tel:02191000000", "_self")}
            >
              تماس با پشتیبانی
            </LoginPrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div>
        <FormHeader
          title="تایید شماره موبایل"
          subtitle={`کد ارسال‌شده به ${maskMobile(mobile)} را وارد کنید`}
        />
        <button
          type="button"
          onClick={backToMobile}
          className="mb-4 flex items-center gap-1 text-sm transition hover:underline"
          style={{ color: LOGIN_PURPLE_LIGHT }}
        >
          <ArrowRight className="size-4" />
          ویرایش شماره
        </button>

        <form onSubmit={submitOtp}>
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
              otpExpired ? "text-destructive" : "text-[#6b7280]",
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
                ? "cursor-not-allowed text-[#9ca3af]"
                : "hover:underline",
            )}
            style={
              resendCooldown > 0 ? undefined : { color: LOGIN_PURPLE_LIGHT }
            }
          >
            <RefreshCw className="size-4" />
            {resendCooldown > 0
              ? `ارسال مجدد کد (${toFaDigits(String(resendCooldown))} ثانیه)`
              : "ارسال مجدد کد"}
          </button>

          <LoginPrimaryButton
            className="mt-6"
            disabled={!canSubmitOtp || isSubmitting}
          >
            {isSubmitting ? "در حال بررسی..." : "ورود به پنل"}
          </LoginPrimaryButton>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-[#9ca3af]">
          پیامک دریافت نکردید؟ پوشه تبلیغات یا اسپم را بررسی کنید.
          <br />
          {demoOtpHint}
        </p>
      </div>
    );
  }

  return (
    <div>
      <FormHeader
        title="به ابرینک خوش آمدید."
        subtitle="برای ورود به پنل، شماره تماس خود را وارد نمائید."
      />

      <form onSubmit={requestOtp}>
        <label
          className="text-sm font-semibold text-[#374151]"
          htmlFor="salon-mobile"
        >
          شماره موبایل
        </label>
        <div className="relative mt-2" dir="ltr">
          <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            id="salon-mobile"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09xxxxxxxxx"
            value={mobile}
            onChange={(event) => {
              setMobile(event.target.value.replace(/[^\d]/g, "").slice(0, 11));
              setMobileError("");
            }}
            onBlur={() => setMobileTouched(true)}
            className={cn(
              "h-14 w-full rounded-2xl border bg-white py-2 ps-10 pe-3 text-sm outline-none transition focus-visible:border-[#5c3396] focus-visible:ring-2 focus-visible:ring-[#5c3396]/20",
              mobileInvalid || mobileError
                ? "border-destructive"
                : "border-[#e5e7eb]",
            )}
          />
        </div>

        <p className="mt-2 text-xs leading-6 text-[#9ca3af]">
          کد ورود از طریق پیامک برای شما ارسال خواهد شد.
        </p>

        {mobileInvalid || mobileError ? (
          <p className="mt-2 flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {mobileError || "شماره موبایل معتبر نیست"}
          </p>
        ) : null}

        <LoginPrimaryButton
          className="mt-6"
          disabled={!canRequestOtp || isSubmitting}
        >
          {isSubmitting ? "در حال ارسال..." : "دریافت کد ورود"}
        </LoginPrimaryButton>
      </form>

      <TermsFooter />
    </div>
  );
}
