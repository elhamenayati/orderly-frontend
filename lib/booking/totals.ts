import { findService } from "@/lib/booking/catalog";
import type { BookingServiceDraft } from "@/types/booking";

export function estimatedTotal(lines: BookingServiceDraft[]) {
  return lines.reduce((sum, line) => sum + (line.estimatedPrice ?? 0), 0);
}

export function displayedMinimumDeposit(lines: BookingServiceDraft[]) {
  const serviceIds = new Set(
    lines
      .map((line) => line.serviceId)
      .filter((id): id is string => Boolean(id)),
  );

  return [...serviceIds].reduce((sum, serviceId) => {
    const service = findService(serviceId);
    return sum + (service?.minimumDeposit ?? 0);
  }, 0);
}

export function salesAmount(finalActualAmount: number | null) {
  return finalActualAmount ?? 0;
}
