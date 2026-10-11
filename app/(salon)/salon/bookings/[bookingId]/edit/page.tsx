import { Suspense } from "react";
import { SalonBookingFormPage } from "@/components/salon/booking-form-page";

export default async function SalonBookingEditRoute({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return (
    <Suspense fallback={null}>
      <SalonBookingFormPage mode="edit" bookingId={bookingId} />
    </Suspense>
  );
}
