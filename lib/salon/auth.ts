import { ApiError, apiFetch, getApiBaseUrl } from "@/lib/api/client";
import { normalizeMobile, isValidGuestMobile } from "@/lib/booking/submit-guest";
import { salons } from "@/mock_ts/salon";
import { salonUsers } from "@/mock_ts/salon-users";
import type { SalonStatus } from "@/types/domain";

const OTP_SESSION_KEY = "mahoura:salonOtpSession";
const DEMO_OTP_CODE = "123456";
export const SALON_OTP_TTL_SECONDS = 120;
export const SALON_OTP_RESEND_COOLDOWN_SECONDS = 45;

type OtpSession = {
  mobile: string;
  expiresAt: number;
};

export type AuthVerifyResponse = {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    salonId: string;
    mobile: string;
    displayName: string;
    role: string;
    avatarPath?: string | null;
    isActive?: boolean;
  };
  salon: {
    id: string;
    brandName: string;
    legalName: string;
    mobile: string;
    status: SalonStatus;
  };
};

export function isValidSalonMobile(mobile: string) {
  return isValidGuestMobile(mobile);
}

export function maskMobile(mobile: string) {
  const normalized = normalizeMobile(mobile);
  if (normalized.length !== 11) return mobile;
  return `${normalized.slice(0, 2)}********${normalized.slice(-2)}`;
}

function readOtpSession(): OtpSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(OTP_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OtpSession;
  } catch {
    return null;
  }
}

function writeOtpSession(mobile: string) {
  const session: OtpSession = {
    mobile: normalizeMobile(mobile),
    expiresAt: Date.now() + SALON_OTP_TTL_SECONDS * 1000,
  };
  sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
}

export function clearOtpSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(OTP_SESSION_KEY);
}

export function otpSessionForMobile(mobile: string) {
  const session = readOtpSession();
  if (!session) return null;
  if (session.mobile !== normalizeMobile(mobile)) return null;
  return session;
}

export function otpRemainingSeconds(mobile: string) {
  const session = otpSessionForMobile(mobile);
  if (!session) return 0;
  return Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
}

export function isOtpExpired(mobile: string) {
  return otpRemainingSeconds(mobile) <= 0;
}

export type SendSalonOtpResult =
  | { ok: true }
  | { ok: false; error: string };

async function sendSalonOtpMock(mobile: string): Promise<SendSalonOtpResult> {
  writeOtpSession(mobile);
  return { ok: true };
}

export async function sendSalonOtp(mobile: string): Promise<SendSalonOtpResult> {
  if (!isValidSalonMobile(mobile)) {
    return { ok: false, error: "شماره موبایل معتبر نیست" };
  }

  const normalized = normalizeMobile(mobile);
  if (!getApiBaseUrl()) {
    return sendSalonOtpMock(normalized);
  }

  try {
    await apiFetch<{ ok: boolean; message: string }>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ mobile: normalized }),
    });
    writeOtpSession(normalized);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return { ok: false, error: "لطفاً قبل از ارسال مجدد چند لحظه صبر کنید" };
      }
      if (error.status === 400) {
        return { ok: false, error: "شماره موبایل معتبر نیست" };
      }
      return { ok: false, error: "ارسال کد با خطا مواجه شد" };
    }
    return { ok: false, error: "اتصال به سرور برقرار نشد" };
  }
}

export type VerifySalonOtpResult =
  | { ok: true; session: AuthVerifyResponse }
  | { ok: false; error: "invalid" | "expired" | "network" }
  | { ok: false; reason: "no_salon" | "salon_blocked" };

function resolveSalonAccessMock(mobile: string) {
  const normalized = normalizeMobile(mobile);
  const user = salonUsers.find((item) => item.mobile === normalized);
  if (!user) return { ok: false as const, reason: "no_salon" as const };

  const salon = salons.find((item) => item.id === user.salonId);
  if (!salon || salon.status === "suspended" || salon.status === "inactive" || salon.status === "pending") {
    return { ok: false as const, reason: "salon_blocked" as const };
  }

  return {
    ok: true as const,
    session: {
      token: "mock-token",
      expiresIn: 86400,
      user: {
        id: user.mobile,
        salonId: user.salonId,
        mobile: normalized,
        displayName: user.displayName,
        role: user.role,
        avatarPath: user.avatarPath ?? null,
      },
      salon: {
        id: salon.id,
        brandName: salon.brandName,
        legalName: salon.legalName,
        mobile: salon.mobile,
        status: salon.status,
      },
    } satisfies AuthVerifyResponse,
  };
}

