import {
  adminSalonRecords,
  adminSalonStatusHistory,
  subscriptionHistory,
  subscriptions,
} from "@/mock_ts/admin";
import { salons } from "@/mock_ts/salon";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { formatJalaliShort } from "@/lib/format/jalali";
import type {
  AdminSalonRecord,
  AdminSalonStatusHistoryEntry,
  Salon,
  SalonStatus,
  Subscription,
  SubscriptionHistoryEntry,
  SubscriptionPaymentStatus,
} from "@/types/domain";

export type AdminSalonListItem = {
  salonId: string;
  displayCode?: string;
  ownerName: string;
  ownerMobile: string;
  subscriptionId?: string;
  createdAt: string;
  paymentStatus?: SubscriptionPaymentStatus;
  salon: Salon;
  subscription?: Subscription;
};

export type AdminSalonDetail = AdminSalonListItem & {
  lastStatusChangeAt?: string;
  lastStatusChangeBy?: string;
  lastRenewalAt?: string;
  lastRenewalBy?: string;
  statusHistory: AdminSalonStatusHistoryEntry[];
  subscriptionHistory: SubscriptionHistoryEntry[];
};

export type AdminSalonListFilters = {
  query?: string;
  status?: SalonStatus | "all";
  planName?: string | "all";
  paymentStatus?: SubscriptionPaymentStatus | "all";
};

export type AdminSalonTableRow = {
  record: AdminSalonRecord;
  salon: Salon;
  subscription?: Subscription;
  brandName: string;
  displayCode: string;
  status: SalonStatus;
  planName: string;
  subscriptionStatus: Subscription["status"];
  paymentStatus: SubscriptionPaymentStatus;
};

function buildAdminRecord(item: AdminSalonListItem): AdminSalonRecord {
  return {
    salonId: item.salonId,
    displayCode:
      item.displayCode ??
      `SAL-${item.salonId.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase()}`,
    ownerName: item.ownerName,
    ownerMobile: item.ownerMobile,
    category: item.salon.category,
    subscriptionId: item.subscriptionId ?? item.subscription?.id ?? "",
    createdAt: item.createdAt,
    paymentStatus: item.paymentStatus ?? item.subscription?.paymentStatus ?? "unpaid",
  };
}

function upsertAdminSalonListItem(item: AdminSalonListItem) {
  const salonIndex = salons.findIndex((entry) => entry.id === item.salon.id);
  if (salonIndex >= 0) salons[salonIndex] = item.salon;
  else salons.push(item.salon);

  const record = buildAdminRecord(item);
  const recordIndex = adminSalonRecords.findIndex(
    (entry) => entry.salonId === item.salonId,
  );
  if (recordIndex >= 0) {
    adminSalonRecords[recordIndex] = {
      ...adminSalonRecords[recordIndex],
      ...record,
    };
  } else {
    adminSalonRecords.push(record);
  }

  if (item.subscription) {
    const subIndex = subscriptions.findIndex(
      (entry) => entry.id === item.subscription!.id,
    );
    if (subIndex >= 0) subscriptions[subIndex] = item.subscription;
    else subscriptions.push(item.subscription);
  }
}

function syncAdminSalonDetailToMock(detail: AdminSalonDetail) {
  upsertAdminSalonListItem(detail);

  const recordIndex = adminSalonRecords.findIndex(
    (entry) => entry.salonId === detail.salonId,
  );
  if (recordIndex >= 0) {
    adminSalonRecords[recordIndex] = {
      ...adminSalonRecords[recordIndex],
      lastStatusChangeAt: detail.lastStatusChangeAt,
      lastStatusChangeBy: detail.lastStatusChangeBy,
      lastRenewalAt: detail.lastRenewalAt,
      lastRenewalBy: detail.lastRenewalBy,
    };
  }

  const remaining = adminSalonStatusHistory.filter(
    (entry) => entry.salonId !== detail.salonId,
  );
  adminSalonStatusHistory.length = 0;
  adminSalonStatusHistory.push(...remaining, ...detail.statusHistory);

  const remainingSubscriptionHistory = subscriptionHistory.filter(
    (entry) => entry.salonId !== detail.salonId,
  );
  subscriptionHistory.length = 0;
  subscriptionHistory.push(
    ...remainingSubscriptionHistory,
    ...(detail.subscriptionHistory ?? []),
  );
}

