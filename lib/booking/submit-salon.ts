import { allocateBookingDisplayCode } from "@/lib/booking/display-code";
import { normalizeDraftForSubmit } from "@/lib/booking/line-utils";
import { finalConflictErrors, validateBookingDraft } from "@/lib/booking/validation";
import { findBookingById } from "@/lib/booking/submit-guest";
import {
  cancelBookingAsync,
  checkoutBookingAsync,
  createBookingAsync,
  updateBookingAsync,
} from "@/lib/salon/bookings";
import { ApiError, isApiEnabled } from "@/lib/api/client";
import { sendBookingCancellationNotification } from "@/lib/salon/notifications";
import { bookings } from "@/mock_ts/bookings";
import { paymentTransactions } from "@/mock_ts/transactions";
import { salon } from "@/mock_ts/salon";
import type { BookingDraft, BookingPersistPayload } from "@/types/booking";
import type {
  Booking,
  BookingService,
  BookingStatus,
  PaymentTransaction,
} from "@/types/domain";

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function buildServicesFromDraft(
  draft: BookingDraft,
  bookingId: string,
): BookingService[] {
  return draft.lines.map((line) => ({
    id: line.persistedId ?? nextId("bks"),
    bookingId,
    serviceId: line.serviceId!,
    stylistId: line.stylistId!,
    startTime: line.startTime!,
    reservedDurationMinutes: line.reservedDurationMinutes!,
    estimatedPrice: line.estimatedPrice!,
    finalActualAmount: null,
  }));
}

export const salonSubmitErrorMessages: Record<string, string> = {
  customer_required: "مشتری را انتخاب کنید",
  booking_date_required: "تاریخ نوبت معتبر نیست",
  lines_required: "حداقل یک خدمت اضافه کنید",
  invalid_lines: "برخی خدمات ناقص یا نامعتبر هستند",
  booking_not_found: "نوبت یافت نشد",
  booking_not_editable: "این نوبت قابل ویرایش نیست",
  booking_not_cancellable: "این نوبت قابل لغو نیست",
  booking_not_checkout: "این نوبت آماده تسویه نیست",
  line_amounts_required: "مبلغ نهایی همه خدمات را وارد کنید",
  invalid_line_amount: "مبلغ نهایی نامعتبر است",
  booking_conflict: "زمان انتخاب‌شده با رزرو دیگری تداخل دارد",
  existing_conflict: "زمان انتخاب‌شده با رزرو دیگری تداخل دارد",
  draft_conflict: "زمان خدمات انتخاب‌شده با یکدیگر تداخل دارند",
  submit_failed: "ثبت رزرو با خطا مواجه شد",
};

export type SalonSubmitResult =
  | { ok: true; bookingId: string }
  | { ok: false; errors: string[] };

function assertEditableStatus(status: BookingStatus) {
  return status === "confirmed" || status === "draft";
}

function buildPersistPayload(draft: BookingDraft): BookingPersistPayload {
  return {
    customerId: draft.customerId!,
    bookingDate: draft.bookingDate,
    notes: draft.notes,
    services: draft.lines.map((line) => ({
      id: line.persistedId,
      serviceId: line.serviceId!,
      stylistId: line.stylistId!,
      startTime: line.startTime!,
      reservedDurationMinutes: line.reservedDurationMinutes!,
      estimatedPrice: line.estimatedPrice!,
    })),
  };
}

function validateDraftForSubmit(draft: BookingDraft): string[] {
  const normalized = normalizeDraftForSubmit(draft);
  const errors: string[] = [];
  errors.push(...validateBookingDraft(normalized));
  errors.push(...finalConflictErrors(normalized));
  return [...new Set(errors)];
}

