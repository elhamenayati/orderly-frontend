import type { Salon, SalonSchedule } from "@/types/domain";

export const DEMO_SALON_ID = "salon_lux";

/** Populated from API after login or admin sync. Starts empty for fresh test data. */
export const salons: Salon[] = [];

export const salon: Salon = {
  id: DEMO_SALON_ID,
  brandName: "",
  legalName: "",
  mobile: "",
  address: "",
  cancellationPolicy: "",
  status: "pending",
};

export const salonSchedule: SalonSchedule = {
  salonId: DEMO_SALON_ID,
  weeklySlots: [],
  closedDates: [],
  exceptions: [],
};
