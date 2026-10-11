import { bookings } from "@/mock_ts/bookings";
import { salonSchedule } from "@/mock_ts/salon";
import { services } from "@/mock_ts/services";
import {
  stylistSchedules,
  stylistServices,
  stylists,
} from "@/mock_ts/stylists";
import type { Booking, BookingService, Service, Stylist } from "@/types/domain";

export function isBookingReadyStylist(stylistId: string, serviceId: string) {
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

  return Boolean(
    stylist?.isActive &&
      service?.isActive &&
      assignment &&
      schedule &&
      schedule.weeklySlots.length > 0,
  );
}

export function bookingReadyStylistsForService(serviceId: string): Stylist[] {
  return stylists.filter((stylist) =>
    isBookingReadyStylist(stylist.id, serviceId),
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
