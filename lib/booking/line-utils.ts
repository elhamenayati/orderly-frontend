import { isLineAvailableOnSchedule } from "@/lib/booking/availability";
import {
  activeBookingsOnDate,
  flattenBookingLines,
  snapshotLineFromCatalog,
} from "@/lib/booking/catalog";
import {
  findConflicts,
  findDraftLineConflicts,
  type OccupiedInterval,
} from "@/lib/booking/conflicts";
import { validateBookingLine } from "@/lib/booking/validation";
import type { BookingDraft, BookingServiceDraft } from "@/types/booking";

export function createEmptyLine(clientId = "line-initial"): BookingServiceDraft {
  return {
    clientId,
    serviceId: null,
    stylistId: null,
    startTime: null,
    reservedDurationMinutes: null,
    estimatedPrice: null,
    availability: "unchecked",
    errors: [],
  };
}

export function recheckLineAvailability(
  line: BookingServiceDraft,
  draft: BookingDraft,
): BookingServiceDraft {
  const errors = validateBookingLine(line, draft.bookingDate);
  if (errors.length > 0) {
    return { ...line, availability: "unchecked", errors };
  }

  if (
    !line.stylistId ||
    !line.startTime ||
    !line.reservedDurationMinutes
  ) {
    return { ...line, availability: "unchecked", errors };
  }

  const onSchedule = isLineAvailableOnSchedule({
    bookingDate: draft.bookingDate,
    stylistId: line.stylistId,
    startTime: line.startTime,
    reservedDurationMinutes: line.reservedDurationMinutes,
  });

  if (!onSchedule) {
    return {
      ...line,
      availability: "conflict",
      errors: [...errors, "outside_schedule"],
    };
  }

  const occupied = flattenBookingLines(
    activeBookingsOnDate(draft.bookingDate, draft.bookingId),
  ).map((item) => ({
    stylistId: item.stylistId,
    startTime: item.startTime,
    reservedDurationMinutes: item.reservedDurationMinutes,
  }));

  const otherLines = draft.lines
    .filter((item) => item.clientId !== line.clientId)
    .filter(
      (item): item is BookingServiceDraft & OccupiedInterval =>
        Boolean(
          item.stylistId &&
            item.startTime &&
            item.reservedDurationMinutes &&
            item.reservedDurationMinutes > 0,
        ),
    );

  const candidate: OccupiedInterval = {
    stylistId: line.stylistId,
    startTime: line.startTime,
    reservedDurationMinutes: line.reservedDurationMinutes,
  };

  const hasConflict =
    findConflicts(candidate, occupied).length > 0 ||
    findConflicts(candidate, otherLines).length > 0;

  return {
    ...line,
    availability: hasConflict ? "conflict" : "available",
    errors: hasConflict ? [...errors, "time_conflict"] : errors,
  };
}

export function updateLineService(
  line: BookingServiceDraft,
  serviceId: string | null,
): BookingServiceDraft {
  return {
    ...line,
    serviceId,
    stylistId: null,
    startTime: null,
    reservedDurationMinutes: null,
    estimatedPrice: null,
    availability: "unchecked",
    errors: [],
  };
}

export function updateLineStylist(
  line: BookingServiceDraft,
  serviceId: string,
  stylistId: string | null,
): BookingServiceDraft {
  if (!stylistId) {
    return {
      ...line,
      stylistId: null,
      startTime: null,
      reservedDurationMinutes: null,
      estimatedPrice: null,
      availability: "unchecked",
      errors: [],
    };
  }

  const snapshot = snapshotLineFromCatalog(serviceId, stylistId);
  return {
    ...line,
    stylistId,
    startTime: null,
    reservedDurationMinutes: snapshot?.reservedDurationMinutes ?? null,
    estimatedPrice: snapshot?.estimatedPrice ?? null,
    availability: "unchecked",
    errors: [],
  };
}

export function updateLineStartTime(
  line: BookingServiceDraft,
  startTime: string | null,
): BookingServiceDraft {
  return {
    ...line,
    startTime,
    availability: "unchecked",
    errors: [],
  };
}

export function updateLineDuration(
  line: BookingServiceDraft,
  reservedDurationMinutes: number | null,
): BookingServiceDraft {
  return {
    ...line,
    reservedDurationMinutes,
    startTime: null,
    availability: "unchecked",
    errors: [],
  };
}

export function recheckAllLines(draft: BookingDraft): BookingDraft {
  return {
    ...draft,
    lines: draft.lines.map((line) => recheckLineAvailability(line, draft)),
  };
}

/** Ignore blank rows left over from «افزودن خدمت». */
export function normalizeDraftForSubmit(draft: BookingDraft): BookingDraft {
  return {
    ...draft,
    lines: draft.lines.filter((line) => line.serviceId),
  };
}

export function describeSubmitLineIssues(draft: BookingDraft): string | null {
  const lines = normalizeDraftForSubmit(draft).lines;
  if (lines.length === 0) {
    return "حداقل یک خدمت اضافه کنید";
  }

  for (const line of lines) {
    const missingTime = !line.startTime;
    const missingFields =
      !line.stylistId ||
      !line.reservedDurationMinutes ||
      line.reservedDurationMinutes <= 0 ||
      line.estimatedPrice === null;

    if (missingTime || missingFields) {
      return "لطفاً دسته، خدمت، آرایشگر و زمان هر ردیف را کامل کنید";
    }

    if (line.availability === "conflict") {
      const conflictCode = inlineLineErrors(line.errors)[0];
      return conflictCode
        ? (lineErrorMessages[conflictCode] ?? "تداخل زمانی با نوبت دیگر")
        : "تداخل زمانی با نوبت دیگر";
    }

    if (line.availability !== "available") {
      return "لطفاً برای هر خدمت یک زمان آزاد انتخاب کنید";
    }
  }

  return null;
}

export const lineErrorMessages: Record<string, string> = {
  service_required: "خدمت را انتخاب کنید",
  stylist_required: "آرایشگر را انتخاب کنید",
  start_time_required: "ساعت شروع را انتخاب کنید",
  duration_required: "مدت زمان معتبر نیست",
  estimated_price_required: "قیمت تخمینی معتبر نیست",
  stylist_not_booking_ready: "آرایشگر برای این خدمت قابل رزرو نیست",
  outside_schedule: "خارج از ساعات کاری یا برنامه آرایشگر",
  time_conflict: "تداخل زمانی با نوبت دیگر",
};

/** Shown inline on a service row — not empty-field hints before submit. */
const INLINE_LINE_ERROR_CODES = new Set([
  "stylist_not_booking_ready",
  "outside_schedule",
  "time_conflict",
]);

export function inlineLineErrors(errors: string[]): string[] {
  return errors.filter((code) => INLINE_LINE_ERROR_CODES.has(code));
}
