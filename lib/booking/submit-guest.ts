import { env } from "@/config/env";
import { finalConflictErrors, validateBookingDraft } from "@/lib/booking/validation";
import { bookings } from "@/mock_ts/bookings";
import { customers } from "@/mock_ts/customers";
import { salon, DEMO_SALON_ID } from "@/mock_ts/salon";
import type { BookingDraft } from "@/types/booking";
import type { Booking, BookingService, Customer } from "@/types/domain";

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith("9") && digits.length === 10) {
    return `0${digits}`;
  }
  return digits;
}

export function isValidGuestMobile(mobile: string) {
  return /^09\d{9}$/.test(normalizeMobile(mobile));
}

export function findOrCreateCustomer(fullName: string, mobile: string): Customer {
  const normalizedMobile = normalizeMobile(mobile);
  const existing = customers.find(
    (item) =>
      item.salonId === DEMO_SALON_ID && item.mobile === normalizedMobile,
  );

  if (existing) {
    if (existing.fullName !== fullName.trim()) {
      existing.fullName = fullName.trim();
    }
    return existing;
  }

  const created: Customer = {
    id: nextId("cust"),
    salonId: DEMO_SALON_ID,
    fullName: fullName.trim(),
    mobile: normalizedMobile,
    createdAt: new Date().toISOString(),
  };
  customers.push(created);
  return created;
}

export type GuestSubmitResult =
  | {
      ok: true;
      bookingId: string;
      customerId: string;
      mockSmsSent: boolean;
    }
  | { ok: false; errors: string[] };

export function submitGuestBooking(input: {
  draft: BookingDraft;
  guestName: string;
  guestMobile: string;
}): GuestSubmitResult {
  const errors: string[] = [];

  if (!input.guestName.trim()) errors.push("guest_name_required");
  if (!isValidGuestMobile(input.guestMobile)) errors.push("guest_mobile_invalid");

  const customer = findOrCreateCustomer(input.guestName, input.guestMobile);
  const draftWithCustomer: BookingDraft = {
    ...input.draft,
    customerId: customer.id,
  };

  errors.push(...validateBookingDraft(draftWithCustomer));
  errors.push(...finalConflictErrors(draftWithCustomer));

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  const bookingId = nextId("bk");
  const now = new Date().toISOString();

  const services: BookingService[] = draftWithCustomer.lines.map((line) => ({
    id: nextId("bks"),
    bookingId,
    serviceId: line.serviceId!,
    stylistId: line.stylistId!,
    startTime: line.startTime!,
    reservedDurationMinutes: line.reservedDurationMinutes!,
    estimatedPrice: line.estimatedPrice!,
    finalActualAmount: null,
  }));

  const booking: Booking = {
    id: bookingId,
    salonId: salon.id,
    customerId: customer.id,
    bookingDate: draftWithCustomer.bookingDate,
    status: "confirmed",
    source: "guest",
    notes: draftWithCustomer.notes || undefined,
    createdAt: now,
    updatedAt: now,
    services,
  };

  bookings.push(booking);

  return {
    ok: true,
    bookingId,
    customerId: customer.id,
    mockSmsSent: env.enableMockSms,
  };
}

export function findBookingById(bookingId: string) {
  return bookings.find((item) => item.id === bookingId);
}
