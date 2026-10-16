import { apiFetch, ApiError, isApiEnabled } from "@/lib/api/client";

export type DemoRequestPayload = {
  fullName: string;
  salonName: string;
  mobile: string;
  city?: string;
  message?: string;
};

const DEMO_STORAGE_KEY = "mahoura:demoRequests";

function storeLocalDemoRequest(payload: DemoRequestPayload) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ ...payload, createdAt: new Date().toISOString(), status: "NEW" });
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage failures in mock mode
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_full_name: "نام و نام خانوادگی معتبر نیست.",
  invalid_salon_name: "نام سالن معتبر نیست.",
  invalid_mobile: "شماره موبایل معتبر نیست.",
  invalid_request_body: "اطلاعات ارسال‌شده ناقص است.",
  failed_to_create_demo_request: "ثبت درخواست با خطا مواجه شد.",
};

export async function submitDemoRequest(payload: DemoRequestPayload) {
  if (!isApiEnabled()) {
    storeLocalDemoRequest(payload);
    return { ok: true as const };
  }

  try {
    await apiFetch("/demo-requests", {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.fullName,
        salonName: payload.salonName,
        mobile: payload.mobile,
        city: payload.city ?? null,
        message: payload.message ?? null,
      }),
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(
        ERROR_MESSAGES[error.message] ?? "ثبت درخواست با خطا مواجه شد.",
      );
    }
    throw error;
  }
}
