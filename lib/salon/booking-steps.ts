import type { BookingDraft } from "@/types/booking";
import type { BookingStatus } from "@/types/domain";

export const BOOKING_STEPS = [
  { id: 1, title: "انتخاب مشتری" },
  { id: 2, title: "انتخاب تاریخ" },
  { id: 3, title: "انتخاب خدمات" },
  { id: 4, title: "کنسلی/تسویه" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

/** 1–4 = active step; 5 = all steps complete (all checkmarks). */
export type BookingActiveStep = BookingStepId | 5;

export function hasCompleteServiceLine(draft: BookingDraft) {
  return draft.lines.some(
    (line) =>
      line.serviceId &&
      line.stylistId &&
      line.startTime &&
      line.reservedDurationMinutes &&
      line.reservedDurationMinutes > 0,
  );
}

export function getBookingFormActiveStep(
  draft: BookingDraft,
  mode: "create" | "edit",
): BookingActiveStep {
  if (mode === "edit") {
    return hasCompleteServiceLine(draft) ? 4 : 3;
  }

  if (!draft.customerId) return 1;
  if (!draft.bookingDate) return 2;
  if (!hasCompleteServiceLine(draft)) return 3;
  return 4;
}

export function getBookingDetailActiveStep(
  status: BookingStatus,
): BookingActiveStep {
  if (status === "completed" || status === "cancelled") return 5;
  if (status === "confirmed") return 4;
  return 3;
}
