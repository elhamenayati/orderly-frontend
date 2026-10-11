import {
  adminSalonRecords,
  subscriptionHistory,
  subscriptions,
} from "@/mock_ts/admin";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { readSalonSessionUser } from "@/lib/salon/auth";
import type {
  Subscription,
  SubscriptionHistoryEntry,
} from "@/types/domain";

export type SalonSubscriptionDetail = {
  subscription?: Subscription;
  history: SubscriptionHistoryEntry[];
};

export const subscriptionActionLabels: Record<
  SubscriptionHistoryEntry["action"],
  string
> = {
  created: "ثبت اشتراک",
  renewed: "تمدید اشتراک",
  payment_updated: "به‌روزرسانی پرداخت",
};

function findCurrentSubscription(salonId: string): Subscription | undefined {
  const record = adminSalonRecords.find((entry) => entry.salonId === salonId);
  if (!record?.subscriptionId) {
    return subscriptions.find((entry) => entry.salonId === salonId);
  }
  return subscriptions.find((entry) => entry.id === record.subscriptionId);
}

function mockSalonSubscriptionDetail(): SalonSubscriptionDetail {
  const session = readSalonSessionUser();
  const salonId = session?.salonId;
  if (!salonId) {
    return { history: [] };
  }

  const subscription = findCurrentSubscription(salonId);
  const history = subscriptionHistory
    .filter((entry) => entry.salonId === salonId)
    .sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  return {
    ...(subscription ? { subscription } : {}),
    history,
  };
}

function syncSubscriptionDetailToMock(detail: SalonSubscriptionDetail) {
  const session = readSalonSessionUser();
  const salonId = session?.salonId;
  if (!salonId) return;

  if (detail.subscription) {
    const index = subscriptions.findIndex(
      (entry) => entry.id === detail.subscription!.id,
    );
    if (index >= 0) subscriptions[index] = detail.subscription;
    else subscriptions.push(detail.subscription);
  }

  const remaining = subscriptionHistory.filter(
    (entry) => entry.salonId !== salonId,
  );
  subscriptionHistory.length = 0;
  subscriptionHistory.push(...remaining, ...detail.history);
}

export async function fetchSalonSubscription(): Promise<SalonSubscriptionDetail> {
  if (!isApiEnabled()) {
    return mockSalonSubscriptionDetail();
  }

  try {
    const detail = await apiFetch<SalonSubscriptionDetail>("/salon/subscription");
    syncSubscriptionDetailToMock(detail);
    return detail;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { history: [] };
    }
    throw error;
  }
}
