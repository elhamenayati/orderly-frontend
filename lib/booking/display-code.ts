import { isoDateFromDate, isoToJalaliDateObject } from "@/lib/format/jalali";
import { bookings } from "@/mock_ts/bookings";
import type { Booking } from "@/types/domain";

export function bookingDisplayCodePrefixFromInstant(isoDateTime: string) {
  const isoDate = isoDateFromDate(new Date(isoDateTime));
  const jalali = isoToJalaliDateObject(isoDate);
  const yy = jalali.year % 100;
  const mm = jalali.month.number;
  return `ORD-${String(yy).padStart(2, "0")}${String(mm).padStart(2, "0")}`;
}

export function allocateBookingDisplayCode(
  salonId: string,
  createdAt: string,
  existingBookings: Booking[] = bookings,
) {
  const prefix = bookingDisplayCodePrefixFromInstant(createdAt);
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`);
  let max = 0;

  for (const booking of existingBookings) {
    if (booking.salonId !== salonId) continue;
    const code = booking.displayCode?.trim() ?? "";
    const match = code.match(pattern);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }

  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function resolveLegacyBookingDisplayCode(
  booking: Booking,
  existingBookings: Booking[] = bookings,
) {
  const prefix = bookingDisplayCodePrefixFromInstant(booking.createdAt);
  const samePrefix = existingBookings
    .filter(
      (item) =>
        item.salonId === booking.salonId &&
        bookingDisplayCodePrefixFromInstant(item.createdAt) === prefix,
    )
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id),
    );
  const index = samePrefix.findIndex((item) => item.id === booking.id);
  const counter = index >= 0 ? index + 1 : samePrefix.length + 1;
  return `${prefix}-${String(counter).padStart(3, "0")}`;
}

export function formatBookingDisplayCode(
  booking: Booking,
  existingBookings: Booking[] = bookings,
) {
  const displayCode = booking.displayCode?.trim();
  if (displayCode) return displayCode;
  return resolveLegacyBookingDisplayCode(booking, existingBookings);
}