export function submitSalonBooking(input: {
  draft: BookingDraft;
}): SalonSubmitResult {
  const draft = normalizeDraftForSubmit(input.draft);
  const errors = validateDraftForSubmit(draft);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const bookingId = nextId("bk");
  const now = new Date().toISOString();

  const booking: Booking = {
    id: bookingId,
    salonId: salon.id,
    customerId: draft.customerId!,
    displayCode: allocateBookingDisplayCode(salon.id, now),
    bookingDate: draft.bookingDate,
    status: "confirmed",
    source: "salon",
    notes: draft.notes || undefined,
    createdAt: now,
    updatedAt: now,
    services: buildServicesFromDraft(draft, bookingId),
  };

  bookings.push(booking);
  return { ok: true, bookingId };
}

export async function submitSalonBookingAsync(input: {
  draft: BookingDraft;
}): Promise<SalonSubmitResult> {
  const draft = normalizeDraftForSubmit(input.draft);
  const errors = validateDraftForSubmit(draft);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (isApiEnabled()) {
    try {
      const booking = await createBookingAsync(buildPersistPayload(draft));
      return { ok: true, bookingId: booking.id };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          return { ok: false, errors: ["booking_conflict"] };
        }
        if (error.status === 400) {
          return { ok: false, errors: ["invalid_lines"] };
        }
      }
      return { ok: false, errors: ["submit_failed"] };
    }
  }

  return submitSalonBooking({ draft });
}

export function updateSalonBooking(input: {
  draft: BookingDraft;
}): SalonSubmitResult {
  if (!input.draft.bookingId) {
    return { ok: false, errors: ["booking_not_found"] };
  }

  const booking = findBookingById(input.draft.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (!assertEditableStatus(booking.status)) {
    return { ok: false, errors: ["booking_not_editable"] };
  }

  const draft = normalizeDraftForSubmit(input.draft);
  const errors = validateDraftForSubmit(draft);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  booking.customerId = draft.customerId!;
  booking.bookingDate = draft.bookingDate;
  booking.notes = draft.notes || undefined;
  booking.updatedAt = new Date().toISOString();
  booking.services = buildServicesFromDraft(draft, booking.id);

  return { ok: true, bookingId: booking.id };
}

export async function updateSalonBookingAsync(input: {
  draft: BookingDraft;
}): Promise<SalonSubmitResult> {
  if (!input.draft.bookingId) {
    return { ok: false, errors: ["booking_not_found"] };
  }

  const booking = findBookingById(input.draft.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (!assertEditableStatus(booking.status)) {
    return { ok: false, errors: ["booking_not_editable"] };
  }

  const draft = normalizeDraftForSubmit(input.draft);
  const errors = validateDraftForSubmit(draft);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (isApiEnabled()) {
    try {
      const updated = await updateBookingAsync(
        input.draft.bookingId,
        buildPersistPayload(draft),
      );
      return { ok: true, bookingId: updated.id };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { ok: false, errors: ["booking_not_found"] };
        }
        if (error.status === 409) {
          return { ok: false, errors: ["booking_conflict"] };
        }
        if (error.status === 400) {
          return { ok: false, errors: ["invalid_lines"] };
        }
      }
      return { ok: false, errors: ["submit_failed"] };
    }
  }

  return updateSalonBooking(input);
}

export function cancelSalonBooking(input: {
  bookingId: string;
  reason?: string;
  cancelledBy?: "salon" | "guest";
}): SalonSubmitResult {
  const booking = findBookingById(input.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, errors: ["booking_not_cancellable"] };
  }

  const now = new Date().toISOString();
  booking.status = "cancelled";
  booking.cancellationReason = input.reason?.trim() || "لغو توسط سالن";
  booking.cancelledBy = input.cancelledBy ?? "salon";
  booking.cancelledAt = now;
  booking.updatedAt = now;

  sendBookingCancellationNotification({
    bookingId: booking.id,
    customerId: booking.customerId,
  });

  return { ok: true, bookingId: booking.id };
}

