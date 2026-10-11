export type LineAvailability =
  | "unchecked"
  | "checking"
  | "available"
  | "conflict";

export type BookingServiceDraft = {
  clientId: string;
  persistedId?: string;
  serviceId: string | null;
  stylistId: string | null;
  startTime: string | null;
  reservedDurationMinutes: number | null;
  estimatedPrice: number | null;
  availability: LineAvailability;
  errors: string[];
};

export type BookingDraft = {
  bookingId?: string;
  customerId: string | null;
  bookingDate: string;
  notes: string;
  lines: BookingServiceDraft[];
};

export type BookingPersistPayload = {
  customerId: string;
  bookingDate: string;
  notes: string;
  services: Array<{
    id?: string;
    serviceId: string;
    stylistId: string;
    startTime: string;
    reservedDurationMinutes: number;
    estimatedPrice: number;
  }>;
};
