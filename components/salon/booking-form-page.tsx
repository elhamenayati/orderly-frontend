"use client";

import { SalonBookingForm } from "@/components/salon/booking/booking-form-page";

type SalonBookingFormPageProps = {
  mode: "create" | "edit";
  bookingId?: string;
};

export function SalonBookingFormPage({
  mode,
  bookingId,
}: SalonBookingFormPageProps) {
  return <SalonBookingForm mode={mode} bookingId={bookingId} />;
}