async function verifySalonOtpMock(
  mobile: string,
  otp: string,
): Promise<VerifySalonOtpResult> {
  const session = otpSessionForMobile(mobile);
  if (!session) return { ok: false, error: "invalid" };
  if (Date.now() > session.expiresAt) return { ok: false, error: "expired" };
  if (otp.trim() !== DEMO_OTP_CODE) return { ok: false, error: "invalid" };

  const access = resolveSalonAccessMock(mobile);
  if (!access.ok) {
    return { ok: false, reason: access.reason };
  }
  return { ok: true, session: access.session };
}

export async function verifySalonOtp(
  mobile: string,
  otp: string,
): Promise<VerifySalonOtpResult> {
  if (!getApiBaseUrl()) {
    return verifySalonOtpMock(mobile, otp);
  }

  try {
    const session = await apiFetch<AuthVerifyResponse>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({
        mobile: normalizeMobile(mobile),
        code: otp.trim(),
      }),
    });
    return { ok: true, session };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        if (error.message.includes("inactive") || error.message.includes("suspended")) {
          return { ok: false, reason: "salon_blocked" };
        }
        return { ok: false, reason: "no_salon" };
      }
      if (error.status === 401) {
        return { ok: false, error: "invalid" };
      }
      if (error.status === 400) {
        return { ok: false, error: "invalid" };
      }
      return { ok: false, error: "network" };
    }
    return { ok: false, error: "network" };
  }
}

export function createSalonSession(session: AuthVerifyResponse) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("mahoura:accessToken", session.token);
  sessionStorage.setItem("mahoura:salonAuth", "1");
  sessionStorage.setItem("mahoura:salonUserId", session.user.id);
  sessionStorage.setItem("mahoura:salonUserName", session.user.displayName);
  sessionStorage.setItem("mahoura:salonBrandName", session.salon.brandName);
  sessionStorage.setItem("mahoura:salonUserMobile", session.user.mobile);
  sessionStorage.setItem("mahoura:salonUserRole", session.user.role);
  sessionStorage.setItem("mahoura:salonId", session.user.salonId);
  clearOtpSession();
}

export const demoOtpHint = `کد دمو: ${DEMO_OTP_CODE}`;

const SALON_SESSION_KEYS = [
  "mahoura:accessToken",
  "mahoura:salonAuth",
  "mahoura:salonUserId",
  "mahoura:salonUserName",
  "mahoura:salonBrandName",
  "mahoura:salonUserMobile",
  "mahoura:salonUserRole",
  "mahoura:salonId",
] as const;

export type SalonSessionUser = {
  displayName: string;
  salonBrandName: string;
  mobile: string;
  role: string;
  salonId: string;
  userId: string;
  avatarPath?: string;
};

export function updateSalonSessionBrandName(brandName: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("mahoura:salonBrandName", brandName.trim());
  window.dispatchEvent(new Event("salon-profile-updated"));
}

export function readSalonSessionUser(): SalonSessionUser | null {
  if (typeof window === "undefined") return null;

  const mobile = sessionStorage.getItem("mahoura:salonUserMobile");
  const displayName = sessionStorage.getItem("mahoura:salonUserName");
  const salonBrandName = sessionStorage.getItem("mahoura:salonBrandName");
  const salonId = sessionStorage.getItem("mahoura:salonId");
  const role = sessionStorage.getItem("mahoura:salonUserRole");
  const userId = sessionStorage.getItem("mahoura:salonUserId");
  if (!mobile || !salonId || !userId) return null;

  return {
    displayName: displayName ?? "",
    salonBrandName: salonBrandName ?? "",
    mobile,
    salonId,
    role: role ?? "",
    userId,
  };
}

export function clearSalonSession() {
  if (typeof window === "undefined") return;
  for (const key of SALON_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
  clearOtpSession();
}