function syncAdminSalonsToMock(items: AdminSalonListItem[]) {
  salons.length = 0;
  adminSalonRecords.length = 0;
  subscriptions.length = 0;

  for (const item of items) {
    upsertAdminSalonListItem(item);
  }
}

export async function fetchAdminSalons(): Promise<AdminSalonListItem[]> {
  if (!isApiEnabled()) {
    return adminSalonListRows().map(({ record, salon, subscription }) => ({
      salonId: record.salonId,
      ownerName: record.ownerName,
      ownerMobile: record.ownerMobile,
      subscriptionId: record.subscriptionId,
      createdAt: record.createdAt,
      salon: salon!,
      subscription,
    }));
  }

  try {
    const items = await apiFetch<AdminSalonListItem[]>("/admin/salons");
    syncAdminSalonsToMock(items);
    return items;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری سالن‌ها با خطا مواجه شد", 0);
  }
}

export async function fetchAdminSalonDetail(
  salonId: string,
): Promise<AdminSalonDetail | null> {
  if (!isApiEnabled()) {
    const salon = findSalonById(salonId);
    const record = findAdminRecord(salonId);
    const subscription = record
      ? findSubscription(record.subscriptionId)
      : undefined;
    if (!salon || !record) return null;

    return {
      salonId,
      displayCode: record.displayCode,
      ownerName: record.ownerName,
      ownerMobile: record.ownerMobile,
      subscriptionId: record.subscriptionId,
      createdAt: record.createdAt,
      paymentStatus: record.paymentStatus,
      salon,
      subscription,
      lastStatusChangeAt: record.lastStatusChangeAt,
      lastStatusChangeBy: record.lastStatusChangeBy,
      lastRenewalAt: record.lastRenewalAt,
      lastRenewalBy: record.lastRenewalBy,
      statusHistory: getSalonStatusHistory(salonId),
      subscriptionHistory: getSubscriptionHistory(salonId),
    };
  }

  try {
    const detail = await apiFetch<AdminSalonDetail>(`/admin/salons/${salonId}`);
    syncAdminSalonDetailToMock(detail);
    return detail;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری جزئیات سالن با خطا مواجه شد", 0);
  }
}

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const salonStatusLabels: Record<SalonStatus, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  suspended: "تعلیق شده",
  pending: "در انتظار",
};

export const paymentStatusLabels: Record<SubscriptionPaymentStatus, string> = {
  paid: "پرداخت شده",
  unpaid: "پرداخت نشده",
};

export const subscriptionPlanFilterOptions = [
  { value: "all", label: "همه پلن‌ها" },
  { value: "پلن حرفه‌ای", label: "پلن حرفه‌ای" },
  { value: "پلن استاندارد", label: "پلن استاندارد" },
  { value: "پلن پایه", label: "پلن پایه" },
] as const;

export const salonStatusFilterOptions = [
  { value: "all", label: "همه" },
  { value: "active", label: "فعال" },
  { value: "pending", label: "در انتظار" },
  { value: "suspended", label: "تعلیق شده" },
  { value: "inactive", label: "غیرفعال" },
] as const;

export const paymentStatusFilterOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "paid", label: "پرداخت شده" },
  { value: "unpaid", label: "پرداخت نشده" },
] as const;

export const subscriptionStatusLabels: Record<Subscription["status"], string> = {
  trial: "آزمایشی",
  active: "فعال",
  expired: "منقضی",
};

export function findSalonById(salonId: string) {
  return salons.find((item) => item.id === salonId);
}

export function findAdminRecord(salonId: string) {
  return adminSalonRecords.find((item) => item.salonId === salonId);
}

export function findSubscription(subscriptionId: string) {
  return subscriptions.find((item) => item.id === subscriptionId);
}

export function adminSalonListRows(): AdminSalonTableRow[] {
  return [...adminSalonRecords]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((record) => {
      const salon = findSalonById(record.salonId);
      if (!salon) return null;
      const subscription = findSubscription(record.subscriptionId);
      return {
        record,
        salon,
        ...(subscription ? { subscription } : {}),
        brandName: salon.brandName,
        displayCode: record.displayCode,
        status: salon.status,
        planName: subscription?.planName ?? "—",
        subscriptionStatus: subscription?.status ?? "expired",
        paymentStatus: record.paymentStatus,
      } satisfies AdminSalonTableRow;
    })
    .filter((row): row is AdminSalonTableRow => row !== null);
}