export async function cancelSalonBookingAsync(input: {
  bookingId: string;
  reason?: string;
  cancelledBy?: "salon" | "guest";
}): Promise<SalonSubmitResult> {
  const booking = findBookingById(input.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, errors: ["booking_not_cancellable"] };
  }

  if (isApiEnabled()) {
    try {
      const updated = await cancelBookingAsync(input.bookingId, {
        reason: input.reason,
        cancelledBy: input.cancelledBy,
      });
      sendBookingCancellationNotification({
        bookingId: updated.id,
        customerId: updated.customerId,
      });
      return { ok: true, bookingId: updated.id };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { ok: false, errors: ["booking_not_found"] };
        }
        if (error.status === 409) {
          return { ok: false, errors: ["booking_not_cancellable"] };
        }
      }
      return { ok: false, errors: ["submit_failed"] };
    }
  }

  return cancelSalonBooking(input);
}

export type CheckoutLineInput = {
  serviceLineId: string;
  finalActualAmount: number;
};

export function checkoutSalonBooking(input: {
  bookingId: string;
  lines: CheckoutLineInput[];
  paymentKind: PaymentTransaction["kind"];
  note?: string;
}): SalonSubmitResult {
  const booking = findBookingById(input.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, errors: ["booking_not_checkout"] };
  }

  if (input.lines.length !== booking.services.length) {
    return { ok: false, errors: ["line_amounts_required"] };
  }

  const errors: string[] = [];
  let total = 0;

  for (const lineInput of input.lines) {
    const serviceLine = booking.services.find(
      (item) => item.id === lineInput.serviceLineId,
    );
    if (!serviceLine) {
      errors.push("line_amounts_required");
      continue;
    }
    if (
      !Number.isFinite(lineInput.finalActualAmount) ||
      lineInput.finalActualAmount < 0
    ) {
      errors.push("invalid_line_amount");
      continue;
    }
    serviceLine.finalActualAmount = lineInput.finalActualAmount;
    total += lineInput.finalActualAmount;
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  const now = new Date().toISOString();
  booking.status = "completed";
  booking.updatedAt = now;

  const transaction: PaymentTransaction = {
    id: nextId("txn"),
    salonId: salon.id,
    bookingId: booking.id,
    direction: "inflow",
    kind: input.paymentKind,
    amount: total,
    occurredAt: now,
    note: input.note || "تسویه نوبت",
  };

  paymentTransactions.push(transaction);

  return { ok: true, bookingId: booking.id };
}

export async function checkoutSalonBookingAsync(input: {
  bookingId: string;
  lines: CheckoutLineInput[];
  paymentKind: PaymentTransaction["kind"];
  note?: string;
}): Promise<SalonSubmitResult> {
  const booking = findBookingById(input.bookingId);
  if (!booking) {
    return { ok: false, errors: ["booking_not_found"] };
  }
  if (booking.status !== "confirmed") {
    return { ok: false, errors: ["booking_not_checkout"] };
  }

  if (input.lines.length !== booking.services.length) {
    return { ok: false, errors: ["line_amounts_required"] };
  }

  const errors: string[] = [];
  for (const lineInput of input.lines) {
    const serviceLine = booking.services.find(
      (item) => item.id === lineInput.serviceLineId,
    );
    if (!serviceLine) {
      errors.push("line_amounts_required");
      continue;
    }
    if (
      !Number.isFinite(lineInput.finalActualAmount) ||
      lineInput.finalActualAmount < 0
    ) {
      errors.push("invalid_line_amount");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  if (isApiEnabled()) {
    try {
      const result = await checkoutBookingAsync(input.bookingId, {
        lines: input.lines,
        paymentKind: input.paymentKind,
        note: input.note,
      });
      return { ok: true, bookingId: result.booking.id };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          return { ok: false, errors: ["booking_not_found"] };
        }
        if (error.status === 409) {
          return { ok: false, errors: ["booking_not_checkout"] };
        }
        if (error.status === 400) {
          return { ok: false, errors: ["invalid_line_amount"] };
        }
      }
      return { ok: false, errors: ["submit_failed"] };
    }
  }

  return checkoutSalonBooking(input);
}
