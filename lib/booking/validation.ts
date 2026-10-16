import { isLineAvailableOnSchedule } from "@/lib/booking/availability";
import {
  activeBookingsOnDate,
  flattenBookingLines,
  isBookingReadyStylist,
} from "@/lib/booking/catalog";
import {
  findConflicts,
  findDraftLineConflicts,
  type OccupiedInterval,
} from "@/lib/booking/conflicts";
import type { BookingDraft, BookingServiceDraft } from "@/types/booking";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^\d{2}:\d{2}$/;

export function validateBookingLine(
  line: BookingServiceDraft,
  bookingDate: string,
): string[] {
  const errors: string[] = [];

  if (!line.serviceId) errors.push("service_required");
  if (!line.stylistId) errors.push("stylist_required");
  if (!line.startTime || !HHMM.test(line.startTime)) {
    errors.push("start_time_required");
  }
  if (!line.reservedDurationMinutes || line.reservedDurationMinutes <= 0) {
    errors.push("duration_required");
  }
  if (line.estimatedPrice === null || line.estimatedPrice < 0) {
    errors.push("estimated_price_required");
  }

  if (line.serviceId && line.stylistId) {
    if (!isBookingReadyStylist(line.stylistId, line.serviceId, bookingDate)) {
      errors.push("stylist_not_booking_ready");
    }
  }

  if (
    line.stylistId &&
    line.startTime &&
    HHMM.test(line.startTime) &&
    line.reservedDurationMinutes &&
    line.reservedDurationMinutes > 0 &&
    ISO_DATE.test(bookingDate)
  ) {
    const onSchedule = isLineAvailableOnSchedule({
      bookingDate,
      stylistId: line.stylistId,
      startTime: line.startTime,
      reservedDurationMinutes: line.reservedDurationMinutes,
    });
    if (!onSchedule) errors.push("outside_schedule");
  }

  return errors;
}

export function validateBookingDraft(draft: BookingDraft): string[] {
  const errors: string[] = [];
  if (!draft.customerId) errors.push("customer_required");
  if (!ISO_DATE.test(draft.bookingDate)) errors.push("booking_date_required");
  if (draft.lines.length === 0) errors.push("lines_required");

  const invalidLines = draft.lines.filter(
    (line) => validateBookingLine(line, draft.bookingDate).length > 0,
  );
  if (invalidLines.length > 0) errors.push("invalid_lines");

  return errors;
}

export function isCompleteBookingLine(
  line: BookingServiceDraft,
): line is BookingServiceDraft & OccupiedInterval {
  return Boolean(
    line.serviceId &&
      line.stylistId &&
      line.startTime &&
      line.reservedDurationMinutes &&
      line.reservedDurationMinutes > 0 &&
      line.estimatedPrice !== null &&
      line.estimatedPrice >= 0,
  );
}

export function finalConflictErrors(draft: BookingDraft): string[] {
  const completeLines = draft.lines.filter(isCompleteBookingLine);

  const occupied: OccupiedInterval[] = flattenBookingLines(
    activeBookingsOnDate(draft.bookingDate, draft.bookingId),
  ).map((line) => ({
    stylistId: line.stylistId,
    startTime: line.startTime,
    reservedDurationMinutes: line.reservedDurationMinutes,
  }));

  const errors: string[] = [];

  for (const line of completeLines) {
    if (findConflicts(line, occupied).length > 0) {
      errors.push(`existing_conflict:${line.clientId}`);
    }
  }

  for (const [left, right] of findDraftLineConflicts(completeLines)) {
    errors.push(
      `draft_conflict:${completeLines[left].clientId}:${completeLines[right].clientId}`,
    );
  }

  return errors;
}
