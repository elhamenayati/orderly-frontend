import { salesAmount } from "@/lib/booking/totals";
import { bookings } from "@/mock_ts/bookings";

export type CompletedLineRow = {
  bookingId: string;
  bookingDate: string;
  lineId: string;
  stylistId: string;
  serviceId: string;
  finalActualAmount: number;
};

export type StylistPerformanceKpis = {
  relatedBookings: number;
  completedServices: number;
  actualSales: number;
  averageServiceValue: number;
};

/** Completed checkout lines — eligible revenue for commission and chair-rent credit. */
export function completedBookingLines(options?: {
  periodStart?: string;
  periodEnd?: string;
}): CompletedLineRow[] {
  const { periodStart, periodEnd } = options ?? {};

  return bookings
    .filter((booking) => booking.status === "completed")
    .filter((booking) => {
      if (periodStart && booking.bookingDate < periodStart) return false;
      if (periodEnd && booking.bookingDate > periodEnd) return false;
      return true;
    })
    .flatMap((booking) =>
      booking.services.map((line) => ({
        bookingId: booking.id,
        bookingDate: booking.bookingDate,
        lineId: line.id,
        stylistId: line.stylistId,
        serviceId: line.serviceId,
        finalActualAmount: salesAmount(line.finalActualAmount),
      })),
    );
}

function stylistCompletedLines(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
) {
  return completedBookingLines(options).filter(
    (line) => line.stylistId === stylistId,
  );
}

export function stylistPerformanceKpis(
  stylistId: string,
  options?: { periodStart?: string; periodEnd?: string },
): StylistPerformanceKpis {
  const lines = stylistCompletedLines(stylistId, options);
  const bookingIds = new Set(lines.map((line) => line.bookingId));
  const actualSales = lines.reduce((sum, line) => sum + line.finalActualAmount, 0);
  const completedServices = lines.length;

  return {
    relatedBookings: bookingIds.size,
    completedServices,
    actualSales,
    averageServiceValue:
      completedServices > 0 ? Math.round(actualSales / completedServices) : 0,
  };
}

export function totalCompletedSales(options?: {
  periodStart?: string;
  periodEnd?: string;
}) {
  return completedBookingLines(options).reduce(
    (sum, line) => sum + line.finalActualAmount,
    0,
  );
}