export function filteredAdminSalonListRows(
  filters: AdminSalonListFilters = {},
): AdminSalonTableRow[] {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return adminSalonListRows().filter((row) => {
    if (filters.status && filters.status !== "all" && row.status !== filters.status) {
      return false;
    }
    if (
      filters.planName &&
      filters.planName !== "all" &&
      row.planName !== filters.planName
    ) {
      return false;
    }
    if (
      filters.paymentStatus &&
      filters.paymentStatus !== "all" &&
      row.paymentStatus !== filters.paymentStatus
    ) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      row.brandName,
      row.displayCode,
      row.record.ownerName,
      row.record.ownerMobile,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export const salonCategoryOptions = [
  "آرایشگاه زنانه",
  "آرایشگاه مردانه",
  "سالن VIP",
  "سالن چندمنظوره",
] as const;

export const createSalonPlanOptions = [
  "پلن پایه",
  "پلن استاندارد",
  "پلن حرفه‌ای",
] as const;

export const initialSalonStatusOptions = [
  { value: "pending", label: "در انتظار" },
  { value: "active", label: "فعال" },
] as const;

export type CreateSalonInput = {
  brandName: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  ownerName: string;
  ownerMobile: string;
  sendOtp: boolean;
  planName: string;
  startsAt: string;
  endsAt: string;
  paymentStatus: SubscriptionPaymentStatus;
  initialStatus: Extract<SalonStatus, "pending" | "active">;
};

export type AdminMutationResult =
  | { ok: true; salonId: string }
  | { ok: false; errors: string[] };

export function defaultCreateSalonDates() {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return {
    startsAt: start.toISOString().slice(0, 10),
    endsAt: end.toISOString().slice(0, 10),
  };
}

export async function createAdminSalonAsync(
  input: CreateSalonInput,
): Promise<AdminMutationResult> {
  if (!isApiEnabled()) {
    return createPlatformSalon(input);
  }

  try {
    const item = await apiFetch<AdminSalonListItem>("/admin/salons", {
      method: "POST",
      body: JSON.stringify(input),
    });
    upsertAdminSalonListItem(item);
    return { ok: true, salonId: item.salonId };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return { ok: false, errors: ["invalid_salon_data"] };
      }
      if (error.status === 409) {
        return { ok: false, errors: ["owner_mobile_duplicate"] };
      }
      return { ok: false, errors: [error.message] };
    }
    return { ok: false, errors: ["network_error"] };
  }
}

export function createPlatformSalon(input: CreateSalonInput): AdminMutationResult {
  const errors: string[] = [];
  if (!input.brandName.trim()) errors.push("brand_required");
  if (!input.category.trim()) errors.push("category_required");
  if (!input.description.trim()) errors.push("description_required");
  if (!input.phone.trim()) errors.push("phone_required");
  if (!input.address.trim()) errors.push("address_required");
  if (!input.ownerName.trim()) errors.push("owner_required");
  if (!/^09\d{9}$/.test(input.ownerMobile.trim())) errors.push("owner_mobile_invalid");
  if (!input.planName.trim()) errors.push("plan_required");
  if (!input.startsAt.trim()) errors.push("start_date_required");
  if (!input.endsAt.trim()) errors.push("end_date_required");
  if (input.startsAt > input.endsAt) errors.push("date_range_invalid");
  if (!input.paymentStatus) errors.push("payment_status_required");
  if (!input.initialStatus) errors.push("salon_status_required");

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const salonId = nextId("salon");
  const subscriptionId = nextId("sub");
  const now = new Date().toISOString();

  const salon: Salon = {
    id: salonId,
    brandName: input.brandName.trim(),
    legalName: input.brandName.trim(),
    mobile: input.phone.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    description: input.description.trim(),
    cancellationPolicy: "سیاست لغو پیش‌فرض پلتفرم",
    status: input.initialStatus,
  };

  const subscription: Subscription = {
    id: subscriptionId,
    salonId,
    planName: input.planName.trim(),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status:
      input.paymentStatus === "paid" && input.initialStatus === "active"
        ? "active"
        : "trial",
  };

  const record: AdminSalonRecord = {
    salonId,
    displayCode: `SAL-${Math.floor(1000 + Math.random() * 9000)}`,
    ownerName: input.ownerName.trim(),
    ownerMobile: input.ownerMobile.trim(),
    subscriptionId,
    createdAt: now,
    paymentStatus: input.paymentStatus,
  };

  salons.push(salon);
  subscriptions.push(subscription);
  adminSalonRecords.push(record);

  void input.sendOtp;

  return { ok: true, salonId };
}

export async function updateSalonStatusAsync(
  salonId: string,
  status: SalonStatus,
  changedBy = "ادمین پلتفرم",
): Promise<AdminMutationResult> {
  if (!isApiEnabled()) {
    return updateSalonStatus(salonId, status, changedBy);
  }

  try {
    const detail = await apiFetch<AdminSalonDetail>(
      `/admin/salons/${salonId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, changedBy }),
      },
    );
    syncAdminSalonDetailToMock(detail);
    return { ok: true, salonId };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { ok: false, errors: ["salon_not_found"] };
      if (error.status === 400) return { ok: false, errors: ["invalid_salon_data"] };
      return { ok: false, errors: [error.message] };
    }
    return { ok: false, errors: ["network_error"] };
  }
}

export function updateSalonStatus(
  salonId: string,
  status: SalonStatus,
  changedBy = "ادمین پلتفرم",
): AdminMutationResult {
  const salon = findSalonById(salonId);
  const record = findAdminRecord(salonId);
  if (!salon || !record) {
    return { ok: false, errors: ["salon_not_found"] };
  }

  const previousStatus = salon.status;
  if (previousStatus === status) {
    return { ok: true, salonId };
  }

  salon.status = status;
  const now = new Date().toISOString();
  record.lastStatusChangeAt = now;
  record.lastStatusChangeBy = changedBy;
  adminSalonStatusHistory.unshift({
    id: nextId("status_hist"),
    salonId,
    fromStatus: previousStatus,
    toStatus: status,
    changedBy,
    changedAt: now,
  });

  return { ok: true, salonId };
}

export function getSalonStatusHistory(
  salonId: string,
): AdminSalonStatusHistoryEntry[] {
  return adminSalonStatusHistory
    .filter((item) => item.salonId === salonId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

export function getSubscriptionHistory(
  salonId: string,
): SubscriptionHistoryEntry[] {
  return subscriptionHistory
    .filter((item) => item.salonId === salonId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));
}

export const subscriptionActionLabels: Record<
  SubscriptionHistoryEntry["action"],
  string
> = {
  created: "ثبت اشتراک",
  renewed: "تمدید اشتراک",
  payment_updated: "به‌روزرسانی پرداخت",
};

export type RenewSalonSubscriptionInput = {
  salonId: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  paymentStatus: SubscriptionPaymentStatus;
  renewedBy?: string;
};

export async function renewSalonSubscriptionAsync(
  input: RenewSalonSubscriptionInput,
): Promise<AdminMutationResult> {
  if (!isApiEnabled()) {
    return renewSalonSubscription(input);
  }

  try {
    const detail = await apiFetch<AdminSalonDetail>(
      `/admin/salons/${input.salonId}/subscription/renew`,
      {
        method: "POST",
        body: JSON.stringify({
          planName: input.planName,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          paymentStatus: input.paymentStatus,
          renewedBy: input.renewedBy,
        }),
      },
    );
    syncAdminSalonDetailToMock(detail);
    return { ok: true, salonId: input.salonId };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { ok: false, errors: ["salon_not_found"] };
      if (error.status === 400) return { ok: false, errors: ["invalid_salon_data"] };
      return { ok: false, errors: [error.message] };
    }
    return { ok: false, errors: ["network_error"] };
  }
}

export function renewSalonSubscription(
  input: RenewSalonSubscriptionInput,
): AdminMutationResult {
  const record = findAdminRecord(input.salonId);
  const subscription = record
    ? findSubscription(record.subscriptionId)
    : undefined;

  if (!record || !subscription) {
    return { ok: false, errors: ["salon_not_found"] };
  }
  if (!input.planName.trim()) return { ok: false, errors: ["plan_required"] };
  if (!input.startsAt.trim()) return { ok: false, errors: ["start_date_required"] };
  if (!input.endsAt.trim()) return { ok: false, errors: ["end_date_required"] };
  if (input.startsAt > input.endsAt) {
    return { ok: false, errors: ["date_range_invalid"] };
  }

  subscription.planName = input.planName.trim();
  subscription.startsAt = input.startsAt;
  subscription.endsAt = input.endsAt;
  subscription.status =
    input.paymentStatus === "paid" ? "active" : "trial";

  const now = new Date().toISOString();
  record.paymentStatus = input.paymentStatus;
  record.lastRenewalAt = now;
  record.lastRenewalBy = input.renewedBy ?? "ادمین پلتفرم";

  return { ok: true, salonId: input.salonId };
}

export async function updateSalonPaymentStatusAsync(
  salonId: string,
  paymentStatus: SubscriptionPaymentStatus,
): Promise<AdminMutationResult> {
  if (!isApiEnabled()) {
    return updateSalonPaymentStatus(salonId, paymentStatus);
  }

  try {
    const detail = await apiFetch<AdminSalonDetail>(
      `/admin/salons/${salonId}/subscription/payment`,
      {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      },
    );
    syncAdminSalonDetailToMock(detail);
    return { ok: true, salonId };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { ok: false, errors: ["salon_not_found"] };
      if (error.status === 400) return { ok: false, errors: ["invalid_salon_data"] };
      return { ok: false, errors: [error.message] };
    }
    return { ok: false, errors: ["network_error"] };
  }
}

export function updateSalonPaymentStatus(
  salonId: string,
  paymentStatus: SubscriptionPaymentStatus,
): AdminMutationResult {
  const record = findAdminRecord(salonId);
  const subscription = record
    ? findSubscription(record.subscriptionId)
    : undefined;

  if (!record || !subscription) {
    return { ok: false, errors: ["salon_not_found"] };
  }

  record.paymentStatus = paymentStatus;
  if (paymentStatus === "paid" && subscription.status !== "expired") {
    subscription.status = "active";
  }

  return { ok: true, salonId };
}

export function formatAdminDateTime(isoDateTime: string) {
  const [datePart, timePart] = isoDateTime.split("T");
  const time = timePart ? timePart.slice(0, 5).replace(":", ":") : "";
  return time
    ? `${formatJalaliShort(datePart)} - ${time}`
    : formatJalaliShort(datePart);
}

export function formatAdminMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length !== 11) return mobile;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function subscriptionExpiryCountdown(endsAt: string) {
  const end = new Date(`${endsAt}T23:59:59`);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { expired: true as const, label: "اشتراک منقضی شده است" };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return {
      expired: false as const,
      label: `(${days} روز و ${hours} ساعت تا انقضا)`,
    };
  }

  return {
    expired: false as const,
    label: `(${hours} ساعت تا انقضا)`,
  };
}

export function salonStatusBadgeClass(status: SalonStatus) {
  switch (status) {
    case "active":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "suspended":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "inactive":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function subscriptionStatusBadgeClass(status: Subscription["status"]) {
  switch (status) {
    case "active":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "trial":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "expired":
      return "border-red-200 bg-red-50 text-red-700";
  }
}

export function paymentStatusBadgeClass(status: SubscriptionPaymentStatus) {
  return status === "paid"
    ? "border-teal-200 bg-teal-50 text-teal-700"
    : "border-red-200 bg-red-50 text-red-700";
}

export const adminFormErrorMessages: Record<string, string> = {
  brand_required: "نام سالن را وارد کنید",
  category_required: "دسته‌بندی را انتخاب کنید",
  description_required: "توضیحات سالن را وارد کنید",
  phone_required: "شماره تماس سالن را وارد کنید",
  address_required: "آدرس سالن را وارد کنید",
  owner_required: "نام مدیر / مالک را وارد کنید",
  owner_mobile_invalid: "شماره موبایل معتبر نیست (۰۹xxxxxxxxx)",
  owner_mobile_duplicate: "این شماره موبایل قبلاً برای مدیر سالن دیگری ثبت شده است",
  plan_required: "پلن اشتراک را انتخاب کنید",
  start_date_required: "تاریخ شروع را انتخاب کنید",
  end_date_required: "تاریخ انقضا را انتخاب کنید",
  date_range_invalid: "تاریخ انقضا باید بعد از تاریخ شروع باشد",
  payment_status_required: "وضعیت پرداخت را انتخاب کنید",
  salon_status_required: "وضعیت اولیه سالن را انتخاب کنید",
  invalid_salon_data: "اطلاعات سالن نامعتبر است",
  network_error: "اتصال به سرور برقرار نشد",
  salon_not_found: "سالن یافت نشد",
};
