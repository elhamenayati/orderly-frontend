import type { BookingDraft } from "@/types/booking";
import type { Booking } from "@/types/domain";

export function bookingToDraft(booking: Booking): BookingDraft {
  return {
    bookingId: booking.id,
    customerId: booking.customerId,
    bookingDate: booking.bookingDate,
    notes: booking.notes ?? "",
    lines: booking.services.map((service) => ({
      clientId: service.id,
      persistedId: service.id,
      serviceId: service.serviceId,
      stylistId: service.stylistId,
      startTime: service.startTime,
      reservedDurationMinutes: service.reservedDurationMinutes,
      estimatedPrice: service.estimatedPrice,
      availability: "available",
      errors: [],
    })),
  };
}
