import { todayIso } from "@/lib/format/jalali";
import { bookings } from "@/mock_ts/bookings";
import { salonSchedule } from "@/mock_ts/salon";
import { services } from "@/mock_ts/services";
import {
  stylistContracts,
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import type { Booking, BookingService, Service, Stylist } from "@/types/domain";

/** True when one of the stylist's contracts (current or superseded) covers the date. */
export function hasContractOnDate(stylistId: string, date: string) {
  return stylistContracts.some(
    (contract) =>
      contract.stylistId === stylistId &&
      contract.effectiveFrom <= date &&
      (!contract.effectiveTo || date <= contract.effectiveTo),
  );
}

/**
 * Returns true if the stylist can take a booking for the given service on the
 * given date. Stylists without a contract covering the booking date are excluded.
 *
 * @param bookingDate ISO-8601 date string (YYYY-MM-DD).  Defaults to today.
 */
export function isBookingReadyStylist(
  stylistId: string,
  serviceId: string,
  bookingDate?: string,
) {
  const stylist = stylists.find((item) => item.id === stylistId);
  const service = services.find((item) => item.id === serviceId);
  const assignment = stylistServices.find(
    (item) =>
      item.stylistId === stylistId &&
      item.serviceId === serviceId &&
      item.isActive &&
      item.startingPrice >= 0,
  );
  const schedule = stylistSchedules.find((item) => item.stylistId === stylistId);

  if (
    !stylist?.isActive ||
    !service?.isActive ||
    !assignment ||
    !schedule ||
    schedule.weeklySlots.length === 0
  ) {
    return false;
  }

  return hasContractOnDate(stylistId, bookingDate || todayIso());
}

export function bookingReadyStylistsForService(
  serviceId: string,
  bookingDate?: string,
): Stylist[] {
  return stylists.filter((stylist) =>
    isBookingReadyStylist(stylist.id, serviceId, bookingDate),
  );
}

export function snapshotLineFromCatalog(serviceId: string, stylistId: string) {
  const service = services.find((item) => item.id === serviceId);
  const assignment = stylistServices.find(
    (item) => item.stylistId === stylistId && item.serviceId === serviceId,
  );

  if (!service || !assignment) return null;

  return {
    reservedDurationMinutes: service.durationMinutes,
    estimatedPrice: assignment.startingPrice,
  };
}

export function findService(serviceId: string): Service | undefined {
  return services.find((item) => item.id === serviceId);
}

export function activeBookingsOnDate(
  date: string,
  ignoreBookingId?: string,
): Booking[] {
  return bookings.filter(
    (booking) =>
      booking.bookingDate === date &&
      booking.status !== "cancelled" &&
      booking.id !== ignoreBookingId,
  );
}

export function flattenBookingLines(
  records: Booking[],
): Array<BookingService & { bookingId: string }> {
  return records.flatMap((booking) =>
    booking.services.map((line) => ({ ...line, bookingId: booking.id })),
  );
}

export { salonSchedule };
