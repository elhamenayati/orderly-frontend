import { findService } from "@/lib/booking/catalog";
import type { BookingDraft } from "@/types/booking";

export function lineCategoriesFromDraft(
  draft: BookingDraft,
): Record<string, string | null> {
  return Object.fromEntries(
    draft.lines.map((line) => {
      if (!line.serviceId) {
        return [line.clientId, null] as const;
      }
      const service = findService(line.serviceId);
      return [line.clientId, service?.categoryId ?? null] as const;
    }),
  );
}
